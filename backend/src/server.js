// ============================================
// BROKERSEC Backend Server - CORREGIDO
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { requestLogger, errorHandler } = require('./middleware/auth');

// Rutas - ASEGÚRATE DE TENER ESTA LÍNEA
const weatherRoutes = require('./routes/weather');
// Si tienes una ruta de auth, agrégala aquí. Si no, usaremos la de weather temporalmente.

const app = express();

// ============================================
// Middleware de Seguridad
// ============================================
app.use(helmet());

// CORS - MUY IMPORTANTE PARA QUITAR EL "FAILED TO FETCH"
app.use(cors({
  origin: '*', // Permite conexiones desde cualquier puerto (5173, etc)
  credentials: true
}));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { success: false, error: 'Demasiadas solicitudes.' },
});
app.use('/api/', limiter);

// ============================================
// Middleware General
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ============================================
// Rutas
// ============================================

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'BROKERSEC Backend API',
    endpoints: {
      clima: '/api/v1/clima',
      registro: '/api/v1/clima/register' // Ruta para que la App no de error
    }
  });
});

// Rutas de API
app.use('/api/v1/clima', weatherRoutes);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.path,
  });
});

app.use(errorHandler);

// ============================================
// Iniciar Servidor - CAMBIO CLAVE A '0.0.0.0'
// ============================================

const PORT = config.server.port || 3001;

// Usamos '0.0.0.0' para que Windows no bloquee la conexión entre puertos
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ============================================');
  console.log('   BROKERSEC Backend Server CORREGIDO');
  console.log('============================================');
  console.log(`📡 Servidor en: http://127.0.0.1:${PORT}`);
  console.log('============================================');
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

module.exports = app;