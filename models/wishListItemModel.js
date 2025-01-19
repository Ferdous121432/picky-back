const mongoose = require('mongoose');

const wishListItemSchema = new mongoose.Schema({
  wishlist_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'Wishlist',
    required: true,
  },
  product_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
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
});

const WishListItem = mongoose.model('WishListItem', wishListItemSchema);

module.exports = WishListItem;
