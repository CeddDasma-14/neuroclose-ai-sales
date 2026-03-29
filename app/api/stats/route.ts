import { NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export async function GET() {
  noStore()

  try {
    const sheetsPath = path.join(process.cwd(), 'src', 'services', 'sheets.js')
    const { getLeads, STATUS } = require(sheetsPath)

    const leads = await getLeads()

    const total = leads.length
    const contacted = leads.filter((l: { status: string }) => l.status !== STATUS.PENDING).length
    const replied = leads.filter((l: { status: string }) => l.status === STATUS.REPLIED).length
    const hotLeads = leads.filter((l: { aiCategory: string }) => l.aiCategory === 'Hot Lead').length
    const unresponsive = leads.filter((l: { status: string }) => l.status === STATUS.UNRESPONSIVE).length
    const optedOut = leads.filter((l: { status: string }) => l.status === STATUS.OPTED_OUT).length
    const conversionRate = contacted > 0 ? Math.round((replied / contacted) * 100) : 0

    const pipeline = [
      { name: 'Pending', value: leads.filter((l: { status: string }) => l.status === STATUS.PENDING).length, fill: '#475569' },
      { name: 'Contacted', value: leads.filter((l: { status: string }) => l.status === STATUS.CONTACTED).length, fill: '#3b82f6' },
      { name: 'Replied', value: replied, fill: '#10b981' },
      { name: 'Unresponsive', value: unresponsive, fill: '#f59e0b' },
      { name: 'Opted Out', value: optedOut, fill: '#ef4444' },
    ]

    const categoryColors: Record<string, string> = {
      'Hot Lead': '#f97316', 'Neutral': '#64748b', 'Not Interested': '#ef4444',
      'Objection': '#eab308', 'Complaint': '#f43f5e', 'Positive': '#22c55e',
    }
    const aiBreakdown = ['Hot Lead', 'Neutral', 'Not Interested', 'Objection', 'Complaint', 'Positive']
      .map((cat) => ({
        name: cat,
        value: leads.filter((l: { aiCategory: string }) => l.aiCategory === cat).length,
        fill: categoryColors[cat],
      }))
      .filter((c) => c.value > 0)

    return NextResponse.json({
      stats: { total, contacted, replied, hotLeads, conversionRate },
      pipeline,
      aiBreakdown,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to load stats: ${message}` }, { status: 500 })
  }
}
