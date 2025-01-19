const mongoose = require('mongoose');

const wishListSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'Please provide user id'],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const WishList = mongoose.model('WishList', wishListSchema);

module.exports = WishList;
