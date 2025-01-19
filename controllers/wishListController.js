const WishList = require('../models/wishListModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getWishList = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('You are not logged in', 401));
  }
  const wishList = await WishList.findOne({ userID: req.user.id });
  res.status(200).json({
    status: 'success',
    data: {
      wishList,
    },
  });
});

exports.getAllWishLists = factory.getAll(WishList);
// exports.createWishList = factory.createOne(WishList);
// exports.updateWishList = factory.updateOne(WishList);
// exports.deleteWishList = factory.deleteOne(WishList);
