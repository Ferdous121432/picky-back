const express = require('express');
const checkoutController = require('../controllers/checkoutController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);
router.use(authController.isLoggedIn);

router
  .route('/checkout-session/:id')
  .post(checkoutController.getCheckoutSession);
router.route('/checkout-session').post(checkoutController.getCheckoutSession);

router.route('/my-orders').get(checkoutController.GetMyOrders);

// router.use(authController.restrictedTo('admin', 'lead-guide'));

// router
//   .route('/')
//   .get(checkoutController.getAllOrders)
//   .post(checkoutController.createOrder);

// router
//   .route('/:id')
//   .get(checkoutController.getOrder)
//   .patch(checkoutController.updateOrder)
//   .delete(checkoutController.deleteOrder);

module.exports = router;
