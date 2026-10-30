'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Printer, ShieldX } from 'lucide-react'
import Logo from '@/components/Logo'
import { formatMoney, formatDate } from '@/components/campaigns/utils'

interface LineItem {
  creator_name: string
  amount: number
  deliverables: string[]
}

interface InvoiceData {
  invoice_number: string
  date: string
  due_date: string
  currency: string
  campaign: { title: string }
  client_name: string | null
  brand: { company_name: string | null }
  payment_instructions: string | null
  line_items: LineItem[]
  total: number
}

// Print-styled invoice to the client for this campaign's charge amounts —
// never payout or profit, since the API route never even selects
// payout_amount. noindex via robots.ts's /invoices/ disallow, same pattern
// as /contracts/[id] and /share/[token]. Browser print-to-PDF is the
// "export," no server-side PDF generation.
export default function InvoicePage() {
  const params = useParams<{ campaignId: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)

  useEffect(() => {
    const authToken = localStorage.getItem('auth_token')
    if (!authToken) {
      router.push('/login')
      return
    }

    fetch(`/api/campaigns/${params.campaignId}/invoice`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true)
          return
        }
        setInvoice(await res.json())
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [params.campaignId, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
      </div>
    )
  }

  if (notFound || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShieldX className="w-12 h-12 text-gray-300 mx-auto" />
          <h1 className="mt-4 font-semibold text-gray-900">Invoice not available</h1>
          <p className="text-gray-500 mt-1">This campaign doesn&apos;t exist, or you don&apos;t have access to it.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 print:py-0 print:px-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href="/dashboard/payments" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
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
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{invoice.brand.company_name}</h1>
              <p className="text-sm text-gray-500 mt-1">Invoice to {invoice.client_name || 'Client'}</p>
              <p className="text-sm text-gray-500">{invoice.campaign.title}</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p className="font-semibold">{invoice.invoice_number}</p>
              <p>Date: {formatDate(invoice.date)}</p>
              <p>Due: {formatDate(invoice.due_date)}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 text-gray-700 align-top">
                    <p>{item.creator_name}</p>
                    {item.deliverables.length > 0 && (
                      <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                        {item.deliverables.map((title, j) => <li key={j}>{title}</li>)}
                      </ul>
                    )}
                  </td>
                  <td className="py-2 text-right text-gray-900 align-top">{formatMoney(item.amount, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="py-3 font-semibold text-gray-900">Total</td>
                <td className="py-3 text-right font-bold text-gray-900">{formatMoney(invoice.total, invoice.currency)}</td>
              </tr>
            </tfoot>
          </table>

          {invoice.payment_instructions && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Payment instructions</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.payment_instructions}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
