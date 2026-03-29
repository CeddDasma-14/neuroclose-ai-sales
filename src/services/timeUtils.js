'use strict';

const { config } = require('../config');

/**
 * Returns true if the current time is within the allowed sending window.
 * TCPA requires outreach only between 8am–9pm in the recipient's local time.
 * We use the configured business timezone as a proxy.
 */
function isWithinSendingHours() {
  const { sendingHoursStart, sendingHoursEnd, timezone } = config.outreach;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(formatter.format(new Date()), 10);
    return hour >= sendingHoursStart && hour < sendingHoursEnd;
  } catch {
    // If timezone is invalid, block sends — misconfiguration must never bypass TCPA
    console.error('[TimeUtils] Invalid BUSINESS_TIMEZONE config — blocking sends to protect TCPA compliance.');
    return false;
  }
}

/**
 * Count how many inbound (LEAD) turns are in the conversation log.
 */
function countConversationTurns(conversationLog) {
  if (!conversationLog) return 0;
  return (conversationLog.match(/\[LEAD\]/g) || []).length;
}

/**
 * Returns true if the conversation has exceeded the max turn limit.
 */
function isConversationLimitReached(conversationLog) {
  return countConversationTurns(conversationLog) >= config.outreach.maxConversationTurns;
}

module.exports = { isWithinSendingHours, countConversationTurns, isConversationLimitReached };
