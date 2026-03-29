import path from 'path'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { PipelineChart } from '@/components/dashboard/pipeline-chart'
import { CategoryChart } from '@/components/dashboard/category-chart'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { FadeUp } from '@/components/ui/fade-up'

async function getDashboardData() {
  try {
    // Call service directly — use eval('require') to bypass webpack bundling
    // eslint-disable-next-line no-eval
    const nativeRequire: NodeRequire = eval('require')
    const { getLeads, STATUS } = nativeRequire(path.join(process.cwd(), 'src/services/sheets.js'))
    const leads = await getLeads()

    const total = leads.length
    const contacted = leads.filter((l: { status: string }) => l.status !== STATUS.PENDING).length
    const replied = leads.filter((l: { status: string }) => l.status === STATUS.REPLIED).length
    const hotLeads = leads.filter((l: { aiCategory: string }) => l.aiCategory === 'Hot Lead').length
    const unresponsive = leads.filter((l: { status: string }) => l.status === STATUS.UNRESPONSIVE).length
    const optedOut = leads.filter((l: { status: string }) => l.status === STATUS.OPTED_OUT).length
    const conversionRate = contacted > 0 ? Math.round((replied / contacted) * 100) : 0

    const pending = leads.filter((l: { status: string }) => l.status === STATUS.PENDING).length
    const qualified = leads.filter((l: { status: string }) => l.status === STATUS.QUALIFIED).length

    const stats = { total, pending, contacted, replied, qualified, hotLeads, optedOut, conversionRate }

    const pipeline = [
      { name: 'Pending', value: leads.filter((l: { status: string }) => l.status === STATUS.PENDING).length, fill: '#475569' },
      { name: 'Contacted', value: leads.filter((l: { status: string }) => l.status === STATUS.CONTACTED).length, fill: '#60a5fa' },
      { name: 'Replied', value: replied, fill: '#34d399' },
      { name: 'Unresponsive', value: unresponsive, fill: '#fbbf24' },
      { name: 'Opted Out', value: optedOut, fill: '#fb7185' },
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
      .filter((c: { value: number }) => c.value > 0)

    const abLeads = leads.filter((l: { abVariant: string }) => l.abVariant === 'A' || l.abVariant === 'B')
    const abStats = {
      A: { sent: abLeads.filter((l: { abVariant: string }) => l.abVariant === 'A').length, replied: abLeads.filter((l: { abVariant: string; replyReceived: string }) => l.abVariant === 'A' && l.replyReceived === 'YES').length },
      B: { sent: abLeads.filter((l: { abVariant: string }) => l.abVariant === 'B').length, replied: abLeads.filter((l: { abVariant: string; replyReceived: string }) => l.abVariant === 'B' && l.replyReceived === 'YES').length },
    }

    return { stats, pipeline, aiBreakdown, leads, abStats, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return {
      stats: { total: 0, pending: 0, contacted: 0, replied: 0, qualified: 0, hotLeads: 0, optedOut: 0, conversionRate: 0 },
      pipeline: [],
      aiBreakdown: [],
      leads: [],
      abStats: { A: { sent: 0, replied: 0 }, B: { sent: 0, replied: 0 } },
      error: message,
    }
  }
}

export default async function DashboardPage() {
  const { stats, pipeline, aiBreakdown, leads, abStats, error } = await getDashboardData()

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-red-400">
          Could not connect to Google Sheets: {error}
        </div>
      )}

      <StatsCards stats={stats} />

      <FadeUp delay={0.15}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="glass rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Lead Pipeline</p>
            <PipelineChart data={pipeline} />
          </div>

          <div className="glass rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">AI Category Breakdown</p>
            <CategoryChart data={aiBreakdown} />
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.22}>
        <div className="glass rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">A/B Message Test</p>
          <div className="grid grid-cols-2 gap-4">
            {(['A', 'B'] as const).map((v) => {
              const { sent, replied } = abStats[v]
              const rate = sent > 0 ? Math.round((replied / sent) * 100) : 0
              const angle = v === 'A' ? 'Speed & Ease angle' : 'Curiosity & Value angle'
              return (
                <div key={v} className="rounded-lg bg-white/5 p-4">
                  <p className="text-sm font-bold text-white mb-1">Variant {v}</p>
                  <p className="text-xs text-white/40 mb-3">{angle}</p>
                  <div className="flex gap-6 text-sm">
                    <div><span className="text-white/40">Sent </span><span className="font-semibold text-white">{sent}</span></div>
                    <div><span className="text-white/40">Replied </span><span className="font-semibold text-emerald-400">{replied}</span></div>
                    <div><span className="text-white/40">Rate </span><span className="font-semibold text-violet-400">{rate}%</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={0.28}>
        <div className="glass rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Activity Feed</p>
          <ActivityFeed leads={leads} />
        </div>
      </FadeUp>
    </div>
  )
}
