const COOKIE_NAME = 'gmp_oauth_state';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/auth' && request.method === 'GET') return startLogin(request, env);
    if (url.pathname === '/callback' && request.method === 'GET') return finishLogin(request, env);
    return new Response('Not found', { status: 404, headers: { 'cache-control': 'no-store' } });
  },
};

function startLogin(request, env) {
  if (!env.GITHUB_CLIENT_ID) return new Response('OAuth is not configured.', { status: 503 });
  const scope = env.GITHUB_SCOPE === 'repo' ? 'repo' : 'public_repo';
  const state = crypto.randomUUID() + crypto.randomUUID();
  const callback = new URL('/callback', request.url).href;
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', callback);
  authorize.searchParams.set('scope', scope);
  authorize.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      location: authorize.href,
      'cache-control': 'no-store',
      'set-cookie': `${COOKIE_NAME}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}

async function finishLogin(request, env) {
  const url = new URL(request.url);
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.SITE_ORIGIN) {
    return new Response('OAuth is not configured.', { status: 503, headers: { 'cache-control': 'no-store' } });
  }
  const cookieState = request.headers.get('cookie')?.split('; ').find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  const queryState = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const cleanCookie = `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  if (!cookieState || !queryState || cookieState !== queryState || !code) {
    return popupMessage(env.SITE_ORIGIN, 'error', 'La connexion GitHub a échoué. Fermez cette fenêtre et réessayez.', cleanCookie);
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: new URL('/callback', request.url).href,
    }),
  });
  const result = await tokenResponse.json();
  if (!tokenResponse.ok || !result.access_token) {
    return popupMessage(env.SITE_ORIGIN, 'error', 'GitHub n’a pas autorisé cette connexion.', cleanCookie);
  }
  return popupMessage(env.SITE_ORIGIN, 'success', result.access_token, cleanCookie);
}

function popupMessage(siteOrigin, status, payload, cookie) {
  const nonce = crypto.randomUUID().replaceAll('-', '');
  const message = status === 'success'
    ? `authorization:github:success:${JSON.stringify({ token: payload, provider: 'github' })}`
    : `authorization:github:error:${JSON.stringify({ message: payload, provider: 'github' })}`;
  // Protocole attendu par Decap : la fenêtre annonce « authorizing:github », Decap répond
  // (depuis l'origine exacte du site), et seulement alors la fenêtre transmet le résultat.
  const script = `(function () {
  var origin = ${JSON.stringify(siteOrigin)};
  var message = ${JSON.stringify(message)};
  if (!window.opener) return;
  window.addEventListener('message', function (e) {
    if (e.origin !== origin || e.data !== 'authorizing:github') return;
    window.opener.postMessage(message, origin);
    setTimeout(function () { window.close(); }, 300);
  });
  window.opener.postMessage('authorizing:github', origin);
})();`;
  const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Connexion GitHub</title><body><p>${status === 'success' ? 'Connexion réussie. Cette fenêtre va se fermer.' : 'Connexion impossible. Cette fenêtre va se fermer.'}</p><script nonce="${nonce}">${script}</script></body></html>`;
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'content-security-policy': `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`,
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
      ...(cookie ? { 'set-cookie': cookie } : {}),
    },
  });
}
