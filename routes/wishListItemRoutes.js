const express = require('express');
const wishListItemController = require('../controllers/wishListItemController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.isLoggedIn);

router
  .route('/')
  .get(wishListItemController.getAllWishListItems)
  .post(wishListItemController.createWishListItem);

router
  .route('/:id')
  .get(wishListItemController.getWishListItem)
  .patch(wishListItemController.updateWishListItem)
  .delete(wishListItemController.deleteWishListItem);

module.exports = router;
