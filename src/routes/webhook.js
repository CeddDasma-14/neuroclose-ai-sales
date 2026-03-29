'use strict';

const express = require('express');
const router = express.Router();
const { webhookLimiter, twilioSignatureValidator } = require('../middleware/security');
const { handleInboundReply } = require('../workflows/replyHandler');
const { emptyTwimlResponse } = require('../services/twilio');

/**
 * POST /webhook/sms
 *
 * Twilio inbound SMS webhook.
 * 1. Rate limit check
 * 2. Validate Twilio signature
 * 3. Respond with empty TwiML immediately (Twilio requires fast ACK)
 * 4. Process the reply asynchronously
 */
router.post(
  '/sms',
  webhookLimiter,
  twilioSignatureValidator,
  async (req, res) => {
    try {
      // Immediately respond with empty TwiML to satisfy Twilio's timeout
      res.set('Content-Type', 'text/xml');
      res.status(200).send(emptyTwimlResponse());

      // Extract and validate SMS/WhatsApp data from Twilio's POST body
      const rawPhone = typeof req.body.From === 'string' ? req.body.From.trim() : '';
      const phone = rawPhone.replace(/^whatsapp:/i, '');
      const channel = /^whatsapp:/i.test(rawPhone) ? 'whatsapp' : 'sms';
      const body = typeof req.body.Body === 'string' ? req.body.Body.trim() : '';

      // E.164 phone format: +[country code][number], 7–15 digits
      const phoneValid = /^\+?[1-9]\d{6,14}$/.test(phone);
      if (!phoneValid || !body || body.length > 1600) {
        return;
      }

      const messageSid = typeof req.body.MessageSid === 'string' ? req.body.MessageSid.trim() : '';

      // Process asynchronously — response already sent
      handleInboundReply({ phone, body, timestamp: new Date().toISOString(), messageSid, channel }).catch((err) => {
        console.error(`[Webhook] handleInboundReply error: ${err.message}`);
      });
    } catch (_err) {
      // Response already sent above — can't send another
    }
  }
);

/**
 * GET /webhook/health
 * Simple health check endpoint.
 */
router.get('/health', (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
