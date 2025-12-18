'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, Eye, RefreshCw, Download, Search } from 'lucide-react'

interface PaymentSubmission {
  payment_reference: string
  user_email: string
  transaction_id: string | null
  notes: string | null
  filename: string
  file_path: string
  file_size: number
  file_type: string
  submitted_at: string
  status: 'pending_verification' | 'verified' | 'rejected'
  verified_at: string | null
  verified_by: string | null
}

interface Stats {
  total: number
  pending: number
  verified: number
  rejected: number
}

export default function AdminPaymentsPage() {
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, verified: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending_verification' | 'verified' | 'rejected'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [adminToken, setAdminToken] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check for saved token
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token')
    if (savedToken) {
      setAdminToken(savedToken)
      setIsAuthenticated(true)
    }
  }, [])

  // Fetch submissions when authenticated
  useEffect(() => {
    if (isAuthenticated && adminToken) {
      fetchSubmissions()
    }
  }, [isAuthenticated, adminToken])

  const handleLogin = () => {
    if (!adminToken.trim()) {
      alert('Please enter admin token')
      return
    }
    localStorage.setItem('admin_token', adminToken)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setIsAuthenticated(false)
    setAdminToken('')
    setSubmissions([])
  }

  const fetchSubmissions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/payment/submissions?token=${adminToken}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid admin token')
        }
        throw new Error('Failed to fetch submissions')
      }

      const data = await response.json()
      setSubmissions(data.submissions || [])
      setStats({
        total: data.total || 0,
        pending: data.pending || 0,
        verified: data.verified || 0,
        rejected: data.rejected || 0
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getProductFromReference = (ref: string): string => {
    if (ref.startsWith('HUM-')) return 'AI Humanizer'
    if (ref.startsWith('INF-')) return 'InfoIshai Search'
    return 'Unknown'
  }

  const getProductSlugFromReference = (ref: string): string => {
    if (ref.startsWith('HUM-')) return 'ai_humanizer'
    if (ref.startsWith('INF-')) return 'infoishai_search'
    return 'ai_humanizer'
  }

  const filteredSubmissions = submissions.filter(sub => {
    if (filter !== 'all' && sub.status !== filter) return false
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        sub.user_email.toLowerCase().includes(search) ||
        sub.payment_reference.toLowerCase().includes(search)
      )
    }
    return true
  })


  const activateSubscription = async (email: string, reference: string) => {
  const confirmed = confirm(
    `Activate subscription for ${email}?\n\nThis will immediately grant access.`
  )
  
  if (!confirmed) return
  
  try {
    const productSlug = getProductSlugFromReference(reference)
    
    const response = await fetch('/api/admin/activate-subscription', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_email: email,
        product_slug: productSlug,
        tier: 'starter', // Default to starter
        payment_reference: reference  // ✅ Add this
      })
    })
    
    const data = await response.json()
    
    if (response.ok) {
      alert(`✅ Subscription activated for ${email}!`)
      fetchSubmissions() // Refresh the list
    } else {
      alert(`❌ Activation failed: ${data.error}`)
    }
  } catch (error) {
    console.error('Activation error:', error)
    alert('❌ Failed to activate subscription')
  }
}

  const copyActivationSQL = (email: string, reference: string) => {
    const productSlug = getProductSlugFromReference(reference)
    const sqlCommand = `UPDATE users 
SET tool_subscriptions = jsonb_set(
  COALESCE(tool_subscriptions, '{}'::jsonb),
  '{${productSlug}}',
  '"starter"'
)
WHERE email = '${email}';

-- Verify it worked:
SELECT email, tool_subscriptions FROM users WHERE email = '${email}';`
    
    navigator.clipboard.writeText(sqlCommand)
    alert('✅ SQL command copied to clipboard!\n\nPaste and run in Supabase SQL Editor.')
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-2">Admin Login</h1>
          <p className="text-gray-600 text-center mb-8">Enter your admin token to access the payment dashboard</p>
          
          <input
            type="password"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Admin Token"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Login
          </button>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Default Token:</strong>
            </p>
            <p className="text-xs font-mono text-gray-600 break-all">
              infoishai-admin-secret-2025-change-this-in-production
            </p>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Token is stored in .env.local as ADMIN_TOKEN
          </p>
        </div>
      </div>
    )
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage payment submissions and activate subscriptions</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchSubmissions}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Submissions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Verified</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.verified}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Rejected</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by email or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending_verification')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'pending_verification'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('verified')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'verified'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading submissions...</p>
          </div>
        )}

        {/* No Submissions */}
        {!loading && filteredSubmissions.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg">
              {searchTerm || filter !== 'all' 
                ? 'No submissions match your filters' 
                : 'No payment submissions yet'}
            </p>
            {(searchTerm || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilter('all')
                }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Submissions List */}
        {!loading && filteredSubmissions.length > 0 && (
          <div className="space-y-4">
            {filteredSubmissions.map((submission, index) => (
              <div
                key={`${submission.payment_reference}-${submission.submitted_at}-${index}`}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        submission.status === 'pending_verification'
                          ? 'bg-yellow-100 text-yellow-800'
                          : submission.status === 'verified'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {submission.status === 'pending_verification' ? 'Pending' : submission.status}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {getProductFromReference(submission.payment_reference)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{submission.user_email}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <p><strong>Reference:</strong> {submission.payment_reference}</p>
                      <p><strong>Transaction:</strong> {submission.transaction_id || 'N/A'}</p>
                      <p><strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleString()}</p>
                      <p><strong>Size:</strong> {(submission.file_size / 1024).toFixed(2)} KB</p>
                    </div>
                    
                    {submission.notes && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Notes:</strong> {submission.notes}
                      </p>
                    )}
                  </div>

                  {/* Right Section */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <a
                      href={`/uploads/payment-proofs/${submission.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Eye className="w-4 h-4" />
                      View Proof
                    </a>
                    
                    {submission.status === 'pending_verification' && (
                      <button
                        onClick={() => copyActivationSQL(submission.user_email, submission.payment_reference)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <Check className="w-4 h-4" />
                        Copy SQL
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}