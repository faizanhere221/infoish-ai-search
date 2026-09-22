'use client'

import {
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_CATEGORIES,
  PLATFORMS,
  DELIVERABLE_TYPES,
} from '@/types/campaigns'
import type { CampaignFormData } from '../CampaignWizard'

interface Step5ReviewProps {
  data: CampaignFormData
}

function label(list: { value: string; label: string }[], value: string) {
  return list.find((item) => item.value === value)?.label || value
}

function formatBudget(data: CampaignFormData) {
  if (data.budget_type === 'negotiable') {return 'Negotiable'}
  if (data.budget_type === 'fixed') {return data.budget_fixed ? `${data.currency} ${data.budget_fixed}` : '—'}
  if (data.budget_min || data.budget_max) {
    return `${data.currency} ${data.budget_min || '0'} – ${data.budget_max || '?'}`
  }
  return '—'
}

function formatDate(value: string) {
  if (!value) {return '—'}
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function SummaryRow({ label: rowLabel, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2">
      <span className="text-sm text-gray-500 sm:w-40 shrink-0">{rowLabel}</span>
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  )
}

export default function Step5Review({ data }: Step5ReviewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Campaign Basics</h3>
        <div className="divide-y divide-gray-50">
          <SummaryRow label="Title" value={data.title || '—'} />
          <SummaryRow label="Description" value={<span className="whitespace-pre-wrap">{data.description || '—'}</span>} />
          <SummaryRow label="Objective" value={data.objective ? label(CAMPAIGN_OBJECTIVES, data.objective) : '—'} />
          <SummaryRow label="Category" value={data.category ? label(CAMPAIGN_CATEGORIES, data.category) : '—'} />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Creator Requirements</h3>
        <div className="divide-y divide-gray-50">
          <SummaryRow
            label="Platforms"
            value={
              data.platforms.length > 0
                ? data.platforms.map((p) => label(PLATFORMS, p)).join(', ')
                : '—'
            }
          />
          <SummaryRow label="Minimum Followers" value={data.min_followers || 'No minimum'} />
          <SummaryRow
            label="Target Countries"
            value={data.target_countries.length > 0 ? data.target_countries.join(', ') : 'Any country'}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Deliverables</h3>
        <div className="space-y-3">
          {data.deliverables.map((d, i) => (
            <div key={d.id} className="flex items-start gap-3 text-sm">
              <span className="text-gray-400 w-5 shrink-0">{i + 1}.</span>
              <div>
                <span className="font-medium text-gray-900">
                  {d.quantity || 1}x {d.deliverable_type ? label(DELIVERABLE_TYPES, d.deliverable_type) : '—'} on{' '}
                  {d.platform ? label(PLATFORMS, d.platform) : '—'}
                </span>
                {d.description && <p className="text-gray-500 mt-0.5">{d.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Budget & Timeline</h3>
        <div className="divide-y divide-gray-50">
          <SummaryRow label="Budget" value={formatBudget(data)} />
          <SummaryRow label="Application Deadline" value={formatDate(data.application_deadline)} />
          <SummaryRow label="Campaign Start" value={formatDate(data.campaign_start_date)} />
          <SummaryRow label="Campaign End" value={formatDate(data.campaign_end_date)} />
        </div>
      </div>
    </div>
  )
}
