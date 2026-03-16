const express = require('express');
const quoteController = require('../controllers/quoteController');

const router = express.Router();

router.post('/', quoteController.create);
router.get('/', quoteController.list);
router.get('/:id', quoteController.getById);

module.exports = router;
