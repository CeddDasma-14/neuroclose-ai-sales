'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Settings,
  Zap,
  Brain,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/campaign', label: 'Campaign', icon: Megaphone },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-white/[0.06] bg-[#050d1a]"
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-5">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-lg shadow-emerald-500/25">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-sm font-bold leading-none text-white tracking-tight">NeuralClose</span>
          <span className="text-[10px] text-white/35 mt-0.5 leading-none">AI Sales Engine</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">Navigation</p>
        {navItems.map(({ href, label, icon: Icon }, i) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-white/40 hover:bg-white/[0.04] hover:text-white/80'
                )}
              >
                {/* Active left bar */}
                {isActive && (
                  <motion.span
                    layoutId="active-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-emerald-400"
                  />
                )}
                <Icon className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-emerald-400' : 'text-white/30 group-hover:text-white/60'
                )} />
                {label}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* AI Status Footer */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3 rounded-lg bg-emerald-500/5 border border-emerald-500/25 px-3 py-2.5" style={{boxShadow: '0 0 12px rgba(52,211,153,0.15), inset 0 0 12px rgba(52,211,153,0.04)'}}>
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="animate-glow-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-emerald-400 leading-none">System Active</p>
            <p className="text-[10px] text-white/25 mt-0.5">AI engine running</p>
          </div>
          <Brain className="h-3.5 w-3.5 text-emerald-400/40 shrink-0" />
        </div>
      </div>
    </motion.aside>
  )
}
