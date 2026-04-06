// ============================================
// Middleware: Autenticación y Seguridad
// ============================================

const jwt = require('jsonwebtoken');
const config = require('../config');
const { normalizeRole } = require('../config/roles');

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

  if (!config.security.internalApiKey || apiKey !== config.security.internalApiKey) {
    return res.status(403).json({
      success: false,
      error: 'API Key inválida',
    });
  }

  next();
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token requerido',
      error: 'No autorizado',
    });
  }

  try {
    req.user = jwt.verify(token, config.jwt.secret);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      error: 'No autorizado',
    });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        error: 'No autorizado',
      });
    }

    const userRole = normalizeRole(req.user.role);
    const normalizedAllowed = allowedRoles.map((role) => normalizeRole(role));

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        error: 'Acceso denegado',
      });
    }

    next();
  };
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

  if (err?.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'La cédula, el usuario o el correo ya están registrados',
      error: 'Registro duplicado',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message,
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
  authenticateToken,
  authorizeRoles,
  requestLogger,
  errorHandler,
  validateBody,
};
