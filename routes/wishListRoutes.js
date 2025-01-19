const express = require('express');
const wishListController = require('../controllers/wishListController');
const authController = require('../controllers/authController');

const router = express.Router();
router.use(authController.isLoggedIn);

router.route('/').get(wishListController.getAllWishLists);
// .post(authController.protect, wishListController.createWishList);

router
  .route('/my-wishlist')
  .get(authController.protect, wishListController.getWishList);
// .patch(authController.protect, wishListController.updateWishList)
// .delete(authController.protect, wishListController.deleteWishList);

module.exports = router;
