'use strict';

require('dotenv').config();

const { validateConfig, config } = require('./config');

// Validate all required env vars before starting anything
try {
  validateConfig();
} catch (err) {
  console.error(`[Server] Configuration error:\n${err.message}`);
  process.exit(1);
}

const express = require('express');
const { helmetMiddleware, globalLimiter } = require('./middleware/security');
const webhookRoutes = require('./routes/webhook');
const { startFollowUpEngine } = require('./workflows/followup');
const { startEmailFollowUpEngine } = require('./workflows/emailFollowup');
const { ensureHeaders } = require('./services/sheets');

const app = express();

// Trust ngrok/reverse-proxy forwarded headers (required for rate limiting behind a proxy)
app.set('trust proxy', 1);

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(globalLimiter);

// CORS — restrict cross-origin requests to the configured allow-list
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.sendStatus(204);
  }
  next();
});

// Parse URL-encoded bodies (Twilio sends application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/webhook', webhookRoutes);

// Root health check
app.get('/', (req, res) => {
  res.json({ ok: true });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[Server] Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Startup ──────────────────────────────────────────────────────────────────
async function start() {
  try {
    await ensureHeaders();
    startFollowUpEngine();
    startEmailFollowUpEngine();
    app.listen(config.app.port);
  } catch (err) {
    console.error(`[Server] Startup failed: ${err.message}`);
    process.exit(1);
  }
}

start();
