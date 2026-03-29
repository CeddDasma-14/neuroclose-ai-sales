import path from 'path'
import { LeadsFilters } from '@/components/leads/leads-filters'

async function getLeads() {
  try {
    // eslint-disable-next-line no-eval
    const nativeRequire: NodeRequire = eval('require')
    const { getLeads: fetchLeads } = nativeRequire(path.join(process.cwd(), 'src/services/sheets.js'))
    const leads = await fetchLeads()
    return { leads, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { leads: [], error: message }
  }
}

export default async function LeadsPage() {
  const { leads, error } = await getLeads()

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-red-400">
          Could not load leads: {error}
        </div>
      )}

      <LeadsFilters leads={leads} />
    </div>
  )
}
