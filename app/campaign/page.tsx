'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Mail, MessageSquare, Clock, Zap } from 'lucide-react'

const WHATSAPP_ICON = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-emerald-400" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

interface CampaignStatus {
  running: boolean
  lastRun: string | null
  nextRun: string | null
}

interface RunResult {
  success: boolean
  message: string
  sent?: number
  failed?: number
}

type RunState = 'idle' | 'loading' | 'success' | 'error'

function formatDate(iso: string | null): string {
  if (!iso) return 'Never'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return 'Unknown'
  }
}

export default function CampaignPage() {
  // SMS outreach state
  const [batchSize, setBatchSize] = useState<string>('10')
  const [delayMs, setDelayMs] = useState<string>('1000')
  const [runState, setRunState] = useState<RunState>('idle')
  const [runResult, setRunResult] = useState<RunResult | null>(null)

  // WhatsApp outreach state
  const [waRunState, setWaRunState] = useState<RunState>('idle')
  const [waRunResult, setWaRunResult] = useState<RunResult | null>(null)

  // Email outreach state
  const [emailRunState, setEmailRunState] = useState<RunState>('idle')
  const [emailRunResult, setEmailRunResult] = useState<RunResult | null>(null)

  // Follow-up engine status state
  const [status, setStatus] = useState<CampaignStatus | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/campaign/status')
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await res.json()
      setStatus(data)
      setStatusError(null)
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to load status')
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  async function handleRunCampaign() {
    setRunState('loading')
    setRunResult(null)

    const batch = Math.min(50, Math.max(1, parseInt(batchSize, 10) || 10))
    const delay = Math.max(500, parseInt(delayMs, 10) || 1000)

    try {
      const res = await fetch('/api/campaign/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: batch, delayMs: delay }),
      })
      const data: RunResult = await res.json()
      setRunResult(data)
      setRunState(data.success ? 'success' : 'error')
      // Refresh status after a run
      fetchStatus()
    } catch (err) {
      setRunResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network error — could not reach server',
      })
      setRunState('error')
    }
  }

  async function handleWhatsAppCampaign() {
    setWaRunState('loading')
    setWaRunResult(null)
    const batch = Math.min(50, Math.max(1, parseInt(batchSize, 10) || 10))
    const delay = Math.max(500, parseInt(delayMs, 10) || 1000)
    try {
      const res = await fetch('/api/campaign/whatsapp-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: batch, delayMs: delay }),
      })
      const data: RunResult = await res.json()
      setWaRunResult(data)
      setWaRunState(data.success ? 'success' : 'error')
      fetchStatus()
    } catch (err) {
      setWaRunResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network error',
      })
      setWaRunState('error')
    }
  }

  async function handleEmailCampaign() {
    setEmailRunState('loading')
    setEmailRunResult(null)
    const batch = Math.min(50, Math.max(1, parseInt(batchSize, 10) || 10))
    const delay = Math.max(500, parseInt(delayMs, 10) || 1000)
    try {
      const res = await fetch('/api/campaign/email-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: batch, delayMs: delay }),
      })
      const data: RunResult = await res.json()
      setEmailRunResult(data)
      setEmailRunState(data.success ? 'success' : 'error')
      fetchStatus()
    } catch (err) {
      setEmailRunResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network error',
      })
      setEmailRunState('error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">

        {/* SMS Outreach Runner */}
        <div className="glass rounded-xl p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-400/10 ring-1 ring-blue-400/20">
                <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-white">SMS Outreach</p>
            </div>
            <p className="text-xs text-white/30">Send personalized SMS via Twilio to all pending leads</p>
          </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="batchSize" className="text-xs text-muted-foreground">
                  Batch size (max 50)
                </Label>
                <Input
                  id="batchSize"
                  type="number"
                  min={1}
                  max={50}
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  disabled={runState === 'loading'}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="delayMs" className="text-xs text-muted-foreground">
                  Delay between messages (ms)
                </Label>
                <Input
                  id="delayMs"
                  type="number"
                  min={500}
                  value={delayMs}
                  onChange={(e) => setDelayMs(e.target.value)}
                  disabled={runState === 'loading'}
                  className="h-9"
                />
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleRunCampaign}
              disabled={runState === 'loading'}
            >
              {runState === 'loading' ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Sending messages...
                </span>
              ) : (
                'Run Outreach Campaign'
              )}
            </Button>

            {runState === 'success' && runResult && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                <p className="font-medium">Campaign complete</p>
                <p className="text-xs text-emerald-400/80 mt-0.5">{runResult.message}</p>
                {(runResult.sent !== undefined || runResult.failed !== undefined) && (
                  <div className="mt-2 flex gap-4 text-xs">
                    {runResult.sent !== undefined && (
                      <span className="text-emerald-300">{runResult.sent} sent</span>
                    )}
                    {runResult.failed !== undefined && runResult.failed > 0 && (
                      <span className="text-red-400">{runResult.failed} failed</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {runState === 'error' && runResult && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-red-400">
                <p className="font-medium">Campaign failed</p>
                <p className="text-xs text-red-400/80 mt-0.5">{runResult.message}</p>
              </div>
            )}
        </div>

        {/* WhatsApp Outreach Runner */}
        <div className="glass rounded-xl p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10 ring-1 ring-emerald-400/20">
                <WHATSAPP_ICON />
              </div>
              <p className="text-sm font-semibold text-white">WhatsApp Outreach</p>
            </div>
            <p className="text-xs text-white/30">Send personalized WhatsApp messages via Twilio sandbox to pending leads</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Uses the same batch size and delay as SMS outreach above.
          </p>
          <Button
            size="lg"
            className="w-full"
            variant="outline"
            onClick={handleWhatsAppCampaign}
            disabled={waRunState === 'loading'}
          >
            {waRunState === 'loading' ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Sending messages...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <WHATSAPP_ICON />
                Run WhatsApp Campaign
              </span>
            )}
          </Button>

          {waRunState === 'success' && waRunResult && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              <p className="font-medium">WhatsApp campaign complete</p>
              <p className="text-xs text-emerald-400/80 mt-0.5">{waRunResult.message}</p>
              {(waRunResult.sent !== undefined || waRunResult.failed !== undefined) && (
                <div className="mt-2 flex gap-4 text-xs">
                  {waRunResult.sent !== undefined && (
                    <span className="text-emerald-300">{waRunResult.sent} sent</span>
                  )}
                  {waRunResult.failed !== undefined && waRunResult.failed > 0 && (
                    <span className="text-red-400">{waRunResult.failed} failed</span>
                  )}
                </div>
              )}
            </div>
          )}
          {waRunState === 'error' && waRunResult && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-red-400">
              <p className="font-medium">WhatsApp campaign failed</p>
              <p className="text-xs text-red-400/80 mt-0.5">{waRunResult.message}</p>
            </div>
          )}
        </div>

        {/* Email Outreach Runner */}
        <div className="glass rounded-xl p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10 ring-1 ring-emerald-400/20">
                <Mail className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-white">Email Outreach</p>
            </div>
            <p className="text-xs text-white/30">Send personalized emails via SendGrid to leads with an email address (column L)</p>
          </div>
            <p className="text-xs text-muted-foreground">
              Uses the same batch size and delay as SMS outreach above.
            </p>
            <Button
              size="lg"
              className="w-full"
              variant="outline"
              onClick={handleEmailCampaign}
              disabled={emailRunState === 'loading'}
            >
              {emailRunState === 'loading' ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Sending emails...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Run Email Campaign
                </span>
              )}
            </Button>

            {emailRunState === 'success' && emailRunResult && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                <p className="font-medium">Email campaign complete</p>
                <p className="text-xs text-emerald-400/80 mt-0.5">{emailRunResult.message}</p>
              </div>
            )}
            {emailRunState === 'error' && emailRunResult && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-red-400">
                <p className="font-medium">Email campaign failed</p>
                <p className="text-xs text-red-400/80 mt-0.5">{emailRunResult.message}</p>
              </div>
            )}
        </div>

        {/* Follow-Up Engine Status */}
        <div className="glass rounded-xl p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-400/10 ring-1 ring-violet-400/20">
                <Zap className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-white">Follow-Up Engine</p>
            </div>
            <p className="text-xs text-white/30">Automated re-engagement scheduler status</p>
          </div>
            {statusError ? (
              <p className="text-sm text-red-400">{statusError}</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      status?.running ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}
                  />
                  <Badge
                    variant="outline"
                    className={
                      status?.running
                        ? 'border-emerald-500/40 text-emerald-400'
                        : 'border-slate-500/40 text-slate-400'
                    }
                  >
                    {status?.running ? 'Running' : 'Paused'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-white/30 flex items-center gap-1.5"><Clock className="h-3 w-3" />Last run</span>
                    <span className="text-white/60 tabular-nums text-xs">{formatDate(status?.lastRun ?? null)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/30 flex items-center gap-1.5"><Clock className="h-3 w-3" />Next run</span>
                    <span className="text-white/60 tabular-nums text-xs">{formatDate(status?.nextRun ?? null)}</span>
                  </div>
                </div>
              </>
            )}
        </div>
      </div>

      {/* Info Card */}
      <div className="glass rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">How the workflows work</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-sm text-white/40">
            <div className="space-y-1.5">
              <p className="font-medium text-white/70">Outreach Campaign</p>
              <p>
                Reads all <span className="text-white/60 font-medium">Pending</span> leads from your Google
                Sheet, generates a personalized opening SMS using Claude AI, and sends it via
                Twilio. Each lead is marked as <span className="text-white/60 font-medium">Contacted</span>{' '}
                after a successful send. You control the batch size and delay to stay within Twilio
                rate limits.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="font-medium text-white/70">Follow-Up Engine</p>
              <p>
                Automatically re-engages leads who haven&apos;t replied. It runs on a schedule and
                sends follow-up messages at{' '}
                <span className="text-white/60 font-medium">1 day, 3 days, and 7 days</span> after initial
                contact. Leads who reply are classified by AI and routed accordingly. Opted-out
                leads are never contacted again.
              </p>
            </div>
          </div>
      </div>
    </div>
  )
}
