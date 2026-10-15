'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Star, Trash2, Wallet } from 'lucide-react'

interface PayoutMethod {
  id: string
  method: string
  account_holder_name: string
  masked_preview: string
  currency: string
  is_default: boolean
}

const METHOD_LABELS: Record<string, string> = {
  wise: 'Wise', payoneer: 'Payoneer', bank_transfer: 'Bank transfer', paypal: 'PayPal', other: 'Other',
}

const EMPTY_FORM = {
  method: 'wise',
  account_holder_name: '',
  currency: 'USD',
  email: '',
  bank_name: '',
  iban: '',
  swift: '',
  country: '',
}

export function PayoutMethodsSettings() {
  const [methods, setMethods] = useState<PayoutMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authHeader = useCallback((): Record<string, string> => {
    const token = localStorage.getItem('auth_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payout-methods', { headers: authHeader() })
      if (res.ok) {
        const data = await res.json()
        setMethods(data.payout_methods || [])
      }
    } finally {
      setLoading(false)
    }
  }, [authHeader])

  useEffect(() => { load() }, [load])

  async function addMethod() {
    setBusy(true)
    setError(null)
    try {
      const details: Record<string, string> = {}
      if (['wise', 'payoneer', 'paypal'].includes(form.method)) {
        details.email = form.email
      }
      if (form.method === 'bank_transfer') {
        details.bank_name = form.bank_name
        details.iban = form.iban
        details.swift = form.swift
        details.country = form.country
      }

      const res = await fetch('/api/payout-methods', {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: form.method,
          account_holder_name: form.account_holder_name,
          currency: form.currency,
          is_default: methods.length === 0,
          details,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to add payout method')
        return
      }
      setForm(EMPTY_FORM)
      setShowAdd(false)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function setDefault(id: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/payout-methods/${id}`, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      })
      if (res.ok) {await load()}
    } finally {
      setBusy(false)
    }
  }

  async function removeMethod(id: string) {
    if (!confirm('Remove this payout method?')) {return}
    setBusy(true)
    try {
      const res = await fetch(`/api/payout-methods/${id}`, { method: 'DELETE', headers: authHeader() })
      if (res.ok) {await load()}
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Payout methods</h2>
        <p className="text-sm text-gray-500 mt-1">
          Payments are made directly between you and the brand. Infoishai keeps the record — add where you want to be paid.
        </p>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {methods.length === 0 && !showAdd && (
        <p className="text-sm text-gray-500">No payout method yet. Add one so a brand can pay you.</p>
      )}

      <div className="space-y-3">
        {methods.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-4 h-4 text-brand-purple-dark" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{m.masked_preview}</p>
                <p className="text-xs text-gray-500">{m.account_holder_name} &middot; {m.currency}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {m.is_default ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-pink/10 text-brand-purple-dark rounded-full text-xs font-medium">
                  <Star className="w-3 h-3 fill-current" /> Default
                </span>
              ) : (
                <button onClick={() => setDefault(m.id)} disabled={busy} className="text-xs text-brand-purple-dark hover:underline">
                  Make default
                </button>
              )}
              <button onClick={() => removeMethod(m.id)} disabled={busy} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" aria-label="Remove">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAdd ? (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.method}
              onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {Object.entries(METHOD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
              placeholder="Currency (USD)"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <input
            value={form.account_holder_name}
            onChange={(e) => setForm((f) => ({ ...f, account_holder_name: e.target.value }))}
            placeholder="Account holder name"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />

          {['wise', 'payoneer', 'paypal'].includes(form.method) && (
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder={`${METHOD_LABELS[form.method]} email`}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          )}

          {form.method === 'bank_transfer' && (
            <>
              <input
                value={form.bank_name}
                onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
                placeholder="Bank name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.iban}
                  onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))}
                  placeholder="IBAN or account number"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <input
                  value={form.swift}
                  onChange={(e) => setForm((f) => ({ ...f, swift: e.target.value }))}
                  placeholder="SWIFT or routing number"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <input
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="Bank country"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </>
          )}

          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600">Cancel</button>
            <button
              onClick={addMethod}
              disabled={busy || !form.account_holder_name.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" /> Add payout method
        </button>
      )}
    </div>
  )
}

export default PayoutMethodsSettings
