//Cart will be created at the time of user registration and will be updated when user adds or removes items from the cart.
// Purpose: Define the schema for the cart collection in the database.
// cartController handle at authController.signup

const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.ObjectId,
    required: [true, 'Please provide user id'],
  },
  total: {
    type: Number,
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

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
