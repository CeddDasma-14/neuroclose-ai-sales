'use strict';

const { google } = require('googleapis');
const { config } = require('../config');

// Column index map (1-based, matches sheet columns A-N)
const COL = {
  PHONE: 1,
  NAME: 2,
  STATUS: 3,
  REPLY_RECEIVED: 4,
  LAST_CONTACT: 5,
  LAST_REPLY: 6,
  FOLLOW_UP_SENT: 7,
  AI_CATEGORY: 8,
  MOTIVATION_SCORE: 9,
  CONVERSATION_LOG: 10,
  NOTES: 11,
  EMAIL: 12,
  AB_VARIANT: 13,
  PREFERRED_CHANNEL: 14,
};

const STATUS = {
  PENDING: 'PENDING',
  CONTACTED: 'CONTACTED',
  REPLIED: 'REPLIED',
  QUALIFIED: 'QUALIFIED',
  UNRESPONSIVE: 'UNRESPONSIVE',
  OPTED_OUT: 'OPTED_OUT',
};

let _sheets = null;

async function getSheetsClient() {
  if (_sheets) return _sheets;
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.google.serviceAccountEmail,
        private_key: config.google.privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    _sheets = google.sheets({ version: 'v4', auth });
    return _sheets;
  } catch (err) {
    throw new Error(`Failed to initialize Google Sheets client: ${err.message}`);
  }
}

/**
 * Sanitize a string value before writing to Sheets.
 * Prevents formula injection (OWASP: stored XSS equivalent in Sheets).
 */
function sanitize(value) {
  if (value == null) return '';
  const str = String(value).trim();
  // Strip leading = + - @ to prevent formula injection
  return str.replace(/^[=+\-@]/, "'$&");
}

/**
 * Read all leads from the sheet (skips header row).
 * Returns array of row objects.
 */
async function getLeads() {
  try {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: config.google.sheetId,
      range: 'Sheet1!A2:N',
    });
    const rows = res.data.values || [];
    return rows.map((row, idx) => ({
      rowIndex: idx + 2, // 1-based, +1 for header
      phone: row[COL.PHONE - 1] || '',
      name: row[COL.NAME - 1] || '',
      status: (row[COL.STATUS - 1] || STATUS.PENDING).toUpperCase(),
      replyReceived: row[COL.REPLY_RECEIVED - 1] || 'NO',
      lastContact: row[COL.LAST_CONTACT - 1] || '',
      lastReply: row[COL.LAST_REPLY - 1] || '',
      followUpSent: row[COL.FOLLOW_UP_SENT - 1] || 'NO',
      aiCategory: row[COL.AI_CATEGORY - 1] || '',
      motivationScore: row[COL.MOTIVATION_SCORE - 1] || '',
      conversationLog: row[COL.CONVERSATION_LOG - 1] || '',
      notes: row[COL.NOTES - 1] || '',
      email: row[COL.EMAIL - 1] || '',
      abVariant: row[COL.AB_VARIANT - 1] || '',
      preferredChannel: row[COL.PREFERRED_CHANNEL - 1] || '',
    }));
  } catch (err) {
    throw new Error(`getLeads failed: ${err.message}`);
  }
}

/**
 * Find a single lead by phone number.
 * Returns the lead object or null.
 */
async function findLeadByPhone(phone) {
  try {
    const leads = await getLeads();
    const normalized = phone.replace(/\D/g, '');
    return leads.find((l) => l.phone.replace(/\D/g, '') === normalized) || null;
  } catch (err) {
    throw new Error(`findLeadByPhone failed: ${err.message}`);
  }
}

/**
 * Update specific columns for a lead row.
 * @param {number} rowIndex - 1-based sheet row number
 * @param {object} updates - { status, replyReceived, lastContact, lastReply, followUpSent, aiCategory, motivationScore, conversationLog, notes }
 */
async function updateLead(rowIndex, updates) {
  try {
    const sheets = await getSheetsClient();
    const data = [];

    const colMap = {
      status: COL.STATUS,
      replyReceived: COL.REPLY_RECEIVED,
      lastContact: COL.LAST_CONTACT,
      lastReply: COL.LAST_REPLY,
      followUpSent: COL.FOLLOW_UP_SENT,
      aiCategory: COL.AI_CATEGORY,
      motivationScore: COL.MOTIVATION_SCORE,
      conversationLog: COL.CONVERSATION_LOG,
      notes: COL.NOTES,
      abVariant: COL.AB_VARIANT,
      preferredChannel: COL.PREFERRED_CHANNEL,
    };

    for (const [key, colIdx] of Object.entries(colMap)) {
      if (updates[key] !== undefined) {
        const colLetter = String.fromCharCode(64 + colIdx);
        data.push({
          range: `Sheet1!${colLetter}${rowIndex}`,
          values: [[sanitize(updates[key])]],
        });
      }
    }

    if (data.length === 0) return;

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: config.google.sheetId,
      requestBody: { valueInputOption: 'RAW', data },
    });
  } catch (err) {
    throw new Error(`updateLead (row ${rowIndex}) failed: ${err.message}`);
  }
}

/**
 * Append a message to the conversation log for a lead.
 */
async function logConversation(rowIndex, existingLog, direction, message) {
  try {
    const timestamp = new Date().toISOString();
    const prefix = direction === 'OUT' ? '[YOU]' : '[LEAD]';
    const entry = `${timestamp} ${prefix}: ${message}`;
    const updatedLog = existingLog ? `${existingLog}\n${entry}` : entry;
    await updateLead(rowIndex, { conversationLog: updatedLog });
    return updatedLog;
  } catch (err) {
    throw new Error(`logConversation failed: ${err.message}`);
  }
}

/**
 * Initialize sheet headers if the sheet is empty.
 */
async function ensureHeaders() {
  try {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: config.google.sheetId,
      range: 'Sheet1!A1:N1',
    });
    const headers = res.data.values?.[0] || [];
    if (headers.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.google.sheetId,
        range: 'Sheet1!A1:N1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Phone', 'Name', 'Status', 'Reply_Received',
            'Last_Contact', 'Last_Reply', 'Follow_Up_Sent',
            'AI_Category', 'Motivation_Score', 'Conversation_Log', 'Notes', 'Email', 'AB_Variant', 'Preferred_Channel',
          ]],
        },
      });
    }
  } catch (err) {
    throw new Error(`ensureHeaders failed: ${err.message}`);
  }
}

module.exports = {
  getLeads,
  findLeadByPhone,
  updateLead,
  logConversation,
  ensureHeaders,
  STATUS,
};
