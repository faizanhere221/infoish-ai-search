'use client'

import { useState, useEffect } from 'react'

// ✅ Define proper interface for API response
interface ExpiryCheckResult {
  success: boolean
  message: string
  expired_count: number
  processed_count?: number
  error?: string
  details?: string
}

export default function SubscriptionManagement() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExpiryCheckResult | null>(null)
  const [adminToken, setAdminToken] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ✅ Fixed: Use useEffect instead of useState
  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token')
    if (savedToken) {
      setAdminToken(savedToken)
      setIsAuthenticated(true)
    }
  }, [])

  const checkExpired = async () => {
    if (!adminToken) {
      alert('❌ Please login first')
      return
    }

    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/cron/check-expired-subscriptions', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })
      
      const data = await response.json() as ExpiryCheckResult
      setResult(data)
      
      if (data.success) {
        alert(`✅ Processed ${data.processed_count || 0} expired subscriptions`)
      } else {
        alert(`❌ Error: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Check expired error:', error)
      alert('❌ Failed to check expired subscriptions')
      setResult({
        success: false,
        message: 'Request failed',
        expired_count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
          <input
            type="password"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && setIsAuthenticated(true)}
            placeholder="Admin Token"
            className="w-full px-4 py-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setIsAuthenticated(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Use the same token as admin/payments
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <button
            onClick={() => {
              localStorage.removeItem('admin_token')
              setIsAuthenticated(false)
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Manual Expiry Check</h2>
          <p className="text-gray-600 mb-4">
            Check for and process expired subscriptions manually.
            This runs automatically daily at midnight UTC.
          </p>
          
          <button
            onClick={checkExpired}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Checking...' : 'Check Expired Subscriptions'}
          </button>

          {result && (
            <div className={`mt-6 p-4 rounded-lg ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className={`font-semibold mb-2 ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.success ? '✅ Success' : '❌ Error'}
              </h3>
              <p className={result.success ? 'text-green-800' : 'text-red-800'}>
                {result.message}
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Total Expired:</strong> {result.expired_count}</p>
                {result.processed_count !== undefined && (
                  <p><strong>Processed:</strong> {result.processed_count}</p>
                )}
                {result.error && (
                  <p className="text-red-600"><strong>Error:</strong> {result.error}</p>
                )}
              </div>
              
              {/* Raw JSON for debugging */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  View Raw Response
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/admin/payments"
              className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
            >
              <h3 className="font-semibold mb-1">Payment Dashboard</h3>
              <p className="text-sm text-gray-600">View and manage payment submissions</p>
            </a>
            
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow transition"
            >
              <h3 className="font-semibold mb-1">View Database</h3>
              <p className="text-sm text-gray-600">Open Supabase dashboard</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}