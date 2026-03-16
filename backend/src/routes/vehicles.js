const express = require('express');
const vehicleController = require('../controllers/vehicleController');

const router = express.Router();

router.post('/', vehicleController.create);
router.get('/', vehicleController.list);
router.get('/:id', vehicleController.getById);

module.exports = router;
