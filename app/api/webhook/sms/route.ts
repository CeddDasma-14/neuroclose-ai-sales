import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

/**
 * POST /api/webhook/sms
 *
 * Next.js version of the Twilio inbound SMS webhook.
 * 1. Validates Twilio signature (rejects spoofed requests)
 * 2. Responds with empty TwiML immediately (Twilio requires fast ACK)
 * 3. Processes the inbound reply asynchronously
 */
export async function POST(req: NextRequest) {
  try {
    // Parse Twilio's application/x-www-form-urlencoded body
    const formData = await req.formData()
    const body = formData.get('Body')
    const from = formData.get('From')
    const to = formData.get('To')

    const messageBody = typeof body === 'string' ? body.trim() : ''
    const phone = typeof from === 'string' ? from.trim() : ''

    // ── Twilio Signature Validation ──────────────────────────────────────────
    const twilioSignature = req.headers.get('x-twilio-signature') ?? ''

    if (!twilioSignature) {
      return new NextResponse('Forbidden: missing signature', { status: 403 })
    }

    // Build the full URL that Twilio used when sending the request
    const protocol = req.headers.get('x-forwarded-proto') ?? 'https'
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? ''
    const fullUrl = `${protocol}://${host}/api/webhook/sms`

    // Build params object that matches what Twilio signed
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      if (typeof value === 'string') params[key] = value
    })

    const twilio = require('twilio') as typeof import('twilio')
    const authToken = process.env.TWILIO_AUTH_TOKEN ?? ''

    const isValid = twilio.validateRequest(authToken, twilioSignature, fullUrl, params)
    if (!isValid) {
      return new NextResponse('Forbidden: invalid signature', { status: 403 })
    }

    // ── Input Validation ─────────────────────────────────────────────────────
    const phoneValid = /^\+?[1-9]\d{6,14}$/.test(phone)
    if (!phoneValid || !messageBody || messageBody.length > 1600) {
      // Return valid empty TwiML even for bad input — don't let Twilio retry
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { status: 200, headers: { 'Content-Type': 'text/xml' } }
      )
    }

    // ── Respond with empty TwiML immediately ─────────────────────────────────
    // Twilio requires a fast ACK. Processing happens asynchronously below.
    const twimlResponse = new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 200, headers: { 'Content-Type': 'text/xml' } }
    )

    // ── Async Processing ─────────────────────────────────────────────────────
    // Fire-and-forget: do not await — response is already constructed
    try {
      const replyHandlerPath = path.join(process.cwd(), 'src', 'workflows', 'replyHandler.js')
      const { handleInboundReply } = require(replyHandlerPath)

      handleInboundReply({
        phone,
        body: messageBody,
        to: typeof to === 'string' ? to.trim() : '',
        timestamp: new Date().toISOString(),
      }).catch((err: Error) => {
        console.error(`[Webhook/SMS] handleInboundReply error: ${err.message}`)
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[Webhook/SMS] Failed to load replyHandler: ${message}`)
    }

    return twimlResponse
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[Webhook/SMS] Unhandled error: ${message}`)
    // Always return valid TwiML — never let Twilio see a 5xx and retry
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 200, headers: { 'Content-Type': 'text/xml' } }
    )
  }
}
