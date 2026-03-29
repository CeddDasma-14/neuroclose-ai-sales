'use strict';

/**
 * WORKFLOW 1 — INITIAL OUTREACH
 *
 * Reads leads from Google Sheets, sends personalized initial SMS via Twilio.
 * Respects batch limits and rate-limiting delay between sends.
 * Logs contact status and timestamp back to Sheets.
 *
 * Run via: npm run outreach
 */

require('dotenv').config();
const { validateConfig, config } = require('../config');
const { getLeads, updateLead, logConversation, ensureHeaders, STATUS } = require('../services/sheets');
const { sendSMS, sendWhatsApp } = require('../services/twilio');
const { generateOutreachMessage } = require('../services/claude');
const { isWithinSendingHours } = require('../services/timeUtils');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOutreach() {
  try {
    validateConfig();
    console.log('[Outreach] Starting initial outreach workflow...');
    await ensureHeaders();

    // TCPA: Only send within allowed hours (8am–9pm business timezone)
    if (!isWithinSendingHours()) {
      const { sendingHoursStart, sendingHoursEnd, timezone } = require('../config').config.outreach;
      console.log(`[Outreach] Outside sending hours (${sendingHoursStart}:00–${sendingHoursEnd}:00 ${timezone}). Skipping.`);
      return;
    }

    const allLeads = await getLeads();

    // Duplicate phone detection — warn and skip duplicates
    const phoneSeen = new Map();
    for (const lead of allLeads) {
      const normalized = lead.phone.replace(/\D/g, '');
      if (!normalized) continue;
      if (phoneSeen.has(normalized)) {
        console.warn(`[Outreach] ⚠️ Duplicate phone detected: ${lead.phone} (rows ${phoneSeen.get(normalized)} and ${lead.rowIndex}) — skipping row ${lead.rowIndex}`);
      } else {
        phoneSeen.set(normalized, lead.rowIndex);
      }
    }
    const uniqueLeads = allLeads.filter((l) => {
      const normalized = l.phone.replace(/\D/g, '');
      return normalized && phoneSeen.get(normalized) === l.rowIndex;
    });

    const pendingLeads = uniqueLeads.filter((l) => l.status === STATUS.PENDING);

    if (pendingLeads.length === 0) {
      console.log('[Outreach] No pending leads to contact. Done.');
      return;
    }

    const batch = pendingLeads.slice(0, config.outreach.batchSize);
    console.log(`[Outreach] Processing ${batch.length} of ${pendingLeads.length} pending leads.`);

    let successCount = 0;
    let failCount = 0;

    for (const lead of batch) {
      try {
        if (!lead.phone) {
          console.warn(`[Outreach] Skipping lead at row ${lead.rowIndex} — no phone number.`);
          continue;
        }

        // Randomly assign A/B variant (50/50 split)
        const variant = Math.random() < 0.5 ? 'A' : 'B';

        // Generate personalized opening message via Claude
        const message = await generateOutreachMessage(lead, variant);

        // Send via WhatsApp if enabled, otherwise SMS
        if (config.app.whatsappEnabled) {
          await sendWhatsApp(lead.phone, message);
        } else {
          await sendSMS(lead.phone, message);
        }

        // Log to conversation history
        const updatedLog = await logConversation(lead.rowIndex, lead.conversationLog, 'OUT', message);

        // Update Sheets: mark as CONTACTED, store variant
        await updateLead(lead.rowIndex, {
          status: STATUS.CONTACTED,
          lastContact: new Date().toISOString(),
          conversationLog: updatedLog,
          abVariant: variant,
        });

        successCount++;

        // Rate-limit delay between sends
        await sleep(config.outreach.delayMs);
      } catch (leadErr) {
        failCount++;
        console.error(`[Outreach] ✗ Failed row ${lead.rowIndex}: ${leadErr.message}`);
        // Continue to next lead — don't abort the whole batch
      }
    }

    console.log(`[Outreach] Complete. ✓ ${successCount} sent | ✗ ${failCount} failed.`);
  } catch (err) {
    console.error(`[Outreach] Fatal error: ${err.message}`);
    process.exit(1);
  }
}

// Run directly when executed as script
if (require.main === module) {
  runOutreach();
}

module.exports = { runOutreach };
