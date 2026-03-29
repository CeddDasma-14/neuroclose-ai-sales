'use strict';

/**
 * EMAIL OUTREACH WORKFLOW
 *
 * Alternative to SMS outreach — uses SendGrid to send personalized emails.
 * Reads leads from Google Sheets, generates a personalized email via Claude,
 * sends via SendGrid, and logs status back to Sheets.
 *
 * Run via: npm run email-outreach
 */

require('dotenv').config();
const sgMail = require('@sendgrid/mail');
const { validateConfig, config } = require('../config');
const { getLeads, updateLead, logConversation, ensureHeaders, STATUS } = require('../services/sheets');
const { generateOutreachMessage, generateEmailSubject } = require('../services/claude');
const { isWithinSendingHours } = require('../services/timeUtils');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runEmailOutreach() {
  try {
    validateConfig();

    const sgKey = config.sendgrid.apiKey;
    if (!sgKey || sgKey.includes('xxx')) {
      throw new Error('SENDGRID_API_KEY is not configured in .env');
    }
    sgMail.setApiKey(sgKey);

    // TCPA: Only send within allowed hours
    if (!isWithinSendingHours()) {
      const { sendingHoursStart, sendingHoursEnd, timezone } = config.outreach;
      console.log(`[EmailOutreach] Outside sending hours (${sendingHoursStart}:00–${sendingHoursEnd}:00 ${timezone}). Skipping.`);
      return { sent: 0, failed: 0 };
    }

    console.log('[EmailOutreach] Starting email outreach workflow...');
    await ensureHeaders();

    const allLeads = await getLeads();
    const pendingLeads = allLeads.filter(
      (l) => l.status === STATUS.PENDING && l.email
    );
    const noEmail = allLeads.filter(
      (l) => l.status === STATUS.PENDING && !l.email
    );

    if (noEmail.length > 0) {
      console.warn(`[EmailOutreach] ${noEmail.length} lead(s) skipped — no Email in column L.`);
    }

    if (pendingLeads.length === 0) {
      console.log('[EmailOutreach] No pending leads with email addresses. Done.');
      return { sent: 0, failed: 0 };
    }

    const batch = pendingLeads.slice(0, config.outreach.batchSize);
    console.log(`[EmailOutreach] Processing ${batch.length} of ${pendingLeads.length} leads.`);

    let successCount = 0;
    let failCount = 0;

    for (const lead of batch) {
      try {
        // Randomly assign A/B variant
        const variant = Math.random() < 0.5 ? 'A' : 'B';

        // Generate personalized message and subject via Claude
        const [messageText, subject] = await Promise.all([
          generateOutreachMessage(lead, variant),
          generateEmailSubject(lead),
        ]);

        const unsubscribeEmail = `mailto:${config.sendgrid.fromEmail}?subject=unsubscribe`;

        const msg = {
          to: lead.email,
          from: {
            email: config.sendgrid.fromEmail,
            name: config.business.name,
          },
          replyTo: config.sendgrid.fromEmail,
          subject,
          text: `${messageText}\n\n---\nTo unsubscribe, reply with UNSUBSCRIBE.`,
          html: `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222">${messageText.replace(/\n/g, '<br/>')}</p>
                 <br/>
                 <p style="font-family:Arial,sans-serif;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:8px">
                   You received this because you may be interested in a cash offer for your property.<br/>
                   <a href="${unsubscribeEmail}" style="color:#999">Unsubscribe</a>
                 </p>`,
          headers: {
            'List-Unsubscribe': `<${unsubscribeEmail}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        };

        await sgMail.send(msg);

        const updatedLog = await logConversation(lead.rowIndex, lead.conversationLog, 'OUT', `[EMAIL] ${messageText}`);
        await updateLead(lead.rowIndex, {
          status: STATUS.CONTACTED,
          lastContact: new Date().toISOString(),
          conversationLog: updatedLog,
          abVariant: variant,
        });

        successCount++;
        console.log(`[EmailOutreach] ✓ Sent to ${lead.email} (${lead.name || 'Unknown'})`);

        // Rate limit delay
        await sleep(config.outreach.delayMs);
      } catch (leadErr) {
        failCount++;
        console.error(`[EmailOutreach] ✗ Failed for ${lead.email}: ${leadErr.message}`);
      }
    }

    console.log(`[EmailOutreach] Complete. ✓ ${successCount} sent | ✗ ${failCount} failed.`);
    return { sent: successCount, failed: failCount };
  } catch (err) {
    console.error(`[EmailOutreach] Fatal error: ${err.message}`);
    return { sent: 0, failed: 0 };
  }
}

if (require.main === module) {
  runEmailOutreach();
}

module.exports = { runEmailOutreach };
