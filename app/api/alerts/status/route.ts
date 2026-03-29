import { NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  noStore()

  try {
    const slackWebhook = process.env.SLACK_WEBHOOK_URL
    const slack = typeof slackWebhook === 'string' && slackWebhook.trim().length > 0

    const teamEmailRaw = process.env.TEAM_EMAIL
    const sendgridKey = process.env.SENDGRID_API_KEY
    const sendgridConfigured =
      typeof sendgridKey === 'string' &&
      sendgridKey.trim().length > 0 &&
      !sendgridKey.includes('xxx')

    const email =
      typeof teamEmailRaw === 'string' &&
      teamEmailRaw.trim().length > 0 &&
      sendgridConfigured

    let teamEmail: string | null = null
    if (typeof teamEmailRaw === 'string' && teamEmailRaw.trim().length > 0) {
      const atIndex = teamEmailRaw.indexOf('@')
      teamEmail = atIndex > 0
        ? teamEmailRaw[0] + '***' + teamEmailRaw.slice(atIndex)
        : '***'
    }

    // Read alert activity from status.json
    let lastAlertSentAt: string | null = null
    let lastAlertLead: string | null = null
    let alertsToday = 0

    try {
      const statusPath = path.join(process.cwd(), 'tasks', 'status.json')
      const raw = await fs.readFile(statusPath, 'utf-8')
      const data = JSON.parse(raw)
      const today = new Date().toDateString()
      lastAlertSentAt = data.lastAlertSentAt ?? null
      lastAlertLead = data.lastAlertLead ?? null
      alertsToday = data.alertDate === today ? (data.alertsToday ?? 0) : 0
    } catch {
      // status.json may not exist yet
    }

    return NextResponse.json({ slack, email, teamEmail, lastAlertSentAt, lastAlertLead, alertsToday })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to read alert status: ${message}` }, { status: 500 })
  }
}
