const express = require('express');
const inspectionController = require('../controllers/inspectionController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/', inspectionController.create);
router.get('/', inspectionController.list);
router.get('/:id', inspectionController.getById);

module.exports = router;
