const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/login', authController.signin);
router.post('/signout', authController.signout);
router.get('/user', authenticateToken, authController.getCurrentUser);

module.exports = router;
