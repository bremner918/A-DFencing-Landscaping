# A&D Fencing & Landscaping: v2

Plain HTML, CSS and JS with no build step. Contact form runs as a Cloudflare Pages Function.

## Layout
- `index.html`, `fencing/index.html`: pages (one folder per page gives clean URLs like `/fencing/`)
- `css/styles.css`, `js/main.js`: all styling and scripting
- `functions/api/contact.js`: form handler (validation, Turnstile bot check, email via Resend)
- `_headers`: security headers incl. a strict Content-Security-Policy (no inline scripts or styles allowed)
- `images/projects/`: project photos

## Test locally
`python3 -m http.server 8000` shows the site. The form needs `npx wrangler pages dev .` plus a `.dev.vars` file (do not commit it).

## Deploy (Cloudflare Pages, repo stays in GitLab)
1. Push to GitLab. In Cloudflare: Workers & Pages > Create > Pages > connect GitLab > pick the repo. No build command; output directory `/`.
2. Add a Turnstile widget (Cloudflare dashboard) and paste its site key over `YOUR_TURNSTILE_SITE_KEY` in `index.html`.
3. Add these as encrypted environment variables: `TURNSTILE_SECRET`, `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` (a sender on a domain verified in Resend).
4. Test on the `*.pages.dev` URL. When happy, add the custom domain and change DNS.

GitLab Pages cannot run `functions/` or read `_headers`, so there the form would need an external service and the headers would be lost.

## Add a project photo
1. Resize to about 1200px wide, save as `.jpg` in `images/projects/`.
2. In `index.html`, copy one `<li><figure>...</figure></li>` in the gallery, change `src` and write a plain-English `alt`.
3. Commit. It deploys automatically.

## Before going live
- Replace the placeholder photo filenames with real photos, and check all copy for accuracy.
- Add `/decking/`, `/paving/`, `/hedges/` pages by copying `fencing/index.html`, then add them to `sitemap.xml` and link them from the services section.
- Set up Google Business Profile and add the new site to Search Console.
