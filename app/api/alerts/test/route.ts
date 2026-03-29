import { NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import path from 'path'
import { createRequire } from 'module'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

const require = createRequire(import.meta.url)

export async function POST(request: Request) {
  noStore()

  // Rate limit: 5 test alerts per minute per IP
  const ip = getClientIp(request)
  if (!checkRateLimit(`alert-test:${ip}`, 5, 60 * 1000)) {
    return NextResponse.json(
      { success: false, message: 'Too many test alerts. Please slow down.' },
      { status: 429 }
    )
  }

  if (!process.env.SLACK_WEBHOOK_URL) {
    return NextResponse.json({ success: false, message: 'Slack webhook URL is not configured.' })
  }

  try {
    const { sendSlackAlert } = require(path.join(process.cwd(), 'src/services/notifications.js'))

    const fakeLead = {
      name: 'Test Lead',
      phone: '+10000000000',
      latestMessage: 'This is a test alert from NeuralClose.',
    }
    const fakeAnalysis = {
      category: 'Hot Lead',
      motivationScore: 9,
    }

    await sendSlackAlert(fakeLead, fakeAnalysis)
    return NextResponse.json({ success: true, message: 'Test alert sent to Slack.' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, message })
  }
}
