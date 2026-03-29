'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Building2, Megaphone, Bell, Slack, Mail,
  CheckCircle, XCircle, Send, Loader2,
} from 'lucide-react'

interface Settings {
  businessName: string
  businessType: string
  businessContext: string
  batchSize: number
  delayMs: number
  slackWebhookUrl: string
  teamEmail: string
}

interface AlertStatus {
  slack: boolean
  email: boolean
  teamEmail: string | null
  lastAlertSentAt: string | null
  lastAlertLead: string | null
  alertsToday: number
}

const DEFAULTS: Settings = {
  businessName: '',
  businessType: '',
  businessContext: '',
  batchSize: 10,
  delayMs: 1000,
  slackWebhookUrl: '',
  teamEmail: '',
}

type SaveState = 'idle' | 'saving' | 'success' | 'error'
type TestState = 'idle' | 'sending' | 'success' | 'error'

function GlassCard({ icon: Icon, iconColor, iconBg, title, description, children }: {
  icon: React.ElementType
  iconColor: string
  iconBg: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
            <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
          </div>
          <p className="text-sm font-semibold text-white">{title}</p>
        </div>
        <p className="text-xs text-white/30">{description}</p>
      </div>
      {children}
    </div>
  )
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
      active
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        : 'bg-white/[0.04] border-white/[0.08] text-white/30'
    }`}>
      {active
        ? <CheckCircle className="h-3 w-3" />
        : <XCircle className="h-3 w-3" />
      }
      {label}
    </div>
  )
}

export default function SettingsPage() {
  const [form, setForm] = useState<Settings>(DEFAULTS)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [alertStatus, setAlertStatus] = useState<AlertStatus | null>(null)
  const [testState, setTestState] = useState<TestState>('idle')
  const [testMessage, setTestMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadAll() {
      try {
        const [settingsRes, statusRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/alerts/status'),
        ])
        if (settingsRes.ok) {
          const data = await settingsRes.json()
          if (data.settings) setForm(data.settings)
        }
        if (statusRes.ok) {
          const data = await statusRes.json()
          setAlertStatus(data)
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load')
      }
    }
    loadAll()
  }, [])

  function handleChange(field: keyof Settings, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (saveState === 'success') setSaveState('idle')
  }

  async function handleSave() {
    setSaveState('saving')
    setSaveError(null)
    const payload: Settings = {
      businessName: String(form.businessName).trim().slice(0, 200),
      businessType: String(form.businessType).trim().slice(0, 200),
      businessContext: String(form.businessContext).trim().slice(0, 500),
      batchSize: Math.min(50, Math.max(1, Math.floor(Number(form.batchSize) || 10))),
      delayMs: Math.max(500, Math.floor(Number(form.delayMs) || 1000)),
      slackWebhookUrl: String(form.slackWebhookUrl).trim().slice(0, 500),
      teamEmail: String(form.teamEmail).trim().slice(0, 200),
    }
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Status ${res.status}`)
      setForm(data.settings)
      setSaveState('success')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
      setSaveState('error')
    }
  }

  async function handleTestSlack() {
    setTestState('sending')
    setTestMessage(null)
    try {
      const res = await fetch('/api/alerts/test', { method: 'POST' })
      const data = await res.json()
      setTestMessage(data.message)
      setTestState(data.success ? 'success' : 'error')
    } catch {
      setTestMessage('Network error — could not reach server')
      setTestState('error')
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {loadError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Could not load settings: {loadError}
        </div>
      )}

      {/* Business Profile */}
      <GlassCard
        icon={Building2} iconColor="text-blue-400"
        iconBg="bg-blue-400/10 ring-1 ring-blue-400/20"
        title="Business Profile"
        description="Your company info used in AI-generated messages"
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="businessName" className="text-xs text-white/40">Business Name</Label>
            <Input id="businessName" value={form.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              placeholder="e.g. Acme Property Group" maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="businessType" className="text-xs text-white/40">Business Type</Label>
            <Input id="businessType" value={form.businessType}
              onChange={(e) => handleChange('businessType', e.target.value)}
              placeholder="e.g. Real Estate, HVAC, Solar" maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="businessContext" className="text-xs text-white/40">
              AI Context <span className="text-white/20">({String(form.businessContext).length}/500)</span>
            </Label>
            <Textarea id="businessContext" value={form.businessContext}
              onChange={(e) => handleChange('businessContext', e.target.value)}
              placeholder="What should the AI know? e.g. We buy houses fast, cash, as-is. Close in 7 days."
              maxLength={500} rows={4}
              className="bg-white/[0.04] border-white/[0.08] text-white/80 placeholder:text-white/20 focus-visible:ring-emerald-400/50 focus-visible:border-emerald-400/30 rounded-lg resize-none"
            />
            <p className="text-xs text-white/20">Changing AI Context requires restarting the server.</p>
          </div>
        </div>
      </GlassCard>

      {/* Campaign Settings */}
      <GlassCard
        icon={Megaphone} iconColor="text-violet-400"
        iconBg="bg-violet-400/10 ring-1 ring-violet-400/20"
        title="Campaign Settings"
        description="Default batch size and delay between messages"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="batchSize" className="text-xs text-white/40">Batch Size (1–50)</Label>
            <Input id="batchSize" type="number" min={1} max={50} value={form.batchSize}
              onChange={(e) => handleChange('batchSize', parseInt(e.target.value, 10) || 10)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delayMs" className="text-xs text-white/40">Message Delay (ms, min 500)</Label>
            <Input id="delayMs" type="number" min={500} value={form.delayMs}
              onChange={(e) => handleChange('delayMs', parseInt(e.target.value, 10) || 1000)} />
          </div>
        </div>
      </GlassCard>

      {/* Team Alerts */}
      <GlassCard
        icon={Bell} iconColor="text-orange-400"
        iconBg="bg-orange-400/10 ring-1 ring-orange-400/20"
        title="Team Alerts"
        description="Get notified the moment a hot lead is detected"
      >
        {/* Live connection status */}
        {alertStatus && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Slack className="h-3.5 w-3.5 text-white/30" />
                <span className="text-xs text-white/40">Slack</span>
                <StatusPill active={alertStatus.slack} label={alertStatus.slack ? 'Connected' : 'Not configured'} />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-white/30" />
                <span className="text-xs text-white/40">Email</span>
                <StatusPill active={alertStatus.email} label={alertStatus.email ? alertStatus.teamEmail ?? 'Configured' : 'Not configured'} />
              </div>
            </div>

            {/* Alert activity stats */}
            {alertStatus.slack && (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1">Alerts Today</p>
                  <p className={`text-xl font-bold ${alertStatus.alertsToday > 0 ? 'text-orange-400' : 'text-white/30'}`}>
                    {alertStatus.alertsToday}
                  </p>
                </div>
                <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1">Last Alert</p>
                  {alertStatus.lastAlertSentAt ? (
                    <>
                      <p className="text-xs font-medium text-white/60 truncate">{alertStatus.lastAlertLead}</p>
                      <p className="text-[10px] text-white/25 mt-0.5">
                        {new Date(alertStatus.lastAlertSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-white/20">No alerts yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="slackWebhookUrl" className="text-xs text-white/40">Slack Webhook URL</Label>
            <Input id="slackWebhookUrl" type="url" value={form.slackWebhookUrl}
              onChange={(e) => handleChange('slackWebhookUrl', e.target.value)}
              placeholder="https://hooks.slack.com/services/..." maxLength={500} />
            <p className="text-xs text-white/20">Set in .env as SLACK_WEBHOOK_URL — restart server after changing.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="teamEmail" className="text-xs text-white/40">Team Alert Email</Label>
            <Input id="teamEmail" type="email" value={form.teamEmail}
              onChange={(e) => handleChange('teamEmail', e.target.value)}
              placeholder="team@yourcompany.com" maxLength={200} />
          </div>
        </div>

        {/* Test Alert Button */}
        {alertStatus?.slack && (
          <div className="space-y-2">
            <button
              onClick={handleTestSlack}
              disabled={testState === 'sending'}
              className="flex items-center gap-2 rounded-lg border border-orange-400/20 bg-orange-400/8 px-4 py-2 text-xs font-medium text-orange-400 hover:bg-orange-400/15 hover:border-orange-400/30 transition-all disabled:opacity-50"
            >
              {testState === 'sending'
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending test...</>
                : <><Send className="h-3.5 w-3.5" /> Send Test Alert to Slack</>
              }
            </button>
            {testMessage && (
              <p className={`text-xs ${testState === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {testMessage}
              </p>
            )}
          </div>
        )}
      </GlassCard>

      {/* Save */}
      <div className="space-y-3">
        <Button size="lg" className="w-full" onClick={handleSave} disabled={saveState === 'saving'}>
          {saveState === 'saving'
            ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>
            : 'Save Settings'
          }
        </Button>
        {saveState === 'success' && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Settings saved successfully.
          </div>
        )}
        {saveState === 'error' && saveError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {saveError}
          </div>
        )}
      </div>
    </div>
  )
}
