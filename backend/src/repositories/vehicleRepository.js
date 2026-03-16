const { query } = require('../db/pool');

function mapVehicle(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    plate: row.plate,
    insuredValue: row.insured_value,
    extrasValue: row.extras_value,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createVehicle({ userId, brand, model, year, plate, insuredValue, extrasValue, metadata }) {
  const result = await query(
    `INSERT INTO vehicles (user_id, brand, model, year, plate, insured_value, extras_value, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
     RETURNING *`,
    [
      userId || null,
      brand,
      model,
      year || null,
      plate || null,
      insuredValue || null,
      extrasValue || 0,
      JSON.stringify(metadata || {}),
    ]
  );

  return mapVehicle(result.rows[0]);
}

async function listVehicles({ userId } = {}) {
  const params = [];
  let sql = 'SELECT * FROM vehicles';

  if (userId) {
    params.push(userId);
    sql += ` WHERE user_id = $${params.length}`;
  }

  sql += ' ORDER BY id DESC';

  const result = await query(sql, params);
  return result.rows.map(mapVehicle);
}

async function findVehicleById(id) {
  const result = await query('SELECT * FROM vehicles WHERE id = $1 LIMIT 1', [id]);
  return mapVehicle(result.rows[0]);
}

module.exports = {
  createVehicle,
  listVehicles,
  findVehicleById,
};
