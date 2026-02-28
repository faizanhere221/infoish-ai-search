'use client'

import { useState } from 'react'
import { 
  X, 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar, 
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import type { CreatorProfile, Service, Deliverable } from '@/types/marketplace'

interface CreateDealFormProps {
  creator: CreatorProfile
  onSubmit: (data: DealFormData) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
  conversationId?: string
}

interface DealFormData {
  creator_id: string
  title: string
  description: string
  services: Service[]
  deliverables: Deliverable[]
  amount_cents: number
  deadline: string | null
}

export function CreateDealForm({
  creator,
  onSubmit,
  onCancel,
  conversationId,
}: CreateDealFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([
    { id: '1', description: '', is_completed: false }
  ])
  const [customAmount, setCustomAmount] = useState<number | null>(null)
  const [deadline, setDeadline] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate total from selected services
  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.rate, 0)
  const totalAmount = customAmount ?? servicesTotal

  // Get active services from creator
  const availableServices = (creator.services || []).filter(s => s.isActive) as Service[]

  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id)
      if (exists) {
        return prev.filter(s => s.id !== service.id)
      }
      return [...prev, service]
    })
    // Reset custom amount when services change
    setCustomAmount(null)
  }

  const addDeliverable = () => {
    setDeliverables(prev => [
      ...prev,
      { id: Date.now().toString(), description: '', is_completed: false }
    ])
  }

  const updateDeliverable = (id: string, description: string) => {
    setDeliverables(prev => 
      prev.map(d => d.id === id ? { ...d, description } : d)
    )
  }

  const removeDeliverable = (id: string) => {
    if (deliverables.length === 1) return
    setDeliverables(prev => prev.filter(d => d.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!title.trim()) {
      setError('Please enter a deal title')
      return
    }
    if (totalAmount < 1) {
      setError('Please select services or enter an amount')
      return
    }
    if (deliverables.every(d => !d.description.trim())) {
      setError('Please add at least one deliverable')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const formData: DealFormData = {
      creator_id: creator.id,
      title: title.trim(),
      description: description.trim(),
      services: selectedServices,
      deliverables: deliverables.filter(d => d.description.trim()),
      amount_cents: Math.round(totalAmount * 100),
      deadline: deadline || null,
    }

    const result = await onSubmit(formData)
    
    if (!result.success) {
      setError(result.error || 'Failed to create deal')
      setIsSubmitting(false)
    }
  }

  // Calculate platform fee
  const platformFee = totalAmount * 0.1
  const creatorPayout = totalAmount - platformFee

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create Deal</h2>
            <p className="text-sm text-gray-500">with {creator.display_name}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deal Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., YouTube Integration - Product Review"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Services */}
            {availableServices.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Services
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableServices.map(service => {
                    const isSelected = selectedServices.some(s => s.id === service.id)
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{service.name}</p>
                            <p className="text-sm text-gray-500 mt-1">{service.platform}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              ${service.rate}
                            </span>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-blue-500" />
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Custom Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedServices.length > 0 ? 'Or Enter Custom Amount' : 'Deal Amount *'}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={customAmount ?? ''}
                  onChange={(e) => setCustomAmount(e.target.value ? Number(e.target.value) : null)}
                  placeholder={selectedServices.length > 0 ? `${servicesTotal} (from selected services)` : '0.00'}
                  min="1"
                  step="0.01"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you're looking for, including any specific requirements..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Deliverables */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deliverables *
              </label>
              <div className="space-y-3">
                {deliverables.map((deliverable, index) => (
                  <div key={deliverable.id} className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={deliverable.description}
                      onChange={(e) => updateDeliverable(deliverable.id, e.target.value)}
                      placeholder="e.g., 60-second integration in video"
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {deliverables.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDeliverable(deliverable.id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDeliverable}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add another deliverable
                </button>
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Payment Summary */}
            {totalAmount > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deal Amount</span>
                    <span className="text-gray-900">${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform Fee (10%)</span>
                    <span className="text-gray-600">-${platformFee.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between font-medium">
                    <span className="text-gray-900">Creator Receives</span>
                    <span className="text-emerald-600">${creatorPayout.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Payment held in escrow until you approve
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || totalAmount < 1}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Create Deal
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateDealForm