const express = require('express');
const authController = require('./../controllers/authController');
const addressController = require('./../controllers/addressController');
const router = express.Router();

router.use(authController.protect);
router.use(authController.isLoggedIn);

router.route('/my-addresses').get(addressController.getUserAllAddress);

router
  .route('/')
  .get(addressController.getUserAllAddress)
  .post(addressController.createAddress);

router
  .route('/:id')
  .get(addressController.getAddress)
  .patch(addressController.updateAddress)
  .delete(addressController.deleteAddress);

module.exports = router;
