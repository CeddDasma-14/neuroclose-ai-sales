'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

interface PipelineItem {
  name: string
  value: number
  fill: string
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 border border-white/10">
        <p className="text-xs text-white/50 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-white">{payload[0].value} leads</p>
      </div>
    )
  }
  return null
}

export function PipelineChart({ data }: { data: PipelineItem[] }) {
  if (!data.length || data.every((d) => d.value === 0)) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm text-white/20">No lead data yet</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="barGrad-blue"    x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.3} />
          </linearGradient>
          <linearGradient id="barGrad-emerald" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0.3} />
          </linearGradient>
          <linearGradient id="barGrad-violet"  x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.3} />
          </linearGradient>
          <linearGradient id="barGrad-amber"   x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.3} />
          </linearGradient>
          <linearGradient id="barGrad-rose"    x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#fb7185" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
          {data.map((entry, index) => {
            const gradMap: Record<string, string> = {
              '#60a5fa': 'url(#barGrad-blue)',
              '#34d399': 'url(#barGrad-emerald)',
              '#a78bfa': 'url(#barGrad-violet)',
              '#fbbf24': 'url(#barGrad-amber)',
              '#fb7185': 'url(#barGrad-rose)',
            }
            return <Cell key={index} fill={gradMap[entry.fill] ?? entry.fill} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
