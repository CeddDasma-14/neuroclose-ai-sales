'use client'

import { motion } from 'motion/react'
import { Clock, MessageSquare, MessageCircle, CheckCircle2, XCircle, Flame } from 'lucide-react'

interface Stats {
  total: number
  pending: number
  contacted: number
  replied: number
  qualified: number
  hotLeads: number
  optedOut: number
  conversionRate: number
}

interface StatsCardsProps {
  stats?: Stats
  isLoading?: boolean
}

const cardConfig = [
  {
    key: 'pending' as const,
    label: 'Pending',
    icon: Clock,
    color: 'text-slate-400',
    iconBg: 'bg-slate-400/10 ring-1 ring-slate-400/20',
    glow: 'glow-slate hover:glow-blue',
    accent: 'from-slate-400/15 to-transparent',
    bar: 'bg-slate-400',
  },
  {
    key: 'contacted' as const,
    label: 'Contacted',
    icon: MessageSquare,
    color: 'text-blue-400',
    iconBg: 'bg-blue-400/10 ring-1 ring-blue-400/20',
    glow: 'glow-blue hover:glow-blue',
    accent: 'from-blue-400/15 to-transparent',
    bar: 'bg-blue-400',
  },
  {
    key: 'replied' as const,
    label: 'Replied',
    icon: MessageCircle,
    color: 'text-emerald-400',
    iconBg: 'bg-emerald-400/10 ring-1 ring-emerald-400/20',
    glow: 'glow-emerald hover:glow-emerald',
    accent: 'from-emerald-400/15 to-transparent',
    bar: 'bg-emerald-400',
  },
  {
    key: 'qualified' as const,
    label: 'Qualified',
    icon: CheckCircle2,
    color: 'text-violet-400',
    iconBg: 'bg-violet-400/10 ring-1 ring-violet-400/20',
    glow: 'glow-violet hover:glow-violet',
    accent: 'from-violet-400/15 to-transparent',
    bar: 'bg-violet-400',
  },
  {
    key: 'hotLeads' as const,
    label: 'Hot Leads',
    icon: Flame,
    color: 'text-orange-400',
    iconBg: 'bg-orange-400/10 ring-1 ring-orange-400/20',
    glow: 'glow-orange hover:glow-orange',
    accent: 'from-orange-400/15 to-transparent',
    bar: 'bg-orange-400',
  },
  {
    key: 'optedOut' as const,
    label: 'Opted Out',
    icon: XCircle,
    color: 'text-pink-400',
    iconBg: 'bg-pink-400/10 ring-1 ring-pink-400/20',
    glow: 'glow-pink hover:glow-pink',
    accent: 'from-pink-400/15 to-transparent',
    bar: 'bg-pink-400',
  },
]

function SkeletonCard() {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
        <div className="h-9 w-9 animate-pulse rounded-lg bg-white/5" />
      </div>
      <div className="h-9 w-16 animate-pulse rounded-lg bg-white/5" />
    </div>
  )
}

export function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {cardConfig.map(({ key }) => <SkeletonCard key={key} />)}
      </div>
    )
  }

  const safeStats: Stats = stats ?? {
    total: 0, pending: 0, contacted: 0, replied: 0, qualified: 0, hotLeads: 0, optedOut: 0, conversionRate: 0,
  }

  return (
    <motion.div
      className="grid grid-cols-2 gap-4 lg:grid-cols-6"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
    >
      {cardConfig.map(({ key, label, icon: Icon, color, iconBg, glow, accent, bar }) => (
        <motion.div
          key={key}
          variants={{
            hidden: { opacity: 0, y: 18, scale: 0.97 },
            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
          }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className={`relative overflow-hidden glass rounded-xl p-5 transition-shadow duration-300 cursor-default ${glow}`}
        >
          {/* Colored left accent bar */}
          <div className={`absolute left-0 top-0 h-full w-[3px] ${bar} opacity-70 rounded-l-xl`} />
          <div className={`absolute -top-4 -right-4 h-20 w-20 rounded-full bg-gradient-radial ${accent} blur-xl opacity-60 pointer-events-none`} />

          <div className="relative flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">{label}</p>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg} shrink-0`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
          </div>

          <div className="relative">
            <p className={`font-display text-3xl font-bold tracking-tight ${color}`}>
              {safeStats[key]}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
