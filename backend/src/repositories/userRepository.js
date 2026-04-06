const { query } = require('../db/pool');

function mapUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    dni: row.dni,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    username: row.username,
    mobile: row.mobile,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createUser({ dni, firstName, lastName, email, username, passwordHash, mobile, role = 'user' }) {
  const result = await query(
    `INSERT INTO users (dni, first_name, last_name, email, username, password_hash, mobile, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [dni, firstName, lastName, email, username, passwordHash, mobile || null, role]
  );

  return result.rows[0];
}

async function findByUsernameOrEmail(value) {
  const result = await query(
    `SELECT *
     FROM users
     WHERE username = $1 OR email = $1 OR dni = $1
     LIMIT 1`,
    [value]
  );

  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return result.rows[0] || null;
}

async function listUsers() {
  const result = await query(
    'SELECT id, dni, first_name, last_name, email, username, mobile, role, created_at, updated_at FROM users ORDER BY id DESC'
  );

  return result.rows.map(mapUser);
}

module.exports = {
  mapUser,
  createUser,
  findByUsernameOrEmail,
  findById,
  listUsers,
};
