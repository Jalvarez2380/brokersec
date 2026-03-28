const { query } = require('../db/pool');
const { getClient } = require('../db/pool');

function mapUserRoles(row) {
  if (!row) return [];

  if (Array.isArray(row.roles) && row.roles.length > 0) {
    return row.roles.filter(Boolean);
  }

  if (row.role) {
    return [row.role];
  }

  return [];
}

function mapUser(row) {
  if (!row) return null;

  const roles = mapUserRoles(row);

  return {
    id: row.id,
    dni: row.dni,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    username: row.username,
    mobile: row.mobile,
    role: roles[0],
    roles,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createUser({ dni, firstName, lastName, email, username, passwordHash, mobile, role = 'user' }) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO users (dni, first_name, last_name, email, username, password_hash, mobile, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [dni, firstName, lastName, email, username, passwordHash, mobile || null, role]
    );

    const user = result.rows[0];
    await assignRole(client, user.id, role);

    await client.query('COMMIT');
    return findById(user.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function findByUsernameOrEmail(value) {
  const result = await query(
    `SELECT u.*,
            COALESCE(
              ARRAY_AGG(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL),
              ARRAY[]::VARCHAR[]
            ) AS roles
     FROM users
     u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.username = $1 OR u.email = $1
     GROUP BY u.id
     LIMIT 1`,
    [value]
  );

  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query(
    `SELECT u.*,
            COALESCE(
              ARRAY_AGG(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL),
              ARRAY[]::VARCHAR[]
            ) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.id = $1
     GROUP BY u.id
     LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

async function listUsers() {
  const result = await query(
    `SELECT u.id,
            u.dni,
            u.first_name,
            u.last_name,
            u.email,
            u.username,
            u.mobile,
            u.role,
            u.created_at,
            u.updated_at,
            COALESCE(
              ARRAY_AGG(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL),
              ARRAY[]::VARCHAR[]
            ) AS roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     GROUP BY u.id
     ORDER BY u.id DESC`
  );

  return result.rows.map(mapUser);
}

async function assignRole(client, userId, roleCode) {
  const roleResult = await client.query(
    `SELECT id FROM roles WHERE code = $1 LIMIT 1`,
    [roleCode]
  );

  if (!roleResult.rows[0]) {
    throw new Error(`Rol no encontrado: ${roleCode}`);
  }

  await client.query(
    `DELETE FROM user_roles WHERE user_id = $1`,
    [userId]
  );

  await client.query(
    `INSERT INTO user_roles (user_id, role_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, role_id) DO NOTHING`,
    [userId, roleResult.rows[0].id]
  );
}

module.exports = {
  mapUser,
  createUser,
  findByUsernameOrEmail,
  findById,
  listUsers,
};
