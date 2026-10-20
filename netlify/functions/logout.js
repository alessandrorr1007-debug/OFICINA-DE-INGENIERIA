exports.handler = async (event) => {
  const expiredCookie = 'studio_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict; Max-Age=0';

  // Si se solicita por GET (por ejemplo navegación directa a /api/logout), redirigir a /
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 302,
      headers: {
        'Location': '/',
        'Cache-Control': 'no-store, no-cache',
        'Set-Cookie': expiredCookie
      },
      body: ''
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache',
      'Set-Cookie': expiredCookie
    },
    body: JSON.stringify({ ok: true })
  };
};
