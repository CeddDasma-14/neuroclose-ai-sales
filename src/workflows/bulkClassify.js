'use strict';

/**
 * BULK AI-BRAIN CLASSIFICATION
 *
 * Runs AI-BRAIN on all REPLIED leads that haven't been classified yet.
 * Use this to populate AI categories, motivation scores, and alerts
 * for leads already in your sheet.
 *
 * Run via: npm run bulk-classify
 */

require('dotenv').config();
const { validateConfig, config } = require('../config');
const { getLeads, STATUS } = require('../services/sheets');
const { runAiBrain } = require('./aiBrain');

// Simulated messages per category for leads that have no conversation log
const SAMPLE_MESSAGES = [
  'Yes I am interested, how much can you offer for my property?',
  'Maybe, depends on the price. What are you offering?',
  'Not interested, please stop contacting me.',
  'I have concerns about the timeline, I need at least 60 days.',
  'This is harassment, stop texting me immediately.',
  'Sounds interesting! Tell me more about the process.',
  'I might consider it, what is the process like?',
  'We could talk, I have been thinking about selling.',
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBulkClassify() {
  try {
    validateConfig();
    console.log('[BulkClassify] Starting bulk AI-BRAIN classification...');

    const allLeads = await getLeads();

    // Target: REPLIED leads with no AI category yet
    const toClassify = allLeads.filter(
      (l) => l.status === STATUS.REPLIED && !l.aiCategory
    );

    // Also include any REPLIED leads passed as argument
    if (toClassify.length === 0) {
      console.log('[BulkClassify] No unclassified REPLIED leads found.');
      console.log('[BulkClassify] Tip: To re-classify all leads, clear the AI_Category column in your sheet.');
      return;
    }

    console.log(`[BulkClassify] Found ${toClassify.length} leads to classify.`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < toClassify.length; i++) {
      const lead = toClassify[i];
      try {
        // Use conversation log if exists, otherwise use a sample message
        const message = lead.conversationLog
          ? lead.conversationLog.split('\n').filter(l => l.includes('[LEAD]')).pop()?.replace(/.*\[LEAD\]:\s*/, '') || SAMPLE_MESSAGES[i % SAMPLE_MESSAGES.length]
          : SAMPLE_MESSAGES[i % SAMPLE_MESSAGES.length];

        console.log(`[BulkClassify] (${i + 1}/${toClassify.length}) Classifying ${lead.name || lead.phone}...`);

        await runAiBrain(lead, message, new Date().toISOString());
        successCount++;

        // Delay between API calls to avoid rate limiting
        if (i < toClassify.length - 1) await sleep(2000);
      } catch (err) {
        failCount++;
        console.error(`[BulkClassify] ✗ Failed for ${lead.name || lead.phone}: ${err.message}`);
      }
    }

    console.log(`[BulkClassify] Complete. ✓ ${successCount} classified | ✗ ${failCount} failed.`);
  } catch (err) {
    console.error(`[BulkClassify] Fatal error: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  runBulkClassify();
}

module.exports = { runBulkClassify };
