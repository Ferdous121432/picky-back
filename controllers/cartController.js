const Cart = require('../models/cartModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getCart = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('You are not logged in', 401));
  }
  const cart = await Cart.findOne({ userID: req.user.id });
  res.status(200).json({
    status: 'success',
    data: {
      cart,
    },
  });
});

exports.getAllCarts = factory.getAll(Cart);
// exports.createCart = factory.createOne(Cart);
// exports.updateCart = factory.updateOne(Cart);
// exports.deleteCart = factory.deleteOne(Cart);
