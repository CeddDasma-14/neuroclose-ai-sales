import { NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export async function GET() {
  noStore()

  try {
    const sheetsPath = path.join(process.cwd(), 'src', 'services', 'sheets.js')
    const { getLeads } = require(sheetsPath)

    const leads = await getLeads()
    return NextResponse.json({ leads })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to load leads: ${message}` }, { status: 500 })
  }
}
