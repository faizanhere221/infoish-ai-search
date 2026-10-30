'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Printer, ShieldX } from 'lucide-react'
import Logo from '@/components/Logo'
import { formatDate } from '@/components/campaigns/utils'

interface ContractData {
  id: string
  version: number
  status: string
  body_snapshot: string | null
  body_hash: string | null
  brand_signer_name: string | null
  brand_signed_at: string | null
  creator_signer_name: string | null
  creator_signed_at: string | null
  voided_reason: string | null
  sent_at: string | null
  created_at: string
}

// Print-styled page (noindex via robots.ts's /contracts/ disallow, same
// pattern as /share/[token]). Browser print-to-PDF is the "export" — no
// server-side PDF generation. Auth is enforced by the API (404 for anyone
// who isn't a party or admin), same client-fetch pattern as every other
// private dashboard page in this app (no middleware page-auth exists).
export default function ContractPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [contract, setContract] = useState<ContractData | null>(null)
  const [campaignTitle, setCampaignTitle] = useState('')
  const [brandName, setBrandName] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [creatorHandle, setCreatorHandle] = useState('')

  useEffect(() => {
    const authToken = localStorage.getItem('auth_token')
    if (!authToken) {
      router.push('/login')
      return
    }

    fetch(`/api/contracts/${params.id}`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const data = await res.json()
        setContract(data.contract)
        setCampaignTitle(data.campaign?.title || '')
        setBrandName(data.brand?.company_name || '')
        setCreatorName(data.creator?.display_name || '')
        setCreatorHandle(data.creator?.username || '')
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [params.id, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    )
  }

  if (notFound || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShieldX className="w-12 h-12 text-gray-300 mx-auto" />
          <h1 className="mt-4 font-semibold text-gray-900">Contract not found</h1>
          <p className="text-gray-500 mt-1">This contract doesn&apos;t exist, or you don&apos;t have access to it.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 print:py-0 print:px-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg text-sm font-medium hover:shadow-lg"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl print:border-0 print:rounded-none p-8 print:p-0">
          <Logo size="sm" className="mb-6" />
          <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Creator content agreement</h1>
              <p className="text-sm text-gray-500 mt-1">{campaignTitle}</p>
              <p className="text-sm text-gray-500">{brandName} &amp; {creatorName} (@{creatorHandle})</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <p>Version {contract.version}</p>
              <p className="capitalize">{contract.status.replace(/_/g, ' ')}</p>
            </div>
          </div>

          {contract.status === 'void' && contract.voided_reason && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 print:border print:border-red-300">
              This contract was voided: {contract.voided_reason}
            </div>
          )}

          {contract.body_snapshot ? (
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">{contract.body_snapshot}</pre>
          ) : (
            <p className="text-sm text-gray-500">This contract hasn&apos;t been sent yet, so there is no signed document to show.</p>
          )}

          {(contract.creator_signed_at || contract.brand_signed_at) && (
            <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Creator signature</p>
                {contract.creator_signed_at ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">{contract.creator_signer_name}</p>
                    <p className="text-xs text-gray-500">{formatDate(contract.creator_signed_at)}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Not yet signed</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Brand signature</p>
                {contract.brand_signed_at ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">{contract.brand_signer_name}</p>
                    <p className="text-xs text-gray-500">{formatDate(contract.brand_signed_at)}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Not yet signed</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-gray-100 text-[10px] text-gray-400 font-mono break-all">
            Contract ID: {contract.id} · Sent: {contract.sent_at ? formatDate(contract.sent_at) : '—'}
            {contract.body_hash && <> · Document hash (SHA-256): {contract.body_hash}</>}
          </div>
        </div>
      </div>
    </div>
  )
}
