const fs = require('fs');
const path = require('path');
const { query } = require('./pool');

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
}

module.exports = {
  initializeDatabase,
};
