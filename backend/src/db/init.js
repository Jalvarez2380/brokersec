const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query } = require('./pool');
const config = require('../config');

const schemaPath = path.join(__dirname, '../../sql/schema.sql');

async function initializeDatabase() {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const statements = schemaSql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await query(statement);
  }

  await ensureSeedAdmin();
}

async function ensureSeedAdmin() {
  const admin = config.seedAdmin;
  const passwordHash = await bcrypt.hash(admin.password, config.bcrypt.saltRounds);

  const existing = await query(
    `SELECT id
     FROM users
     WHERE username = $1 OR email = $2 OR dni = $3
     LIMIT 1`,
    [admin.username, admin.email, admin.dni]
  );

  if (existing.rows[0]) {
    await query(
      `UPDATE users
       SET dni = $1,
           first_name = $2,
           last_name = $3,
           email = $4,
           username = $5,
           password_hash = $6,
           mobile = $7,
           role = $8,
           updated_at = NOW()
       WHERE id = $9`,
      [
        admin.dni,
        admin.firstName,
        admin.lastName,
        admin.email,
        admin.username,
        passwordHash,
        admin.mobile,
        admin.role,
        existing.rows[0].id,
      ]
    );
    return;
  }

  await query(
    `INSERT INTO users (dni, first_name, last_name, email, username, password_hash, mobile, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      admin.dni,
      admin.firstName,
      admin.lastName,
      admin.email,
      admin.username,
      passwordHash,
      admin.mobile,
      admin.role,
    ]
  );
}

module.exports = {
  initializeDatabase,
};
