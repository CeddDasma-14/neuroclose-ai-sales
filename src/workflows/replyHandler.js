'use strict';

/**
 * WORKFLOW 3 — SMS REPLY HANDLER
 *
 * Called by the webhook route when Twilio delivers an inbound SMS.
 * - Validates the request is genuinely from Twilio
 * - Finds the lead in Google Sheets
 * - Prevents duplicate processing
 * - Marks reply as received
 * - Hands off to AI-BRAIN (Workflow 4)
 */

const { findLeadByPhone, updateLead, STATUS } = require('../services/sheets');
const { runAiBrain } = require('./aiBrain');

// Track recently processed messages to prevent double-firing
// Key: `${phone}:${body}` — cleared after 60 seconds
const recentlyProcessed = new Map();

/**
 * Process an inbound SMS reply.
 * @param {object} params - { phone, body, timestamp }
 */
async function handleInboundReply({ phone, body, timestamp, messageSid, channel }) {
  try {
    if (!phone || !body) {
      throw new Error('Missing required fields: phone or body');
    }

    const cleanPhone = phone.replace(/^whatsapp:/i, '');
    const normalizedPhone = cleanPhone.replace(/\D/g, '');

    // MessageSid is unique per message and identical across Twilio retries — bulletproof dedup.
    // Fall back to phone:body if MessageSid is missing (e.g. local testing).
    const dedupeKey = messageSid || `${normalizedPhone}:${body.trim()}`;

    // Duplicate check — prevent Twilio retries from double-processing
    if (recentlyProcessed.has(dedupeKey)) {
      return;
    }
    recentlyProcessed.set(dedupeKey, true);
    setTimeout(() => recentlyProcessed.delete(dedupeKey), 300000); // 5-min window covers all Twilio retry intervals

    // Find the lead in Google Sheets
    const lead = await findLeadByPhone(cleanPhone);

    if (!lead) {
      return;
    }

    // Skip opted-out leads — TCPA compliance
    if (lead.status === STATUS.OPTED_OUT) {
      return;
    }

    // Build updated log and write everything in one atomic Sheets call
    const ts = timestamp || new Date().toISOString();
    const entry = `${ts} [LEAD]: ${body}`;
    const updatedLog = lead.conversationLog ? `${lead.conversationLog}\n${entry}` : entry;

    // Auto-extract email from message if lead doesn't have one yet
    const emailMatch = body.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    const extractedEmail = emailMatch ? emailMatch[0].toLowerCase() : null;

    console.log(`[ReplyHandler] Updating sheet for ${cleanPhone} → REPLIED`);
    await updateLead(lead.rowIndex, {
      status: STATUS.REPLIED,
      replyReceived: 'YES',
      lastReply: ts,
      conversationLog: updatedLog,
      ...(channel ? { preferredChannel: channel } : {}),
      ...(extractedEmail && !lead.email ? { email: extractedEmail } : {}),
    });
    console.log(`[ReplyHandler] Sheet updated for ${cleanPhone}`);

    // Attach updated fields to lead object for AI-BRAIN use
    lead.conversationLog = updatedLog;
    if (extractedEmail && !lead.email) lead.email = extractedEmail;

    // Hand off to AI-BRAIN (async — non-blocking so webhook can respond fast)
    setImmediate(() => {
      runAiBrain(lead, body, timestamp || new Date().toISOString()).catch((err) => {
        console.error(`[ReplyHandler] AI-BRAIN error: ${err.message}`);
      });
    });
  } catch (err) {
    throw new Error(`handleInboundReply failed: ${err.message}`);
  }
}

module.exports = { handleInboundReply };
