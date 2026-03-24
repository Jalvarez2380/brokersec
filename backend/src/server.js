const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { requestLogger, errorHandler } = require('./middleware/auth');
const { initializeDatabase } = require('./db/init');

const weatherRoutes = require('./routes/weather');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vehicleRoutes = require('./routes/vehicles');
const quoteRoutes = require('./routes/quotes');
const inspectionRoutes = require('./routes/inspections');
const healthRoutes = require('./routes/health');

const PORT = config.server.port || 3001;

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: '*',
    credentials: true,
  }));

  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: { success: false, error: 'Demasiadas solicitudes.' },
  });

  app.use('/api/', limiter);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'BROKERSEC Backend API',
      endpoints: {
        healthLive: '/api/health/live',
        healthReady: '/api/health/ready',
        healthDb: '/api/health/db',
        authSignup: '/api/auth/signup',
        authSignin: '/api/auth/signin',
        users: '/api/users',
        vehicles: '/api/vehicles',
        quotes: '/api/quotes',
        inspections: '/api/inspections',
        clima: '/api/v1/clima',
      },
    });
  });

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/quotes', quoteRoutes);
  app.use('/api/inspections', inspectionRoutes);
  app.use('/api/v1/clima', weatherRoutes);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint no encontrado',
      path: req.path,
    });
  });

  app.use(errorHandler);

  return app;
}

async function startServer() {
  await initializeDatabase();

  const app = createApp();

  return app.listen(PORT, '0.0.0.0', () => {
    console.log('============================================');
    console.log('BROKERSEC Backend Server');
    console.log('============================================');
    console.log(`Servidor en: http://127.0.0.1:${PORT}`);
    console.log(`DB: postgresql://${config.database.user}@${config.database.host}:${config.database.port}/${config.database.name}`);
    console.log('============================================');
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Error al iniciar el backend:', error);
    process.exit(1);
  });
}

process.on('unhandledRejection', (err) => {
  console.error('Error:', err);
  process.exit(1);
});

module.exports = {
  createApp,
  startServer,
};
