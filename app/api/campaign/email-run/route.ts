import { NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import path from 'path'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(request: Request) {
  noStore()

  // Rate limit: 3 campaign runs per 10 minutes per IP
  const ip = getClientIp(request)
  if (!checkRateLimit(`campaign-email:${ip}`, 3, 10 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please wait before running another campaign.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const rawBatch = body?.batchSize
    const rawDelay = body?.delayMs

    const batchSize = typeof rawBatch === 'number'
      ? Math.min(50, Math.max(1, Math.floor(rawBatch)))
      : 10
    const delayMs = typeof rawDelay === 'number'
      ? Math.max(500, Math.floor(rawDelay))
      : 1000

    const emailOutreachPath = path.join(process.cwd(), 'src', 'workflows', 'emailOutreach.js')
    const configPath = path.join(process.cwd(), 'src', 'config', 'index.js')

    // eslint-disable-next-line no-eval
    const nativeRequire: NodeRequire = eval('require')
    const { runEmailOutreach } = nativeRequire(emailOutreachPath)
    const { config } = nativeRequire(configPath)

    const prevBatch = config.outreach.batchSize
    const prevDelay = config.outreach.delayMs
    config.outreach.batchSize = batchSize
    config.outreach.delayMs = delayMs

    let sent = 0
    let failed = 0

    try {
      const result = await runEmailOutreach()
      if (result && typeof result === 'object') {
        sent = result.sent ?? 0
        failed = result.failed ?? 0
      }
    } finally {
      config.outreach.batchSize = prevBatch
      config.outreach.delayMs = prevDelay
    }

    const fs = await import('fs/promises')
    const statusPath = path.join(process.cwd(), 'tasks', 'status.json')
    let existing: Record<string, unknown> = {}
    try {
      const raw = await fs.readFile(statusPath, 'utf-8')
      existing = JSON.parse(raw)
    } catch { /* file may not exist yet */ }

    await fs.writeFile(
      statusPath,
      JSON.stringify({ ...existing, lastEmailRun: new Date().toISOString() }, null, 2),
      'utf-8'
    )

    return NextResponse.json({
      success: true,
      message: `Email outreach complete. ${sent} sent, ${failed} failed.`,
      sent,
      failed,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { success: false, message: `Email campaign failed: ${message}` },
      { status: 500 }
    )
  }
}
