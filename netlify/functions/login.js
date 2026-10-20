const crypto = require('node:crypto');

// Utilidad para pausar ejecución (mitigación de fuerza bruta en el servidor)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Firma criptográfica HMAC-SHA256
function sign(data, secret) {
  const b64Payload = Buffer.from(JSON.stringify(data)).toString('base64');
  const signature = crypto.createHmac('sha256', secret).update(b64Payload).digest('hex');
  return `${b64Payload}.${signature}`;
}

// Verificación de firma criptográfica
function verify(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [b64Payload, signature] = parts;
  const expected = crypto.createHmac('sha256', secret).update(b64Payload).digest('hex');
  
  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(b64Payload, 'base64').toString('utf8'));
  } catch (_) {
    return null;
  }
}

// Comparación segura en tiempo constante (protección contra timing attacks)
function safeCompare(input, expected) {
  if (typeof input !== 'string' || typeof expected !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(input).digest();
  const hashB = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// Extracción de cookies del encabezado
function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  const pairs = header.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  }
  return cookies;
}

// Cálculo del tiempo de espera según el número de fallos
function getDelaySeconds(attempts) {
  if (attempts < 3) return 0;
  if (attempts === 3) return 3;
  if (attempts === 4) return 8;
  if (attempts === 5) return 15;
  return 30; // 6 o más intentos fallidos
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Método no permitido' })
    };
  }

  const appPassword = process.env.APP_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!appPassword || !sessionSecret) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        error: 'Error de configuración: APP_PASSWORD o SESSION_SECRET no están configuradas en Netlify.'
      })
    };
  }

  // Parsear contraseña del body (JSON o form-urlencoded)
  let passwordInput = '';
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  const rawBody = event.body || '';

  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(rawBody);
      passwordInput = parsed.password || '';
    } catch (_) {
      passwordInput = '';
    }
  } else {
    try {
      const params = new URLSearchParams(rawBody);
      passwordInput = params.get('password') || '';
    } catch (_) {
      passwordInput = '';
    }
  }

  // Verificar estado de intentos fallidos (protección contra fuerza bruta)
  const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
  const cookies = parseCookies(cookieHeader);
  const throttleData = verify(cookies.studio_throttle, sessionSecret);

  let currentAttempts = throttleData && typeof throttleData.attempts === 'number' ? throttleData.attempts : 0;
  const lastFailedAt = throttleData && typeof throttleData.lastFailed === 'number' ? throttleData.lastFailed : 0;

  // Si ya tiene 3 o más intentos fallidos, comprobar tiempo de espera requerido
  const requiredDelay = getDelaySeconds(currentAttempts);
  if (requiredDelay > 0) {
    const elapsedSec = (Date.now() - lastFailedAt) / 1000;
    if (elapsedSec < requiredDelay) {
      const waitRemaining = Math.ceil(requiredDelay - elapsedSec);
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache'
        },
        body: JSON.stringify({
          ok: false,
          error: `Demasiados intentos fallidos. Espera ${waitRemaining} segundos.`,
          retryAfter: waitRemaining
        })
      };
    }
  }

  // Comparación segura
  const isMatch = safeCompare(passwordInput.trim(), appPassword.trim());

  if (!isMatch) {
    const newAttempts = currentAttempts + 1;
    const retryAfter = getDelaySeconds(newAttempts);

    // Retardo progresivo en el servidor para ralentizar ataques automatizados
    const serverSleepMs = Math.min(2000, 300 + newAttempts * 200);
    await sleep(serverSleepMs);

    const throttleToken = sign(
      { attempts: newAttempts, lastFailed: Date.now() },
      sessionSecret
    );

    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache',
        'Set-Cookie': `studio_throttle=${throttleToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`
      },
      body: JSON.stringify({
        ok: false,
        error: 'Contraseña incorrecta',
        attempts: newAttempts,
        retryAfter: retryAfter > 0 ? retryAfter : 0
      })
    };
  }

  // Contraseña correcta: emitir token de sesión para 30 días
  const maxAge = 30 * 24 * 60 * 60; // 30 días en segundos (2592000s)
  const sessionPayload = {
    iat: Date.now(),
    exp: Date.now() + maxAge * 1000,
    nonce: crypto.randomBytes(16).toString('hex')
  };
  const sessionToken = sign(sessionPayload, sessionSecret);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache'
    },
    multiValueHeaders: {
      'Set-Cookie': [
        `studio_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`,
        `studio_throttle=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
      ]
    },
    body: JSON.stringify({ ok: true })
  };
};
