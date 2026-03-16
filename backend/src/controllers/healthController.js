const config = require('../config');
const { testConnection } = require('../db/pool');

class HealthController {
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
