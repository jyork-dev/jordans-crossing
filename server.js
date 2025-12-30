const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static site from project root
app.use(express.static(path.join(__dirname)));

// -- Admin/basic-auth middleware
function requireAdmin(req, res, next){
  const auth = req.headers['authorization'];
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;

  if(!adminUser || !adminPass){
    // Development: if no creds set, deny admin access to avoid accidental exposure
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Admin credentials not configured');
  }

  if(!auth || !auth.startsWith('Basic ')){
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required');
  }

  try{
    const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString();
    const idx = credentials.indexOf(':');
    const user = credentials.slice(0, idx);
    const pass = credentials.slice(idx + 1);
    if(user === adminUser && pass === adminPass){
      return next();
    }
  }catch(e){
    // fallthrough
  }
  res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
  return res.status(401).send('Invalid credentials');
}

// Basic email regex (simple validation only)
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Nodemailer setup (SMTP)
let transporter = null;
const SMTP_HOST = process.env.SMTP_HOST;
if (SMTP_HOST) {
  try {
    const nodemailer = require('nodemailer');
    const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    });
    // verify transporter
    transporter.verify().then(()=>{
      console.log('SMTP transporter configured');
    }).catch(err=>{
      console.warn('SMTP transporter verification failed:', err && err.message ? err.message : err);
      transporter = null;
    });
  } catch (e) {
    console.warn('Nodemailer not available or configuration failed:', e && e.message ? e.message : e);
    transporter = null;
  }
} else {
  console.log('SMTP not configured; emails will not be sent. Set SMTP_HOST, SMTP_USER, SMTP_PASS and INTAKE_EMAIL to enable.');
}

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    let submissions = [];
    try {
      const raw = await fs.readFile(DATA_FILE, 'utf8');
      submissions = JSON.parse(raw || '[]');
    } catch (err) {
      // ignore if file does not exist or invalid
      submissions = [];
    }

    const entry = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      name: String(name),
      email: String(email),
      message: String(message)
    };

    submissions.push(entry);
    await fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2), 'utf8');
    // Attempt to send an email notification if SMTP is configured and INTAKE_EMAIL is set.
    const intake = process.env.INTAKE_EMAIL;
    if (transporter && intake) {
      const fromAddr = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@jordanscrossing.org';
      const mail = {
        from: fromAddr,
        to: intake,
        subject: `New contact submission from ${name}`,
        text: `New contact submission:\n\nName: ${name}\nEmail: ${email}\nDate: ${entry.createdAt}\n\nMessage:\n${message}`
      };
      transporter.sendMail(mail).then(info => {
        console.log('Contact email sent', info && info.messageId ? info.messageId : info);
      }).catch(err => {
        console.error('Failed to send contact email:', err && err.message ? err.message : err);
      });
    } else {
      if (!intake) console.warn('INTAKE_EMAIL not set; email notification skipped.');
    }

    // Respond success to the client even if email sending is async/fails. This keeps UX smooth.
    res.json({ ok: true });
  } catch (err) {
    console.error('Error handling /api/contact', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected admin submissions endpoint
app.get('/api/admin/submissions', requireAdmin, async (req, res) => {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const submissions = JSON.parse(raw || '[]');
    res.json({ submissions });
  } catch (err) {
    res.json({ submissions: [] });
  }
});

// Serve admin UI (protected)
app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
