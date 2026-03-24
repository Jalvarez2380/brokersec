const { createApp } = require('../server');

describe('health endpoints', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    const app = createApp();
    server = app.listen(0, '127.0.0.1');

    await new Promise((resolve) => {
      server.on('listening', resolve);
    });

    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    if (!server) {
      return;
    }

    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  test('GET / devuelve informacion de endpoints', async () => {
    const response = await fetch(`${baseUrl}/`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.endpoints.healthLive).toBe('/api/health/live');
    expect(body.endpoints.healthReady).toBe('/api/health/ready');
  });

  test('GET /api/health/live devuelve estado operativo', async () => {
    const response = await fetch(`${baseUrl}/api/health/live`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.service).toBe('brokersec-backend');
    expect(body.data.version).toBeDefined();
    expect(body.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
