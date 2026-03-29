'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const sgMail = require('@sendgrid/mail');
const { config } = require('../config');

function recordAlertSent(leadName) {
  try {
    const statusPath = path.join(process.cwd(), 'tasks', 'status.json');
    let existing = {};
    try { existing = JSON.parse(fs.readFileSync(statusPath, 'utf-8')); } catch {}
    const today = new Date().toDateString();
    const alertsToday = existing.alertDate === today ? (existing.alertsToday || 0) + 1 : 1;
    fs.writeFileSync(statusPath, JSON.stringify({
      ...existing,
      lastAlertSentAt: new Date().toISOString(),
      lastAlertLead: leadName || 'Unknown',
      alertsToday,
      alertDate: today,
    }, null, 2));
  } catch {}
}

const sendgridReady =
  config.sendgrid.apiKey &&
  !config.sendgrid.apiKey.includes('xxx') &&
  config.sendgrid.fromEmail &&
  !config.sendgrid.fromEmail.includes('yourdomain');

if (sendgridReady) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

/**
 * Send a notification email via SendGrid.
 * Silently skips if SendGrid is not configured.
 */
async function sendEmail({ to, subject, html }) {
  if (!sendgridReady) {
    console.log(`[Notifications] Email skipped (SendGrid not configured): ${subject}`);
    return;
  }
  try {
    await sgMail.send({
      to,
      from: config.sendgrid.fromEmail,
      subject,
      html,
    });
  } catch (err) {
    console.error(`[Notifications] Failed to send email: ${err.message}`);
  }
}

/**
 * Alert the acquisitions team about a hot lead.
 */
async function sendHotLeadAlert(lead, classification) {
  try {
    const subject = `🔥 Hot Lead: ${lead.name || lead.phone} (Score: ${classification.motivationScore}/100)`;
    const html = `
      <h2>Hot Lead Detected</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td><b>Name</b></td><td>${lead.name || 'Unknown'}</td></tr>
        <tr><td><b>Phone</b></td><td>${lead.phone}</td></tr>
        <tr><td><b>Category</b></td><td>${classification.category}</td></tr>
        <tr><td><b>Urgency</b></td><td>${classification.urgency}</td></tr>
        <tr><td><b>Motivation Score</b></td><td>${classification.motivationScore}/100</td></tr>
        <tr><td><b>AI Reasoning</b></td><td>${classification.reasoning}</td></tr>
      </table>
      <h3>Latest Message</h3>
      <p style="background:#f4f4f4;padding:12px;border-radius:4px">${lead.latestMessage || 'N/A'}</p>
      <h3>Conversation Log</h3>
      <pre style="background:#f4f4f4;padding:12px;border-radius:4px;white-space:pre-wrap">${lead.conversationLog || 'No history'}</pre>
      <hr/>
      <p style="color:#888;font-size:12px">Sent by ${config.business.name} AI Sales System</p>
    `;
    await sendEmail({ to: config.team.acquisitionsEmail, subject, html });
  } catch (_err) {
  }
}

/**
 * Alert the manager about a complaint.
 */
async function sendComplaintAlert(lead, messageBody) {
  try {
    const subject = `⚠️ Complaint Received: ${lead.name || lead.phone}`;
    const html = `
      <h2>Lead Complaint — Immediate Attention Required</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td><b>Name</b></td><td>${lead.name || 'Unknown'}</td></tr>
        <tr><td><b>Phone</b></td><td>${lead.phone}</td></tr>
        <tr><td><b>Time</b></td><td>${new Date().toISOString()}</td></tr>
      </table>
      <h3>Message</h3>
      <p style="background:#fff3cd;padding:12px;border-radius:4px;border-left:4px solid #f0ad4e">${messageBody}</p>
      <h3>Full Conversation</h3>
      <pre style="background:#f4f4f4;padding:12px;border-radius:4px;white-space:pre-wrap">${lead.conversationLog || 'No history'}</pre>
      <hr/>
      <p style="color:#888;font-size:12px">Sent by ${config.business.name} AI Sales System</p>
    `;
    await sendEmail({ to: config.team.managerEmail, subject, html });
  } catch (_err) {
  }
}

/**
 * Alert the acquisitions team about an objection from a lead.
 */
async function sendObjectionAlert(lead, messageBody, classification) {
  try {
    const subject = `📋 Objection from Lead: ${lead.name || lead.phone}`;
    const html = `
      <h2>Lead Raised an Objection</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td><b>Name</b></td><td>${lead.name || 'Unknown'}</td></tr>
        <tr><td><b>Phone</b></td><td>${lead.phone}</td></tr>
        <tr><td><b>Reasoning</b></td><td>${classification.reasoning}</td></tr>
      </table>
      <h3>Their Message</h3>
      <p style="background:#f4f4f4;padding:12px;border-radius:4px">${messageBody}</p>
      <hr/>
      <p style="color:#888;font-size:12px">Sent by ${config.business.name} AI Sales System</p>
    `;
    await sendEmail({ to: config.team.acquisitionsEmail, subject, html });
  } catch (_err) {
  }
}

/**
 * Send a Slack Block Kit alert via an incoming webhook URL.
 * Silently skips if SLACK_WEBHOOK_URL is not set.
 * @param {object} lead - Lead object (must include phone, name, latestMessage)
 * @param {object} analysis - Classification result (category, motivationScore)
 */
async function sendSlackAlert(lead, analysis) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const snippet = typeof lead.latestMessage === 'string'
      ? lead.latestMessage.slice(0, 200)
      : 'N/A';

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🔥 Hot Lead Detected!', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Name:*\n${lead.name || 'Unknown'}` },
          { type: 'mrkdwn', text: `*Phone:*\n${lead.phone}` },
          { type: 'mrkdwn', text: `*AI Category:*\n${analysis.category}` },
          { type: 'mrkdwn', text: `*Motivation Score:*\n${analysis.motivationScore}/100` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Latest Message:*\n${snippet}` },
      },
    ];

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (baseUrl) {
      const leadUrl = `${baseUrl}/leads/${encodeURIComponent(lead.phone)}`;
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Lead', emoji: true },
            url: leadUrl,
            style: 'primary',
          },
        ],
      });
    }

    const payload = JSON.stringify({ blocks });

    await new Promise((resolve, reject) => {
      const url = new URL(webhookUrl);
      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          res.resume(); // Drain response body
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Slack webhook returned HTTP ${res.statusCode}`));
          } else {
            resolve(undefined);
          }
        }
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    recordAlertSent(lead.name || lead.phone);
  } catch (err) {
    console.error(`[Notifications] Slack alert failed: ${err.message}`);
  }
}

/**
 * Send a hot-lead email alert to the team email address.
 * Silently skips if TEAM_EMAIL or SendGrid is not configured.
 * @param {object} lead - Lead object
 * @param {object} analysis - Classification result
 */
async function sendEmailAlert(lead, analysis) {
  const teamEmail = process.env.TEAM_EMAIL;
  if (!teamEmail || !sendgridReady) return;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const leadUrl = `${baseUrl}/leads/${encodeURIComponent(lead.phone)}`;
    const snippet = typeof lead.latestMessage === 'string'
      ? lead.latestMessage.slice(0, 200)
      : 'N/A';

    const subject = `🔥 Hot Lead: ${lead.name || lead.phone}`;
    const html = `
      <h2 style="color:#e85d04">🔥 Hot Lead Detected</h2>
      <table style="border-collapse:collapse;width:100%;max-width:480px">
        <tr><td style="padding:6px 12px"><b>Name</b></td><td style="padding:6px 12px">${lead.name || 'Unknown'}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:6px 12px"><b>Phone</b></td><td style="padding:6px 12px">${lead.phone}</td></tr>
        <tr><td style="padding:6px 12px"><b>Score</b></td><td style="padding:6px 12px">${analysis.motivationScore}/100</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:6px 12px"><b>Category</b></td><td style="padding:6px 12px">${analysis.category}</td></tr>
      </table>
      <h3>Latest Message</h3>
      <p style="background:#fff3e0;padding:12px;border-radius:4px;border-left:4px solid #e85d04">${snippet}</p>
      <p><a href="${leadUrl}" style="background:#e85d04;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block">View Lead</a></p>
      <hr/>
      <p style="color:#888;font-size:12px">Sent by AI Sales Automation</p>
    `;

    await sendEmail({ to: teamEmail, subject, html });
  } catch (err) {
    console.error(`[Notifications] Email alert failed: ${err.message}`);
  }
}

module.exports = { sendHotLeadAlert, sendComplaintAlert, sendObjectionAlert, sendSlackAlert, sendEmailAlert };
