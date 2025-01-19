const mongoose = require('mongoose');
const validator = require('validator');

const addressSchema = new mongoose.Schema({
  default: { type: Boolean, default: false },
  userID: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  address_line_1: { type: String, required: true },
  address_line_2: { type: String },
  country: { type: String, required: true },
  city: { type: String, required: true },
  postal_code: { type: String, required: true },
  landmark: { type: String },
  phone_number: {
    type: String,
    required: true,
    validate: [validator.isMobilePhone, 'Invalid phone number'],
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date },
});

addressSchema.pre(/^find/, function (next) {
  this.populate('userID');
  next();
});

const Address = mongoose.model('Address', addressSchema);
module.exports = Address;
