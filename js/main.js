(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  }

  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  const say = (msg, ok) => {
    status.textContent = msg; // textContent only, never innerHTML
    status.className = 'form-status ' + (ok ? 'is-ok' : 'is-error');
  };
  const params = new URLSearchParams(location.search);
  if (params.get('sent') === '1') say('Thanks, your message has been sent. We will be in touch soon.', true);
  if (params.get('error') === '1') say('Your message could not be sent. Please check the form or call 07766 557522.', false);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    say('Sending…', true);
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        form.reset();
        say('Thanks, your message has been sent. We will be in touch soon.', true);
      } else {
        say(data.error || 'Something went wrong. Please call or email us instead.', false);
      }
    } catch (err) {
      say('Could not send. Check your connection or call 07766 557522.', false);
    } finally {
      btn.disabled = false;
      if (window.turnstile) window.turnstile.reset();
    }
  });
})();
