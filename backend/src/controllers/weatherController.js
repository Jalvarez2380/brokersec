// ============================================
// Controlador: Clima
// ============================================
// Endpoints propios que consumen WeatherService

const weatherService = require('../services/weatherService');

class WeatherController {
  /**
   * GET /api/v1/clima/actual/:ciudad
   * Obtener clima actual de una ciudad
   */
  async getCurrentWeather(req, res) {
    try {
      const { ciudad } = req.params;
      const { pais = 'EC' } = req.query;

      // Validación básica
      if (!ciudad || ciudad.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Nombre de ciudad inválido',
        });
      }

      const weatherData = await weatherService.getCurrentWeather(ciudad, pais);

      res.json({
        success: true,
        data: weatherData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/v1/clima/pronostico/:ciudad
   * Obtener pronóstico de 5 días
   */
  async getForecast(req, res) {
    try {
      const { ciudad } = req.params;
      const { pais = 'EC' } = req.query;

      if (!ciudad || ciudad.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Nombre de ciudad inválido',
        });
      }

      const forecastData = await weatherService.getForecast(ciudad, pais);

      res.json({
        success: true,
        data: forecastData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /api/v1/clima/riesgo
   * Calcular factor de riesgo climático para cotización
   */
  async calculateRiskFactor(req, res) {
    try {
      const { ciudad, pais = 'EC' } = req.body;

      if (!ciudad) {
        return res.status(400).json({
          success: false,
          error: 'Ciudad es requerida',
        });
      }

      // Obtener datos del clima
      const weatherData = await weatherService.getCurrentWeather(ciudad, pais);

      // Calcular factor de riesgo
      const riskAnalysis = weatherService.calculateWeatherRiskFactor(weatherData);

      res.json({
        success: true,
        data: {
          clima: weatherData,
          analisisRiesgo: riskAnalysis,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/v1/clima/health
   * Verificar estado del servicio
   */
  async healthCheck(req, res) {
    try {
      // Intentar una consulta simple
      await weatherService.getCurrentWeather('Quito', 'EC');

      res.json({
        success: true,
        message: 'Servicio de clima operativo',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        message: 'Servicio de clima no disponible',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = new WeatherController();
