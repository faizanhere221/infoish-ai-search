'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, FileText, Loader2, Wallet } from 'lucide-react'
import { formatDate } from '@/components/campaigns/utils'

interface ContractTabProps {
  campaignCreatorId: string
  actorType: 'brand' | 'creator'
  token: string | null
}

interface Contract {
  id: string
  version: number
  status: string
  special_terms: string | null
  payment_terms_days: number
  kill_fee_percent: number
  body_preview?: string | null
  body_snapshot: string | null
  brand_signer_name: string | null
  brand_signed_at: string | null
  creator_signer_name: string | null
  creator_signed_at: string | null
  voided_reason: string | null
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent — awaiting signatures',
  signed_by_creator: 'Signed by creator — awaiting brand',
  signed_by_brand: 'Signed by brand — awaiting creator',
  fully_signed: 'Fully signed',
  void: 'Void',
}

export function ContractTab({ campaignCreatorId, actorType, token }: ContractTabProps) {
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [specialTerms, setSpecialTerms] = useState('')
  const [paymentDays, setPaymentDays] = useState('14')
  const [killFee, setKillFee] = useState('50')

  const [signerName, setSignerName] = useState('')
  const [agree, setAgree] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [showDecline, setShowDecline] = useState(false)
  const [needsPayoutMethod, setNeedsPayoutMethod] = useState(false)

  const authHeader = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/contracts`, { headers: authHeader() })
      if (res.ok) {
        const data = await res.json()
        setContract(data.contract)
        if (data.contract) {
          setSpecialTerms(data.contract.special_terms || '')
          setPaymentDays(String(data.contract.payment_terms_days))
          setKillFee(String(data.contract.kill_fee_percent))
        }
        if (actorType === 'creator' && data.contract?.status === 'fully_signed') {
          const methodsRes = await fetch('/api/payout-methods', { headers: authHeader() })
          if (methodsRes.ok) {
            const methodsData = await methodsRes.json()
            setNeedsPayoutMethod((methodsData.payout_methods || []).length === 0)
          }
        }
      } else {
        setError('Could not load the contract')
      }
    } catch {
      setError('Could not load the contract — check your connection and try again')
    } finally {
      setLoading(false)
    }
  }, [campaignCreatorId, actorType, authHeader])

  useEffect(() => { load() }, [load])

  async function createContract() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/contracts`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create contract')
        return
      }
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function saveDraft() {
    if (!contract) {return}
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/contracts/${contract.id}`, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          special_terms: specialTerms || null,
          payment_terms_days: Number(paymentDays) || 14,
          kill_fee_percent: Number(killFee) || 50,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save')
        return
      }
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function sendContract() {
    if (!contract) {return}
    if (!confirm('Send this contract to the creator? The wording is locked once sent.')) {return}
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/contracts/${contract.id}/send`, {
        method: 'POST',
        headers: authHeader(),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send contract')
        return
      }
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function sign() {
    if (!contract) {return}
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/contracts/${contract.id}/sign`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ signer_name: signerName, agree: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to sign')
        return
      }
      setSignerName('')
      setAgree(false)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function decline() {
    if (!contract || !declineReason.trim()) {return}
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaign-creators/${campaignCreatorId}/contracts/${contract.id}/decline`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: declineReason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to decline')
        return
      }
      setDeclineReason('')
      setShowDecline(false)
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
  }

  if (!contract) {
    return (
      <div className="text-center py-6">
        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500 mb-4">
          {actorType === 'brand' ? 'No contract yet for this creator.' : 'The brand hasn’t drafted a contract yet.'}
        </p>
        {actorType === 'brand' && (
          <button
            onClick={createContract}
            disabled={busy}
            className="px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50"
          >
            Draft a contract
          </button>
        )}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>
    )
  }

  const previewBody = contract.status === 'draft' ? contract.body_preview : contract.body_snapshot

  return (
    <div className="space-y-4">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">Version {contract.version}</span>
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{STATUS_LABELS[contract.status] || contract.status}</span>
      </div>

      {contract.status === 'void' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Voided: {contract.voided_reason}
          {actorType === 'brand' && (
            <button onClick={createContract} disabled={busy} className="block mt-2 text-brand-purple-dark hover:underline font-medium">
              Create a new version
            </button>
          )}
        </div>
      )}

      {contract.status === 'draft' && actorType === 'brand' && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Payment terms (days to pay after completion)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={paymentDays}
              onChange={(e) => setPaymentDays(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Kill fee if cancelled after a draft is submitted (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={killFee}
              onChange={(e) => setKillFee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Special terms (optional)</label>
            <textarea
              value={specialTerms}
              onChange={(e) => setSpecialTerms(e.target.value)}
              rows={3}
              placeholder="Anything extra specific to this deal…"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={saveDraft} disabled={busy} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              Save
            </button>
            <button
              onClick={sendContract}
              disabled={busy}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50"
            >
              Send to creator
            </button>
          </div>
        </div>
      )}

      {contract.status === 'draft' && actorType === 'creator' && (
        <p className="text-sm text-gray-500">The brand is still preparing this contract.</p>
      )}

      {previewBody && (
        <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700 leading-relaxed">{previewBody}</pre>
        </div>
      )}

      {contract.status === 'sent' && actorType === 'creator' && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
          <input
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Type your full name"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <label className="flex items-start gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
            I agree this is my electronic signature.
          </label>
          <button
            onClick={sign}
            disabled={busy || !signerName.trim() || !agree}
            className="w-full px-3 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50"
          >
            Sign contract
          </button>
        </div>
      )}

      {contract.status === 'sent' && actorType === 'brand' && (
        <p className="text-sm text-gray-500">Waiting for the creator to sign.</p>
      )}

      {contract.status === 'signed_by_creator' && actorType === 'brand' && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Creator signed as &ldquo;{contract.creator_signer_name}&rdquo; on {formatDate(contract.creator_signed_at)}.</p>
          <input
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Type your full name"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <label className="flex items-start gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
            I agree this is my electronic signature.
          </label>
          <button
            onClick={sign}
            disabled={busy || !signerName.trim() || !agree}
            className="w-full px-3 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50"
          >
            Countersign
          </button>
        </div>
      )}

      {contract.status === 'signed_by_creator' && actorType === 'creator' && (
        <p className="text-sm text-gray-500">You signed. Waiting for the brand to countersign.</p>
      )}

      {contract.status === 'fully_signed' && (
        <div className="space-y-1 text-sm text-gray-600">
          <p>Creator: {contract.creator_signer_name} &middot; {formatDate(contract.creator_signed_at)}</p>
          <p>Brand: {contract.brand_signer_name} &middot; {formatDate(contract.brand_signed_at)}</p>
        </div>
      )}

      {contract.status === 'fully_signed' && actorType === 'creator' && needsPayoutMethod && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-center gap-2">
          <Wallet className="w-4 h-4 flex-shrink-0" />
          <span>
            Add a payout method so the brand knows where to pay you —{' '}
            <Link href="/settings?tab=payouts" className="font-medium hover:underline">add one now</Link>.
          </span>
        </div>
      )}

      {(contract.status === 'fully_signed' || contract.status === 'sent' || contract.status === 'signed_by_creator') && (
        <Link
          href={`/contracts/${contract.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-brand-purple-dark hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" /> View / print contract
        </Link>
      )}

      {(contract.status === 'sent' || contract.status === 'signed_by_creator') && (
        showDecline ? (
          <div className="space-y-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <input
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason for declining"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowDecline(false)} className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
              <button onClick={decline} disabled={busy || !declineReason.trim()} className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                Decline
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowDecline(true)} className="text-sm text-red-600 hover:underline">Decline this contract</button>
        )
      )}
    </div>
  )
}

export default ContractTab
