'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, 
  ArrowLeft,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  AlertCircle,
  User,
  AtSign
} from 'lucide-react'
import { NICHES, PLATFORMS, COUNTRIES, LANGUAGES } from '@/utils/constants'

type Step = 1 | 2 | 3

interface FormData {
  // Step 1: Account
  email: string
  password: string
  confirmPassword: string
  // Step 2: Profile
  username: string
  displayName: string
  bio: string
  country: string
  city: string
  languages: string[]
  // Step 3: Content
  niches: string[]
  platforms: string[]
}

export default function CreatorSignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
    bio: '',
    country: '',
    city: '',
    languages: [],
    niches: [],
    platforms: [],
  })

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const toggleArrayItem = (field: 'languages' | 'niches' | 'platforms', value: string) => {
    setFormData(prev => {
      const arr = prev[field]
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(v => v !== value) }
      }
      return { ...prev, [field]: [...arr, value] }
    })
  }

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!formData.username || !formData.displayName) {
      setError('Username and display name are required')
      return false
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters')
      return false
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (formData.niches.length === 0) {
      setError('Please select at least one niche')
      return false
    }
    if (formData.platforms.length === 0) {
      setError('Please select at least one platform')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep((step + 1) as Step)
  }

  const handleBack = () => {
    setStep((step - 1) as Step)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!validateStep3()) return
    
    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Register user
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          user_type: 'creator',
        }),
      })

      const registerData = await registerRes.json()

      if (!registerRes.ok) {
        setError(registerData.error || 'Failed to create account')
        setIsLoading(false)
        return
      }

      // Step 2: Create creator profile
      const creatorRes = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: registerData.user.id,
          username: formData.username.toLowerCase(),
          display_name: formData.displayName,
          bio: formData.bio || null,
          country: formData.country || null,
          city: formData.city || null,
          niches: formData.niches,
          languages: formData.languages,
          platforms: formData.platforms.map(p => ({
            platform: p,
            username: null,
            url: null,
            followers: 0,
          })),
        }),
      })

      const creatorData = await creatorRes.json()

      if (!creatorRes.ok) {
        setError(creatorData.error || 'Failed to create profile')
        setIsLoading(false)
        return
      }

      // Step 3: Auto-login
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const loginData = await loginRes.json()

      if (loginRes.ok) {
        // Save to localStorage
        localStorage.setItem('auth_token', loginData.token)
        localStorage.setItem('auth_user', JSON.stringify(loginData.user))
        localStorage.setItem('auth_profile', JSON.stringify(creatorData.creator))
      }

      // Redirect to dashboard
      router.push('/dashboard/creator')

    } catch (err) {
      console.error('Signup error:', err)
      setError('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Infoishai</span>
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s < step ? 'bg-violet-600 text-white' :
                s === step ? 'bg-violet-600 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 mx-1 rounded ${
                  s < step ? 'bg-violet-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error */}
          {error && (
            <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create your account</h2>
                <p className="text-gray-500 mt-1">Start your creator journey</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Profile */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Set up your profile</h2>
                <p className="text-gray-500 mt-1">Tell brands about yourself</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => updateField('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="yourname"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => updateField('displayName', e.target.value)}
                      placeholder="Your Name"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    placeholder="Tell brands about yourself and your content..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Your city"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Languages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => toggleArrayItem('languages', lang.code)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          formData.languages.includes(lang.code)
                            ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Content */}
          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Your content</h2>
                <p className="text-gray-500 mt-1">What do you create?</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Content Niches * <span className="text-gray-400">(select up to 5)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {NICHES.map((niche) => (
                      <button
                        key={niche}
                        type="button"
                        onClick={() => {
                          if (formData.niches.includes(niche) || formData.niches.length < 5) {
                            toggleArrayItem('niches', niche)
                          }
                        }}
                        disabled={!formData.niches.includes(niche) && formData.niches.length >= 5}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          formData.niches.includes(niche)
                            ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
                        }`}
                      >
                        {niche}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Platforms * <span className="text-gray-400">(where you create content)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map((platform) => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => toggleArrayItem('platforms', platform.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          formData.platforms.includes(platform.id)
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="font-medium text-gray-900">{platform.name}</span>
                        {formData.platforms.includes(platform.id) && (
                          <CheckCircle className="w-5 h-5 text-violet-500 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            ) : (
              <Link
                href="/signup"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </Link>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Account
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-600 hover:text-violet-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}