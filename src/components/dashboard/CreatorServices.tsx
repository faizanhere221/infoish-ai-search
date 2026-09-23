import Link from 'next/link'
import { DollarSign, Plus } from 'lucide-react'
import { PLATFORMS } from '@/utils/constants'

interface ServiceItem {
  id?: string
  title: string
  platform?: string | null
  price: number
  is_active: boolean
}

const NAMES = Object.fromEntries(PLATFORMS.map((p) => [p.id, p.name])) as Record<string, string>

export default function CreatorServices({ services }: { services: ServiceItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">My Services &amp; Rates</h2>
        <Link href="/settings?tab=services" className="text-sm font-medium text-violet-600 hover:text-violet-700">
          Edit
        </Link>
      </div>

      {services.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {services.map((s, i) => (
            <li key={s.id || i} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{s.title}</p>
                <p className="text-xs text-gray-500">
                  {s.platform ? NAMES[s.platform] || s.platform : 'Any platform'}
                  {!s.is_active && ' · Inactive'}
                </p>
              </div>
              <span className="font-semibold text-gray-900 flex-shrink-0">${Number(s.price).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-8">
          <DollarSign className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="mt-2 text-gray-500">No services added yet</p>
          <Link
            href="/settings?tab=services"
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            Add Services
          </Link>
        </div>
      )}
    </div>
  )
}
