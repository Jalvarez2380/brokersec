const express = require('express');
const vehicleController = require('../controllers/vehicleController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, vehicleController.create);
router.get('/', authenticateToken, vehicleController.list);
router.get('/:id', authenticateToken, vehicleController.getById);

module.exports = router;
