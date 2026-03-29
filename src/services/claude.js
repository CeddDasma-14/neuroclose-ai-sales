'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { config } = require('../config');
const { tracedCreate } = require('./observability');

let _client = null;

// ── Daily call budget ────────────────────────────────────────────────────────
// Simple in-memory counters that reset at midnight. Prevents runaway API costs.
const _budget = { classifyCalls: 0, replyCalls: 0, resetDate: new Date().toDateString() };

function checkBudget(type) {
  const today = new Date().toDateString();
  if (_budget.resetDate !== today) {
    _budget.classifyCalls = 0;
    _budget.replyCalls = 0;
    _budget.resetDate = today;
  }
  const limit = type === 'classify'
    ? config.anthropic.maxDailyClassifyCalls
    : config.anthropic.maxDailyReplyCalls;
  if (limit > 0 && _budget[`${type}Calls`] >= limit) {
    throw new Error(`Daily ${type} API budget (${limit}) reached. Resuming tomorrow.`);
  }
  _budget[`${type}Calls`]++;
}

function getClient() {
  if (_client) return _client;
  try {
    _client = new Anthropic({ apiKey: config.anthropic.apiKey });
    return _client;
  } catch (err) {
    throw new Error(`Failed to initialize Anthropic client: ${err.message}`);
  }
}

/**
 * TCPA opt-out keywords — per US regulations.
 * If any of these appear in a lead's message, they must be opted out immediately.
 */
const OPT_OUT_KEYWORDS = ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit'];

// Messages that don't need a reply — conversation closers
const STOP_REPLY_KEYWORDS = [
  'thanks', 'thank you', 'ok', 'okay', 'oky', 'got it', 'great', 'perfect',
  'sounds good', 'all goods', 'all good', 'noted', 'sure', 'cool', 'nice',
  'talk soon', 'bye', 'goodbye', 'ttyl',
];

/**
 * Check if a message is a conversation closer that doesn't need a reply.
 */
function isStopReplyMessage(messageBody) {
  const normalized = messageBody.trim().toLowerCase();
  return STOP_REPLY_KEYWORDS.some((kw) => normalized === kw || normalized === kw + '!');
}

/**
 * Truncate conversation log to last N exchanges to keep context focused.
 */
function truncateLog(conversationLog, maxExchanges = 10) {
  if (!conversationLog) return '';
  const lines = conversationLog.split('\n').filter(Boolean);
  return lines.slice(-maxExchanges * 2).join('\n');
}

/**
 * Check if lead has provided address, condition, and timeline.
 */
function isFullyQualified(conversationLog) {
  if (!conversationLog) return false;
  const log = conversationLog.toLowerCase();
  const hasAddress = /\d+\s+\w+.*street|ave|road|blvd|drive|lane|court|way|place/i.test(conversationLog);
  const hasCondition = /(condition|repairs?|fix|good|bad|worst|fair|poor|great|excellent|needs work)/i.test(log);
  const hasTimeline = /(asap|soon|anytime|flexible|month|week|year|urgent|timeline|sell by)/i.test(log);
  // Email is nice-to-have — not required for qualification
  return hasAddress && hasCondition && hasTimeline;
}

function hasEmail(conversationLog) {
  if (!conversationLog) return false;
  return /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i.test(conversationLog);
}

/**
 * Check if a message contains an opt-out keyword.
 */
function isOptOutMessage(messageBody) {
  const normalized = messageBody.trim().toLowerCase();
  return OPT_OUT_KEYWORDS.includes(normalized);
}

/**
 * Build a readable SMS transcript from the conversation log string.
 */
function buildTranscript(conversationLog) {
  if (!conversationLog) return 'No prior conversation.';
  return conversationLog.trim();
}

/**
 * Classify a lead's intent using Claude Haiku (cheap + fast).
 * Returns structured JSON: { category, urgency, motivation_score, reasoning }
 *
 * Categories: Hot Lead | Neutral | Not Interested | Objection | Complaint | Positive
 */
async function classifyReply(lead, messageBody, conversationLog) {
  try {
    checkBudget('classify');
    const client = getClient();
    const transcript = buildTranscript(conversationLog);

    const prompt = `You are an AI assistant for a ${config.business.type} company called ${config.business.name}.

Context: ${config.business.context}

Lead Information:
- Name: ${lead.name || 'Unknown'}
- Phone: ${lead.phone}

Full SMS Conversation History:
${transcript}

Latest Message from Lead: "${messageBody}"

Classify this lead's intent and respond with ONLY valid JSON (no markdown, no extra text):

{
  "category": "<one of: Hot Lead | Neutral | Not Interested | Objection | Complaint | Positive>",
  "urgency": "<one of: High | Medium | Low>",
  "motivation_score": <integer 0-100>,
  "reasoning": "<one sentence explaining the classification>"
}

Classification Guide:
- Hot Lead: High urgency, wants to sell fast, motivated, asking about process or price
- Neutral: Mild interest, not committed, asking general questions
- Not Interested: Clear rejection, doesn't want to sell, no interest
- Objection: Any hesitation, pushback, or concern — price too low, not ready yet, has an agent, wants to think about it, questions legitimacy, asks for proof, compares to other buyers, worried about timeline, skeptical about process, wants more info before committing, or says "maybe" / "not sure yet" — not a flat rejection
- Complaint: Angry, frustrated, negative about the contact itself
- Positive: Enthusiastic, agreeable, warm response without full commitment yet`;

    const response = await tracedCreate(client, 'classifyReply', lead.phone, { category: 'classify', leadName: lead.name }, {
      model: config.anthropic.classifyModel,
      max_tokens: config.anthropic.maxTokensClassify,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].text.trim();

    // Strip markdown code fences if Claude wrapped the JSON (e.g. ```json ... ```)
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    // Parse and validate JSON
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(`Claude returned invalid JSON: ${cleaned}`);
    }

    const validCategories = ['Hot Lead', 'Neutral', 'Not Interested', 'Objection', 'Complaint', 'Positive'];
    if (!validCategories.includes(parsed.category)) {
      throw new Error(`Invalid category returned: ${parsed.category}`);
    }

    const score = parseInt(parsed.motivation_score, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      throw new Error(`Invalid motivation_score: ${parsed.motivation_score}`);
    }

    return {
      category: parsed.category,
      urgency: parsed.urgency || 'Medium',
      motivationScore: score,
      reasoning: parsed.reasoning || '',
    };
  } catch (err) {
    throw new Error(`classifyReply failed: ${err.message}`);
  }
}

/**
 * Generate a contextual SMS reply using Claude Sonnet (quality output).
 * @param {string} category - Classification result
 * @param {object} lead - Lead object
 * @param {string} messageBody - Latest message from lead
 * @param {string} conversationLog - Full conversation history
 * @returns {string} SMS reply text
 */
async function generateReply(category, lead, messageBody, conversationLog) {
  try {
    checkBudget('reply');
    const client = getClient();
    const transcript = buildTranscript(truncateLog(conversationLog, 10));

    const toneGuide = {
      'Hot Lead': 'Warm, professional, helpful. Gather property details (address, condition, timeline). Once those are collected, naturally ask for their email so the team can send over details. Do NOT promise calls or say you are calling — this is a text/WhatsApp conversation only.',
      'Neutral': 'Friendly, curious, non-pushy. Keep the conversation going.',
      'Not Interested': 'Respectful, positive, leave the door open for the future.',
      'Objection': 'Empathetic and patient. Acknowledge their concern, validate it, then gently address it. Never be defensive. If about price, explain the value of speed and certainty. If about trust, offer proof or references. If about timing, show flexibility. Keep the door open — never push.',
      'Complaint': 'Apologetic, calm, de-escalate immediately.',
      'Positive': 'Match their energy, warm and encouraging.',
    };

    const prompt = `You are a friendly SMS representative for ${config.business.name}, a ${config.business.type} company.

Context about us: ${config.business.context}

Lead Name: ${lead.name || 'there'}
Category: ${category}
Tone to use: ${toneGuide[category] || 'Friendly and professional'}

Conversation History:
${transcript}

Lead's Latest Message: "${messageBody}"

Write a SHORT, natural SMS reply (1-3 sentences max, under 160 characters ideally).
Do NOT use emojis unless the lead used them first.
Do NOT be salesy or pushy.
Reply only with the SMS text itself — no quotes, no explanation.`;

    const response = await tracedCreate(client, 'generateReply', lead.phone, { category, leadName: lead.name }, {
      model: config.anthropic.replyModel,
      max_tokens: config.anthropic.maxTokensReply,
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = response.content[0].text.trim();

    if (!reply) throw new Error('Claude returned empty reply');
    if (reply.length > 1600) throw new Error('Generated reply exceeds SMS limit');

    return reply;
  } catch (err) {
    throw new Error(`generateReply failed: ${err.message}`);
  }
}

/**
 * Generate personalized initial outreach SMS for a lead.
 * @param {object} lead
 * @param {'A'|'B'} variant - A/B test variant. A = speed/convenience angle, B = curiosity/value angle.
 */
async function generateOutreachMessage(lead, variant = 'A') {
  try {
    checkBudget('reply');
    const client = getClient();

    const variantAngle = variant === 'B'
      ? `Angle: Lead with curiosity — make them wonder what their property could be worth to a cash buyer. Don't mention price. Be brief and intriguing.`
      : `Angle: Lead with ease and speed — highlight that you buy as-is, no repairs, fast close. Sound helpful, not pushy.`;

    const prompt = `You are crafting a first-contact SMS for ${config.business.name}, a ${config.business.type} company.

Context: ${config.business.context}

Lead Name: ${lead.name || 'there'}
${variantAngle}

Write a SHORT, friendly, non-pushy first SMS (under 160 characters).
Sound like a real person, not a bot.
Do NOT use emojis. Do NOT mention prices.
Reply only with the SMS text — no quotes, no explanation.`;

    const response = await tracedCreate(client, 'generateOutreachMessage', lead.phone, { variant, leadName: lead.name }, {
      model: config.anthropic.replyModel,
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const message = response.content[0].text.trim();
    if (!message) throw new Error('Claude returned empty outreach message');
    return message;
  } catch (err) {
    throw new Error(`generateOutreachMessage failed: ${err.message}`);
  }
}

/**
 * Generate a follow-up SMS for a non-responding lead.
 */
async function generateFollowUpMessage(lead, followUpNumber) {
  try {
    const client = getClient();

    const prompt = `You are following up with a lead for ${config.business.name}, a ${config.business.type} company.

Context: ${config.business.context}

Lead Name: ${lead.name || 'there'}
This is follow-up #${followUpNumber}.

Write a SHORT, gentle follow-up SMS (under 160 characters).
Do not be pushy. Keep it casual and human.
Reply only with the SMS text — no quotes, no explanation.`;

    const response = await tracedCreate(client, 'generateFollowUpMessage', lead.phone, { followUpNumber, leadName: lead.name }, {
      model: config.anthropic.classifyModel,
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const message = response.content[0].text.trim();
    if (!message) throw new Error('Claude returned empty follow-up message');
    return message;
  } catch (err) {
    throw new Error(`generateFollowUpMessage failed: ${err.message}`);
  }
}

/**
 * Generate a structured summary of a qualified lead's key details.
 * Used for the Slack handoff card when a lead is ready for manual review.
 */
async function generateLeadSummary(lead) {
  try {
    const client = getClient();
    const transcript = buildTranscript(truncateLog(lead.conversationLog, 20));

    const prompt = `You are summarizing a lead conversation for a ${config.business.type} acquisitions team.

Lead Name: ${lead.name || 'Unknown'}
Phone: ${lead.phone}
Motivation Score: ${lead.motivationScore || 'N/A'}

Conversation:
${transcript}

Extract and return ONLY valid JSON (no markdown):
{
  "address": "<property address if mentioned, or 'Not provided'>",
  "condition": "<property condition if mentioned, or 'Not mentioned'>",
  "timeline": "<selling timeline if mentioned, or 'Not mentioned'>",
  "keyPoints": "<1-2 sentence summary of the lead's situation and motivation>"
}`;

    const response = await tracedCreate(client, 'generateLeadSummary', lead.phone, { leadName: lead.name }, {
      model: config.anthropic.classifyModel,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].text.trim();
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null; // Non-critical — Slack alert still fires without summary
  }
}

/**
 * Generate a natural, non-spammy email subject line for a lead.
 * Avoids common spam trigger phrases.
 */
async function generateEmailSubject(lead) {
  try {
    const client = getClient();

    const prompt = `Write a short, natural email subject line (under 50 characters) for a first outreach email from ${config.business.name}, a ${config.business.type} company, to a property owner named ${lead.name || 'there'}.

Rules:
- Sound like a real person emailing, not a marketing blast
- Do NOT use: "quick question", "cash offer", "buy your house", "free", "urgent", "act now"
- Keep it casual and curiosity-driven
- No emojis, no ALL CAPS
- Reply with ONLY the subject line text — no quotes, no explanation`;

    const response = await tracedCreate(client, 'generateEmailSubject', lead.phone, { leadName: lead.name }, {
      model: config.anthropic.classifyModel,
      max_tokens: 60,
      messages: [{ role: 'user', content: prompt }],
    });

    const subject = response.content[0].text.trim().replace(/^["']|["']$/g, '');
    if (!subject) throw new Error('Empty subject returned');
    return subject;
  } catch (err) {
    // Fallback to a safe default if Claude fails
    return `Following up — ${config.business.name}`;
  }
}

module.exports = {
  classifyReply,
  generateReply,
  generateOutreachMessage,
  generateFollowUpMessage,
  generateEmailSubject,
  generateLeadSummary,
  buildTranscript,
  isOptOutMessage,
  isStopReplyMessage,
  isFullyQualified,
  hasEmail,
};
