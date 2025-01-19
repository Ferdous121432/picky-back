const express = require('express');
const cartItemController = require('../controllers/cartItemController');
const authController = require('../controllers/authController');
const userController = require('./../controllers/userController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);
router.use(authController.isLoggedIn);

router.route('/mycart').get(cartItemController.getMyCart);

router
  .route('/')
  .get(cartItemController.getAllCartItems)
  .post(cartItemController.createCartItem);

router
  .route('/:id')
  .get(cartItemController.getCartItem)
  .patch(cartItemController.updateCartItem)
  .delete(cartItemController.deleteCartItem);

module.exports = router;
