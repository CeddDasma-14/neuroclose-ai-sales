'use strict';

require('dotenv').config();

const REQUIRED_VARS = [
  'ANTHROPIC_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'GOOGLE_SHEET_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
];

// Optional — system works without these, but email alerts will be silently skipped
const OPTIONAL_VARS = [
  'SENDGRID_API_KEY',
  'SENDGRID_FROM_EMAIL',
  'ACQUISITIONS_TEAM_EMAIL',
  'MANAGER_EMAIL',
];

function validateConfig() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join('\n  ')}\n\nCopy .env.example to .env and fill in all values.`
    );
  }
  const missingOptional = OPTIONAL_VARS.filter((key) => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(`[Config] Optional vars not set (email alerts disabled): ${missingOptional.join(', ')}`);
  }
}

const config = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    classifyModel: 'claude-haiku-4-5-20251001',   // cheap + fast for classification
    replyModel: 'claude-sonnet-4-6',               // quality for reply generation
    maxTokensClassify: 512,
    maxTokensReply: 300,
    // Daily call budget — prevents runaway API costs. Set to 0 to disable.
    maxDailyClassifyCalls: parseInt(process.env.MAX_DAILY_CLASSIFY_CALLS || '500', 10),
    maxDailyReplyCalls: parseInt(process.env.MAX_DAILY_REPLY_CALLS || '500', 10),
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  google: {
    sheetId: process.env.GOOGLE_SHEET_ID,
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL,
  },
  team: {
    acquisitionsEmail: process.env.ACQUISITIONS_TEAM_EMAIL,
    managerEmail: process.env.MANAGER_EMAIL,
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProd: process.env.NODE_ENV === 'production',
    smsEnabled: process.env.SMS_ENABLED !== 'false',
    whatsappEnabled: process.env.WHATSAPP_ENABLED === 'true',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
  },
  outreach: {
    batchSize: parseInt(process.env.OUTREACH_BATCH_SIZE || '50', 10),
    delayMs: parseInt(process.env.OUTREACH_DELAY_MS || '5000', 10),
    sendingHoursStart: parseInt(process.env.SENDING_HOURS_START || '8', 10),   // 8am
    sendingHoursEnd: parseInt(process.env.SENDING_HOURS_END || '21', 10),      // 9pm
    timezone: process.env.BUSINESS_TIMEZONE || 'America/New_York',
    maxConversationTurns: parseInt(process.env.MAX_CONVERSATION_TURNS || '15', 10),
  },
  business: {
    name: process.env.BUSINESS_NAME || 'Our Company',
    type: process.env.BUSINESS_TYPE || 'real estate wholesaling',
    context: process.env.SELLER_MOTIVATION_CONTEXT || 'We buy houses fast, cash, as-is',
  },
};

module.exports = { config, validateConfig };
