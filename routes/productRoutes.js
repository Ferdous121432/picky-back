const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');

const router = express.Router();

// router.use(authController.isLoggedIn);

router.route('/').get(productController.getAllProducts).post(
  // authController.protect,
  // authController.restrictedTo('admin', 'executive', 'salesman'),
  productController.uploadProductImages,
  productController.resizeProductCoverImage,
  productController.checkBody,
  productController.createProduct,
);

router
  .route('/:slug')
  .get(productController.getProduct)
  .patch(
    // authController.protect,
    // authController.restrictedTo('admin', 'lead-guide'),
    productController.uploadProductImages,
    productController.resizeProductCoverImage,
    productController.updateProduct,
  )
  .delete(
    // authController.protect,
    // authController.restrictedTo('admin', 'lead-guide'),
    productController.deleteProduct,
  );

// New route to get products by category
router.route('/category/:slug').get(productController.getProductsByCategory);

module.exports = router;
