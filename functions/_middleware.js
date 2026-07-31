/**
 * Cloudflare Pages middleware: redirect www to apex domain.
 * www.quanelectrical.com was serving HTML for /_astro/* assets (breaking CSS);
 * the apex domain serves static assets correctly.
 */
export async function onRequest(context) {
	const url = new URL(context.request.url);

	if (url.hostname === 'www.quanelectrical.com') {
		url.hostname = 'quanelectrical.com';
		return Response.redirect(url.toString(), 301);
	}

	return context.next();
}
