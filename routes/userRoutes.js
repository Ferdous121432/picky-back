const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
// 2] Routes

const router = express.Router();

// middleware runs in sequence

router.post('/signup', authController.signup);
router.get('/verify/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationToken);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
// router.post('/forgotpassword', authController.forgotPassword);
// router.patch('/resetpassword/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch(
  '/updatepassword',

  authController.updatePassword,
);

router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateme',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
router.patch('/deleteme', userController.deleteMe);

// Restrict all routes after this middleware to admin only
router.use(authController.restrictedTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
