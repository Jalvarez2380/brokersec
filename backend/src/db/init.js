const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query } = require('./pool');

const schemaPath = path.join(__dirname, '../../sql/schema.sql');

async function seedUsers() {
  // Garantiza que los usuarios semilla existan con credenciales conocidas.
  // Si el username ya existe -> solo actualiza password_hash y role.
  // Si no existe -> inserta con datos unicos.
  const seeds = [
    { username: 'admin',      password: 'Admin123!',    role: 'admin',
      dni: 'SEED-ADM-001', firstName: 'Admin',     lastName: 'BROKERSEC', email: 'seed.admin@brokersec.local',     mobile: '0999000001' },
    { username: 'inspector1', password: 'Inspector1!',  role: 'inspector',
      dni: 'SEED-INS-001', firstName: 'Inspector', lastName: 'Principal', email: 'seed.inspector@brokersec.local', mobile: '0999000002' },
    { username: 'ventas1',    password: 'Ventas123!',   role: 'ventas',
      dni: 'SEED-VEN-001', firstName: 'Vendedor',  lastName: 'Principal', email: 'seed.ventas@brokersec.local',    mobile: '0999000003' },
  ];

  for (const s of seeds) {
    const hash = await bcrypt.hash(s.password, 10);

    // Verificar si el usuario ya existe por username
    const { rows } = await query('SELECT id FROM users WHERE username = $1', [s.username]);

    if (rows.length > 0) {
      // Ya existe: solo actualizar password y rol
      await query(
        'UPDATE users SET password_hash=$1, role=$2, updated_at=NOW() WHERE username=$3',
        [hash, s.role, s.username],
      );
    } else {
      // No existe: insertar nuevo usuario semilla
      await query(`
        INSERT INTO users (dni, first_name, last_name, email, username, password_hash, mobile, role)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT DO NOTHING
      `, [s.dni, s.firstName, s.lastName, s.email, s.username, hash, s.mobile, s.role]);
    }
  }

  console.log('Usuarios semilla listos: admin / inspector1 / ventas1');
}

async function initializeDatabase() {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  // Separar en sentencias individuales (excluyendo el bloque INSERT de semillas del schema,
  // que se ejecuta via seedUsers() para mejor control)
  const statements = schemaSql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await query(statement);
  }

  await query(`ALTER TABLE inspections ADD COLUMN IF NOT EXISTS location JSONB NOT NULL DEFAULT '{}'::jsonb`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) NOT NULL DEFAULT 'user'`);

  await seedUsers();
}

module.exports = {
  initializeDatabase,
};
