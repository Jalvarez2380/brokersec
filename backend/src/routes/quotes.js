const express = require('express');
const quoteController = require('../controllers/quoteController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, quoteController.create);
router.get('/', authenticateToken, quoteController.list);
router.get('/:id', authenticateToken, quoteController.getById);

module.exports = router;
