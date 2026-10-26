'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  Bell, 
  CreditCard, 
  Shield, 
  LogOut,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Globe,
  User,
  Mail
} from 'lucide-react'
import { COUNTRIES, INDUSTRIES, COMPANY_SIZES } from '@/utils/constants'
import { EmailPreferencesSettings } from '@/components/settings/EmailPreferencesSettings'

type SettingsTab = 'company' | 'notifications' | 'payments' | 'security'

interface BrandProfile {
  id: string
  user_id: string
  company_name: string
  company_website: string | null
  logo_url: string | null
  description: string | null
  industry: string | null
  company_size: string | null
  country: string | null
  contact_name: string
  contact_role: string | null
  verification_status: string
}

export default function BrandSettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<SettingsTab>('company')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [profile, setProfile] = useState<BrandProfile | null>(null)
  const [userEmail, setUserEmail] = useState('')

  const tabs = [
    { id: 'company' as SettingsTab, label: 'Company Profile', icon: Building2 },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'payments' as SettingsTab, label: 'Payments', icon: CreditCard },
    { id: 'security' as SettingsTab, label: 'Security', icon: Shield },
  ]

  const loadData = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('auth_user')
      const profileStr = localStorage.getItem('auth_profile')

      if (!userStr) {
        router.push('/login')
        return
      }

      const user = JSON.parse(userStr)
      setUserEmail(user.email)

      if (profileStr) {
        const savedProfile = JSON.parse(profileStr)
        setProfile(savedProfile)

        // The cached auth_profile is only a snapshot from login. Read the
        // brand back from the server so the form shows what is saved.
        const res = await fetch(`/api/brands/${savedProfile.id}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const fresh = { ...savedProfile, ...data.brand }
          setProfile(fresh)
          localStorage.setItem('auth_profile', JSON.stringify(fresh))
        } else {
          setError('Could not load your saved company profile. Refresh to try again.')
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load settings')
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSave = async () => {
    if (!profile) {return}
    
    setSaving(true)
    setSaved(false)
    setError(null)

    const token = localStorage.getItem('auth_token')

    try {
      const res = await fetch(`/api/brands/${profile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // Send only the editable fields. Required fields go as undefined
        // rather than null so an empty optional value doesn't fail validation.
        body: JSON.stringify({
          company_name: profile.company_name || undefined,
          company_website: profile.company_website,
          logo_url: profile.logo_url,
          description: profile.description,
          industry: profile.industry,
          company_size: profile.company_size,
          country: profile.country || undefined,
          contact_name: profile.contact_name || undefined,
          contact_role: profile.contact_role,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const data = await res.json().catch(() => null)
      const persisted = data?.brand ? { ...profile, ...data.brand } : profile
      setProfile(persisted)
      localStorage.setItem('auth_profile', JSON.stringify(persisted))

      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Error saving:', err)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
      setSaving(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_profile')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold">Profile not found</h2>
          <Link href="/login" className="mt-4 inline-block text-blue-600">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard/brand" 
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Company Settings</h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 border-l-2 border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
              <div className="border-t border-gray-200">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {activeTab === 'company' && (
                <CompanySettings 
                  profile={profile} 
                  setProfile={setProfile}
                  userEmail={userEmail}
                />
              )}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'payments' && <PaymentSettings />}
              {activeTab === 'security' && <SecuritySettings />}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPANY SETTINGS
// ============================================================================
function CompanySettings({ 
  profile, 
  setProfile,
  userEmail
}: { 
  profile: BrandProfile
  setProfile: (p: BrandProfile) => void
  userEmail: string
}) {
  const updateProfile = (field: keyof BrandProfile, value: BrandProfile[keyof BrandProfile]) => {
    setProfile({ ...profile, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Company Profile</h2>
        <p className="text-sm text-gray-500 mt-1">Update your company information visible to creators.</p>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
          {profile.company_name?.charAt(0) || 'B'}
        </div>
        <div>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Change Logo
          </button>
          <p className="text-xs text-gray-500 mt-2">JPG, PNG or SVG. Max 2MB.</p>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={profile.company_name || ''}
              onChange={(e) => updateProfile('company_name', e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={profile.company_website || ''}
              onChange={(e) => updateProfile('company_website', e.target.value)}
              placeholder="https://example.com"
              className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
          <select
            value={profile.industry || ''}
            onChange={(e) => updateProfile('industry', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
          <select
            value={profile.company_size || ''}
            onChange={(e) => updateProfile('company_size', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select size</option>
            {COMPANY_SIZES.map((size) => (
              <option key={size.id} value={size.id}>{size.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
          <select
            value={profile.country || ''}
            onChange={(e) => updateProfile('country', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">About your company</label>
          <textarea
            rows={4}
            value={profile.description || ''}
            onChange={(e) => updateProfile('description', e.target.value)}
            placeholder="Tell creators about your company, products, and what kind of collaborations you're looking for..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{(profile.description || '').length}/500 characters</p>
        </div>

        <div className="md:col-span-2 pt-4 border-t border-gray-200">
          <h3 className="text-md font-medium text-gray-900 mb-4">Contact Person</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name *</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={profile.contact_name || ''}
              onChange={(e) => updateProfile('contact_name', e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role / Title</label>
          <input
            type="text"
            value={profile.contact_role || ''}
            onChange={(e) => updateProfile('contact_role', e.target.value)}
            placeholder="Marketing Manager"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================
function NotificationSettings() {
  return <EmailPreferencesSettings />
}

// ============================================================================
// PAYMENT SETTINGS
// ============================================================================
function PaymentSettings() {
  const [brandId, setBrandId] = useState<string | null>(null)
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    const profileStr = localStorage.getItem('auth_profile')
    const token = localStorage.getItem('auth_token')
    if (!profileStr || !token) {return}
    const profile = JSON.parse(profileStr)
    setBrandId(profile.id)

    fetch(`/api/brands/${profile.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setInstructions(data?.brand?.payment_instructions || ''))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    const token = localStorage.getItem('auth_token')
    if (!brandId || !token) {return}
    setSaving(true)
    setSaved(false)
    setSaveError(null)
    try {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_instructions: instructions }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const data = await res.json().catch(() => ({}))
        setSaveError(data.error || 'Failed to save payment instructions. Please try again.')
      }
    } catch {
      setSaveError('Failed to save payment instructions. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Payment Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Payments are made directly between you and the creator. Infoishai keeps the record — see{' '}
          <Link href="/dashboard/payments" className="text-brand-purple-dark hover:underline">your payments dashboard</Link> for every record.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Payment instructions for invoices</label>
        <p className="text-xs text-gray-500 mb-2">Shown on every client invoice you generate — your bank details, remittance notes, or anything a client needs to pay you.</p>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        ) : (
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            placeholder="e.g. Please pay by bank transfer within 14 days to: Acme Agency, IBAN ..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-pink text-sm"
          />
        )}
      </div>

      <button
        onClick={save}
        disabled={saving || loading}
        className="px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-lg font-medium disabled:opacity-50"
      >
        {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
      </button>
      {saveError && (
        <p role="alert" className="flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500" />
          {saveError}
        </p>
      )}
    </div>
  )
}

// ============================================================================
// SECURITY SETTINGS
// ============================================================================
function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your account security.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
          <input
            type="password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
          <input
            type="password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
          <input
            type="password"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800">
          Update Password
        </button>
      </div>
    </div>
  )
}