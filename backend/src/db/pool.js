const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.database.url,
  max: config.database.max,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
});

pool.on('error', (error) => {
  console.error('PostgreSQL pool error:', error);
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function getClient() {
  return pool.connect();
}

async function testConnection() {
  const result = await query(
    'SELECT NOW() AS current_time, current_database() AS database_name, current_user AS database_user'
  );

  return result.rows[0];
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};
