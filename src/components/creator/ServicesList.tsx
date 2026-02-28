'use client'

import { Clock, ChevronRight } from 'lucide-react'
import { PLATFORMS } from '@/utils/constants'
import type { Service } from '@/types/marketplace'

interface ServicesListProps {
  services: Service[]
  onSelect?: (service: Service) => void
  selectable?: boolean
  selectedIds?: string[]
  showInactive?: boolean
}

export function ServicesList({
  services,
  onSelect,
  selectable = false,
  selectedIds = [],
  showInactive = false,
}: ServicesListProps) {
  const filteredServices = showInactive 
    ? services 
    : services.filter(s => s.isActive)

  if (filteredServices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No services available
      </div>
    )
  }

  // Group services by platform
  const groupedServices = filteredServices.reduce((acc, service) => {
    const platform = service.platform
    if (!acc[platform]) {
      acc[platform] = []
    }
    acc[platform].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedServices).map(([platform, platformServices]) => {
        const platformInfo = PLATFORMS.find(p => p.id === platform)
        
        return (
          <div key={platform}>
            {/* Platform Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{platformInfo?.icon || '🌐'}</span>
              <h4 className="font-medium text-gray-900">
                {platformInfo?.name || platform}
              </h4>
            </div>

            {/* Services */}
            <div className="space-y-3">
              {platformServices.map(service => {
                const isSelected = selectedIds.includes(service.id)
                
                return (
                  <div
                    key={service.id}
                    onClick={() => selectable && onSelect?.(service)}
                    className={`p-4 rounded-xl border transition-all ${
                      selectable ? 'cursor-pointer' : ''
                    } ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${
                      !service.isActive ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-900">
                            {service.name}
                          </h5>
                          {!service.isActive && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {service.description}
                          </p>
                        )}
                        {service.turnaroundDays && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {service.turnaroundDays} day{service.turnaroundDays !== 1 ? 's' : ''} delivery
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 ml-4">
                        <span className="text-lg font-semibold text-gray-900">
                          ${service.rate}
                        </span>
                        {selectable && (
                          <ChevronRight className={`w-5 h-5 ${
                            isSelected ? 'text-blue-500' : 'text-gray-400'
                          }`} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ServicesList