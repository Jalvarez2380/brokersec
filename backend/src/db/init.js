const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query } = require('./pool');
const config = require('../config');
const { ALLOWED_ROLES } = require('../config/roles');

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

  await ensureInspectionLocationColumns();
  await ensureRolesCatalog();
  await migrateUserRoles();
  await ensureSeedUsers();
}

async function ensureInspectionLocationColumns() {
  await query(`ALTER TABLE inspections ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7)`);
  await query(`ALTER TABLE inspections ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7)`);
  await query(`ALTER TABLE inspections ADD COLUMN IF NOT EXISTS location_accuracy NUMERIC(10, 2)`);
  await query(`ALTER TABLE inspections ADD COLUMN IF NOT EXISTS location_captured_at TIMESTAMPTZ`);
}

async function ensureRolesCatalog() {
  const roleDefinitions = [
    { code: 'admin', name: 'Administrador', description: 'Control total del sistema' },
    { code: 'ventas', name: 'Ventas', description: 'Gestion comercial y cotizaciones' },
    { code: 'usuario', name: 'Usuario', description: 'Acceso basico al sistema' },
  ];

  for (const role of roleDefinitions) {
    await query(
      `INSERT INTO roles (code, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (code)
       DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
      [role.code, role.name, role.description]
    );
  }
}

async function migrateUserRoles() {
  const usersResult = await query(
    `SELECT id, role FROM users`
  );

  for (const user of usersResult.rows) {
    const roleCode = ALLOWED_ROLES.includes(user.role) ? user.role : 'usuario';

    await query(
      `UPDATE users
       SET role = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [roleCode, user.id]
    );

    await syncUserRole(user.id, roleCode);
  }
}

async function ensureSeedUsers() {
  for (const seedUser of config.seedUsers) {
    await upsertSeedUser(seedUser);
  }
}

async function upsertSeedUser(seedUser) {
  const passwordHash = await bcrypt.hash(seedUser.password, config.bcrypt.saltRounds);

  const existing = await query(
    `SELECT id
     FROM users
     WHERE username = $1 OR email = $2 OR dni = $3
     LIMIT 1`,
    [seedUser.username, seedUser.email, seedUser.dni]
  );

  if (existing.rows[0]) {
    const userId = existing.rows[0].id;
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
        seedUser.dni,
        seedUser.firstName,
        seedUser.lastName,
        seedUser.email,
        seedUser.username,
        passwordHash,
        seedUser.mobile,
        seedUser.role,
        userId,
      ]
    );
    await syncUserRole(userId, seedUser.role);
    return;
  }

  const created = await query(
    `INSERT INTO users (dni, first_name, last_name, email, username, password_hash, mobile, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      seedUser.dni,
      seedUser.firstName,
      seedUser.lastName,
      seedUser.email,
      seedUser.username,
      passwordHash,
      seedUser.mobile,
      seedUser.role,
    ]
  );

  await syncUserRole(created.rows[0].id, seedUser.role);
}

async function syncUserRole(userId, roleCode) {
  await query(
    `DELETE FROM user_roles WHERE user_id = $1`,
    [userId]
  );

  await query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT $1, r.id
     FROM roles r
     WHERE r.code = $2
     ON CONFLICT (user_id, role_id) DO NOTHING`,
    [userId, roleCode]
  );
}

module.exports = {
  initializeDatabase,
};
