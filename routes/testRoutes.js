const express = require('express');
const test = require('../controllers/testController');
// 2] Routes
const router = express.Router();

// router.post('/signup', authController.signup);
// router.post('/login', authController.login);

router.route('/').get(test.getAllTests).post(test.createNewTest);
// router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
