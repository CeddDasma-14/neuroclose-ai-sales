import { NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import path from 'path'

export async function GET() {
  noStore()

  try {
    const fs = await import('fs/promises')
    const statusPath = path.join(process.cwd(), 'tasks', 'status.json')

    let data: {
      running?: boolean
      lastRun?: string | null
      nextRun?: string | null
    } = {}

    try {
      const raw = await fs.readFile(statusPath, 'utf-8')
      data = JSON.parse(raw)
    } catch {
      // File doesn't exist — return safe defaults
      return NextResponse.json({ running: false, lastRun: null, nextRun: null })
    }

    return NextResponse.json({
      running: data.running === true,
      lastRun: data.lastRun ?? null,
      nextRun: data.nextRun ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to read campaign status: ${message}` },
      { status: 500 }
    )
  }
}
