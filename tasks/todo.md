# AI Sales Automation — Task Tracker

## ✅ Phase 1 — Core Backend (COMPLETE)
- [x] Project scaffold + package.json
- [x] Dependency installation (`npm install`)
- [x] `src/config/index.js` — env var validation at startup
- [x] `src/services/sheets.js` — Google Sheets CRUD
- [x] `src/services/twilio.js` — SMS send + signature validation
- [x] `src/services/claude.js` — AI classification + reply generation
- [x] `src/services/notifications.js` — SendGrid email alerts
- [x] `src/workflows/outreach.js` — Workflow 1: Initial Outreach
- [x] `src/workflows/followup.js` — Workflow 2: Follow-Up Engine
- [x] `src/workflows/replyHandler.js` — Workflow 3: SMS Reply Handler
- [x] `src/workflows/aiBrain.js` — Workflow 4: AI-BRAIN
- [x] TCPA compliance — opt-out detection + confirmation SMS

---

## 🔜 Phase 2 — Setup & Testing (PENDING)
- [ ] Create Google Sheet with correct column headers
- [ ] Set up Twilio account + phone number
- [ ] Set up SendGrid account + sender verification
- [ ] Copy `.env.example` → `.env` and fill in all values
- [ ] Add test lead to Google Sheet
- [ ] Run `npm run outreach` — verify SMS sends
- [ ] Reply to test SMS — verify webhook + AI-BRAIN

---

## 🚧 Phase 3 — UI (IN PROGRESS)

### Architecture
- **Next.js 14** (App Router) — full-stack, single codebase
- **Tailwind CSS** + **shadcn/ui** — professional dark theme
- **Recharts** — dashboard metrics
- Next.js API routes import directly from `src/services/`
- Cron workflows stay as standalone Node scripts
- Twilio webhook migrates to a Next.js API route
- Architect cleanly for multi-tenant (future v2)

### Milestone 1 — Scaffold & Layout
- [ ] Scaffold Next.js 14 app with App Router + TypeScript + Tailwind
- [ ] Install and configure shadcn/ui
- [ ] Build root layout: sidebar nav, header, dark theme
- [ ] Sidebar links: Dashboard, Leads, Campaign, Settings
- [ ] Responsive shell (works on desktop and mobile)

### Milestone 2 — Dashboard Page (`/`)
- [ ] Stats cards: Total Leads, Contacted, Replied, Hot Leads, Conversion Rate
- [ ] Lead pipeline bar chart (status distribution)
- [ ] AI Category breakdown (Hot Lead, Neutral, Objection, etc.)
- [ ] Live activity feed (last 20 actions)
- [ ] `GET /api/stats` — aggregate stats from Sheets

### Milestone 3 — Leads Page (`/leads`)
- [ ] Full leads table with columns: Name, Phone, Status, AI Category, Motivation Score, Last Contact
- [ ] Status badge component (color-coded per status)
- [ ] Motivation score progress bar
- [ ] Search + filter by status / AI category
- [ ] `GET /api/leads` — fetch all leads

### Milestone 4 — Lead Detail Page (`/leads/[phone]`)
- [ ] Conversation thread view (formatted, timestamped)
- [ ] AI analysis card: category, urgency, motivation score, reasoning
- [ ] Lead info card: name, phone, notes
- [ ] Timeline of all interactions
- [ ] `GET /api/leads/[phone]` — single lead

### Milestone 5 — Campaign Page (`/campaign`)
- [ ] Run Outreach button (triggers `workflows/outreach.js`)
- [ ] Batch size config + delay config
- [ ] Last run summary (sent, failed, skipped)
- [ ] Follow-up engine status (running / paused)
- [ ] `POST /api/campaign/run` — trigger outreach
- [ ] `GET /api/campaign/status` — engine status

### Milestone 6 — Settings Page (`/settings`)
- [ ] Business name, type, context fields
- [ ] Batch size + delay settings
- [ ] Notification config: Slack webhook URL, team email
- [ ] Save to `.env` / config (with restart notice)

### Milestone 7 — Team Alerts
- [ ] Slack alert: rich message to `#hot-leads` channel on Hot Lead detected
- [ ] Email alert: SendGrid notification with lead summary
- [ ] Alert fires from `aiBrain.js` when category = Hot Lead
- [ ] Alert includes: name, phone, score, category, conversation snippet, link to lead detail

### Milestone 8 — Webhook Migration
- [ ] Migrate Twilio inbound webhook to `app/api/webhook/sms/route.ts`
- [ ] Migrate Express security middleware to Next.js middleware
- [ ] Remove Express server dependency for UI

### Milestone 9 — Polish
- [ ] Loading states + skeleton screens on all pages
- [ ] Error boundaries + toast notifications
- [ ] Empty states (no leads, no activity)
- [ ] Mobile responsive check
- [ ] Remove all console.log before any production deploy

---

## 🔜 Phase 4 — Enhancement Roadmap (v2)
- [ ] Auth (Clerk) + Multi-tenant support
- [ ] Appointment Booking Bot (Google Calendar API)
- [ ] Voice AI Calls (ElevenLabs + Twilio Voice)
- [ ] WhatsApp Integration
- [ ] Autonomous Agent Mode
