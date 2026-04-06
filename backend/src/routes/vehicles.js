const express = require('express');
const vehicleController = require('../controllers/vehicleController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/', vehicleController.create);
router.get('/', vehicleController.list);
router.get('/:id', vehicleController.getById);

module.exports = router;
