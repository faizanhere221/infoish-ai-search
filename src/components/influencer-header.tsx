'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Menu, 
  X, 
  User, 
  Mail, 
  LogOut,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react'

export default function InfluencerHeader() {
  const router = useRouter()
  const [influencer, setInfluencer] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Password change modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    // Load influencer data
    const loadInfluencer = () => {
      const userData = localStorage.getItem('user_data')
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setInfluencer(parsedUser)
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      }
    }

    loadInfluencer()

    // Listen for profile updates
    const handleProfileUpdate = () => {
      console.log('Profile updated - refreshing header')
      loadInfluencer()
    }

    window.addEventListener('profileUpdated', handleProfileUpdate)

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [])

  const handleLogout = async () => {
    try {
      const authToken = localStorage.getItem('auth_token')
      const { logoutUserWithBackend } = await import('@/utils/auth')
      await logoutUserWithBackend(authToken || undefined)
      
      setInfluencer(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    try {
      setChangingPassword(true)
      const authToken = localStorage.getItem('auth_token')
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

      const response = await fetch(`${BACKEND_URL}/influencers/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordSuccess(true)
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        
        setTimeout(() => {
          setShowPasswordModal(false)
          setPasswordSuccess(false)
        }, 2000)
      } else {
        setPasswordError(data.detail || data.message || 'Failed to change password')
      }
    } catch (error) {
      console.error('Password change error:', error)
      setPasswordError('Failed to change password. Please try again.')
    } finally {
      setChangingPassword(false)
    }
  }

  const openPasswordModal = () => {
    setShowPasswordModal(true)
    setShowDropdown(false)
    setPasswordError('')
    setPasswordSuccess(false)
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo - Links to Influencer Dashboard */}
            <Link href="/influencer/dashboard" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-black text-xl">I</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Infoish
                </span>
                <span className="text-[10px] text-gray-500 -mt-1 font-medium tracking-wide">
                  Influencer Portal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              <Link 
                href="/about" 
                className="px-4 py-2 text-black/70 hover:text-blue-600 font-medium rounded-xl transition-all duration-200 hover:bg-blue-50/50"
              >
                About
              </Link>
              <Link 
                href="/blog" 
                className="px-4 py-2 text-black/70 hover:text-purple-600 font-medium rounded-xl transition-all duration-200 hover:bg-purple-50/50"
              >
                Blog
              </Link>

              {/* User Profile Dropdown */}
              {influencer && (
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 transition-all duration-200"
                  >
                    {influencer.profile_image_url ? (
                      <img
                        src={influencer.profile_image_url}
                        alt={influencer.full_name}
                        className="w-10 h-10 rounded-xl border-2 border-white/30 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="hidden xl:block text-left">
                      <p className="text-sm font-semibold text-black leading-tight">
                        {influencer.full_name || influencer.username}
                      </p>
                      <p className="text-xs text-black/60">
                        Influencer
                      </p>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/30 z-50">
                        <div className="p-6 border-b border-black/10">
                          <div className="flex items-center gap-4">
                            {influencer.profile_image_url ? (
                              <img
                                src={influencer.profile_image_url}
                                alt={influencer.full_name}
                                className="w-16 h-16 rounded-2xl border-2 border-white/30 object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                                <User className="w-8 h-8 text-white" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-bold text-black text-lg">
                                {influencer.full_name || influencer.username}
                              </p>
                              <p className="text-sm text-black/60">{influencer.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <button
                            onClick={openPasswordModal}
                            className="w-full flex items-center gap-3 text-left px-4 py-3 text-sm font-medium text-black hover:bg-purple-50 rounded-2xl transition-all duration-200"
                          >
                            <Lock className="w-5 h-5" />
                            Change Password
                          </button>
                          
                          <Link
                            href="/contact"
                            className="w-full flex items-center gap-3 text-left px-4 py-3 text-sm font-medium text-black hover:bg-purple-50 rounded-2xl transition-all duration-200"
                            onClick={() => setShowDropdown(false)}
                          >
                            <Mail className="w-5 h-5" />
                            Contact Support
                          </Link>
                          
                          <div className="border-t border-black/10 mt-4 pt-4">
                            <button 
                              className="w-full flex items-center gap-3 text-left px-4 py-3 text-sm font-medium hover:bg-red-50 rounded-2xl text-red-600 transition-all duration-200"
                              onClick={handleLogout}
                            >
                              <LogOut className="w-5 h-5" />
                              Logout
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-3 rounded-xl bg-white/30 hover:bg-white/50 backdrop-blur-lg border border-white/20 transition-all duration-300"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-black" />
              ) : (
                <Menu className="w-5 h-5 text-black" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-black/10 py-6 bg-white/20 backdrop-blur-xl">
              <div className="flex flex-col gap-2">
                <Link 
                  href="/about"
                  className="text-black hover:text-blue-500 font-medium py-4 px-6 rounded-2xl transition-all duration-200 hover:bg-white/30"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link 
                  href="/blog"
                  className="text-black hover:text-purple-500 font-medium py-4 px-6 rounded-2xl transition-all duration-200 hover:bg-white/30"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Blog
                </Link>
                
                {influencer && (
                  <div className="border-t border-black/10 mt-4 pt-4 space-y-2">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        openPasswordModal()
                      }}
                      className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-medium text-sm transition-all duration-200 bg-white/20 text-black hover:bg-white/40"
                    >
                      <Lock className="w-5 h-5" />
                      Change Password
                    </button>
                    
                    <Link
                      href="/contact"
                      className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-medium text-sm transition-all duration-200 bg-white/20 text-black hover:bg-white/40"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Mail className="w-5 h-5" />
                      Contact Support
                    </Link>
                    
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full flex items-center justify-center gap-3 bg-red-500 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-red-600 transition-all duration-300"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Spacer */}
      <div className="h-20"></div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Success Message */}
            {passwordSuccess && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">Password changed successfully!</span>
              </div>
            )}

            {/* Error Message */}
            {passwordError && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700 font-medium">{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Old Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  placeholder="Enter current password"
                  disabled={changingPassword}
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  placeholder="Enter new password (min 8 characters)"
                  disabled={changingPassword}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  placeholder="Confirm new password"
                  disabled={changingPassword}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Change Password
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={changingPassword}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}