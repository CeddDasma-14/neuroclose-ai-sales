import { NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export async function GET(
  _req: Request,
  { params }: { params: { phone: string } }
) {
  noStore()

  // Validate phone param — E.164 format only
  const rawPhone = typeof params.phone === 'string' ? params.phone : ''
  if (!/^\+?[1-9]\d{6,14}$/.test(rawPhone)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  try {
    const sheetsPath = path.join(process.cwd(), 'src', 'services', 'sheets.js')
    const { getLeads } = require(sheetsPath)

    const leads = await getLeads()
    const lead = leads.find(
      (l: { phone: string }) => l.phone === rawPhone
    )

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json({ lead })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to load lead: ${message}` },
      { status: 500 }
    )
  }
}
