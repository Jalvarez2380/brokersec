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

  return {
    id: row.id,
    userId: row.user_id,
    vehicleId: row.vehicle_id,
    quoteId: row.quote_id,
    status: row.status,
    notes: row.notes,
    scheduledAt: row.scheduled_at,
    location: row.latitude !== null && row.longitude !== null ? {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      accuracy: row.location_accuracy !== null ? Number(row.location_accuracy) : null,
      capturedAt: row.location_captured_at,
    } : null,
    createdAt: row.created_at,
  };
}

async function createInspection({ userId, vehicleId, quoteId, status, notes, scheduledAt, location, evidences = [] }) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const inspectionResult = await client.query(
      `INSERT INTO inspections (
         user_id, vehicle_id, quote_id, status, notes, scheduled_at,
         latitude, longitude, location_accuracy, location_captured_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId || null,
        vehicleId || null,
        quoteId || null,
        status || 'pending',
        notes || null,
        scheduledAt || null,
        location?.latitude ?? null,
        location?.longitude ?? null,
        location?.accuracy ?? null,
        location?.capturedAt || null,
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
    conditions.push(`user_id = $${params.length}`);
  }

  if (vehicleId) {
    params.push(vehicleId);
    conditions.push(`vehicle_id = $${params.length}`);
  }

  if (quoteId) {
    params.push(quoteId);
    conditions.push(`quote_id = $${params.length}`);
  }

  let sql = 'SELECT * FROM inspections';
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ' ORDER BY id DESC';

  const result = await query(sql, params);
  return result.rows.map(mapInspection);
}

async function findInspectionById(id) {
  const inspectionResult = await query('SELECT * FROM inspections WHERE id = $1 LIMIT 1', [id]);
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
