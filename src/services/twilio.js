'use strict';

const twilio = require('twilio');
const { config } = require('../config');

let _client = null;

function getClient() {
  if (_client) return _client;
  try {
    _client = twilio(config.twilio.accountSid, config.twilio.authToken);
    return _client;
  } catch (err) {
    throw new Error(`Failed to initialize Twilio client: ${err.message}`);
  }
}

/**
 * Send an SMS message via Twilio.
 * @param {string} to - Destination phone number (E.164 format)
 * @param {string} body - SMS message body
 * @returns {object} Twilio message object
 */
async function sendSMS(to, body) {
  try {
    // Skip SMS if disabled (e.g. trial account with international restrictions)
    if (!config.app.smsEnabled) {
      console.log(`[Twilio] SMS disabled — skipping send to ${to}: "${body.slice(0, 60)}..."`);
      return null;
    }

    const client = getClient();

    // Validate inputs
    if (!to || typeof to !== 'string') throw new Error('Invalid "to" phone number');
    if (!body || typeof body !== 'string') throw new Error('Invalid SMS body');
    if (body.length > 1600) throw new Error('SMS body exceeds 1600 character limit');

    // Normalize to E.164 format (ensure leading +)
    const normalizedTo = to.startsWith('+') ? to : `+${to}`;

    const message = await client.messages.create({
      body,
      from: config.twilio.phoneNumber,
      to: normalizedTo,
    });

    return message;
  } catch (err) {
    throw new Error(`sendSMS to ${to} failed: ${err.message}`);
  }
}

/**
 * Validate that an incoming request is genuinely from Twilio.
 * Rejects tampered or spoofed webhook requests.
 * @param {string} twilioSignature - X-Twilio-Signature header value
 * @param {string} url - Full webhook URL
 * @param {object} params - POST body params
 * @returns {boolean}
 */
function validateWebhookSignature(twilioSignature, url, params) {
  try {
    return twilio.validateRequest(
      config.twilio.authToken,
      twilioSignature,
      url,
      params
    );
  } catch (_err) {
    return false;
  }
}

/**
 * Generate an empty TwiML response (required by Twilio to acknowledge receipt).
 */
function emptyTwimlResponse() {
  const twiml = new twilio.twiml.MessagingResponse();
  return twiml.toString();
}

/**
 * Send a WhatsApp message via Twilio WhatsApp sandbox.
 * @param {string} to - Destination phone number (E.164 format, without whatsapp: prefix)
 * @param {string} body - Message body
 */
async function sendWhatsApp(to, body) {
  try {
    if (!config.app.whatsappEnabled) {
      console.log(`[Twilio] WhatsApp disabled — skipping send to ${to}: "${body.slice(0, 60)}..."`);
      return null;
    }

    const client = getClient();

    if (!to || typeof to !== 'string') throw new Error('Invalid "to" phone number');
    if (!body || typeof body !== 'string') throw new Error('Invalid message body');

    const cleanTo = to.replace(/^whatsapp:/i, '');
    const normalizedTo = cleanTo.startsWith('+') ? cleanTo : `+${cleanTo}`;

    const message = await client.messages.create({
      body,
      from: config.app.whatsappNumber,
      to: `whatsapp:${normalizedTo}`,
    });

    console.log(`[Twilio] WhatsApp sent to ${normalizedTo}: "${body.slice(0, 60)}..."`);
    return message;
  } catch (err) {
    throw new Error(`sendWhatsApp to ${to} failed: ${err.message}`);
  }
}

module.exports = { sendSMS, sendWhatsApp, validateWebhookSignature, emptyTwimlResponse };
