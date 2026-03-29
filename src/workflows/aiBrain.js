'use strict';

/**
 * WORKFLOW 4 — AI-BRAIN (The Intelligence Layer)
 *
 * Receives structured lead + message data from Workflow 3.
 * Classifies intent with Claude Haiku, routes to 6 branches,
 * generates contextual replies with Claude Sonnet, and takes actions.
 *
 * 6 Branches:
 *   Hot Lead     → Alert team, update score, send reply
 *   Neutral      → Send follow-up, schedule reminder
 *   Not Interested → Log, send respectful closing
 *   Objection    → Alert team, send objection-handling response
 *   Complaint    → Alert manager, send de-escalation response
 *   Positive     → Send warm encouraging response
 */

const { updateLead, logConversation, STATUS } = require('../services/sheets');
const { sendSMS, sendWhatsApp } = require('../services/twilio');
const { config } = require('../config');
const { classifyReply, generateReply, isOptOutMessage, isStopReplyMessage, isFullyQualified, generateLeadSummary, hasEmail } = require('../services/claude');
const { isConversationLimitReached } = require('../services/timeUtils');

async function sendMessage(phone, message, preferredChannel) {
  // Honor the channel the lead used to reply — WhatsApp leads stay on WhatsApp, SMS stays on SMS
  if (preferredChannel === 'whatsapp') return sendWhatsApp(phone, message);
  if (preferredChannel === 'sms') return sendSMS(phone, message);
  // Fallback: use global config
  if (config.app.whatsappEnabled) return sendWhatsApp(phone, message);
  return sendSMS(phone, message);
}
const { sendHotLeadAlert, sendComplaintAlert, sendObjectionAlert, sendSlackAlert, sendEmailAlert } = require('../services/notifications');

// In-memory lock to prevent duplicate processing of the same message
// Key: `${phone}:${messageTimestamp}`
const processingLocks = new Set();

// Track phones that have already received one-time alerts this session
const hotLeadAlerted = new Set();
const reviewAlerted = new Set();

/**
 * Main AI-BRAIN entry point.
 * @param {object} lead - Lead object from Sheets
 * @param {string} messageBody - The latest inbound SMS text
 * @param {string} messageTimestamp - ISO timestamp of the message
 */
async function runAiBrain(lead, messageBody, messageTimestamp) {
  const lockKey = `${lead.phone}:${messageTimestamp}`;

  // Duplicate processing guard
  if (processingLocks.has(lockKey)) {
    return;
  }
  processingLocks.add(lockKey);

  try {
    // ── TCPA: Opt-out check (must happen before AI classification) ──────────
    if (isOptOutMessage(messageBody)) {
      await handleOptOut(lead);
      return;
    }

    // ── Stop-reply check: don't respond to conversation closers ─────────────
    if (isStopReplyMessage(messageBody)) {
      console.log(`[AI-BRAIN] Stop-reply detected ("${messageBody}") — skipping response.`);
      return;
    }

    // ── Qualified check: all info collected → alert human once to review ─────
    if (isFullyQualified(lead.conversationLog) && lead.status !== STATUS.QUALIFIED && !reviewAlerted.has(lead.phone)) {
      reviewAlerted.add(lead.phone);
      // Generate summary card for the Slack alert
      generateLeadSummary(lead).then((summary) => {
        const emailStatus = hasEmail(lead.conversationLog) ? '✅ Provided' : '❌ Not collected';
        const summaryText = summary
          ? `📋 *Summary:*\n• Address: ${summary.address}\n• Condition: ${summary.condition}\n• Timeline: ${summary.timeline}\n• Email: ${emailStatus}\n• Notes: ${summary.keyPoints}`
          : `✅ Lead qualified. Email: ${emailStatus}. Ready for manual review.`;
        sendSlackAlert(
          { ...lead, latestMessage: summaryText },
          { category: '✅ Ready for Review', motivationScore: lead.motivationScore || 'N/A' }
        ).catch((err) => console.error(`[AI-BRAIN] Slack review alert error: ${err.message}`));
      }).catch((err) => console.error(`[AI-BRAIN] Summary generation error: ${err.message}`));
      console.log(`[AI-BRAIN] Lead ${lead.phone} ready for manual qualification — Slack alert sent.`);
    }

    // ── Conversation turn limit: alert team and stop if too many exchanges ───
    if (isConversationLimitReached(lead.conversationLog)) {
      console.log(`[AI-BRAIN] Lead ${lead.phone} hit conversation limit — alerting team.`);
      sendSlackAlert(
        { ...lead, latestMessage: messageBody },
        { category: '🔁 Conversation Limit Reached — needs human review', motivationScore: lead.motivationScore || 'N/A' }
      ).catch((err) => console.error(`[AI-BRAIN] Slack limit alert error: ${err.message}`));
      return;
    }

    // ── Stop responding if already manually qualified ────────────────────────
    if (lead.status === STATUS.QUALIFIED) {
      console.log(`[AI-BRAIN] Lead ${lead.phone} is QUALIFIED — alerting team of new message.`);
      sendSlackAlert(
        { ...lead, latestMessage: messageBody },
        { category: '⚠️ QUALIFIED Lead Replied', motivationScore: lead.motivationScore || 'N/A' }
      ).catch((err) => console.error(`[AI-BRAIN] Slack qualified-reply alert error: ${err.message}`));
      return;
    }

    // ── Step 1: Classify with Claude Haiku ──────────────────────────────────
    const classification = await classifyReply(lead, messageBody, lead.conversationLog);

    // ── Step 2: Route to branch ──────────────────────────────────────────────
    await routeByCategory(classification, lead, messageBody);

    // ── Step 3: Update Sheets with classification results ───────────────────
    await updateLead(lead.rowIndex, {
      aiCategory: classification.category,
      motivationScore: String(classification.motivationScore),
      notes: `${classification.reasoning} [${new Date().toISOString()}]`,
    });
  } catch (err) {
    console.error(`[AI-BRAIN] Processing error: ${err.message}`);
    // Don't rethrow — AI-BRAIN failures should not crash the webhook server
  } finally {
    // Release lock after a short delay to prevent rapid re-fires
    setTimeout(() => processingLocks.delete(lockKey), 30000);
  }
}

/**
 * Routes to the correct branch based on AI classification.
 */
async function routeByCategory(classification, lead, messageBody) {
  try {
    const { category } = classification;

    switch (category) {
      case 'Hot Lead':
        await handleHotLead(classification, lead, messageBody);
        break;
      case 'Neutral':
        await handleNeutral(classification, lead, messageBody);
        break;
      case 'Not Interested':
        await handleNotInterested(lead, messageBody);
        break;
      case 'Objection':
        await handleObjection(classification, lead, messageBody);
        break;
      case 'Complaint':
        await handleComplaint(lead, messageBody);
        break;
      case 'Positive':
        await handlePositive(lead, messageBody);
        break;
      default:
        await handleNeutral(classification, lead, messageBody);
    }
  } catch (err) {
    throw new Error(`routeByCategory failed: ${err.message}`);
  }
}

// ── Branch Handlers ──────────────────────────────────────────────────────────

async function handleHotLead(classification, lead, messageBody) {
  try {

    // Only alert once per lead — use in-memory set to prevent duplicates
    if (!hotLeadAlerted.has(lead.phone)) {
      hotLeadAlerted.add(lead.phone);
      await sendHotLeadAlert({ ...lead, latestMessage: messageBody }, classification);
      const alertLead = { ...lead, latestMessage: messageBody };
      sendSlackAlert(alertLead, classification).catch((err) =>
        console.error(`[AI-BRAIN] Slack alert error: ${err.message}`)
      );
      sendEmailAlert(alertLead, classification).catch((err) =>
        console.error(`[AI-BRAIN] Email alert error: ${err.message}`)
      );
    }

    // Generate and send a reply to keep momentum
    const reply = await generateReply('Hot Lead', lead, messageBody, lead.conversationLog);
    await sendMessage(lead.phone, reply, lead.preferredChannel);

    // Log the reply
    const updatedLog = await logConversation(lead.rowIndex, lead.conversationLog, 'OUT', reply);
    await updateLead(lead.rowIndex, {
      status: STATUS.REPLIED,
      conversationLog: updatedLog,
    });
  } catch (err) {
    throw new Error(`handleHotLead failed: ${err.message}`);
  }
}

async function handleNeutral(classification, lead, messageBody) {
  try {

    const reply = await generateReply('Neutral', lead, messageBody, lead.conversationLog);
    await sendMessage(lead.phone, reply, lead.preferredChannel);

    const updatedLog = await logConversation(lead.rowIndex, lead.conversationLog, 'OUT', reply);
    await updateLead(lead.rowIndex, {
      status: STATUS.REPLIED,
      conversationLog: updatedLog,
    });
  } catch (err) {
    throw new Error(`handleNeutral failed: ${err.message}`);
  }
}

async function handleNotInterested(lead, messageBody) {
  try {

    const reply = await generateReply('Not Interested', lead, messageBody, lead.conversationLog);
    await sendMessage(lead.phone, reply, lead.preferredChannel);

    const updatedLog = await logConversation(lead.rowIndex, lead.conversationLog, 'OUT', reply);
    await updateLead(lead.rowIndex, {
      status: STATUS.UNRESPONSIVE, // Stop further outreach
      conversationLog: updatedLog,
      notes: `Marked not interested at ${new Date().toISOString()}`,
    });
  } catch (err) {
    throw new Error(`handleNotInterested failed: ${err.message}`);
  }
}

async function handleObjection(classification, lead, messageBody) {
  try {

    // Alert acquisitions team to be aware
    await sendObjectionAlert(lead, messageBody, classification);

    const reply = await generateReply('Objection', lead, messageBody, lead.conversationLog);
    await sendMessage(lead.phone, reply, lead.preferredChannel);

    const updatedLog = await logConversation(lead.rowIndex, lead.conversationLog, 'OUT', reply);
    await updateLead(lead.rowIndex, {
      status: STATUS.REPLIED,
      conversationLog: updatedLog,
      notes: `Objection handled at ${new Date().toISOString()}`,
    });
  } catch (err) {
    throw new Error(`handleObjection failed: ${err.message}`);
  }
}

async function handleComplaint(lead, messageBody) {
  try {

    // Alert manager immediately
    await sendComplaintAlert(lead, messageBody);

    const reply = await generateReply('Complaint', lead, messageBody, lead.conversationLog);
    await sendMessage(lead.phone, reply, lead.preferredChannel);

    const updatedLog = await logConversation(lead.rowIndex, lead.conversationLog, 'OUT', reply);
    await updateLead(lead.rowIndex, {
      status: STATUS.REPLIED,
      conversationLog: updatedLog,
      notes: `COMPLAINT logged at ${new Date().toISOString()} — manager alerted`,
    });
  } catch (err) {
    throw new Error(`handleComplaint failed: ${err.message}`);
  }
}

async function handlePositive(lead, messageBody) {
  try {

    const reply = await generateReply('Positive', lead, messageBody, lead.conversationLog);
    await sendMessage(lead.phone, reply, lead.preferredChannel);

    const updatedLog = await logConversation(lead.rowIndex, lead.conversationLog, 'OUT', reply);
    await updateLead(lead.rowIndex, {
      status: STATUS.REPLIED,
      conversationLog: updatedLog,
    });
  } catch (err) {
    throw new Error(`handlePositive failed: ${err.message}`);
  }
}

/**
 * TCPA opt-out handler.
 * Tags the lead as OPTED_OUT and sends a required confirmation message.
 */

async function handleOptOut(lead) {
  try {
    const confirmationMsg = 'You have been unsubscribed and will receive no further messages from us.';
    await sendMessage(lead.phone, confirmationMsg, lead.preferredChannel);

    const updatedLog = await logConversation(lead.rowIndex, lead.conversationLog, 'OUT', confirmationMsg);
    await updateLead(lead.rowIndex, {
      status: STATUS.OPTED_OUT,
      conversationLog: updatedLog,
      notes: `OPTED OUT at ${new Date().toISOString()} — TCPA compliant`,
    });

  } catch (err) {
    // Don't throw — we must never re-contact opted-out leads
    console.error(`[AI-BRAIN] handleOptOut error: ${err.message}`);
  }
}

module.exports = { runAiBrain };
