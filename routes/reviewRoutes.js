const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');
const router = express.Router({ mergeParams: true });

router.use(authController.protect);
router.use(authController.isLoggedIn);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictedTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictedTo('user', 'admin', 'lead-guide'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictedTo('user', 'admin'),
    reviewController.deleteReview,
  );

module.exports = router;
