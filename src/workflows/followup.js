'use strict';

/**
 * WORKFLOW 2 — FOLLOW-UP ENGINE
 *
 * Runs as a node-cron job every 3 minutes.
 * Checks for non-responding leads and sends timed follow-ups.
 * Branches:
 *   < 1 day since contact  → 3-min follow-up SMS
 *   1–3 days since contact → 24h follow-up SMS
 *   > 3 days since contact → Tag as UNRESPONSIVE, stop SMS
 */

require('dotenv').config();
const cron = require('node-cron');
const { validateConfig } = require('../config');
const { getLeads, updateLead, logConversation, STATUS } = require('../services/sheets');
const { sendSMS, sendWhatsApp } = require('../services/twilio');
const { config } = require('../config');
const { generateFollowUpMessage } = require('../services/claude');
const { isWithinSendingHours } = require('../services/timeUtils');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * ONE_DAY_MS;

async function processFollowUps() {
  try {
    // TCPA: Only send within allowed hours (8am–9pm business timezone)
    if (!isWithinSendingHours()) {
      return; // Silent skip — cron will retry in 3 minutes
    }

    const allLeads = await getLeads();
    const now = Date.now();

    const toFollow = allLeads.filter((l) => {
      // Only process leads that were contacted but haven't replied and aren't already tagged
      return (
        l.status === STATUS.CONTACTED &&
        l.replyReceived === 'NO' &&
        l.lastContact
      );
    });

    if (toFollow.length === 0) {
      return;
    }

    for (const lead of toFollow) {
      try {
        const lastContactTime = new Date(lead.lastContact).getTime();
        if (isNaN(lastContactTime)) {
          continue;
        }

        const elapsed = now - lastContactTime;

        if (elapsed > THREE_DAYS_MS) {
          // Branch 3: Tag as UNRESPONSIVE — stop all further SMS
          await updateLead(lead.rowIndex, {
            status: STATUS.UNRESPONSIVE,
            notes: `Marked unresponsive after 3 days of no reply. ${new Date().toISOString()}`,
          });
        } else if (elapsed > ONE_DAY_MS) {
          // Branch 2: 24h follow-up
          if (lead.followUpSent === 'FIRST' || lead.followUpSent === 'YES') continue;

          const message = await generateFollowUpMessage(lead, 2);
          if (config.app.whatsappEnabled) {
            await sendWhatsApp(lead.phone, message);
          } else {
            await sendSMS(lead.phone, message);
          }

          const updatedLog = await logConversation(lead.rowIndex, lead.conversationLog, 'OUT', message);
          await updateLead(lead.rowIndex, {
            followUpSent: 'YES',
            lastContact: new Date().toISOString(),
            conversationLog: updatedLog,
            notes: `24h follow-up sent at ${new Date().toISOString()}`,
          });

        } else {
          const minutesSinceContact = elapsed / 60000;

          if (!lead.followUpSent && minutesSinceContact >= 3 && minutesSinceContact < 60) {
            const message = await generateFollowUpMessage(lead, 1);
            if (config.app.whatsappEnabled) {
              await sendWhatsApp(lead.phone, message);
            } else {
              await sendSMS(lead.phone, message);
            }

            const updatedLog = await logConversation(lead.rowIndex, lead.conversationLog, 'OUT', message);
            await updateLead(lead.rowIndex, {
              followUpSent: 'FIRST',
              conversationLog: updatedLog,
            });

          }
        }
      } catch (leadErr) {
        console.error(`[FollowUp] Error processing row ${lead.rowIndex}: ${leadErr.message}`);
      }
    }
  } catch (err) {
    console.error(`[FollowUp] Fatal error in follow-up cycle: ${err.message}`);
    // Don't kill the cron job on a cycle failure
  }
}

function startFollowUpEngine() {
  try {
    validateConfig();

    // Run immediately on start, then every 3 minutes
    processFollowUps();
    cron.schedule('*/3 * * * *', processFollowUps);
  } catch (err) {
    console.error(`[FollowUp] Failed to start: ${err.message}`);
    process.exit(1);
  }
}

// Run directly when executed as script
if (require.main === module) {
  startFollowUpEngine();
}

module.exports = { startFollowUpEngine, processFollowUps };
