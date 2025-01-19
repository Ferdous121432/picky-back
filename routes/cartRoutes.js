const express = require('express');
const cartController = require('../controllers/cartController');
const authController = require('../controllers/authController');

const router = express.Router();
router.use(authController.isLoggedIn);
router.route('/').get(cartController.getAllCarts);
//   .post(cartController.createCart);

router.route('/my-cart').get(authController.protect, cartController.getCart);
//   .patch(cartController.updateCart)
//   .delete(cartController.deleteCart);

module.exports = router;
