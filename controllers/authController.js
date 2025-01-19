const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const sendVerificationEmail = require('../utils/sendVerificationEmail');

// jwt token creation
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000,
  });
};

// send token to client and create cookie
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    secure: true, // Set to true if using HTTPS
    sameSite: 'Lax', // Controls when cookies are sent
    path: '/', // Ensure the cookie is accessible on all routes
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  if (res.cookie) {
    res.cookie('jwt', token, cookieOptions);
  } else {
    console.error('res.cookie is not a function');
  }

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// Login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1. Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // check if user verified his email
  const userVerify = await User.findOne({
    email,
  });

  if (userVerify.verified === false) {
    return next(new AppError('verify your email', 404));
  }

  // 2. Check if user exists && password is correct
  const user = await User.findOne({
    email,
  }).select('+password');
  // password is not selected by default, so we need to select it explicitly with +password
  const correct = await user.correctPassword(password, user.password);

  if (!user || !correct) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3. If everything is ok, send token to client
  createSendToken(user._id, 201, res);
});

// Protect routes
exports.protect = catchAsync(async (req, res, next) => {
  // 1. Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }
  let decoded;
  // 2. Verification token (if token is valid)
  // promisify is used to convert callback based function to promise based function
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log('decoded  :', decoded);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(
        new AppError('Your session has expired. Please log in again.', 401),
      );
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  // 3. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  }

  // 4. Check if user changed password after the token was issued
  // iat is the time when the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }

  // Grant access to protected route
  req.user = currentUser;

  // sent jwt token to client
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
  });
  next();
});

// Only for rendered pages, no error
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // 1) varify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 2. Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3. Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // Grant access to protected route
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

// Logout user
exports.logout = async (req, res) => {
  try {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err });
  }
};

// Restricting routes to certain roles
exports.restrictedTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',

        message: 'You do not have permission to perform this action',
      });
    }

    next();
  };
};

//TODO implement this functionality
// Password reset functionality
// exports.forgotPassword = catchAsync(async (req, res, next) => {
//   // 1. Get user based on POSTed email
//   const user = await User.findOne({ email: req.body.email });

//   if (!user) {
//     return next(new AppError('There is no user with email address.', 404));
//   }

//   // 2. Generate the random reset token
//   const resetToken = user.createPasswordResetToken();
//   await user.save({ validateBeforeSave: false });

//   // 3. Send it to user's email

//   try {
//     const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

//     await new Email(user, resetURL).sendPasswordReset();

//     res.status(200).json({
//       status: 'success',
//       message: 'Token sent to email!',
//     });
//   } catch (err) {
//     user.passwordResetToken = undefined;
//     user.passwordResetExpires = undefined;
//     await user.save({ validateBeforeSave: false });
//     console.log(err);
//     return next(
//       new AppError(
//         'There was an error sending the email. Try again later!',
//         500,
//       ),
//     );
//   }
// });

// exports.resetPassword = catchAsync(async (req, res, next) => {
//   // 1. Get user based on the token

//   const hashToken = crypto
//     .createHash('sha256')
//     .update(req.params.token)
//     .digest('hex');

//   const user = await User.findOne({
//     passwordResetToken: hashToken,
//     passwordResetExpires: { $gt: Date.now() },
//   });
//   // 2. If token has not expired, and there is user, set the new password

//   if (!user) {
//     return next(new AppError('Token is invalid or has expired', 400));
//   }

//   user.password = req.body.password;
//   user.passwordConfirm = req.body.passwordConfirm;
//   user.passwordResetToken = undefined;
//   user.passwordResetExpires = undefined;
//   await user.save();

//   // 3. Update changedPasswordAt property for the user

//   // 4. Log the user in, send JWT
//   createSendToken(user._id, 201, res);
// });

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2. Check if POSTed current password is correct
  const correct = await user.correctPassword(
    req.body.passwordCurrent,
    user.password,
  );

  // 3. If so, update password
  if (!correct) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4. Log user in, send JWT
  // TODO remove this functionality at production
  createSendToken(user._id, 201, res);
});

//
exports.signup = catchAsync(async (req, res, next) => {
  // Roles will be defined by the admin. Default role is user
  if (req.body.role) {
    req.body.role = 'user';
  }
  // Ensure required fields are provided
  const requiredFields = [
    'firstName',
    'lastName',
    'email',
    'password',
    'passwordConfirm',
  ];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({
        status: 'fail',
        message: `Missing required field: ${field}`,
      });
    }
  }

  // check if user with the email already exists
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    return res.status(400).json({
      status: 'fail',
      message: 'User with this email already exists.',
    });
  }

  console.log('req.body :', req.body);

  const newUser = await User.create(req.body);
  console.log(newUser);

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  newUser.verificationToken = verificationToken;
  newUser.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // Token valid for 24 hours
  await newUser.save({ validateBeforeSave: false });
  // Send verification email
  const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/users/verify/${verificationToken}`;
  await sendVerificationEmail(newUser, verificationUrl);
  res.status(201).json({
    status: 'success',
    message: 'User registered. Please check your email to verify your account.',
  });
});

// Endpoint to verify email
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const token = req.params.token;

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      status: 'fail',
      message: 'Token is invalid or has expired.',
    });
  }
  user.verified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();
  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully!',
  });
});

exports.resendVerificationToken = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ status: 'fail', message: 'User not found' });
    }

    // Generate a new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 3600000; // 1 hour

    // Save the new token to the database
    await user.save();

    // Send the new token to the user's email
    const verificationUrl = `${req.protocol}://${req.get('host')}/verify-email?token=${verificationToken}`;
    await sendVerificationEmail(user, verificationUrl);

    await sendEmail({
      email: user.email,
      subject: 'Email Verification',
      message,
    });

    res
      .status(200)
      .json({ status: 'success', message: 'Verification token resent' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
