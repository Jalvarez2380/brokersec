const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// Se comenta esta línea temporalmente para evitar que el servidor se caiga (app crashed)
// const insuranceController = require('../controllers/insuranceController');

// Ruta para el cálculo real de seguros - Comentada para corregir el error Undefined
// router.post('/cotizar', insuranceController.calculatePremium);

// Rutas originales de clima
router.get('/actual/:ciudad', weatherController.getCurrentWeather);
router.get('/pronostico/:ciudad', weatherController.getForecast);
router.post('/riesgo', weatherController.calculateRiskFactor);
router.get('/health', weatherController.healthCheck);

module.exports = router;
