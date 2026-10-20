// Netlify Edge Function: Autenticación perimetral obligatoria para Paul Engineering Studio

function getSecret() {
  try {
    if (typeof Netlify !== "undefined" && Netlify.env) {
      const sec = Netlify.env.get("SESSION_SECRET");
      if (sec) return sec;
    }
  } catch (_) {}
  try {
    if (typeof Deno !== "undefined" && Deno.env) {
      const sec = Deno.env.get("SESSION_SECRET");
      if (sec) return sec;
    }
  } catch (_) {}
  return "";
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx > -1) {
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      if (key === name) {
        return decodeURIComponent(val);
      }
    }
  }
  return null;
}

// Verificación criptográfica HMAC-SHA256 en WebCrypto (entorno Edge/Deno)
async function verifySessionToken(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [b64Payload, signature] = parts;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const expectedSigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(b64Payload));
    const expectedHex = Array.from(new Uint8Array(expectedSigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedHex.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expectedHex.length; i++) {
      diff |= expectedHex.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    if (diff !== 0) return false;

    // Decodificar payload y comprobar caducidad
    const jsonStr = atob(b64Payload);
    const data = JSON.parse(jsonStr);
    if (!data.exp || typeof data.exp !== "number") return false;
    if (Date.now() > data.exp) return false;

    return true;
  } catch (_) {
    return false;
  }
}

// Generador de la pantalla de contraseña (autosuficiente, sin dependencias externas)
function renderPasswordScreen() {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Acceso · Paul Engineering Studio</title>
  <meta name="robots" content="noindex, nofollow, noarchive">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100dvh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", system-ui, sans-serif;
      background:
        radial-gradient(ellipse at 50% 20%, #eae5d7 0%, #ded7c6 50%, #cfc5b0 100%);
      color: #243c39;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      width: 100%;
      max-width: 390px;
      background: #fbfaf6;
      border: 1px solid #dcdfd6;
      border-radius: 26px;
      padding: 40px 28px 34px;
      box-shadow:
        0 24px 50px rgba(36, 60, 57, 0.10),
        0 4px 12px rgba(36, 60, 57, 0.05);
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, #c59b58, #35534c, #c59b58);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 13px;
      margin-bottom: 28px;
    }
    .logo {
      font-size: 26px;
      line-height: 1;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: #2d4542;
      color: #dec8a6;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(45, 69, 66, 0.2);
    }
    .brand-title {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.10em;
      color: #243c39;
      line-height: 1.2;
    }
    .brand-title em {
      display: block;
      font-style: normal;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.16em;
      color: #6a8279;
      margin-top: 2px;
    }
    .brand-sub {
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #8c9b93;
      margin-top: 3px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    label {
      font-size: 13px;
      font-weight: 600;
      color: #3b544e;
      letter-spacing: 0.02em;
    }
    .input-wrapper {
      position: relative;
    }
    input[type="password"], input[type="text"] {
      width: 100%;
      min-height: 56px;
      padding: 0 16px;
      font-size: 16px; /* Evita zoom automático en Safari iOS */
      color: #243c39;
      background: #ffffff;
      border: 1.5px solid #c9d2c6;
      border-radius: 14px;
      font-family: inherit;
      outline: none;
      transition: border-color .18s, box-shadow .18s;
      -webkit-appearance: none;
    }
    input:focus {
      border-color: #2d4542;
      box-shadow: 0 0 0 4px rgba(45, 69, 66, 0.15);
    }
    input.shake {
      animation: shake .35s ease;
      border-color: #ba4742;
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-7px); }
      40%, 80% { transform: translateX(7px); }
    }
    button[type="submit"] {
      min-height: 56px;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.03em;
      font-family: inherit;
      color: #f6f3eb;
      background: #243c39;
      border: 0;
      border-radius: 14px;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(36, 60, 57, 0.22);
      transition: background .18s, transform .12s, filter .18s, opacity .18s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    button[type="submit"]:hover:not(:disabled) {
      background: #1d322f;
      filter: brightness(1.05);
    }
    button[type="submit"]:active:not(:disabled) {
      transform: scale(0.98);
    }
    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      box-shadow: none;
    }
    .feedback {
      min-height: 22px;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      text-align: center;
      padding: 0 4px;
      display: none;
    }
    .feedback.show {
      display: block;
    }
    .feedback.error {
      color: #a7332e;
      background: #faecea;
      border: 1px solid #f1c7c4;
      border-radius: 12px;
      padding: 11px 13px;
    }
    .feedback.success {
      color: #225c43;
      background: #e8f3ec;
      border: 1px solid #c2e2cf;
      border-radius: 12px;
      padding: 11px 13px;
    }
    .hint {
      margin-top: 24px;
      font-size: 11px;
      color: #8c9b93;
      text-align: center;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <div class="logo">✦</div>
      <div>
        <div class="brand-title">PAUL <em>ENGINEERING STUDIO</em></div>
        <div class="brand-sub">Acceso restringido</div>
      </div>
    </div>

    <form id="login-form" autocomplete="off">
      <div class="field-group">
        <label for="password">Ingresar contraseña</label>
        <div class="input-wrapper">
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Ingresar contraseña"
            autocomplete="current-password"
            required
            autofocus
          >
        </div>
      </div>

      <div id="feedback" class="feedback" role="alert" aria-live="polite"></div>

      <button type="submit" id="submit-btn">
        <span>Entrar</span>
      </button>
    </form>

    <p class="hint">Oficina de ingeniería interactiva · Acceso protegido</p>
  </div>

  <script>
    const form = document.getElementById('login-form');
    const input = document.getElementById('password');
    const btn = document.getElementById('submit-btn');
    const feedback = document.getElementById('feedback');
    let countdownInterval = null;

    function showError(msg) {
      feedback.textContent = msg;
      feedback.className = 'feedback show error';
      input.classList.remove('shake');
      void input.offsetWidth; // retrigger reflow
      input.classList.add('shake');
      input.value = '';
      input.focus();
    }

    function showSuccess(msg) {
      feedback.textContent = msg;
      feedback.className = 'feedback show success';
    }

    function startCooldown(seconds) {
      let remaining = seconds;
      btn.disabled = true;
      input.disabled = true;
      
      const updateText = () => {
        showError('Demasiados intentos. Espera ' + remaining + 's para reintentar.');
      };
      updateText();

      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(countdownInterval);
          btn.disabled = false;
          input.disabled = false;
          feedback.className = 'feedback';
          feedback.textContent = '';
          input.focus();
        } else {
          updateText();
        }
      }, 1000);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = input.value;
      if (!password) return;

      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span>Verificando...</span>';

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.ok) {
          showSuccess('Contraseña correcta. Abriendo oficina...');
          // Redirigir a la raíz para cargar la oficina con la cookie de sesión
          setTimeout(() => {
            window.location.href = '/';
          }, 200);
          return;
        }

        if (response.status === 429 && data.retryAfter) {
          startCooldown(data.retryAfter);
          return;
        }

        showError(data.error || 'Contraseña incorrecta');
      } catch (err) {
        showError('Error al conectar con el servidor. Intenta de nuevo.');
      } finally {
        if (!feedback.classList.contains('error') || !btn.disabled) {
          btn.disabled = false;
        }
        btn.innerHTML = originalText;
      }
    });
  </script>
</body>
</html>`;
}

export default async function (request, context) {
  const url = new URL(request.url);
  const path = url.pathname;

  // 1. Rutas que no requieren comprobación de sesión (autenticación y robots.txt)
  if (
    path === "/api/login" ||
    path === "/api/logout" ||
    path.startsWith("/.netlify/functions/login") ||
    path.startsWith("/.netlify/functions/logout") ||
    path === "/robots.txt"
  ) {
    return context.next();
  }

  // 2. Comprobar cookie de sesión
  const secret = getSecret();
  const sessionCookie = getCookie(request, "studio_session");
  const isAuthenticated = await verifySessionToken(sessionCookie, secret);

  // 3. Si la sesión es válida, continuar con la carga normal de la oficina
  if (isAuthenticated) {
    return context.next();
  }

  // 4. Si NO hay sesión válida:
  // Proteger los archivos de la oficina (index.html, app.js, building.js, style.css, vendor, etc.)
  const accept = request.headers.get("accept") || "";
  const isNavigation =
    request.mode === "navigate" ||
    accept.includes("text/html") ||
    path === "/" ||
    path.endsWith(".html");

  // Si es una petición de navegación o desde el navegador, entregar la pantalla de contraseña
  if (isNavigation) {
    return new Response(renderPasswordScreen(), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }

  // Si es una petición directa a un script, estilo o asset sin sesión, denegar con 401
  return new Response("Acceso no autorizado. Ingrese la contraseña en la página principal.", {
    status: 401,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
