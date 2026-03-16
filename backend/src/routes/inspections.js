const express = require('express');
const inspectionController = require('../controllers/inspectionController');

const router = express.Router();

router.post('/', inspectionController.create);
router.get('/', inspectionController.list);
router.get('/:id', inspectionController.getById);

module.exports = router;
