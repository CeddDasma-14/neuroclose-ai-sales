# NeuralClose — AI Sales Automation

> Your smartest salesperson never sleeps.

An AI-powered sales automation system that handles outreach, follow-ups, lead qualification, and real-time team alerts — across SMS, WhatsApp, and Email.

---

## Features

### AI Brain
- **Intelligent reply handling** — Claude AI reads every inbound SMS/WhatsApp message and crafts a personalized response based on your business context
- **Lead qualification** — automatically detects hot leads, objections, complaints, and positive signals
- **Human takeover detection** — stops AI replies when a lead is marked QUALIFIED and ready for a human
- **A/B message testing** — split-tests two outreach angles and tracks reply rates per variant
- **Bulk lead classification** — re-scores your entire lead list with AI in one run

### Outreach Workflows
- **SMS outreach** — bulk personalized SMS campaigns via Twilio with configurable batch size and delay
- **WhatsApp outreach** — bulk WhatsApp campaigns via Twilio WhatsApp sandbox
- **Email outreach** — bulk email campaigns via SendGrid with HTML templates
- **Follow-up engine** — automatic timed follow-ups for unresponsive leads
- **Email follow-up engine** — separate follow-up sequence for email leads

### Inbound Webhook
- **Twilio SMS/WhatsApp webhook** — secure endpoint that receives inbound replies
- **Signature validation** — verifies every request is genuinely from Twilio (rejects spoofed requests)
- **Rate limiting** — 20 requests/minute on the webhook to prevent abuse
- **Async processing** — responds to Twilio instantly, processes AI reply in the background

### Team Alerts
- **Slack hot lead alerts** — instant Slack notification when a lead is classified as hot
- **Slack qualification alerts** — notified when a lead is fully qualified and ready for review
- **Email alerts** — team email notifications via SendGrid
- **Alert tracking** — tracks alerts sent today and last alert details in the dashboard

### Google Sheets Integration
- **Lead database** — all leads stored and updated in Google Sheets in real time
- **Status tracking** — PENDING → CONTACTED → REPLIED → QUALIFIED → OPTED_OUT pipeline
- **Conversation log** — full SMS/WhatsApp conversation history per lead
- **AI category tagging** — Hot Lead, Neutral, Not Interested, Objection, Complaint, Positive

### Dashboard UI
- **Live stats cards** — Pending, Contacted, Replied, Qualified, Hot Leads, Opted Out
- **Lead pipeline chart** — visual bar chart of leads across pipeline stages
- **AI category breakdown** — donut/bar chart of AI-classified lead categories
- **A/B test results** — live comparison of variant A vs B reply rates
- **Activity feed** — real-time timeline of the most recent lead interactions

### Leads Page
- **Full leads table** — name, phone, email, status, AI category, last contact
- **Search and filter** — filter by status or AI category, search by name/phone
- **Lead detail view** — full conversation thread, AI analysis, interaction timeline

### Campaign Page
- **SMS campaign launcher** — run outreach with live progress tracking
- **WhatsApp campaign launcher** — separate WhatsApp outreach control
- **Email campaign launcher** — email campaign with status feedback
- **Follow-up engine control** — trigger follow-up sequences manually

### Settings Page
- **Team Alerts panel** — Slack connection status, send test alert button
- **Alert stats** — alerts sent today, last alert lead and time
- **Integration status** — live connection indicators for Slack, SendGrid, and team email

### Design System
- **Dark luxury theme** — deep navy (`#050d1a`) base with glassmorphism cards
- **Per-color neon glow borders** — each card glows in its own accent color (Dubai LifeOS style)
- **Outfit display font** — bold character for headings and stat numbers
- **Motion.js animations** — staggered card entrances, slide-in sidebar, scroll-triggered fade-ups
- **Colored left accent bars** — visual identity stripe per card matching its glow color

### Security
- **Twilio webhook signature validation** — cryptographic request verification
- **Rate limiting** — global (100 req/15 min) and webhook-specific (20 req/min) limiters
- **Helmet.js** — secure HTTP response headers on the Express server
- **Environment variables** — all secrets in `.env`, never committed
- **Input sanitization** — phone number and message body validation on all inbound data

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Animations | Motion.js |
| Charts | Recharts |
| AI | Anthropic Claude API |
| SMS / WhatsApp | Twilio |
| Email | SendGrid |
| Database | Google Sheets (via Service Account) |
| Alerts | Slack Incoming Webhooks |
| Observability | Langfuse |
| Auth | Clerk |
| Backend | Node.js + Express |

---

## Project Structure

```
├── app/                        # Next.js App Router (UI)
│   ├── page.tsx                # Dashboard
│   ├── leads/                  # Leads table + detail
│   ├── campaign/               # Campaign launcher
│   ├── settings/               # Settings + integrations
│   └── api/                    # API routes
│       ├── webhook/sms/        # Twilio inbound webhook
│       ├── leads/              # Lead CRUD
│       ├── campaign/           # Campaign triggers
│       ├── alerts/             # Slack alert status + test
│       └── stats/              # Dashboard stats
├── components/                 # UI components
│   ├── dashboard/              # Stats cards, charts, activity feed
│   ├── layout/                 # Sidebar, header
│   ├── leads/                  # Leads table, filters
│   ├── lead-detail/            # Lead detail panels
│   └── ui/                     # Shared primitives
├── src/
│   ├── services/               # sheets.js, twilio.js, claude.js, notifications.js
│   ├── workflows/              # outreach.js, replyHandler.js, aiBrain.js, followup.js
│   ├── middleware/             # security.js (rate limiting, signature validation)
│   ├── routes/                 # webhook.js (Express routes)
│   └── server.js               # Express server entry point
└── tasks/                      # Dev notes, lessons, status tracking
```

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in all values — see .env.example for required keys
```

### 3. Required accounts
- [Anthropic Console](https://console.anthropic.com) — Claude API key
- [Twilio](https://console.twilio.com) — Account SID, Auth Token, phone number
- [Google Cloud](https://console.cloud.google.com) — Service account with Sheets API enabled
- [SendGrid](https://app.sendgrid.com) — API key + verified sender
- [Slack](https://api.slack.com/apps) — Incoming webhook URL

### 4. Run the UI
```bash
npm run ui
# Opens on http://localhost:3001
```

### 5. Run outreach workflows
```bash
npm run outreach          # SMS outreach
npm run email-outreach    # Email outreach
npm run followup          # Follow-up engine
npm run bulk-classify     # Re-classify all leads with AI
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude AI API key |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Your Twilio SMS number |
| `TWILIO_WHATSAPP_NUMBER` | Your Twilio WhatsApp number |
| `GOOGLE_SHEET_ID` | Google Sheets document ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | Service account private key |
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender email |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL |
| `BUSINESS_NAME` | Your business name (used in AI prompts) |
| `BUSINESS_TYPE` | Your business type (used in AI prompts) |
| `SELLER_MOTIVATION_CONTEXT` | Value proposition (used in AI prompts) |

---

## Milestones

- [x] M1 — Google Sheets lead database integration
- [x] M2 — SMS outreach workflow
- [x] M3 — AI reply handler (Claude)
- [x] M4 — WhatsApp outreach
- [x] M5 — Email outreach + follow-up engine
- [x] M6 — Next.js dashboard UI
- [x] M7 — Slack + Email team alerts
- [ ] M8 — Twilio webhook live (ngrok / deploy)
- [ ] M9 — Production deploy

---

*Built with Claude Code · NeuralClose v1.0*
