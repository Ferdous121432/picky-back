const WishListItem = require('../models/wishListItemModel');
const factory = require('./handlerFactory');

const allowables = ['product_id', 'quantity'];

exports.getAllWishListItems = factory.getAll(WishListItem);
exports.getWishListItem = factory.getOne(WishListItem);
exports.createWishListItem = factory.createOne(WishListItem);
exports.updateWishListItem = factory.updateOne(WishListItem, allowables);
exports.deleteWishListItem = factory.deleteOne(WishListItem);
