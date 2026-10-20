# Guía de Despliegue en Netlify con Protección Perimetral

Esta guía explica paso a paso cómo publicar **Paul Engineering Studio** en **Netlify** directamente desde tu teléfono móvil (o computadora), configurando el acceso protegido por contraseña y las variables de entorno necesarias.

---

## 1. Requisitos Previos

1. Tener una cuenta en [GitHub](https://github.com) con este repositorio (`OFICINA-DE-INGENIERIA`) en la rama `main`.
2. Tener una cuenta gratuita en [Netlify](https://www.netlify.com).

---

## 2. Cómo Conectar el Repositorio en Netlify desde el Celular

Puedes hacer todo el proceso desde el navegador de tu celular (Safari, Chrome, etc.):

1. Abre el navegador en tu celular y entra a [app.netlify.com](https://app.netlify.com).
2. Inicia sesión con tu cuenta de **GitHub**.
3. En el panel principal (Team Overview), pulsa el botón **"Add new site"** (o **"Import from Git"**).
4. Elige la opción **"Deploy with GitHub"**.
   - Si es la primera vez, pulsa **"Authorize Netlify"** para dar permisos.
   - En la lista de repositorios permitidos, asegúrate de autorizar o buscar:  
     `alessandrorr1007-debug/OFICINA-DE-INGENIERIA`.
5. Selecciona el repositorio **`OFICINA-DE-INGENIERIA`**.
6. En la pantalla de configuración básica del despliegue:
   - **Branch to deploy**: Deja seleccionada `main`.
   - **Base directory**: Déjalo vacío.
   - **Build command**: Déjalo vacío (el proyecto ya viene compilado y listo en `dist`).
   - **Publish directory**: `dist` (Netlify lo tomará automáticamente de `netlify.toml`).
7. **No pulses "Deploy" todavía**; primero añade las variables de entorno como se explica en la siguiente sección. (Si por error pulsas Deploy, el sitio se creará pero requerirá las variables para permitir acceso).

---

## 3. Cómo Configurar las Variables de Entorno en Netlify

Antes de permitir el acceso a la oficina, debes definir dos variables obligatorias:

1. En la misma pantalla de despliegue (o en **Site configuration** > **Environment variables** si el sitio ya fue creado):
2. Pulsa en **"Add environment variable"** (o **"Add a variable"**).
3. Añade la primera variable:
   - **Key**: `APP_PASSWORD`
   - **Value**: La contraseña que usarás para entrar a la oficina (por ejemplo, una frase segura o palabra clave). Asegúrate de no dejar espacios en blanco al inicio o al final.
   - **Scopes**: All scopes (Builds, Functions, Edge Functions).
4. Añade la segunda variable:
   - **Key**: `SESSION_SECRET`
   - **Value**: Una cadena larga, aleatoria y secreta de 64 caracteres hexadecimales (ver instrucciones abajo para generarla).
   - **Scopes**: All scopes (Builds, Functions, Edge Functions).
5. Pulsa **"Create variable"** o **"Save"**.
6. Pulsa el botón **"Deploy OFICINA-DE-INGENIERIA"** (o si ya estaba creado, ve a la pestaña **Deploys** y pulsa **"Trigger deploy"** > **"Deploy site"**).

---

## 4. Cómo Generar un `SESSION_SECRET` Largo y Aleatorio

El `SESSION_SECRET` se utiliza para firmar criptográficamente (HMAC-SHA256) la cookie de sesión del navegador. Debe ser imposible de adivinar.

### Opción A: Desde tu computadora (Node.js)
Abre tu terminal y ejecuta:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copiarás un resultado similar a:
`a3f89b2c4e1d5a7f80e92c1b4d6e8a0f2b4c6e8d0a2f4b6c8e0a2d4f6b8c0e2a`

### Opción B: Desde PowerShell (Windows)
```powershell
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
```

### Opción C: Desde el celular (consola del navegador o web segura)
Puedes abrir una pestaña en tu navegador, abrir la consola o generar una clave segura con la API criptográfica nativa de tu teléfono:
```javascript
Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
```

---

## 5. Cómo Cambiar la Contraseña o Cerrar Sesión en Todos los Dispositivos

### Para cambiar la contraseña:
1. Entra a [app.netlify.com](https://app.netlify.com) desde tu celular o computadora.
2. Selecciona tu sitio.
3. Ve a **Site configuration** > **Environment variables**.
4. Pulsa sobre `APP_PASSWORD`, edita el valor con la nueva contraseña y guarda.
5. Ve a la pestaña **Deploys** y pulsa **"Trigger deploy"** > **"Clear cache and deploy site"**.
   - A partir de ese momento, los nuevos inicios de sesión requerirán la nueva contraseña.

### Para revocar inmediatamente todas las sesiones activas:
Si prestaste acceso a alguien o deseas forzar a que todos los dispositivos vuelvan a pedir contraseña de inmediato:
1. Edita la variable `SESSION_SECRET` en Netlify y pon un nuevo valor aleatorio.
2. Despliega de nuevo (**Trigger deploy**).
3. Todas las cookies previas quedarán invalidadas al instante porque su firma criptográfica ya no coincidirá con el nuevo secreto.

---

## 6. Verificación del Despliegue

Una vez completado el despliegue en Netlify:

1. Abre la URL asignada por Netlify (por ejemplo, `https://tu-sitio.netlify.app`).
2. **Debe aparecer únicamente la pantalla con el estilo del estudio**:
   - Título: *PAUL ENGINEERING STUDIO*.
   - Campo: *Ingresar contraseña*.
   - Botón: *Entrar*.
3. Si intentas abrir directamente `https://tu-sitio.netlify.app/app.js` en una ventana privada sin haber iniciado sesión:
   - El sistema te mostrará la pantalla de contraseña o bloqueará el acceso con `401 No autorizado`.
4. Ingresa una contraseña equivocada para comprobar la protección:
   - Debe indicar *"Contraseña incorrecta"*.
   - Si insistes repetidas veces, el sistema activará la espera progresiva contra fuerza bruta.
5. Ingresa la contraseña correcta definida en `APP_PASSWORD`:
   - El estudio 3D se abrirá de inmediato.
   - La sesión permanecerá activa durante 30 días sin volver a pedirla en ese navegador.
6. Pulsa el botón **"Salir"** en la esquina superior derecha:
   - La sesión se destruirá y volverá a aparecer la pantalla de contraseña.
