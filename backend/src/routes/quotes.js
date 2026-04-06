const express = require('express');
const quoteController = require('../controllers/quoteController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/', quoteController.create);
router.get('/', quoteController.list);
router.get('/:id', quoteController.getById);

module.exports = router;
