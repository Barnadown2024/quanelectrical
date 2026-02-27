/**
 * Cloudflare Pages Function: POST /api/contact
 * Stores contact form submissions in D1. No external services.
 *
 * Requires a D1 database bound as "DB" (see wrangler.toml).
 * Run migrations/0001_contact_submissions.sql before first use.
 */

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
	'Access-Control-Max-Age': '86400',
};

function jsonResponse(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
	});
}

function sanitize(str) {
	if (typeof str !== 'string') return '';
	return str.slice(0, 2000).trim();
}

export async function onRequestPost(context) {
	try {
		const { request, env } = context;
		const db = env.DB;

		if (!db) {
			console.error('Contact form: D1 binding "DB" not configured.');
			return jsonResponse(
				{ success: false, error: 'Form is not configured. Please try again later.' },
				503
			);
		}

		const body = await request.json();

		const name = sanitize(body.name);
		const email = sanitize(body.email);
		const phone = sanitize(body.phone || '');
		const message = sanitize(body.message);

		if (!name || !email || !message) {
			return jsonResponse(
				{ success: false, error: 'Name, email and message are required.' },
				400
			);
		}

		await db
			.prepare(
				'INSERT INTO contact_submissions (name, email, phone, message) VALUES (?, ?, ?, ?)'
			)
			.bind(name, email, phone, message)
			.run();

		return jsonResponse({
			success: true,
			message: 'Thank you. Your message has been received. We will get back to you soon.',
		});
	} catch (e) {
		console.error('Contact API error:', e);
		return jsonResponse(
			{ success: false, error: 'Something went wrong. Please try again or email us directly.' },
			500
		);
	}
}

export function onRequestOptions() {
	return new Response(null, {
		status: 204,
		headers: CORS_HEADERS,
	});
}
