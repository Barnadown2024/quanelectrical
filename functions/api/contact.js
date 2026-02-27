/**
 * Cloudflare Pages Function: POST /api/contact
 * Stores contact form submissions in D1 and optionally sends a notification email.
 *
 * Required: D1 database bound as "DB" (see wrangler.toml).
 * Optional notification: set NOTIFICATION_EMAIL and one of RESEND_API_KEY, SENDGRID_API_KEY, or EMAIL_WORKER_URL.
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

function formatEmailHTML(submission) {
	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #b45309, #d97706); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: 600; color: #666; font-size: 0.9rem; }
    .value { font-size: 1rem; color: #333; margin-top: 5px; }
    .message-box { white-space: pre-wrap; background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">New contact form submission</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Quan Electrical</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Name</div>
        <div class="value">${submission.name}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${submission.email}">${submission.email}</a></div>
      </div>
      ${submission.phone ? `
      <div class="field">
        <div class="label">Phone</div>
        <div class="value">${submission.phone}</div>
      </div>
      ` : ''}
      <div class="field">
        <div class="label">Message</div>
        <div class="value message-box">${(submission.message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>
      <div class="field">
        <div class="label">Submitted</div>
        <div class="value">${new Date(submission.submittedAt).toLocaleString()}</div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

async function sendNotificationEmail({ to, subject, submission }, env) {
	const emailBody = `
New contact form submission – Quan Electrical
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${submission.name}
Email: ${submission.email}
${submission.phone ? `Phone: ${submission.phone}\n` : ''}
Message:
${submission.message || '(none)'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Submitted: ${new Date(submission.submittedAt).toLocaleString()}
  `.trim();

	if (env.EMAIL_WORKER_URL) {
		const res = await fetch(env.EMAIL_WORKER_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.EMAIL_WORKER_TOKEN || ''}`,
			},
			body: JSON.stringify({
				to,
				from: env.EMAIL_FROM || 'noreply@quanelectrical.com',
				subject,
				text: emailBody,
				html: formatEmailHTML(submission),
			}),
		});
		if (!res.ok) throw new Error(`Email Worker failed: ${res.statusText}`);
		return await res.json();
	}

	if (env.RESEND_API_KEY) {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.RESEND_API_KEY}`,
			},
			body: JSON.stringify({
				from: env.EMAIL_FROM || 'Quan Electrical <onboarding@resend.dev>',
				to: [to],
				subject,
				text: emailBody,
				html: formatEmailHTML(submission),
			}),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err.message || res.statusText);
		}
		return await res.json();
	}

	if (env.SENDGRID_API_KEY) {
		const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
			},
			body: JSON.stringify({
				personalizations: [{ to: [{ email: to }] }],
				from: {
					email: (env.EMAIL_FROM || 'noreply@quanelectrical.com').replace(/^[^<]*<([^>]+)>$/, '$1').trim() || 'noreply@quanelectrical.com',
					name: 'Quan Electrical',
				},
				subject,
				content: [
					{ type: 'text/plain', value: emailBody },
					{ type: 'text/html', value: formatEmailHTML(submission) },
				],
			}),
		});
		if (!res.ok) throw new Error(`SendGrid failed: ${await res.text()}`);
		return { success: true };
	}

	console.warn('No email service configured. Set RESEND_API_KEY, SENDGRID_API_KEY, or EMAIL_WORKER_URL.');
	return { success: true, note: 'Email service not configured' };
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

		const result = await db
			.prepare(
				'INSERT INTO contact_submissions (name, email, phone, message) VALUES (?, ?, ?, ?)'
			)
			.bind(name, email, phone, message)
			.run();

		if (env.NOTIFICATION_EMAIL) {
			try {
				await sendNotificationEmail(
					{
						to: env.NOTIFICATION_EMAIL,
						subject: `Contact form: ${name}`,
						submission: {
							name,
							email,
							phone,
							message,
							submittedAt: new Date().toISOString(),
						},
					},
					env
				);
			} catch (emailErr) {
				console.error('Contact form: notification email failed', emailErr.message || emailErr);
			}
		}

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
