const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const STATIONS_REGISTRY = require(path.join(__dirname, '../../dist/stations-registry.js'));

// Instancia de Netlify Blobs con tolerancia a entornos locales de pruebas
let blobStore = null;
try {
  const { getStore } = require('@netlify/blobs');
  blobStore = getStore('studio-connections');
} catch (_) {
  blobStore = null;
}

// Almacenamiento perimetral en Blobs con fallback seguro para pruebas locales
async function saveBlob(key, value) {
  if (blobStore) {
    try {
      await blobStore.setJSON(key, value);
      return;
    } catch (_) {}
  }
  const dir = path.join(__dirname, '../../.netlify/blobs-fallback');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${key}.json`), JSON.stringify(value), 'utf8');
}

async function readBlob(key) {
  if (blobStore) {
    try {
      const data = await blobStore.get(key, { type: 'json' });
      if (data) return data;
    } catch (_) {}
  }
  const file = path.join(__dirname, '../../.netlify/blobs-fallback', `${key}.json`);
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (_) {
      return null;
    }
  }
  return null;
}

async function removeBlob(key) {
  if (blobStore) {
    try {
      await blobStore.delete(key);
      return;
    } catch (_) {}
  }
  const file = path.join(__dirname, '../../.netlify/blobs-fallback', `${key}.json`);
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
    } catch (_) {}
  }
}

// Cifrado simétrico autenticado AES-256-GCM
function getAesKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY no está configurada.');
  return crypto.createHash('sha256').update(key).digest();
}

function encryptCredentials(data) {
  const aesKey = getAesKey();
  const iv = crypto.randomBytes(12); // 96 bits para AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  let ciphertext = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: ciphertext,
    updatedAt: new Date().toISOString()
  };
}

function decryptCredentials(envelope) {
  if (!envelope || !envelope.iv || !envelope.tag || !envelope.data) return null;
  const aesKey = getAesKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(envelope.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'hex'));
  let decrypted = decipher.update(envelope.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

// Comparación segura contra timing attacks
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hA = crypto.createHash('sha256').update(a).digest();
  const hB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hA, hB);
}

// Verificación de cookie de sesión de la oficina
function verifySessionCookie(cookieHeader, secret) {
  if (!cookieHeader || !secret) return false;
  const match = cookieHeader.match(/studio_session=([^;]+)/);
  if (!match) return false;
  const token = decodeURIComponent(match[1]);
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [b64Payload, signature] = parts;
  const expected = crypto.createHmac('sha256', secret).update(b64Payload).digest('hex');

  const sA = Buffer.from(signature, 'hex');
  const sB = Buffer.from(expected, 'hex');
  if (sA.length !== sB.length || !crypto.timingSafeEqual(sA, sB)) return false;

  try {
    const payload = JSON.parse(Buffer.from(b64Payload, 'base64').toString('utf8'));
    return Boolean(payload.exp && Date.now() < payload.exp);
  } catch (_) {
    return false;
  }
}

// Enmascaramiento de datos sensibles (nunca devolver texto plano al cliente)
function maskSecret(val) {
  if (!val || typeof val !== 'string') return '';
  const clean = val.trim();
  if (clean.length <= 4) return '••••';
  return '••••••••' + clean.slice(-4);
}

// Control de tasa para evitar abusos en pruebas y guardados
const requestBuckets = new Map();
function isRateLimited(key, maxLimit = 15, windowMs = 60000) {
  const now = Date.now();
  const bucket = requestBuckets.get(key) || [];
  const valid = bucket.filter(t => now - t < windowMs);
  if (valid.length >= maxLimit) {
    requestBuckets.set(key, valid);
    return true;
  }
  valid.push(now);
  requestBuckets.set(key, valid);
  return false;
}

// Validadores y probadores por estación
async function testStationConnection(stationId, creds) {
  if (stationId === 'github') {
    const token = creds.token?.trim();
    if (!token) throw new Error('Falta el token de GitHub.');
    const repo = 'alessandrorr1007-debug/OFICINA-DE-INGENIERIA';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'Paul-Engineering-Studio/1.0',
      'Accept': 'application/vnd.github+json'
    };

    // 1. Consultar rama main (solo GET)
    const branchRes = await fetch(`https://api.github.com/repos/${repo}/branches/main`, { headers });
    if (!branchRes.ok) {
      if (branchRes.status === 401 || branchRes.status === 403) {
        throw new Error('Token de GitHub inválido o sin permisos sobre el repositorio.');
      }
      if (branchRes.status === 404) {
        throw new Error('Repositorio o rama main no encontrada.');
      }
      throw new Error(`GitHub respondió con error (${branchRes.status}): ${branchRes.statusText}`);
    }

    // 2. Consultar últimos 5 commits (solo GET)
    const commitsRes = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`, { headers });
    if (!commitsRes.ok) {
      throw new Error(`Error al leer commits de GitHub (${commitsRes.status}).`);
    }
    const commits = await commitsRes.json();
    const count = Array.isArray(commits) ? commits.length : 0;
    const latest = count > 0 ? commits[0] : null;
    const shortSha = latest?.sha ? latest.sha.substring(0, 7) : '';
    const rawMsg = latest?.commit?.message || '';
    const cleanMsg = rawMsg.split('\n')[0].substring(0, 50);

    return `Conexión exitosa con GitHub. Rama main activa. Se leyeron los últimos ${count} commits (último: ${shortSha} - ${cleanMsg}).`;
  }

  if (stationId === 'ai') {
    const apiKey = creds.apiKey?.trim();
    const model = creds.model?.trim() || 'llama-3.3-70b-versatile';
    if (!apiKey) throw new Error('Falta la API Key de Groq.');

    // Llamada mínima de prueba a Groq
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Responde únicamente con la palabra OK.' }],
        max_completion_tokens: 5,
        temperature: 0.1
      })
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error('API Key de Groq inválida.');
      if (res.status === 429) {
        const err = new Error('Límite alcanzado en Groq (cuota de tokens o peticiones por minuto).');
        err.rateLimit = true;
        throw err;
      }
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error?.message || `Error en Groq (${res.status}).`);
    }

    return `Conexión exitosa con Groq. Modelo ${model} operativo y listo para responder.`;
  }

  if (stationId === 'deploy') {
    const url = creds.buildHookUrl?.trim();
    if (!url) throw new Error('Falta la URL del Build Hook de Netlify.');

    // Validar formato estricto sin disparar ninguna compilación real
    const regex = /^https:\/\/api\.netlify\.com\/build_hooks\/[a-zA-Z0-9_-]+$/;
    if (!regex.test(url)) {
      throw new Error('Formato inválido. Debe ser una URL oficial de Build Hook de Netlify (https://api.netlify.com/build_hooks/...).');
    }

    return 'Formato de Build Hook verificado correctamente. Conexión de despliegue configurada.';
  }

  throw new Error(`La estación "${stationId}" aún no tiene pruebas disponibles.`);
}

exports.handler = async (event) => {
  const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
  const sessionSecret = process.env.SESSION_SECRET;

  // 1. Exigir sesión válida de la oficina
  if (!verifySessionCookie(cookieHeader, sessionSecret)) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'No autorizado. Se requiere sesión activa en la oficina.' })
    };
  }

  // 2. Validar que exista ENCRYPTION_KEY
  if (!process.env.ENCRYPTION_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Variable de entorno ENCRYPTION_KEY no configurada en Netlify.' })
    };
  }

  // 3. Determinar acción
  const params = event.queryStringParameters || {};
  let action = params.action || '';
  const pathParts = event.path ? event.path.split('/').filter(Boolean) : [];
  const lastPart = pathParts[pathParts.length - 1];
  if (['status', 'save', 'test', 'delete'].includes(lastPart)) {
    action = lastPart;
  }
  if (!action && event.httpMethod === 'GET') action = 'status';

  // 4. Rate limiting por IP/acción
  const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  if (['save', 'test'].includes(action) && isRateLimited(`${clientIp}:${action}`, 15, 60000)) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ ok: false, error: 'Límite alcanzado: demasiadas peticiones seguidas. Espera un momento.' })
    };
  }

  // Parsear body si existe
  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (_) {
      body = {};
    }
  }

  // Comprobar contraseña de oficina si se requiere para cambiar credenciales
  if (body.officePassword) {
    const appPassword = process.env.APP_PASSWORD || '';
    if (!safeCompare(body.officePassword.trim(), appPassword.trim())) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: 'Contraseña de la oficina incorrecta. No se aplicaron cambios.' })
      };
    }
  }

  try {
    // ACCIÓN: CONSULTAR ESTADO DE TODAS LAS ESTACIONES
    if (action === 'status') {
      const statuses = {};
      for (const key of Object.keys(STATIONS_REGISTRY)) {
        const def = STATIONS_REGISTRY[key];
        if (def.proximamente) {
          statuses[key] = {
            id: key,
            status: 'Desconectado',
            proximamente: true,
            configured: false
          };
          continue;
        }

        const envelope = await readBlob(key);
        if (!envelope) {
          statuses[key] = {
            id: key,
            status: 'Desconectado',
            configured: false
          };
          continue;
        }

        try {
          const creds = decryptCredentials(envelope);
          const masked = {};
          if (creds) {
            for (const [fKey, fVal] of Object.entries(creds)) {
              if (fKey === 'model' || fKey === 'repo') {
                masked[fKey] = fVal;
              } else {
                masked[fKey] = maskSecret(fVal);
              }
            }
          }
          statuses[key] = {
            id: key,
            status: envelope.lastStatus || 'Conectado',
            configured: true,
            updatedAt: envelope.updatedAt,
            lastTestedAt: envelope.lastTestedAt || null,
            lastTestMessage: envelope.lastTestMessage || null,
            masked
          };
        } catch (_) {
          statuses[key] = {
            id: key,
            status: 'Error',
            configured: false,
            error: 'No se pudo descifrar las credenciales guardadas.'
          };
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ ok: true, stations: statuses })
      };
    }

    // ACCIÓN: GUARDAR CREDENCIALES
    if (action === 'save') {
      const stationId = body.stationId;
      const fields = body.fields || {};
      if (!STATIONS_REGISTRY[stationId] || STATIONS_REGISTRY[stationId].proximamente) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'Estación inválida o no disponible.' })
        };
      }

      // Validar campos requeridos
      const def = STATIONS_REGISTRY[stationId];
      for (const field of def.fields || []) {
        if (field.required && (!fields[field.id] || !fields[field.id].trim())) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ok: false, error: `El campo "${field.label}" es obligatorio.` })
          };
        }
      }

      // Cifrar con AES-256-GCM y guardar en Netlify Blobs
      const envelope = encryptCredentials(fields);
      envelope.lastStatus = 'Conectado';
      await saveBlob(stationId, envelope);

      const masked = {};
      for (const [k, v] of Object.entries(fields)) {
        masked[k] = (k === 'model' || k === 'repo') ? v : maskSecret(v);
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({
          ok: true,
          status: 'Conectado',
          message: 'Configurado ✓',
          updatedAt: envelope.updatedAt,
          masked
        })
      };
    }

    // ACCIÓN: PROBAR CONEXIÓN
    if (action === 'test') {
      const stationId = body.stationId;
      if (!STATIONS_REGISTRY[stationId]) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'Estación inválida.' })
        };
      }

      let credsToTest = body.fields;
      let envelope = null;

      // Si no vienen en el cuerpo, recuperar las credenciales cifradas guardadas
      if (!credsToTest || Object.keys(credsToTest).length === 0) {
        envelope = await readBlob(stationId);
        if (!envelope) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ok: false, error: 'No hay credenciales guardadas para esta estación.' })
          };
        }
        credsToTest = decryptCredentials(envelope);
      }

      try {
        const message = await testStationConnection(stationId, credsToTest);
        
        // Actualizar estado en Blob si ya estaba guardada
        if (envelope) {
          envelope.lastStatus = 'Conectado';
          envelope.lastTestedAt = new Date().toISOString();
          envelope.lastTestMessage = message;
          await saveBlob(stationId, envelope);
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          body: JSON.stringify({
            ok: true,
            status: 'Conectado',
            message
          })
        };
      } catch (err) {
        const finalStatus = err.rateLimit ? 'Límite alcanzado' : 'Error';
        if (envelope) {
          envelope.lastStatus = finalStatus;
          envelope.lastTestedAt = new Date().toISOString();
          envelope.lastTestMessage = err.message;
          await saveBlob(stationId, envelope);
        }
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          body: JSON.stringify({
            ok: false,
            status: finalStatus,
            error: err.message
          })
        };
      }
    }

    // ACCIÓN: DESCONECTAR Y BORRAR CREDENCIALES
    if (action === 'delete') {
      const stationId = body.stationId;
      if (!stationId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'Identificador de estación requerido.' })
        };
      }

      await removeBlob(stationId);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({
          ok: true,
          status: 'Desconectado',
          message: 'Estación desconectada y credenciales eliminadas.'
        })
      };
    }

    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: `Acción desconocida: "${action}".` })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Error interno en el servidor de conexiones.' })
    };
  }
};
