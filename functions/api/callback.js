/**
 * Decap CMS GitHub OAuth: receives code from GitHub, exchanges for token, returns HTML that postMessages to opener.
 * Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Cloudflare Pages env (use Secrets for the secret).
 */
function loginPageHtml(status, payload) {
	const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
	return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Logging in...</title></head>
<body>
<script>
(function() {
  var msg = ${JSON.stringify(message)};
  if (window.opener) {
    window.opener.postMessage(msg, window.opener.origin || '*');
  }
  window.close();
})();
</script>
<p>Logging in... You can close this window if it doesn't close automatically.</p>
</body></html>`;
}

export async function onRequestGet(context) {
	const { request, env } = context;
	const clientId = env.GITHUB_CLIENT_ID;
	const clientSecret = env.GITHUB_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		return new Response(
			loginPageHtml('error', { error: 'OAuth not configured' }),
			{ status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
		);
	}
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	if (!code) {
		return new Response(
			loginPageHtml('error', { error: 'Missing code' }),
			{ status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
		);
	}
	try {
		const res = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				'User-Agent': 'QuanElectrical-DecapCMS-OAuth',
			},
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				code,
			}),
		});
		const data = await res.json();
		if (data.error) {
			return new Response(
				loginPageHtml('error', { error: data.error_description || data.error }),
				{ status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
			);
		}
		const token = data.access_token;
		return new Response(loginPageHtml('success', { provider: 'github', token }), {
			status: 200,
			headers: { 'Content-Type': 'text/html;charset=UTF-8' },
		});
	} catch (e) {
		return new Response(
			loginPageHtml('error', { error: String(e.message || e) }),
			{ status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
		);
	}
}
