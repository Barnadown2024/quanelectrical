/**
 * Decap CMS GitHub OAuth: redirects to GitHub login.
 * Set GITHUB_CLIENT_ID in Cloudflare Pages env. Callback URL in GitHub OAuth App must be: https://quanelectrical.com/api/callback
 */
export async function onRequestGet(context) {
	const { request, env } = context;
	const clientId = env.GITHUB_CLIENT_ID;
	if (!clientId) {
		return new Response('GITHUB_CLIENT_ID not set. Add it in Cloudflare Pages > Settings > Environment variables.', {
			status: 500,
			headers: { 'Content-Type': 'text/plain' },
		});
	}
	const url = new URL(request.url);
	const redirectUri = `${url.origin}/api/callback`;
	const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	const authUrl = new URL('https://github.com/login/oauth/authorize');
	authUrl.searchParams.set('client_id', clientId);
	authUrl.searchParams.set('redirect_uri', redirectUri);
	authUrl.searchParams.set('scope', 'repo,user');
	authUrl.searchParams.set('state', state);
	return Response.redirect(authUrl.href, 302);
}
