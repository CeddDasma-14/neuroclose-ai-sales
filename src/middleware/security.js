'use strict';

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { validateWebhookSignature } = require('../services/twilio');

/**
 * Helmet — sets secure HTTP response headers.
 */
const helmetMiddleware = helmet();

/**
 * Global rate limiter — 100 requests per 15 minutes per IP.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

/**
 * Strict rate limiter for the SMS webhook — 20 requests per minute.
 * Twilio delivers one webhook per inbound SMS, so 20/min is generous.
 */
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Webhook rate limit exceeded.' },
});

/**
 * Twilio webhook signature validation middleware.
 * Rejects any request that doesn't have a valid Twilio signature.
 * This prevents spoofed requests from triggering the AI pipeline.
 */
function twilioSignatureValidator(req, res, next) {
  try {
    const signature = req.headers['x-twilio-signature'];
    if (!signature) {
      return res.status(403).json({ error: 'Forbidden: missing signature' });
    }

    // Build the full URL for validation
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    const isValid = validateWebhookSignature(signature, fullUrl, req.body);
    if (!isValid) {
      return res.status(403).json({ error: 'Forbidden: invalid signature' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Internal security error' });
  }
}

module.exports = { helmetMiddleware, globalLimiter, webhookLimiter, twilioSignatureValidator };
