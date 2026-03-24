const config = require('../config');
const { testConnection } = require('../db/pool');
const pkg = require('../../package.json');

class HealthController {
  live(req, res) {
    return res.json({
      success: true,
      message: 'Servicio operativo',
      data: {
        service: pkg.name,
        version: pkg.version,
        env: config.server.env,
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  }

  async ready(req, res) {
    try {
      const db = await testConnection();

      return res.json({
        success: true,
        message: 'Servicio listo para recibir trafico',
        data: {
          database: {
            host: config.database.host,
            port: config.database.port,
            name: db.database_name,
            user: db.database_user,
            currentTime: db.current_time,
          },
        },
      });
    } catch (error) {
      return res.status(503).json({
        success: false,
        message: 'Servicio no listo',
        error: 'Dependencias no disponibles',
        details: error.message,
      });
    }
  }

  async dbHealth(req, res, next) {
    try {
      const db = await testConnection();

      return res.json({
        success: true,
        message: 'Conexión PostgreSQL operativa',
        data: {
          host: config.database.host,
          port: config.database.port,
          database: db.database_name,
          user: db.database_user,
          currentTime: db.current_time,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new HealthController();
