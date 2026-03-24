const express = require('express');
const assistantController = require('../controllers/assistantController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/chat', authenticateToken, assistantController.chat);

module.exports = router;
