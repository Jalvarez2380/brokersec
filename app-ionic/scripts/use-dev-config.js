/**
 * Inyecta la configuracion de desarrollo (server.url) en capacitor.config.json
 * para que el emulador de Android cargue la app desde el servidor Vite dev (puerto 3000).
 *
 * Uso: node scripts/use-dev-config.js
 * El script modifica SOLO el archivo capacitor.config.json generado por cap sync,
 * nunca toca capacitor.config.ts.
 */

const fs = require('fs');
const path = require('path');

const CAP_CONFIG_JSON = path.join(__dirname, '../android/app/src/main/assets/capacitor.config.json');
const DEV_SERVER_URL = process.env.CAP_SERVER_URL || 'http://10.0.2.2:3000';

if (!fs.existsSync(CAP_CONFIG_JSON)) {
  console.error('capacitor.config.json no encontrado. Ejecuta "npx cap sync android" primero.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CAP_CONFIG_JSON, 'utf8'));

config.server = {
  ...(config.server || {}),
  url: DEV_SERVER_URL,
  cleartext: true,
};

fs.writeFileSync(CAP_CONFIG_JSON, JSON.stringify(config, null, 2));
console.log(`Dev config aplicada: server.url = ${DEV_SERVER_URL}`);
