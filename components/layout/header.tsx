'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Bell, Sparkles } from 'lucide-react'

const pageTitles: Record<string, { title: string; description: string }> = {
  '/':          { title: 'Dashboard',  description: 'Overview of your sales automation' },
  '/leads':     { title: 'Leads',      description: 'All leads from your pipeline' },
  '/campaign':  { title: 'Campaign',   description: 'Manage outreach and follow-ups' },
  '/settings':  { title: 'Settings',   description: 'Configure your automation' },
}

export function Header() {
  const pathname = usePathname()
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
  }, [pathname])

  const baseRoute = '/' + (pathname.split('/')[1] || '')
  const meta = pageTitles[baseRoute] ?? pageTitles['/']

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#050d1a]/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-3">
        {/* AI indicator */}
        <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/8 border border-emerald-500/15 px-2 py-1">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">AI</span>
        </div>
        <div>
          <h1 className="font-display text-base font-semibold text-white leading-none">{meta.title}</h1>
          <p className="text-xs text-white/30 mt-0.5">{meta.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {lastUpdated && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/25">
            <span className="h-1 w-1 rounded-full bg-emerald-400/60" />
            <span>Updated {lastUpdated}</span>
          </div>
        )}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-[#050d1a]" />
        </button>
      </div>
    </header>
  )
}
