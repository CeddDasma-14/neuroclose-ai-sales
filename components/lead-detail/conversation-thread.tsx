import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Message {
  role: 'inbound' | 'outbound'
  content: string
  timestamp: string
}

function parseConversationLog(raw: string): Message[] {
  if (!raw || !raw.trim()) return []

  const lines = raw.split('\n').filter((l) => l.trim())
  const messages: Message[] = []

  for (const line of lines) {
    // Format: 2024-01-01T12:00:00.000Z [YOU]: message
    // or:     2024-01-01T12:00:00.000Z [LEAD]: message
    const match = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+\[(YOU|LEAD)\]:\s*(.*)$/)
    if (match) {
      messages.push({
        role: match[2] === 'YOU' ? 'outbound' : 'inbound',
        content: match[3],
        timestamp: match[1],
      })
      continue
    }

    // Fallback: no timestamp, just [YOU]: or [LEAD]:
    const fallback = line.match(/^\[(YOU|LEAD)\]:\s*(.*)$/)
    if (fallback) {
      messages.push({
        role: fallback[1] === 'YOU' ? 'outbound' : 'inbound',
        content: fallback[2],
        timestamp: '',
      })
    }
  }

  return messages
}

function formatTime(iso: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

interface Props {
  conversationLog: string
}

export function ConversationThread({ conversationLog }: Props) {
  const messages = parseConversationLog(conversationLog)

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Conversation Thread</CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="text-2xl mb-2">💬</div>
            <p className="text-slate-400 text-sm">No messages yet.</p>
            <p className="text-slate-600 text-xs mt-1">Messages will appear here once the workflow runs.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] space-y-1`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'outbound'
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-slate-700 text-slate-100 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.timestamp && (
                    <p className={`text-xs text-slate-500 ${msg.role === 'outbound' ? 'text-right' : 'text-left'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
