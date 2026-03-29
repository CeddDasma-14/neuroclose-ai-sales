import { NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import path from 'path'

const SETTINGS_PATH = path.join(process.cwd(), 'tasks', 'settings.json')

interface Settings {
  businessName: string
  businessType: string
  businessContext: string
  batchSize: number
  delayMs: number
  slackWebhookUrl: string
  teamEmail: string
}

const DEFAULT_SETTINGS: Settings = {
  businessName: '',
  businessType: '',
  businessContext: '',
  batchSize: 10,
  delayMs: 1000,
  slackWebhookUrl: '',
  teamEmail: '',
}

async function readSettings(): Promise<Settings> {
  const fs = await import('fs/promises')
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf-8')
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export async function GET() {
  noStore()

  try {
    const settings = await readSettings()
    // Never expose the Slack webhook URL to the frontend — it's a sensitive credential
    const { slackWebhookUrl: _, ...safeSettings } = settings
    return NextResponse.json({ settings: safeSettings })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to load settings: ${message}` },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  noStore()

  try {
    const body = await request.json()

    // Sanitize and validate each field
    const sanitized: Settings = {
      businessName: String(body.businessName ?? '').trim().slice(0, 200),
      businessType: String(body.businessType ?? '').trim().slice(0, 200),
      businessContext: String(body.businessContext ?? '').trim().slice(0, 500),
      batchSize: Math.min(50, Math.max(1, Math.floor(Number(body.batchSize) || 10))),
      delayMs: Math.max(500, Math.floor(Number(body.delayMs) || 1000)),
      slackWebhookUrl: String(body.slackWebhookUrl ?? '').trim().slice(0, 500),
      teamEmail: String(body.teamEmail ?? '').trim().slice(0, 200),
    }

    // Basic email format check — only if a value was provided
    if (sanitized.teamEmail && !sanitized.teamEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid team email address' },
        { status: 400 }
      )
    }

    const fs = await import('fs/promises')
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(sanitized, null, 2), 'utf-8')

    return NextResponse.json({ success: true, settings: sanitized })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to save settings: ${message}` },
      { status: 500 }
    )
  }
}
