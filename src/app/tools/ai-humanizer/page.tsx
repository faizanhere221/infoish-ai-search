'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Wand2, Copy, Download, RotateCcw, Check, AlertCircle, Sparkles, TrendingUp, Zap, FileText, Shield, Gauge, Crown } from 'lucide-react'

type UserTier = 'free' | 'starter' | 'pro' | 'premium' 

interface UsageInfo {
  tier: UserTier
  used: number
  limit: number
  remaining: number
  resetIn: string
  isAuthenticated: boolean
}

interface Stats {
  originalWords: number
  humanizedWords: number
  aiPatternsRemoved: number
  readabilityScore: number
  plagiarismScore: number
}

interface PlagiarismInfo {
  color: string
  bg: string
  label: string
  icon: string
}

export default function AIHumanizerTool() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [isHumanizing, setIsHumanizing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<Stats>({
    originalWords: 0,
    humanizedWords: 0,
    aiPatternsRemoved: 999,
    readabilityScore: 0,
    plagiarismScore: 0,
  })

  const [usage, setUsage] = useState<UsageInfo>({
    tier: 'free',
    used: 0,
    limit: 3,
    remaining: 3,
    resetIn: '24 hours',
    isAuthenticated: false
  })
  const [isLoadingUsage, setIsLoadingUsage] = useState(false)

  const MAX_WORDS = 2500

  useEffect(() => {
    checkUsage()
  }, [])

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      originalWords: countWords(inputText),
    }))
  }, [inputText])

  // ✅ Helper function to get auth token from localStorage
  const getAuthToken = (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  // ✅ Helper function to get auth headers
  const getAuthHeaders = (): HeadersInit => {
    const token = getAuthToken()
    const headers: HeadersInit = {}
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      console.log('🔑 Using auth token from localStorage')
    } else {
      console.log('⚠️ No auth token found in localStorage')
    }
    
    return headers
  }

  const checkUsage = async () => {
    setIsLoadingUsage(true)
    try {
      console.log('🔍 Checking usage...')
      
      // ✅ Get token from localStorage (FastAPI token)
      const token = getAuthToken()
      
      if (token) {
        console.log('✅ Found auth token in localStorage')
        console.log('🔑 Token preview:', token.substring(0, 30) + '...')
      } else {
        console.log('⚠️ No auth token - user not logged in')
      }
      
      const headers = getAuthHeaders()
      
      console.log('📡 Calling /api/humanize-ai/usage...')
      const response = await fetch('/api/humanize-ai/usage', { headers })
      
      if (response.ok) {
        const data: UsageInfo = await response.json()
        console.log('✅ Usage data received:', data)
        setUsage(data)
      } else {
        console.error('❌ API returned error:', response.status)
        const errorData = await response.json()
        console.error('Error details:', errorData)
      }
    } catch (error) {
      console.error('❌ Failed to check usage:', error)
    } finally {
      setIsLoadingUsage(false)
    }
  }

  const countWords = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const calculatePlagiarismScore = (original: string, humanized: string): number => {
    if (!original || !humanized) return 0

    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 0)
    }

    const originalWords = normalizeText(original)
    const humanizedWords = normalizeText(humanized)

    if (originalWords.length === 0) return 0

    let matchingWords = 0
    const maxLength = Math.min(originalWords.length, humanizedWords.length)

    for (let i = 0; i < maxLength; i++) {
      if (originalWords[i] === humanizedWords[i]) {
        matchingWords++
      }
    }

    const similarity = (matchingWords / originalWords.length) * 100
    return Math.round(similarity)
  }

  const calculateReadability = (text: string): number => {
    if (!text) return 0

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const syllables = words.reduce((count, word) => {
      return count + countSyllables(word)
    }, 0)

    if (sentences.length === 0 || words.length === 0) return 0

    const avgWordsPerSentence = words.length / sentences.length
    const avgSyllablesPerWord = syllables / words.length

    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  const countSyllables = (word: string): number => {
    word = word.toLowerCase()
    if (word.length <= 3) return 1
    
    const vowels = 'aeiouy'
    let count = 0
    let prevIsVowel = false

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i])
      if (isVowel && !prevIsVowel) {
        count++
      }
      prevIsVowel = isVowel
    }

    if (word.endsWith('e')) {
      count--
    }

    return Math.max(1, count)
  }

  const handleHumanize = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text to humanize!')
      return
    }

    const wordCount = countWords(inputText)
    
    const limits: Record<UserTier, number> = {
      free: 300,
      starter: 1000,
      pro: 3000,
      premium: 3000 
    }
    
    if (wordCount > limits[usage.tier]) {
      alert(`Text too long for ${usage.tier} tier. Maximum ${limits[usage.tier]} words allowed. Your text has ${wordCount} words.`)
      return
    }
    
    if (usage.remaining <= 0) {
      const message = usage.tier === 'free'
        ? `You've used all ${usage.limit} AI humanizations for today. Resets in ${usage.resetIn}.\n\nUpgrade to Starter for 50 monthly uses!`
        : `You've used all ${usage.limit} AI humanizations this month. Resets in ${usage.resetIn}.`
      
      alert(message)
      return
    }

    setIsHumanizing(true)

    try {
      // ✅ Use localStorage token
      const headers: HeadersInit = { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
      
      const response = await fetch('/api/humanize-ai', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: inputText })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'AI humanization failed')
      }

      const data = await response.json()
      const humanized = data.humanizedText
      
      // Track usage
      await fetch('/api/humanize-ai/usage', {
        method: 'POST',
        headers: getAuthHeaders()
      })
      
      await checkUsage()
      
      setOutputText(humanized)

      const readability = calculateReadability(humanized)
      const plagiarism = calculatePlagiarismScore(inputText, humanized)

      setStats({
        originalWords: countWords(inputText),
        humanizedWords: countWords(humanized),
        aiPatternsRemoved: 999,
        readabilityScore: readability,
        plagiarismScore: plagiarism,
      })

    } catch (error) {
      console.error('Humanization error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to humanize text. Please try again.'
      alert(errorMessage)
    } finally {
      setIsHumanizing(false)
    }
  }

  const handleCopy = () => {
    if (!outputText) return
    navigator.clipboard.writeText(outputText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!outputText) return
    const blob = new Blob([outputText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'humanized-text.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setInputText('')
    setOutputText('')
    setStats({
      originalWords: 0,
      humanizedWords: 0,
      aiPatternsRemoved: 999,
      readabilityScore: 0,
      plagiarismScore: 0,
    })
  }

  const getPlagiarismInfo = (): PlagiarismInfo => {
    if (stats.plagiarismScore >= 80) {
      return { color: 'text-red-600', bg: 'bg-red-50', label: 'High Similarity', icon: '⚠️' }
    } else if (stats.plagiarismScore >= 50) {
      return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium Similarity', icon: '⚡' }
    } else if (stats.plagiarismScore >= 30) {
      return { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Good Uniqueness', icon: '✓' }
    } else {
      return { color: 'text-green-600', bg: 'bg-green-50', label: 'Excellent Uniqueness', icon: '🎉' }
    }
  }

  const plagiarismInfo = getPlagiarismInfo()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Wand2 className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">AI Humanizer</h1>
                <p className="text-xs sm:text-sm text-gray-600">Bypass AI detectors with advanced humanization</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {usage.tier !== 'free' && (
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                  usage.tier === 'premium' || usage.tier === 'pro'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                }`}>
                  {usage.tier === 'premium' || usage.tier === 'pro' ? '👑 PRO' : '⭐ STARTER'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 sm:p-6 text-white mb-8 shadow-xl">
          <div className="flex items-start gap-3 sm:gap-4">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold mb-2">Premium AI Humanization</h3>
              <p className="text-sm sm:text-base text-purple-100 mb-3">
                Our advanced humanizer achieves upto 10% AI detection Tools. 
                
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm">Less than 10% AI Detection</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm">Advance AI</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm">Instant Results</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm">Download & Copy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Stats Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-purple-600" />
              Your Usage Statistics
            </h3>
            {!usage.isAuthenticated && (
              <Link
                href="/login"
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {usage.tier === 'free' ? 'Daily Limit' : 'Monthly Limit'}
              </span>
              <span className="text-sm font-bold text-gray-900">
                {usage.used} / {usage.limit} uses
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  usage.remaining <= 2
                    ? 'bg-gradient-to-r from-red-500 to-pink-500'
                    : usage.remaining <= usage.limit * 0.3
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                    : 'bg-gradient-to-r from-green-500 to-blue-500'
                }`}
                style={{ width: `${(usage.used / usage.limit) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {usage.remaining} humanizations remaining • Resets in {usage.resetIn}
            </p>
          </div>

          {/* Tier Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {usage.tier === 'free' ? '300' : usage.tier === 'starter' ? '1,000' : '3,000'}
              </div>
              <div className="text-xs text-gray-600">Max words per use</div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {usage.tier === 'free' ? '3/day' : usage.tier === 'starter' ? '50/mo' : '150/mo'}
              </div>
              <div className="text-xs text-gray-600">AI humanizations</div>
            </div>
            
            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
              <div className="text-2xl font-bold text-green-600 mb-1">
                Advance AI
              </div>
              <div className="text-xs text-gray-600">Premium AI Model</div>
            </div>
          </div>

          {/* Upgrade CTA for Free Users */}
          {usage.tier === 'free' && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
              <div className="flex items-start gap-3">
                <Crown className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="font-bold text-purple-900 mb-1">
                    {usage.remaining <= 1 ? 'Running Low on Credits!' : 'Unlock More Power'}
                  </h4>
                  <p className="text-sm text-purple-700 mb-3">
                    {usage.remaining <= 1 
                      ? `You've used ${usage.used} of ${usage.limit} daily humanizations. Upgrade to get 50-150 monthly uses with higher word limits!`
                      : 'Get 50-150 monthly humanizations with up to 3,000 words per use. Perfect for students, writers, and professionals.'
                    }
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    <Crown className="w-4 h-4" />
                    View Plans - Starting PKR 999/mo
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input/Output Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                AI-Generated Text
              </h2>
              <span className={`text-xs sm:text-sm font-medium ${
                stats.originalWords > MAX_WORDS ? 'text-red-600' : 'text-gray-500'
              }`}>
                {stats.originalWords} / {
                  usage.tier === 'free' ? '300' : 
                  usage.tier === 'starter' ? '1,000' :
                  usage.tier === 'pro' ? '3,000' :
                  '3,000'
                } words
              </span>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your AI-generated text here... (from ChatGPT, Claude, Gemini, etc.)"
              className="w-full h-64 sm:h-80 p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none text-sm sm:text-base"
              disabled={isHumanizing}
            />
            {stats.originalWords > (
              usage.tier === 'free' ? 300 : 
              usage.tier === 'starter' ? 1000 : 
              usage.tier === 'pro' ? 3000 :
              3000
            ) && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  Text exceeds your tier limit. 
                  {usage.tier === 'free' && ' Upgrade to Starter for 1,000 words or Pro for 3,000 words.'}
                  {usage.tier === 'starter' && ' Upgrade to Pro for 3,000 words per use.'}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                Humanized Text
              </h2>
              {outputText && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Download as .txt"
                  >
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
            <textarea
              value={outputText}
              readOnly
              placeholder="Humanized text will appear here..."
              className="w-full h-64 sm:h-80 p-4 border-2 border-gray-200 rounded-xl bg-gray-50 resize-none text-sm sm:text-base"
            />
            {outputText && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">
                  Text successfully humanized! Expected AI detection: upto 10% only
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <button
            onClick={handleHumanize}
            disabled={!inputText.trim() || isHumanizing || usage.remaining <= 0}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            {isHumanizing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Humanizing.....</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>Humanize Text ({usage.remaining} left)</span>
              </>
            )}
          </button>

          {(inputText || outputText) && (
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Stats Dashboard */}
        {outputText && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              Transformation Stats
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
              
              <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900 text-sm">AI Humanized</h4>
                </div>
                <div className="text-3xl font-bold text-purple-600">GPT-4o</div>
                <p className="text-xs text-gray-600 mt-1">Premium AI Model</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900 text-sm">Word Count</h4>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.originalWords} → {stats.humanizedWords}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {stats.humanizedWords > stats.originalWords ? '+' : ''}
                  {stats.humanizedWords - stats.originalWords} words
                </p>
              </div>

              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900 text-sm">Readability</h4>
                </div>
                <div className="text-3xl font-bold text-green-600">{stats.readabilityScore}%</div>
                <p className="text-xs text-gray-600 mt-1">
                  {stats.readabilityScore >= 80 ? 'Very Easy' :
                   stats.readabilityScore >= 60 ? 'Easy' :
                   stats.readabilityScore >= 40 ? 'Medium' : 'Complex'}
                </p>
              </div>

              <div className={`p-5 bg-gradient-to-br ${plagiarismInfo.bg} to-white rounded-xl border-2 ${plagiarismInfo.bg.replace('bg-', 'border-').replace('-50', '-100')}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-5 h-5 ${plagiarismInfo.color}`} />
                  <h4 className="font-semibold text-gray-900 text-sm">Similarity</h4>
                </div>
                <div className={`text-3xl font-bold ${plagiarismInfo.color}`}>
                  {stats.plagiarismScore}%
                </div>
                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                  <span>{plagiarismInfo.icon}</span>
                  <span>{plagiarismInfo.label}</span>
                </p>
              </div>

            </div>

            <div className={`p-4 ${plagiarismInfo.bg} border ${plagiarismInfo.bg.replace('bg-', 'border-').replace('-50', '-200')} rounded-xl`}>
              <div className="flex items-start gap-3">
                <Shield className={`w-5 h-5 ${plagiarismInfo.color} flex-shrink-0 mt-0.5`} />
                <div>
                  <h4 className={`font-semibold ${plagiarismInfo.color} mb-1`}>Expected AI Detection: 0-10% </h4>
                  <p className="text-sm text-gray-700">
                    Our GPT powered humanizer achieves 80-90% human detection on AI Detectors. 
                    Lower similarity scores indicate better transformation quality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}