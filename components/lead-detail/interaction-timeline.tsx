import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatDate(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

interface TimelineEvent {
  label: string
  value: string
  dotColor: string
}

interface Props {
  lastContact: string
  lastReply: string
  replyReceived: string
  followUpSent: string
  status: string
}

export function InteractionTimeline({ lastContact, lastReply, replyReceived, followUpSent, status }: Props) {
  const events: TimelineEvent[] = []

  if (lastContact) {
    events.push({
      label: 'First / Last Contacted',
      value: formatDate(lastContact),
      dotColor: 'bg-blue-500',
    })
  }

  if (followUpSent === 'YES') {
    events.push({
      label: 'Follow-up Sent',
      value: lastContact ? formatDate(lastContact) : 'Yes',
      dotColor: 'bg-amber-500',
    })
  }

  if (replyReceived === 'YES' && lastReply) {
    events.push({
      label: 'Reply Received',
      value: formatDate(lastReply),
      dotColor: 'bg-emerald-500',
    })
  }

  const statusEventMap: Record<string, { label: string; color: string }> = {
    REPLIED:      { label: 'Status: Replied',      color: 'bg-emerald-500' },
    CONTACTED:    { label: 'Status: Contacted',    color: 'bg-blue-500' },
    UNRESPONSIVE: { label: 'Status: Unresponsive', color: 'bg-amber-500' },
    OPTED_OUT:    { label: 'Status: Opted Out',    color: 'bg-red-500' },
    PENDING:      { label: 'Status: Pending',      color: 'bg-slate-500' },
  }

  const statusEvent = statusEventMap[status]
  if (statusEvent) {
    events.push({
      label: statusEvent.label,
      value: 'Current',
      dotColor: statusEvent.color,
    })
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Interaction Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No interactions recorded yet.</p>
        ) : (
          <ol className="relative border-l border-slate-700 ml-2 space-y-4 py-1">
            {events.map((event, i) => (
              <li key={i} className="ml-4">
                <span
                  className={`absolute -left-1.5 mt-1 h-3 w-3 rounded-full border border-slate-900 ${event.dotColor}`}
                />
                <p className="text-xs text-slate-400">{event.label}</p>
                <p className="text-sm text-slate-200 font-medium">{event.value}</p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
