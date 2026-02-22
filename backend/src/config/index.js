// ============================================
// BROKERSEC Backend - Configuración
// ============================================

require('dotenv').config();

module.exports = {
  // Servidor
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
  },

  // Base de datos
  database: {
    url: process.env.DATABASE_URL,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '7d',
  },

  // Bcrypt
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // API Externa - OpenWeatherMap
  openWeather: {
    apiKey: process.env.OPENWEATHER_API_KEY,
    baseUrl: process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5',
    timeout: 5000, // 5 segundos
  },

  // Seguridad
  security: {
    internalApiKey: process.env.INTERNAL_API_KEY,
  },
};
