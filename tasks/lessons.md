# Lessons Learned

_This file is updated after every correction. Rules that prevent repeat mistakes._

---

## L001 — Always wrap every external call in try/catch
**Rule:** Every function that calls Twilio, Claude API, Google Sheets, or SendGrid must have its own try/catch with a descriptive error message.
**Why:** External APIs fail unpredictably. A bare error will crash the process and stop all lead processing.
**How to apply:** Pattern: `try { ... } catch (err) { throw new Error('contextName failed: ' + err.message); }`

## L002 — TCPA opt-out check must happen BEFORE AI classification
**Rule:** Check for STOP/UNSUBSCRIBE keywords before sending any message to Claude.
**Why:** Sending opted-out leads to the AI pipeline wastes tokens and risks re-contacting them.
**How to apply:** `isOptOutMessage()` is called first in `aiBrain.js` before any other processing.

## L003 — Twilio webhook must respond immediately, process asynchronously
**Rule:** Send the TwiML response before doing any database or AI work.
**Why:** Twilio times out at 15 seconds. Any delay risks it retrying the webhook and double-processing.
**How to apply:** `res.send(emptyTwimlResponse())` → then `setImmediate(() => handleInboundReply(...))`.

## L004 — Sanitize all values before writing to Google Sheets
**Rule:** Strip leading `= + - @` from any string before writing to Sheets.
**Why:** Google Sheets will execute any cell starting with these characters as a formula (formula injection).
**How to apply:** Use `sanitize()` from `sheets.js` on all user-supplied or AI-generated values.

## L005 — Never hardcode credentials — use process.env only
**Rule:** All API keys, tokens, and secrets live in `.env` only, accessed via `config/index.js`.
**Why:** Hardcoded credentials will be committed to git and leak.
**How to apply:** Config is validated at startup. Any missing key throws before the server starts.
