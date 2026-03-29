'use strict';

/**
 * EMAIL FOLLOW-UP ENGINE
 *
 * Runs as a node-cron job every 3 minutes (same logic as followup.js but via email).
 * Branches:
 *   < 1 day since contact  → quick re-engagement email
 *   1–3 days since contact → 24h follow-up email
 *   > 3 days since contact → tag UNRESPONSIVE, stop emails
 */

require('dotenv').config();
const cron = require('node-cron');
const sgMail = require('@sendgrid/mail');
const { validateConfig, config } = require('../config');
const { getLeads, updateLead, logConversation, STATUS } = require('../services/sheets');
const { generateFollowUpMessage } = require('../services/claude');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * ONE_DAY_MS;

async function sendFollowUpEmail(lead, messageText, followUpNumber) {
  try {
    const msg = {
      to: lead.email,
      from: { email: config.sendgrid.fromEmail, name: config.business.name },
      replyTo: config.sendgrid.fromEmail,
      subject: followUpNumber === 1
        ? `Still here if you need us — ${config.business.name}`
        : `One last check-in — ${config.business.name}`,
      text: `${messageText}\n\n---\nTo unsubscribe, reply UNSUBSCRIBE.`,
      html: `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222">${messageText.replace(/\n/g, '<br/>')}</p>
             <br/>
             <p style="font-family:Arial,sans-serif;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:8px">
               <a href="mailto:${config.sendgrid.fromEmail}?subject=unsubscribe" style="color:#999">Unsubscribe</a>
             </p>`,
      headers: {
        'List-Unsubscribe': `<mailto:${config.sendgrid.fromEmail}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    };
    await sgMail.send(msg);
    console.log(`[EmailFollowup] ✓ Follow-up #${followUpNumber} sent to ${lead.email}`);
  } catch (err) {
    throw new Error(`sendFollowUpEmail failed: ${err.message}`);
  }
}

async function processEmailFollowUps() {
  try {
    const sgKey = config.sendgrid.apiKey;
    if (!sgKey || sgKey.includes('xxx')) return;
    sgMail.setApiKey(sgKey);

    const allLeads = await getLeads();
    const now = Date.now();

    const toFollow = allLeads.filter((l) =>
      l.status === STATUS.CONTACTED &&
      l.replyReceived === 'NO' &&
      l.lastContact &&
      l.email
    );

    if (toFollow.length === 0) return;

    console.log(`[EmailFollowup] Checking ${toFollow.length} leads for follow-up...`);

    for (const lead of toFollow) {
      try {
        const lastContactTime = new Date(lead.lastContact).getTime();
        if (isNaN(lastContactTime)) continue;

        const elapsed = now - lastContactTime;

        if (elapsed > THREE_DAYS_MS) {
          // Branch 3: Unresponsive — stop all contact
          await updateLead(lead.rowIndex, {
            status: STATUS.UNRESPONSIVE,
            notes: `Marked unresponsive after 3 days. ${new Date().toISOString()}`,
          });
          console.log(`[EmailFollowup] Tagged UNRESPONSIVE: ${lead.name || lead.email}`);

        } else if (elapsed > ONE_DAY_MS) {
          // Branch 2: 24h follow-up (only once)
          if (lead.followUpSent === 'FIRST' || lead.followUpSent === 'YES') continue;

          const message = await generateFollowUpMessage(lead, 2);
          await sendFollowUpEmail(lead, message, 2);

          const updatedLog = await logConversation(lead.rowIndex, lead.conversationLog, 'OUT', `[EMAIL FOLLOWUP-2] ${message}`);
          await updateLead(lead.rowIndex, {
            followUpSent: 'YES',
            lastContact: new Date().toISOString(),
            conversationLog: updatedLog,
            notes: `24h email follow-up sent at ${new Date().toISOString()}`,
          });

        } else {
          // Branch 1: 3-min follow-up (only once, between 3–60 min after initial contact)
          if (lead.followUpSent) continue;
          const minutesSince = elapsed / 60000;
          if (minutesSince < 3 || minutesSince >= 60) continue;

          const message = await generateFollowUpMessage(lead, 1);
          await sendFollowUpEmail(lead, message, 1);

          const updatedLog = await logConversation(lead.rowIndex, lead.conversationLog, 'OUT', `[EMAIL FOLLOWUP-1] ${message}`);
          await updateLead(lead.rowIndex, {
            followUpSent: 'FIRST',
            conversationLog: updatedLog,
          });
        }
      } catch (leadErr) {
        console.error(`[EmailFollowup] Error for ${lead.email}: ${leadErr.message}`);
      }
    }
  } catch (err) {
    console.error(`[EmailFollowup] Cycle error: ${err.message}`);
  }
}

function startEmailFollowUpEngine() {
  try {
    validateConfig();
    console.log('[EmailFollowup] Email follow-up engine started. Checking every 3 minutes.');
    processEmailFollowUps();
    cron.schedule('*/3 * * * *', processEmailFollowUps);
  } catch (err) {
    console.error(`[EmailFollowup] Failed to start: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  startEmailFollowUpEngine();
}

module.exports = { startEmailFollowUpEngine, processEmailFollowUps };
