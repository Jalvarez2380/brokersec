const { query } = require('../db/pool');

function mapQuote(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    vehicleId: row.vehicle_id,
    city: row.city,
    country: row.country,
    status: row.status,
    coveragePlan: row.coverage_plan,
    insuredValue: row.insured_value,
    premiumNet: row.premium_net,
    taxes: row.taxes,
    totalPremium: row.total_premium,
    payload: row.payload || {},
    createdAt: row.created_at,
  };
}

async function createQuote({ userId, vehicleId, city, country, status, coveragePlan, insuredValue, premiumNet, taxes, totalPremium, payload }) {
  const result = await query(
    `INSERT INTO quotes (
      user_id, vehicle_id, city, country, status, coverage_plan,
      insured_value, premium_net, taxes, total_premium, payload
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
    RETURNING *`,
    [
      userId || null,
      vehicleId || null,
      city || null,
      country || 'EC',
      status || 'draft',
      coveragePlan || null,
      insuredValue || null,
      premiumNet || null,
      taxes || null,
      totalPremium || null,
      JSON.stringify(payload || {}),
    ]
  );

  return mapQuote(result.rows[0]);
}

async function listQuotes({ userId, vehicleId } = {}) {
  const conditions = [];
  const params = [];

  if (userId) {
    params.push(userId);
    conditions.push(`user_id = $${params.length}`);
  }

  if (vehicleId) {
    params.push(vehicleId);
    conditions.push(`vehicle_id = $${params.length}`);
  }

  let sql = 'SELECT * FROM quotes';
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ' ORDER BY id DESC';

  const result = await query(sql, params);
  return result.rows.map(mapQuote);
}

async function findQuoteById(id) {
  const result = await query('SELECT * FROM quotes WHERE id = $1 LIMIT 1', [id]);
  return mapQuote(result.rows[0]);
}

module.exports = {
  createQuote,
  listQuotes,
  findQuoteById,
};
