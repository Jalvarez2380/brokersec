// ============================================
// BROKERSEC Backend - Configuración
// ============================================

require('dotenv').config();
const { USER_ROLES } = require('./roles');

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT, 10) || 5433;
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || '12345';
const dbName = process.env.DB_NAME || 'brokersec';

module.exports = {
  // Servidor
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
  },

  // Base de datos
  database: {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    name: dbName,
    url: process.env.DATABASE_URL || `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`,
    max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS, 10) || 30000,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'brokersec-super-secret-key-2025-change-in-production',
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

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  },

  // Seguridad
  security: {
    internalApiKey: process.env.INTERNAL_API_KEY,
  },

  seedUsers: [
    {
      dni: process.env.SEED_ADMIN_DNI || '9999999999',
      firstName: process.env.SEED_ADMIN_FIRST_NAME || 'Admin',
      lastName: process.env.SEED_ADMIN_LAST_NAME || 'Brokersec',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@brokersec.local',
      username: process.env.SEED_ADMIN_USERNAME || 'admin',
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin123*',
      mobile: process.env.SEED_ADMIN_MOBILE || '0999999999',
      role: process.env.SEED_ADMIN_ROLE || USER_ROLES.ADMIN,
    },
    {
      dni: process.env.SEED_SALES_DNI || '8888888888',
      firstName: process.env.SEED_SALES_FIRST_NAME || 'Ventas',
      lastName: process.env.SEED_SALES_LAST_NAME || 'Brokersec',
      email: process.env.SEED_SALES_EMAIL || 'ventas@brokersec.local',
      username: process.env.SEED_SALES_USERNAME || 'ventas',
      password: process.env.SEED_SALES_PASSWORD || 'Ventas123*',
      mobile: process.env.SEED_SALES_MOBILE || '0988888888',
      role: process.env.SEED_SALES_ROLE || USER_ROLES.SALES,
    },
    {
      dni: process.env.SEED_USER_DNI || '7777777777',
      firstName: process.env.SEED_USER_FIRST_NAME || 'Cliente',
      lastName: process.env.SEED_USER_LAST_NAME || 'Brokersec',
      email: process.env.SEED_USER_EMAIL || 'usuario@brokersec.local',
      username: process.env.SEED_USER_USERNAME || 'usuario',
      password: process.env.SEED_USER_PASSWORD || 'Usuario123*',
      mobile: process.env.SEED_USER_MOBILE || '0977777777',
      role: process.env.SEED_USER_ROLE || USER_ROLES.USER,
    },
  ],
};
