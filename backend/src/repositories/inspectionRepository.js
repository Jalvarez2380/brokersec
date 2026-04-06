const { getClient, query } = require('../db/pool');

function mapEvidence(row) {
  return {
    id: row.id,
    inspectionId: row.inspection_id,
    type: row.evidence_type,
    label: row.label,
    dataUrl: row.data_url,
    fileUrl: row.file_url,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

function mapInspection(row) {
  if (!row) return null;

  const customerName = `${row.first_name || ''} ${row.last_name || ''}`.trim();

  return {
    id: row.id,
    userId: row.user_id,
    vehicleId: row.vehicle_id,
    quoteId: row.quote_id,
    status: row.status,
    notes: row.notes,
    scheduledAt: row.scheduled_at,
    location: row.location || {},
    createdAt: row.created_at,
    customer: customerName || row.email ? {
      id: row.user_id,
      name: customerName || 'Cliente',
      email: row.email,
      mobile: row.mobile,
    } : undefined,
    vehicle: row.brand || row.model ? {
      id: row.vehicle_id,
      brand: row.brand,
      model: row.model,
      year: row.year,
      plate: row.plate,
    } : undefined,
  };
}

async function createInspection({ userId, vehicleId, quoteId, status, notes, scheduledAt, location, evidences = [] }) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const inspectionResult = await client.query(
      `INSERT INTO inspections (user_id, vehicle_id, quote_id, status, notes, scheduled_at, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING *`,
      [
        userId || null,
        vehicleId || null,
        quoteId || null,
        status || 'pending',
        notes || null,
        scheduledAt || null,
        JSON.stringify(location || {}),
      ]
    );

    const inspection = inspectionResult.rows[0];
    const savedEvidences = [];

    for (const evidence of evidences) {
      const evidenceResult = await client.query(
        `INSERT INTO inspection_evidences (inspection_id, evidence_type, label, data_url, file_url, metadata)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         RETURNING *`,
        [
          inspection.id,
          evidence.type,
          evidence.label || null,
          evidence.dataUrl || null,
          evidence.fileUrl || null,
          JSON.stringify(evidence.metadata || {}),
        ]
      );

      savedEvidences.push(mapEvidence(evidenceResult.rows[0]));
    }

    await client.query('COMMIT');

    return {
      ...mapInspection(inspection),
      evidences: savedEvidences,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function listInspections({ userId, vehicleId, quoteId } = {}) {
  const conditions = [];
  const params = [];

  if (userId) {
    params.push(userId);
    conditions.push(`i.user_id = $${params.length}`);
  }

  if (vehicleId) {
    params.push(vehicleId);
    conditions.push(`i.vehicle_id = $${params.length}`);
  }

  if (quoteId) {
    params.push(quoteId);
    conditions.push(`i.quote_id = $${params.length}`);
  }

  let sql = `
    SELECT i.*, u.first_name, u.last_name, u.email, u.mobile, v.brand, v.model, v.year, v.plate
    FROM inspections i
    LEFT JOIN users u ON u.id = i.user_id
    LEFT JOIN vehicles v ON v.id = i.vehicle_id
  `;

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ' ORDER BY i.id DESC';

  const result = await query(sql, params);

  return Promise.all(result.rows.map(async (row) => {
    const evidenceResult = await query(
      'SELECT * FROM inspection_evidences WHERE inspection_id = $1 ORDER BY id ASC',
      [row.id]
    );

    return {
      ...mapInspection(row),
      evidences: evidenceResult.rows.map(mapEvidence),
    };
  }));
}

async function findInspectionById(id) {
  const inspectionResult = await query(
    `SELECT i.*, u.first_name, u.last_name, u.email, u.mobile, v.brand, v.model, v.year, v.plate
     FROM inspections i
     LEFT JOIN users u ON u.id = i.user_id
     LEFT JOIN vehicles v ON v.id = i.vehicle_id
     WHERE i.id = $1
     LIMIT 1`,
    [id]
  );
  const inspection = mapInspection(inspectionResult.rows[0]);

  if (!inspection) {
    return null;
  }

  const evidenceResult = await query(
    'SELECT * FROM inspection_evidences WHERE inspection_id = $1 ORDER BY id ASC',
    [id]
  );

  return {
    ...inspection,
    evidences: evidenceResult.rows.map(mapEvidence),
  };
}

module.exports = {
  createInspection,
  listInspections,
  findInspectionById,
};
