'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react'
import { ReasonDialog } from '@/components/admin/ReasonDialog'

interface ContractDetail {
  id: string
  campaign_creator_id: string
  version: number
  status: string
  special_terms: string | null
  payment_terms_days: number
  kill_fee_percent: number
  body_snapshot: string | null
  brand_signer_name: string | null
  brand_signed_at: string | null
  creator_signer_name: string | null
  creator_signed_at: string | null
  voided_reason: string | null
  created_at: string
  sent_at: string | null
}

function fmtDateTime(d: string | null) {
  if (!d) {return '—'}
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminContractDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [context, setContext] = useState<{ campaign_creator_id: string | null; campaign_title: string | null; creator_name: string | null; brand_name: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [confirmVoid, setConfirmVoid] = useState(false)
  const [actionError, setActionError] = useState('')

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const res = await fetch(`/api/admin/contracts/${params.id}`)
      if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return }
      if (res.status === 404) { setNotFound(true); setLoading(false); return }
      if (!res.ok) {throw new Error('Failed to load')}
      const data = await res.json()
      setContract(data.contract)
      setContext(data.context)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  const confirmVoidContract = async (reason: string) => {
    setActionError('')
    try {
      const res = await fetch(`/api/admin/contracts/${params.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) {throw new Error((await res.json().catch(() => ({})))?.error || 'Failed to void contract')}
      setConfirmVoid(false)
      await fetchDetail()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to void contract')
    }
  }

  if (loading) {
    return <div className="py-20 text-center"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-sm text-gray-400">Loading…</p></div>
  }
  if (notFound) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500 font-medium">Contract not found</p>
        <Link href="/admin/contracts" className="mt-4 inline-block text-sm text-violet-600 hover:text-violet-700">Back to Contracts</Link>
      </div>
    )
  }
  if (loadError || !contract) {
    return (
      <div className="py-20 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-gray-700 font-medium mb-1">Couldn&apos;t load this contract</p>
        <button onClick={() => fetchDetail()} className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    )
  }

  const canVoid = contract.status !== 'void'

  return (
    <div className="space-y-6">
      <Link href="/admin/contracts" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Contracts
      </Link>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Contract v{contract.version}</h1>
            <p className="text-sm text-gray-500 mt-1">{context?.campaign_title ?? '—'} · {context?.creator_name ?? '—'} · {context?.brand_name ?? '—'}</p>
            <span className="inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">{contract.status.replace(/_/g, ' ')}</span>
          </div>
          {canVoid && (
            <button onClick={() => setConfirmVoid(true)} className="px-3 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100">
              Void Contract
            </button>
          )}
          {context?.campaign_creator_id && (
            <Link href={`/admin/campaign-creators/${context.campaign_creator_id}`} className="px-3 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              View Workflow Row
            </Link>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-gray-400 text-xs">Payment terms</p><p className="text-gray-800 font-medium">{contract.payment_terms_days} days</p></div>
          <div><p className="text-gray-400 text-xs">Kill fee</p><p className="text-gray-800 font-medium">{contract.kill_fee_percent}%</p></div>
          <div><p className="text-gray-400 text-xs">Creator signed</p><p className="text-gray-800 font-medium">{fmtDateTime(contract.creator_signed_at)}</p></div>
          <div><p className="text-gray-400 text-xs">Brand signed</p><p className="text-gray-800 font-medium">{fmtDateTime(contract.brand_signed_at)}</p></div>
        </div>

        {contract.special_terms && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
            <span className="font-medium">Special terms:</span> {contract.special_terms}
          </div>
        )}
        {contract.voided_reason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span className="font-medium">Voided:</span> {contract.voided_reason}
          </div>
        )}
      </div>

      {contract.body_snapshot && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-3">Contract Body</h2>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">{contract.body_snapshot}</pre>
        </div>
      )}

      {confirmVoid && (
        <ReasonDialog
          title="Void Contract"
          description="This notifies both the brand and the creator. A new version will be needed to continue. This cannot be undone."
          danger
          confirmLabel="Void Contract"
          onConfirm={confirmVoidContract}
          onClose={() => { setConfirmVoid(false); setActionError('') }}
        />
      )}
      {actionError && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm">{actionError}</div>
      )}
    </div>
  )
}
