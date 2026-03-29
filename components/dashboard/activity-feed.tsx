'use client'

import { motion } from 'motion/react'
import { MessageSquare, Phone, Flame, UserX, CheckCircle } from 'lucide-react'

interface Lead {
  name: string
  phone: string
  status: string
  aiCategory: string
  lastContact: string
  conversationLog: string
}

const statusConfig = (status: string, aiCategory: string) => {
  if (aiCategory === 'Hot Lead')    return { Icon: Flame,         color: 'text-orange-400', ring: 'ring-orange-400/20', bg: 'bg-orange-400/10',  label: 'Hot lead detected' }
  if (status === 'REPLIED')         return { Icon: MessageSquare, color: 'text-emerald-400', ring: 'ring-emerald-400/20', bg: 'bg-emerald-400/10', label: 'Lead replied' }
  if (status === 'CONTACTED')       return { Icon: Phone,         color: 'text-blue-400',   ring: 'ring-blue-400/20',   bg: 'bg-blue-400/10',    label: 'Outreach sent' }
  if (status === 'UNRESPONSIVE')    return { Icon: UserX,         color: 'text-amber-400',  ring: 'ring-amber-400/20',  bg: 'bg-amber-400/10',   label: 'Marked unresponsive' }
  return                                   { Icon: CheckCircle,   color: 'text-slate-400',  ring: 'ring-slate-400/20',  bg: 'bg-slate-400/10',   label: 'Added to pipeline' }
}

function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function ActivityFeed({ leads }: { leads: Lead[] }) {
  const active = leads
    .filter((l) => l.lastContact)
    .sort((a, b) => new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime())
    .slice(0, 20)

  if (!active.length) {
    return (
      <div className="flex h-24 items-center justify-center">
        <p className="text-sm text-white/20">No activity yet — run your first outreach campaign</p>
      </div>
    )
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical timeline line */}
      <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none" />

      {active.map((lead, i) => {
        const { Icon, color, ring, bg, label } = statusConfig(lead.status, lead.aiCategory)
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ x: 3, transition: { duration: 0.15 } }}
            className="relative flex items-start gap-4 py-2.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors group cursor-default"
          >
            {/* Icon node on timeline */}
            <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg} ring-1 ${ring} mt-0.5`}>
              <Icon className={`h-3.5 w-3.5 ${color}`} />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-medium text-white/80 truncate group-hover:text-white transition-colors">
                {lead.name || lead.phone}
              </p>
              <p className={`text-xs ${color} opacity-70`}>{label}</p>
            </div>

            <span className="text-xs text-white/20 shrink-0 pt-0.5 group-hover:text-white/40 transition-colors">
              {timeAgo(lead.lastContact)}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
