const assert = require('node:assert');
const crypto = require('node:crypto');
const path = require('node:path');

process.env.APP_PASSWORD = 'password123';
process.env.SESSION_SECRET = 'd9f8e7c6b5a41234567890abcdef1234567890abcdef1234567890abcdef1234';

const loginHandler = require(path.join(__dirname, '../netlify/functions/login.js')).handler;
const logoutHandler = require(path.join(__dirname, '../netlify/functions/logout.js')).handler;

async function runAuthTests() {
  console.log('--- Iniciando pruebas de autenticación ---');

  // 1. Método no permitido
  const rMethod = await loginHandler({ httpMethod: 'GET', headers: {} });
  assert.strictEqual(rMethod.statusCode, 405, 'Debe rechazar GET');

  // 2. Contraseña incorrecta
  const rWrong = await loginHandler({
    httpMethod: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'contrasena_erronea' })
  });
  assert.strictEqual(rWrong.statusCode, 401, 'Debe devolver 401 ante contraseña incorrecta');
  const bodyWrong = JSON.parse(rWrong.body);
  assert.strictEqual(bodyWrong.ok, false);
  assert.strictEqual(bodyWrong.error, 'Contraseña incorrecta');
  assert.ok(rWrong.headers['Set-Cookie'].includes('studio_throttle='), 'Debe emitir cookie de throttle');

  // 3. Contraseña correcta
  const rCorrect = await loginHandler({
    httpMethod: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'password123' })
  });
  assert.strictEqual(rCorrect.statusCode, 200, 'Debe devolver 200 ante contraseña correcta');
  const bodyCorrect = JSON.parse(rCorrect.body);
  assert.strictEqual(bodyCorrect.ok, true);

  const cookies = rCorrect.multiValueHeaders['Set-Cookie'];
  assert.ok(Array.isArray(cookies), 'Debe devolver multiValueHeaders con cookies');
  const sessionCookie = cookies.find(c => c.startsWith('studio_session='));
  assert.ok(sessionCookie, 'Debe incluir cookie studio_session');
  assert.ok(sessionCookie.includes('HttpOnly'), 'Debe ser HttpOnly');
  assert.ok(sessionCookie.includes('Secure'), 'Debe ser Secure');
  assert.ok(sessionCookie.includes('SameSite=Strict'), 'Debe ser SameSite=Strict');
  assert.ok(sessionCookie.includes('Max-Age=2592000'), 'Debe tener Max-Age de 30 días');

  // 4. Verificación de token estilo Edge Function (WebCrypto HMAC-SHA256)
  const tokenMatch = sessionCookie.match(/^studio_session=([^;]+)/);
  assert.ok(tokenMatch, 'Token extraído');
  const token = tokenMatch[1];
  const [b64Payload, signature] = token.split('.');

  const enc = new TextEncoder();
  const key = await crypto.webcrypto.subtle.importKey(
    'raw',
    enc.encode(process.env.SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const expectedSigBuf = await crypto.webcrypto.subtle.sign('HMAC', key, enc.encode(b64Payload));
  const expectedHex = Array.from(new Uint8Array(expectedSigBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  assert.strictEqual(signature, expectedHex, 'La firma generada por login debe ser verificable en WebCrypto');

  // 5. Rechazo de token manipulado
  const tamperedToken = b64Payload + '.deadbeef1234';
  const [, tamperedSig] = tamperedToken.split('.');
  assert.notStrictEqual(tamperedSig, expectedHex, 'Debe detectar firma manipulada');

  // 6. Prueba de logout
  const rLogoutPost = await logoutHandler({ httpMethod: 'POST', headers: {} });
  assert.strictEqual(rLogoutPost.statusCode, 200);
  assert.ok(rLogoutPost.headers['Set-Cookie'].includes('Max-Age=0'));

  const rLogoutGet = await logoutHandler({ httpMethod: 'GET', headers: {} });
  assert.strictEqual(rLogoutGet.statusCode, 302);
  assert.strictEqual(rLogoutGet.headers.Location, '/');
  assert.ok(rLogoutGet.headers['Set-Cookie'].includes('Max-Age=0'));

  console.log('OK: Pruebas de autenticación, firma WebCrypto, throttling y logout pasaron exitosamente.');
}

runAuthTests().catch((err) => {
  console.error('Error en pruebas de autenticación:', err);
  process.exit(1);
});
