import type { ApplicationStatus } from '@/types/campaigns'

export const APPLICATION_STATUS_STYLE: Record<ApplicationStatus, { label: string; bg: string; text: string }> = {
  submitted: { label: 'Submitted', bg: 'bg-gray-100', text: 'text-gray-700' },
  viewed: { label: 'Viewed', bg: 'bg-blue-100', text: 'text-blue-700' },
  shortlisted: { label: 'Shortlisted', bg: 'bg-amber-100', text: 'text-amber-700' },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700' },
  hired: { label: 'Hired', bg: 'bg-emerald-100', text: 'text-emerald-700' },
}

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

export default function ApplicationStatusBadge({ status, className = '' }: ApplicationStatusBadgeProps) {
  const style = APPLICATION_STATUS_STYLE[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} ${className}`}>
      {style.label}
    </span>
  )
}
