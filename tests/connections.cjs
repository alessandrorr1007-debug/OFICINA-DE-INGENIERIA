const assert = require('node:assert');
const crypto = require('node:crypto');
const path = require('node:path');

process.env.APP_PASSWORD = 'super-office-password';
process.env.SESSION_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.ENCRYPTION_KEY = 'my-ultra-secret-encryption-key-for-connections';

const connectionsHandler = require(path.join(__dirname, '../netlify/functions/connections.js')).handler;

// Generar cookie válida de sesión para las pruebas
function createValidSessionCookie() {
  const payload = {
    iat: Date.now(),
    exp: Date.now() + 3600000,
    nonce: 'test-nonce'
  };
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const sig = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(b64).digest('hex');
  return `studio_session=${b64}.${sig}`;
}

async function runConnectionTests() {
  console.log('--- Iniciando pruebas de sistema de conexiones y cifrado ---');

  // 1. Probar rechazo sin cookie de sesión
  const resNoAuth = await connectionsHandler({
    httpMethod: 'GET',
    headers: {},
    queryStringParameters: { action: 'status' }
  });
  assert.strictEqual(resNoAuth.statusCode, 401, 'Debe responder 401 sin sesión');

  const validCookie = createValidSessionCookie();

  // 2. Consultar estado inicial
  const resInitStatus = await connectionsHandler({
    httpMethod: 'GET',
    headers: { cookie: validCookie },
    queryStringParameters: { action: 'status' }
  });
  assert.strictEqual(resInitStatus.statusCode, 200);
  const dataInit = JSON.parse(resInitStatus.body);
  assert.ok(dataInit.ok);
  assert.ok(dataInit.stations.github);
  assert.ok(dataInit.stations.ai);
  assert.ok(dataInit.stations.deploy);
  assert.ok(dataInit.stations.database.proximamente);

  // 3. Guardar credenciales de Despliegue (Teo)
  const buildHookUrl = 'https://api.netlify.com/build_hooks/671234567890abcdef123456';
  const resSaveDeploy = await connectionsHandler({
    httpMethod: 'POST',
    headers: { cookie: validCookie, 'content-type': 'application/json' },
    queryStringParameters: { action: 'save' },
    body: JSON.stringify({
      stationId: 'deploy',
      fields: { buildHookUrl }
    })
  });
  assert.strictEqual(resSaveDeploy.statusCode, 200, 'Debe guardar credenciales correctamente');
  const dataSaveDeploy = JSON.parse(resSaveDeploy.body);
  assert.strictEqual(dataSaveDeploy.ok, true);
  assert.strictEqual(dataSaveDeploy.status, 'Conectado');
  assert.ok(dataSaveDeploy.masked.buildHookUrl.startsWith('••••••••'));
  assert.strictEqual(dataSaveDeploy.masked.buildHookUrl.slice(-4), '3456');

  // 4. Probar conexión de Despliegue (validador de formato sin ejecución)
  const resTestDeploy = await connectionsHandler({
    httpMethod: 'POST',
    headers: { cookie: validCookie, 'content-type': 'application/json' },
    queryStringParameters: { action: 'test' },
    body: JSON.stringify({ stationId: 'deploy' })
  });
  assert.strictEqual(resTestDeploy.statusCode, 200);
  const dataTestDeploy = JSON.parse(resTestDeploy.body);
  assert.strictEqual(dataTestDeploy.ok, true);
  assert.strictEqual(dataTestDeploy.status, 'Conectado');
  assert.ok(dataTestDeploy.message.includes('Build Hook verificado'));

  // 5. Probar validación con formato erróneo de hook
  const resTestInvalidHook = await connectionsHandler({
    httpMethod: 'POST',
    headers: { cookie: validCookie, 'content-type': 'application/json' },
    queryStringParameters: { action: 'test' },
    body: JSON.stringify({
      stationId: 'deploy',
      fields: { buildHookUrl: 'https://evil.com/hook' }
    })
  });
  const dataInvalid = JSON.parse(resTestInvalidHook.body);
  assert.strictEqual(dataInvalid.ok, false);
  assert.strictEqual(dataInvalid.status, 'Error');

  // 6. Probar que el estado devuelve datos enmascarados y nunca en texto plano
  const resStatusAfter = await connectionsHandler({
    httpMethod: 'GET',
    headers: { cookie: validCookie },
    queryStringParameters: { action: 'status' }
  });
  const dataStatusAfter = JSON.parse(resStatusAfter.body);
  assert.strictEqual(dataStatusAfter.stations.deploy.status, 'Conectado');
  assert.ok(!JSON.stringify(dataStatusAfter).includes(buildHookUrl), 'NUNCA debe devolver el secreto en texto plano');

  // 7. Probar protección por contraseña de oficina (sudo mode)
  const resSaveWrongPass = await connectionsHandler({
    httpMethod: 'POST',
    headers: { cookie: validCookie, 'content-type': 'application/json' },
    queryStringParameters: { action: 'save' },
    body: JSON.stringify({
      stationId: 'deploy',
      fields: { buildHookUrl },
      officePassword: 'wrong-password'
    })
  });
  assert.strictEqual(resSaveWrongPass.statusCode, 403, 'Debe rechazar si la contraseña de oficina no coincide');

  // 8. Desconectar y borrar credenciales
  const resDelete = await connectionsHandler({
    httpMethod: 'POST',
    headers: { cookie: validCookie, 'content-type': 'application/json' },
    queryStringParameters: { action: 'delete' },
    body: JSON.stringify({ stationId: 'deploy' })
  });
  assert.strictEqual(resDelete.statusCode, 200);
  const dataDelete = JSON.parse(resDelete.body);
  assert.strictEqual(dataDelete.ok, true);
  assert.strictEqual(dataDelete.status, 'Desconectado');

  // 9. Comprobar que tras borrar vuelve a estado desconectado
  const resStatusFinal = await connectionsHandler({
    httpMethod: 'GET',
    headers: { cookie: validCookie },
    queryStringParameters: { action: 'status' }
  });
  const dataFinal = JSON.parse(resStatusFinal.body);
  assert.strictEqual(dataFinal.stations.deploy.status, 'Desconectado');
  assert.strictEqual(dataFinal.stations.deploy.configured, false);

  console.log('OK: Pruebas de conexiones, cifrado AES-256-GCM, verificación y borrado pasaron exitosamente.');
}

runConnectionTests().catch(err => {
  console.error('Fallo en pruebas de conexiones:', err);
  process.exit(1);
});
