import path from 'path'
import Link from 'next/link'
import { LeadInfoCard } from '@/components/lead-detail/lead-info-card'
import { AiAnalysisCard } from '@/components/lead-detail/ai-analysis-card'
import { ConversationThread } from '@/components/lead-detail/conversation-thread'
import { InteractionTimeline } from '@/components/lead-detail/interaction-timeline'

async function getLead(phone: string) {
  try {
    // eslint-disable-next-line no-eval
    const nativeRequire: NodeRequire = eval('require')
    const { findLeadByPhone } = nativeRequire(path.join(process.cwd(), 'src/services/sheets.js'))
    const lead = await findLeadByPhone(phone)
    return { lead: lead ?? null, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { lead: null, error: message }
  }
}

export default async function LeadDetailPage({
  params,
}: {
  params: { phone: string }
}) {
  const phone = decodeURIComponent(params.phone)
  const { lead, error } = await getLead(phone)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
        <p className="text-red-400 text-sm">Failed to load lead: {error}</p>
        <Link href="/leads" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
          ← Back to Leads
        </Link>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
        <p className="text-2xl font-semibold text-slate-300">Lead not found</p>
        <p className="text-slate-500 text-sm">No lead matches phone number: {phone}</p>
        <Link href="/leads" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
          ← Back to Leads
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          <LeadInfoCard
            name={lead.name}
            phone={lead.phone}
            status={lead.status}
            notes={lead.notes}
          />
          <AiAnalysisCard
            aiCategory={lead.aiCategory}
            motivationScore={lead.motivationScore}
            notes={lead.notes}
          />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <ConversationThread conversationLog={lead.conversationLog} />
          <InteractionTimeline
            lastContact={lead.lastContact}
            lastReply={lead.lastReply}
            replyReceived={lead.replyReceived}
            followUpSent={lead.followUpSent}
            status={lead.status}
          />
        </div>
      </div>
    </div>
  )
}
