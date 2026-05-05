'use client'

import { useState, useEffect } from 'react'
import { Save, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface Settings {
  site_name: string
  site_description: string
  default_page_size: number
  enable_messaging: boolean
  enable_reviews: boolean
  enable_deals: boolean
  maintenance_mode: boolean
  session_timeout_min: number
  max_login_attempts: number
  ip_whitelist: string[]
  ip_blacklist: string[]
}

const DEFAULT: Settings = {
  site_name: 'Infoishai',
  site_description: 'Influencer Marketing Platform',
  default_page_size: 20,
  enable_messaging: true,
  enable_reviews: true,
  enable_deals: true,
  maintenance_mode: false,
  session_timeout_min: 240,
  max_login_attempts: 5,
  ip_whitelist: [],
  ip_blacklist: [],
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string
}) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer group">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        {description && <div className="text-xs text-slate-400 mt-0.5">{description}</div>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-slate-600'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </div>
    </label>
  )
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-slate-700/50 last:border-0">
      <div className="mb-1.5">
        <div className="text-sm font-medium text-white">{label}</div>
        {description && <div className="text-xs text-slate-400">{description}</div>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [missingTable, setMissingTable] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) {
          setSettings(s => ({ ...s, ...data.settings }))
          setMissingTable(!!data.missing_table)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setToast({ type: 'success', msg: 'Settings saved successfully' })
    } catch (err) {
      setToast({ type: 'error', msg: err instanceof Error ? err.message : 'Failed to save settings' })
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-slate-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Configure platform-wide settings (super admin only)</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${toast.type === 'success' ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300' : 'bg-red-900/30 border-red-700/50 text-red-300'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {missingTable && (
        <div className="flex items-start gap-3 p-4 bg-amber-900/30 border border-amber-700/50 rounded-xl text-amber-300 text-sm">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Settings table not found. Run <code className="bg-black/30 px-1 rounded">supabase/settings_migration.sql</code> to persist settings. Showing defaults.</span>
        </div>
      )}

      {/* Platform Settings */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-4">Platform</h2>
        <div className="space-y-0 divide-y divide-slate-700/30">
          <Field label="Site Name" description="Displayed in the browser tab and emails">
            <input
              type="text"
              value={settings.site_name}
              onChange={e => set('site_name', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </Field>
          <Field label="Site Description">
            <input
              type="text"
              value={settings.site_description}
              onChange={e => set('site_description', e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </Field>
          <Field label="Default Page Size" description="Number of rows shown per page in tables">
            <input
              type="number"
              min={5} max={100} step={5}
              value={settings.default_page_size}
              onChange={e => set('default_page_size', parseInt(e.target.value) || 20)}
              className="w-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </Field>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-2">Feature Flags</h2>
        <div className="divide-y divide-slate-700/30">
          <Toggle
            label="Enable Messaging"
            description="Allow brands and creators to message each other"
            checked={settings.enable_messaging}
            onChange={v => set('enable_messaging', v)}
          />
          <Toggle
            label="Enable Reviews"
            description="Allow deal reviews and ratings"
            checked={settings.enable_reviews}
            onChange={v => set('enable_reviews', v)}
          />
          <Toggle
            label="Enable Deals"
            description="Allow deal creation and management"
            checked={settings.enable_deals}
            onChange={v => set('enable_deals', v)}
          />
          <Toggle
            label="Maintenance Mode"
            description="Show maintenance page to all non-admin users"
            checked={settings.maintenance_mode}
            onChange={v => set('maintenance_mode', v)}
          />
        </div>
        {settings.maintenance_mode && (
          <div className="mt-3 flex items-center gap-2 text-amber-400 text-xs bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Maintenance mode is ON — regular users will see a maintenance page
          </div>
        )}
      </div>

      {/* Security Settings */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-4">Security</h2>
        <div className="space-y-0 divide-y divide-slate-700/30">
          <Field label="Session Timeout (minutes)" description="Admin session expires after this many minutes of inactivity">
            <input
              type="number"
              min={30} max={1440} step={30}
              value={settings.session_timeout_min}
              onChange={e => set('session_timeout_min', parseInt(e.target.value) || 240)}
              className="w-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </Field>
          <Field label="Max Login Attempts" description="Lock account after this many failed attempts">
            <input
              type="number"
              min={3} max={20}
              value={settings.max_login_attempts}
              onChange={e => set('max_login_attempts', parseInt(e.target.value) || 5)}
              className="w-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </Field>
          <Field label="IP Whitelist" description="Comma-separated IPs. Empty = allow all">
            <input
              type="text"
              placeholder="192.168.1.1, 10.0.0.0/8"
              value={settings.ip_whitelist.join(', ')}
              onChange={e => set('ip_whitelist', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </Field>
          <Field label="IP Blacklist" description="Comma-separated IPs to block">
            <input
              type="text"
              placeholder="1.2.3.4, 5.6.7.0/24"
              value={settings.ip_blacklist.join(', ')}
              onChange={e => set('ip_blacklist', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </Field>
        </div>
      </div>
    </div>
  )
}
