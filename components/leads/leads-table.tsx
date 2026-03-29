'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'

interface Lead {
  name: string
  phone: string
  email: string
  status: string
  aiCategory: string
  motivationScore: number
  lastContact: string
  notes: string
  conversationHistory: string
}

interface LeadsTableProps {
  leads: Lead[]
}

function getStatusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'PENDING':      return 'pending'
    case 'CONTACTED':    return 'contacted'
    case 'REPLIED':      return 'replied'
    case 'UNRESPONSIVE': return 'unresponsive'
    case 'OPTED_OUT':    return 'opted_out'
    default:             return 'secondary'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':      return 'Pending'
    case 'CONTACTED':    return 'Contacted'
    case 'REPLIED':      return 'Replied'
    case 'UNRESPONSIVE': return 'Unresponsive'
    case 'OPTED_OUT':    return 'Opted Out'
    default:             return status
  }
}

function getCategoryVariant(category: string): BadgeProps['variant'] {
  switch (category) {
    case 'Hot Lead':      return 'hot_lead'
    case 'Neutral':       return 'neutral'
    case 'Not Interested': return 'not_interested'
    case 'Objection':     return 'objection'
    case 'Complaint':     return 'complaint'
    case 'Positive':      return 'positive'
    default:              return 'secondary'
  }
}

function getMotivationColor(score: number): string {
  if (score >= 8) return 'bg-emerald-500'
  if (score >= 5) return 'bg-amber-500'
  return 'bg-red-500'
}

function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '—'
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1)   return 'Just now'
    if (diffMins < 60)  return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 30)  return `${diffDays} days ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
  } catch {
    return '—'
  }
}

export function LeadsTable({ leads }: LeadsTableProps) {
  const router = useRouter()

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-20">
          <p className="text-sm text-muted-foreground text-center">
            No leads yet. Add leads to your Google Sheet to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">All Leads</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">AI Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Motivation</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Last Contact</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.phone}
                  onClick={() => router.push(`/leads/${encodeURIComponent(lead.phone)}`)}
                  className="border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-secondary/40"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{lead.name || '—'}</div>
                    <div className="text-xs text-muted-foreground">{lead.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{lead.email || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusVariant(lead.status)}>
                      {getStatusLabel(lead.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {lead.aiCategory ? (
                      <Badge variant={getCategoryVariant(lead.aiCategory)}>
                        {lead.aiCategory}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getMotivationColor(lead.motivationScore ?? 0)}`}
                          style={{ width: `${((lead.motivationScore ?? 0) / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-4 shrink-0">
                        {lead.motivationScore ?? 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeDate(lead.lastContact)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
