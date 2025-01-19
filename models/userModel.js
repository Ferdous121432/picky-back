const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { create } = require('./cartModel');

// Create a schema for the user model   name email photo password passwordConfirm

const userSchema = new mongoose.Schema(
  {
    avatar: {
      type: String,
      default: 'default.jpg',
    },
    firstName: {
      type: String,
      required: [true, 'A user must have a first name'],
      trim: true,
      maxlength: [
        30,
        'A first name must have less or equal than 30 characters',
      ],
      validate: [validator.isAlpha, 'First name must only contain characters'],
    },
    lastName: {
      type: String,
      required: [true, 'A user must have a last name'],
      trim: true,
      maxlength: [30, 'A last name must have less or equal than 30 characters'],
      validate: [validator.isAlpha, 'Last name must only contain characters'],
    },
    userName: {
      type: String,
      // required: [true, 'A user must have a username'],
      trim: true,
      maxlength: [30, 'A username must have less or equal than 30 characters'],
      validate: [
        validator.isAlphanumeric,
        'Username must only contain alphanumeric characters',
      ],
      // unique: [true, 'Username has already been used'],
    },
    email: {
      type: String,
      required: [true, 'A user must have an email'],
      unique: [true, 'Email has already been used'],
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'A user must have a password'],
      minlength: [2, 'Password must be more or equal than 8 characters'],
      select: false, // hide the password from the output
    },
    passwordConfirm: {
      type: String,
      required: [true, 'A user must confirm their password'],
      minlength: [
        2,
        'Password confirmation must be more or equal than 8 characters',
      ],
      validate: {
        validator: function (val) {
          return val === this.password;
        },
        message: 'Passwords are not the same',
      },
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    gender: {
      type: String,
    },

    dateOfBirth: {
      type: Date,
      // required: [true, 'A user must have a date of birth'],
      validate: [validator.isDate, 'Please provide a valid date of birth'],
    },

    //TODO: Add a verification for the phone number
    phoneNumber: {
      type: String,
      required: [true, 'A user must have a phone number'],
      validate: [
        validator.isMobilePhone,
        'Please provide a valid phone number',
      ],
    },

    role: {
      type: String,
      enum: ['user', 'salesman', 'executive', 'admin'],
      required: [
        true,
        'A user must have a role such as user, salesman, executive or admin',
      ],
      default: 'user',
    },

    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
    deleted_at: {
      type: Date,
    },
    // email verification
    verified: { type: Boolean, default: false },
    verificationToken: { type: String, unique: true },
    verificationTokenExpires: { type: Date },
  },
  {
    virtuals: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Create a virtual property for the user schema to get the full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Create a virtual property for the user schema to get Address
//TODO solve the issue of the address not being populated
userSchema.virtual('address', {
  ref: 'Address',
  foreignField: 'userID',
  localField: '_id',
});

// Middleware to populate the address field when finding a user
userSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'address',
    select: '-__v', // Exclude the __v field from the populated address
  });
  next();
});

// Create a virtual property for the user schema to get the cart
userSchema.virtual('cart', {
  ref: 'CartItem',
  foreignField: 'user_id',
  localField: '_id',
});

// Middleware to populate the cart field when finding a user
userSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'cart',
    select: '-__v', // Exclude the __v field from the populated cart
  });
  next();
});

// Encrypt the password before saving the user
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

// Create an instance method for the user schema to check if the password was changed after the token was issued
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Query middleware to hide inactive users
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// Create an instance method for the user schema to check if the password is correct
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//userschema methods to check if the password was changed after the token was issued
userSchema.methods.changedPasswordAfter = function (JWTTiestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTiestamp < changedTimestamp;
  }

  //false means not changed
  return false;
};

// Create an instance method for the user schema to create a password reset token

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Encrypt the reset token and save it to the database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  // Set the password reset token expiration time  and save it to the database
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Create a model for the user schema
const User = mongoose.model('User', userSchema);

module.exports = User;
