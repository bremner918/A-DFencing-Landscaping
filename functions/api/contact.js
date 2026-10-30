// Cloudflare Pages Function: POST /api/contact
// Secrets (set in Cloudflare, never in the repo): TURNSTILE_SECRET, RESEND_API_KEY, CONTACT_TO, CONTACT_FROM
const LIMITS = { name: 100, email: 200, subject: 150, message: 3000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const wantsJson = (request.headers.get('Accept') || '').includes('application/json');
  const finish = (ok, error, status) =>
    wantsJson
      ? json(ok ? { ok: true } : { ok: false, error }, ok ? 200 : status)
      : Response.redirect(`${url.origin}/?${ok ? 'sent' : 'error'}=1#contact`, 303);

  // Same-origin only (blocks cross-site form posts)
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) return json({ ok: false, error: 'Forbidden' }, 403);

  let form;
  try { form = await request.formData(); } catch { return finish(false, 'Invalid request.', 400); }

  if (form.get('website')) return finish(true); // honeypot: pretend success to bots

  const get = (k) => String(form.get(k) || '').trim();
  const name = get('name'), email = get('email'), message = get('message');
  const subject = get('subject').replace(/[\r\n]+/g, ' ');

  if (!name || !EMAIL_RE.test(email) || !message) return finish(false, 'Please fill in your name, a valid email and a message.', 400);
  for (const [k, max] of Object.entries(LIMITS)) {
    if (get(k).length > max) return finish(false, `Your ${k} is too long.`, 400);
  }

  // Bot check
  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET || '',
      response: get('cf-turnstile-response'),
      remoteip: request.headers.get('CF-Connecting-IP') || '',
    }),
  }).then((r) => r.json()).catch(() => ({ success: false }));
  if (!verify.success) return finish(false, 'Spam check failed. Please try again.', 400);

  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: email,
      subject: `Website enquiry: ${subject || 'No subject'}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    }),
  }).catch(() => null);

  if (!sent || !sent.ok) return finish(false, 'Could not send your message. Please call or email us.', 502);
  return finish(true);
}

export const onRequest = () => json({ ok: false, error: 'Method not allowed' }, 405);
