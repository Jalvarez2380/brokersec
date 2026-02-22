// ============================================
// Servicio: OpenWeatherMap API Proxy
// ============================================
// Este servicio consume la API externa de clima
// y la expone de forma segura al frontend

const axios = require('axios');
const config = require('../config');

class WeatherService {
  constructor() {
    this.apiKey = config.openWeather.apiKey;
    this.baseUrl = config.openWeather.baseUrl;
    this.timeout = config.openWeather.timeout;

    // Validar que existe la API Key
    if (!this.apiKey || this.apiKey === 'TU_API_KEY_AQUI') {
      console.warn('⚠️  ADVERTENCIA: OpenWeatherMap API Key no configurada');
    }
  }

  /**
   * Obtener clima actual por ciudad
   * @param {string} city - Nombre de la ciudad
   * @param {string} country - Código del país (ej: 'EC' para Ecuador)
   * @returns {Promise<Object>} - Datos del clima normalizados
   */
  async getCurrentWeather(city, country = 'EC') {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: `${city},${country}`,
          appid: this.apiKey,
          units: 'metric', // Celsius
          lang: 'es', // Español
        },
        timeout: this.timeout,
      });

      // Normalizar respuesta (transformación y control de cambios)
      return this.normalizeWeatherData(response.data);
    } catch (error) {
      return this.handleWeatherError(error);
    }
  }

  /**
   * Obtener pronóstico de 5 días
   * @param {string} city - Nombre de la ciudad
   * @param {string} country - Código del país
   * @returns {Promise<Object>} - Pronóstico normalizado
   */
  async getForecast(city, country = 'EC') {
    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          q: `${city},${country}`,
          appid: this.apiKey,
          units: 'metric',
          lang: 'es',
        },
        timeout: this.timeout,
      });

      return this.normalizeForecastData(response.data);
    } catch (error) {
      return this.handleWeatherError(error);
    }
  }

  /**
   * Calcular factor de riesgo climático
   * Para ajustar prima de seguro según condiciones climáticas
   * @param {Object} weatherData - Datos del clima
   * @returns {Object} - Factor de riesgo y justificación
   */
  calculateWeatherRiskFactor(weatherData) {
    let riskFactor = 1.0; // Factor base
    const reasons = [];

    // Lluvia intensa = mayor riesgo
    if (weatherData.lluvia && weatherData.lluvia > 50) {
      riskFactor += 0.15;
      reasons.push('Zona con lluvia intensa');
    } else if (weatherData.lluvia && weatherData.lluvia > 20) {
      riskFactor += 0.08;
      reasons.push('Zona con lluvia moderada');
    }

    // Vientos fuertes = mayor riesgo
    if (weatherData.viento && weatherData.viento > 40) {
      riskFactor += 0.10;
      reasons.push('Vientos fuertes frecuentes');
    }

    // Clima extremo = mayor riesgo
    const condicionesExtremas = ['tormenta', 'granizo', 'nieve'];
    if (condicionesExtremas.some(cond => 
      weatherData.descripcion?.toLowerCase().includes(cond))) {
      riskFactor += 0.20;
      reasons.push('Condiciones climáticas extremas');
    }

    // Visibilidad reducida = mayor riesgo
    if (weatherData.visibilidad && weatherData.visibilidad < 3000) {
      riskFactor += 0.05;
      reasons.push('Visibilidad reducida');
    }

    return {
      factor: Math.min(riskFactor, 1.5), // Máximo 50% de incremento
      porcentajeIncremento: ((riskFactor - 1) * 100).toFixed(2),
      justificacion: reasons.join(', ') || 'Condiciones climáticas normales',
      aplicarIncremento: riskFactor > 1.0,
    };
  }

  /**
   * Normalizar datos del clima
   * Transformación: API externa → JSON propio
   */
  normalizeWeatherData(data) {
    return {
      ciudad: data.name,
      pais: data.sys.country,
      temperatura: Math.round(data.main.temp),
      sensacionTermica: Math.round(data.main.feels_like),
      temperaturaMin: Math.round(data.main.temp_min),
      temperaturaMax: Math.round(data.main.temp_max),
      humedad: data.main.humidity,
      presion: data.main.pressure,
      viento: data.wind.speed,
      direccionViento: data.wind.deg,
      visibilidad: data.visibility,
      nubosidad: data.clouds.all,
      lluvia: data.rain ? data.rain['1h'] || data.rain['3h'] : 0,
      descripcion: data.weather[0].description,
      icono: data.weather[0].icon,
      condicion: data.weather[0].main,
      timestamp: new Date(data.dt * 1000).toISOString(),
      amanecer: new Date(data.sys.sunrise * 1000).toLocaleTimeString('es-EC'),
      atardecer: new Date(data.sys.sunset * 1000).toLocaleTimeString('es-EC'),
    };
  }

  /**
   * Normalizar pronóstico
   */
  normalizeForecastData(data) {
    const pronosticoPorDia = {};

    data.list.forEach(item => {
      const fecha = new Date(item.dt * 1000).toLocaleDateString('es-EC');
      
      if (!pronosticoPorDia[fecha]) {
        pronosticoPorDia[fecha] = {
          fecha,
          temperaturaMin: item.main.temp_min,
          temperaturaMax: item.main.temp_max,
          descripcion: item.weather[0].description,
          icono: item.weather[0].icon,
          probabilidadLluvia: item.pop * 100,
          registros: [],
        };
      }

      pronosticoPorDia[fecha].registros.push({
        hora: new Date(item.dt * 1000).toLocaleTimeString('es-EC'),
        temperatura: Math.round(item.main.temp),
        descripcion: item.weather[0].description,
      });

      // Actualizar min/max
      pronosticoPorDia[fecha].temperaturaMin = Math.min(
        pronosticoPorDia[fecha].temperaturaMin,
        item.main.temp_min
      );
      pronosticoPorDia[fecha].temperaturaMax = Math.max(
        pronosticoPorDia[fecha].temperaturaMax,
        item.main.temp_max
      );
    });

    return {
      ciudad: data.city.name,
      pais: data.city.country,
      pronostico: Object.values(pronosticoPorDia).slice(0, 5),
    };
  }

  /**
   * Manejo de errores
   */
  handleWeatherError(error) {
    if (error.response) {
      // Error de la API externa
      const status = error.response.status;
      
      if (status === 404) {
        throw new Error('Ciudad no encontrada');
      } else if (status === 401) {
        throw new Error('API Key inválida o expirada');
      } else if (status === 429) {
        throw new Error('Límite de solicitudes excedido. Intenta más tarde');
      } else {
        throw new Error(`Error del servicio de clima: ${status}`);
      }
    } else if (error.request) {
      // Timeout o sin respuesta
      throw new Error('Servicio de clima no disponible. Intenta más tarde');
    } else {
      // Error de configuración
      throw new Error('Error al procesar solicitud de clima');
    }
  }
}

module.exports = new WeatherService();
