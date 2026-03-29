import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const CATEGORY_STYLES: Record<string, { badge: string; label: string }> = {
  'Hot Lead':       { badge: 'bg-orange-600 text-orange-100', label: 'Hot Lead' },
  'Neutral':        { badge: 'bg-slate-600 text-slate-100',   label: 'Neutral' },
  'Not Interested': { badge: 'bg-red-600 text-red-100',       label: 'Not Interested' },
  'Objection':      { badge: 'bg-yellow-600 text-yellow-100', label: 'Objection' },
  'Complaint':      { badge: 'bg-rose-600 text-rose-100',     label: 'Complaint' },
  'Positive':       { badge: 'bg-emerald-600 text-emerald-100', label: 'Positive' },
}

const URGENCY_MAP: Record<number, string> = {
  0: 'None', 1: 'Very Low', 2: 'Low', 3: 'Low', 4: 'Moderate',
  5: 'Moderate', 6: 'Medium', 7: 'High', 8: 'High', 9: 'Very High', 10: 'Critical',
}

interface Props {
  aiCategory: string
  motivationScore: string | number
  notes: string
  aiReasoning?: string
}

export function AiAnalysisCard({ aiCategory, motivationScore, notes, aiReasoning }: Props) {
  const score = Math.min(10, Math.max(0, Number(motivationScore) || 0))
  const pct = score * 10
  const style = CATEGORY_STYLES[aiCategory] ?? { badge: 'bg-slate-600 text-slate-100', label: aiCategory || 'Unknown' }
  const urgency = URGENCY_MAP[Math.round(score)] ?? 'Unknown'
  const reasoning = aiReasoning || notes || 'No reasoning recorded.'

  const barColor =
    score >= 8 ? 'bg-orange-500' :
    score >= 6 ? 'bg-yellow-500' :
    score >= 4 ? 'bg-blue-500' :
    'bg-slate-500'

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">AI Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Category badge */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs uppercase tracking-wide w-20">Category</span>
          <Badge className={style.badge}>{style.label || 'Unknown'}</Badge>
        </div>

        {/* Motivation score */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs uppercase tracking-wide">Motivation Score</span>
            <span className="text-2xl font-bold text-white">{score}<span className="text-sm text-slate-400">/10</span></span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Urgency */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs uppercase tracking-wide w-20">Urgency</span>
          <span className="text-slate-200">{urgency}</span>
        </div>

        {/* Reasoning */}
        <div className="space-y-1">
          <span className="text-slate-500 text-xs uppercase tracking-wide">Reasoning</span>
          <p className="text-slate-300 leading-relaxed text-xs">{reasoning}</p>
        </div>
      </CardContent>
    </Card>
  )
}
