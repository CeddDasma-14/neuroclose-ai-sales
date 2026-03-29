import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-slate-600 text-slate-100',
  CONTACTED: 'bg-blue-600 text-blue-100',
  REPLIED: 'bg-emerald-600 text-emerald-100',
  UNRESPONSIVE: 'bg-amber-600 text-amber-100',
  OPTED_OUT: 'bg-red-600 text-red-100',
}

interface Props {
  name: string
  phone: string
  status: string
  notes: string
}

export function LeadInfoCard({ name, phone, status, notes }: Props) {
  const statusClass = STATUS_COLORS[status] ?? 'bg-slate-600 text-slate-100'

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Link
            href="/leads"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Back to Leads
          </Link>
          <Badge className={statusClass}>{status}</Badge>
        </div>
        <CardTitle className="text-base mt-2">{name || 'Unknown'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-slate-500 text-xs uppercase tracking-wide w-14">Phone</span>
          <span className="font-mono">{phone}</span>
        </div>
        {notes && (
          <div className="flex gap-2">
            <span className="text-slate-500 text-xs uppercase tracking-wide w-14 shrink-0 pt-0.5">Notes</span>
            <span className="text-slate-300 leading-relaxed">{notes}</span>
          </div>
        )}
        {!notes && (
          <p className="text-slate-500 italic text-xs">No notes recorded.</p>
        )}
      </CardContent>
    </Card>
  )
}
