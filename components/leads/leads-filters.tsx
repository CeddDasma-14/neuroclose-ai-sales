'use client'

import { useState, useMemo } from 'react'
import { LeadsTable } from './leads-table'

interface Lead {
  name: string
  phone: string
  status: string
  aiCategory: string
  motivationScore: number
  lastContact: string
  notes: string
  conversationHistory: string
}

interface LeadsFiltersProps {
  leads: Lead[]
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'REPLIED', label: 'Replied' },
  { value: 'UNRESPONSIVE', label: 'Unresponsive' },
  { value: 'OPTED_OUT', label: 'Opted Out' },
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'Hot Lead', label: 'Hot Lead' },
  { value: 'Neutral', label: 'Neutral' },
  { value: 'Not Interested', label: 'Not Interested' },
  { value: 'Objection', label: 'Objection' },
  { value: 'Complaint', label: 'Complaint' },
  { value: 'Positive', label: 'Positive' },
]

export function LeadsFilters({ leads }: LeadsFiltersProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const searchLower = search.toLowerCase()
      const matchesSearch =
        !search ||
        lead.name.toLowerCase().includes(searchLower) ||
        lead.phone.includes(search)
      const matchesStatus = !status || lead.status === status
      const matchesCategory = !category || lead.aiCategory === category
      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [leads, search, status, category])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="text-xs text-muted-foreground">
          {filtered.length} of {leads.length} leads
        </span>
      </div>

      <LeadsTable leads={filtered} />
    </div>
  )
}
