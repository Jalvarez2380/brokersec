// ============================================
// Middleware: Autenticación y Seguridad
// ============================================

const config = require('../config');

/**
 * Middleware: Verificar API Key interna
 * Protege endpoints para que solo la app móvil pueda acceder
 */
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API Key requerida',
      message: 'Incluye el header X-API-Key en la solicitud',
    });
  }

  if (apiKey !== config.security.internalApiKey) {
    return res.status(403).json({
      success: false,
      error: 'API Key inválida',
    });
  }

  next();
};

/**
 * Middleware: Logging de requests
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};

/**
 * Middleware: Manejo de errores global
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.server.env === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware: Validar body de request
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.details.map(d => d.message),
      });
    }
    
    next();
  };
};

module.exports = {
  verifyApiKey,
  requestLogger,
  errorHandler,
  validateBody,
};
