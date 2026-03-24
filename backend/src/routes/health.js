const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get('/live', healthController.live);
router.get('/ready', healthController.ready);
router.get('/db', healthController.dbHealth);

module.exports = router;
