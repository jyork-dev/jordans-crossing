# Jordan's Crossing — Website (static)

This is a simple, clean, responsive static website scaffold for Jordan's Crossing (non-profit supporting women leaving abusive relationships).

What I added
- `index.html` — homepage with semantic sections (hero, about, programs, get help, volunteer, donate, contact).
- `styles.css` — responsive, accessible CSS with variables.
- `script.js` — small JS for mobile nav toggle, contact -> mailto, donate placeholder.
- `assets/logo.svg` — a simple SVG logo.

Preview locally

Open `index.html` in your browser, or run a local static server (recommended):

```zsh
# from repository root
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Deploy

- GitHub Pages: push this repo to GitHub, enable Pages from the main branch. The site will be served from the repository root.
- Netlify/Vercel: connect the repo and set a build command of none — static folder is repo root.

Contact intake (demo server)

This project now includes a small demo Express server to accept contact submissions and store them locally in `data/submissions.json`. This is for local testing only and is NOT suitable for production for confidentiality reasons.

Run locally:

```zsh
cd "/Users/justinyork/Dev/Jordans Crossing"
npm install
npm start
# then open http://localhost:3000
```

The contact form will POST to `/api/contact`. For debugging you can GET `/api/submissions` to view stored entries (this route is not protected in the demo — protect it or remove it in production).

Security & production guidance

- Do NOT store sensitive/intake data in plain files for production; use secure storage with encryption and restricted access.
- Use a reputable form/email provider (Formspree, SendGrid, AWS SES, or a serverless function that sends emails and stores data securely).
- Make sure intake processes are trauma-informed and follow legal/privacy regulations for your jurisdiction.

Netlify Forms (recommended serverless option)

If you want the site to use a serverless workflow (no Express server required), Netlify Forms is an easy option:

1. Add this repo to Netlify (drag & drop or connect your GitHub repo) and set the build to none — there is no build step for this static site.
2. Netlify will automatically detect the form (the HTML has `data-netlify="true"` and `name="contact"`) and collect submissions.
3. You can enable email notifications in Netlify Forms or view submissions in the Netlify dashboard. Netlify also supports webhook forwarding to a secure endpoint if you want to process submissions further.

Notes on testing:
- Netlify Forms won't collect submissions when you're testing via `localhost` — deploy the site to Netlify to see submissions in the dashboard.
- The frontend JS will still post JSON to `POST /api/contact` when running locally, so local testing still works with the included Express server.

If you prefer Formspree instead of Netlify, I can switch the form to post to Formspree's endpoint — that also avoids running a server and forwards submissions to email.

Admin UI (protected)

I added a simple admin UI you can use to view submissions at `/admin`. This route and the submissions API are protected by HTTP Basic Auth.

Setup:

1. Set environment variables before starting the server locally:

```zsh
export ADMIN_USER=youradmin
export ADMIN_PASS=strongpassword
npm start
```

2. Open http://localhost:3000/admin. Your browser will prompt for the credentials. Once authenticated the admin UI will fetch `/api/admin/submissions` and render them.

Security notes:
- Do NOT use weak credentials in production. Use a strong, unique password and restrict access to trusted IPs when possible.
- For production protect admin access with a proper authentication system (OAuth, single sign-on, or at least a firewall) and remove the demo `/api/admin/submissions` route or protect it further.

SMTP email notifications (Option B)

You can configure the server to send contact submissions by email using SMTP (Nodemailer). Set the following environment variables before starting the server:

```zsh
export SMTP_HOST=smtp.example.com
export SMTP_PORT=587
export SMTP_USER=smtp-user
export SMTP_PASS=smtp-pass
export SMTP_FROM="Jordan's Crossing <no-reply@jordanscrossing.org>" # optional
export INTAKE_EMAIL=help@jordanscrossing.org
```

Behavior:
- If `SMTP_HOST` and `INTAKE_EMAIL` are set and valid, the server will attempt to send an email for each new submission (the submission is still stored locally in `data/submissions.json`).
- If SMTP is not configured, submissions will still be accepted and stored locally, but email notifications will not be sent — you will see a console message indicating that SMTP is not configured.

Testing with Mailtrap (recommended for development):
1. Create a Mailtrap account and get SMTP credentials.
2. Use their SMTP settings as `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and set `INTAKE_EMAIL` to your Mailtrap inbox.
3. Start the server and submit the form; verify messages in Mailtrap.

Security reminder: do not commit credentials to the repository. Use environment variables and your hosting provider's secrets manager for production.



Next steps (suggested)
- Add real contact intake backend or secure form provider (Formspree, Netlify Forms, or a small serverless function).
- Integrate a payment/donation provider (Stripe, PayPal, or GiveWP) for secure donations.
- Add real images and content, an accessibility audit, and privacy/safety guidance for site visitors.

If you want, I can:
- Add a small contact backend (Netlify Functions or simple Node server).
- Convert this into a React/Vue site or a CMS-backed site if you want non-technical staff to update content.

## Environment variables (example)

For running the server locally or in a host, set the following environment variables. Do NOT commit secrets to the repository.

```zsh
# SMTP (optional - used to send intake emails)
export SMTP_HOST=smtp.example.com
export SMTP_PORT=587
export SMTP_USER=smtp-user
export SMTP_PASS=smtp-pass
export SMTP_FROM="Jordan's Crossing <no-reply@jordanscrossing.org>"
export INTAKE_EMAIL=help@jordanscrossing.org

# Admin UI (required to enable admin area locally)
export ADMIN_USER=youradmin
export ADMIN_PASS=strongpassword
```

Tip: Use a secrets manager or your hosting provider's env var configuration for production.