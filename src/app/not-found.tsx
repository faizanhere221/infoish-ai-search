'use client'

import React from 'react'
import Link from 'next/link'
import { Home, Search, ArrowLeft, Sparkles, TrendingUp, Instagram, Hash } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative inline-block">
            {/* Large 404 Text */}
            <h1 className="text-9xl md:text-[12rem] font-bold bg-linear-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent leading-none">
              404
            </h1>
            
            {/* Floating Icons */}
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center animate-bounce">
              <Search className="w-6 h-6 text-purple-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-5 h-5 text-pink-600" />
            </div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
              <TrendingUp className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Oops! Page Not Found
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            The page you&apos;re looking for seems to have wandered off.
          </p>
          <p className="text-base text-gray-500">
            Don&apos;t worry, even the best influencers get lost sometimes! 😅
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          
          <Link
            href="/search"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-purple-600 border-2 border-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all shadow-md hover:shadow-lg"
          >
            <Search className="w-5 h-5" />
            Search Influencers
          </Link>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Here&apos;s what you can do instead:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <Link
              href="/tools/instagram-profile-analyzer"
              className="flex items-center gap-3 p-4 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all group border-2 border-transparent hover:border-purple-200"
            >
              <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-sm">Profile Analyzer</p>
                <p className="text-xs text-gray-600">Analyze any profile</p>
              </div>
            </Link>

            <Link
              href="/tools/instagram-hashtag-generator"
              className="flex items-center gap-3 p-4 bg-linear-to-br from-blue-50 to-cyan-50 rounded-xl hover:shadow-md transition-all group border-2 border-transparent hover:border-blue-200"
            >
              <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Hash className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-sm">Hashtag Generator</p>
                <p className="text-xs text-gray-600">Generate hashtags</p>
              </div>
            </Link>

            <Link
              href="/tools"
              className="flex items-center gap-3 p-4 bg-linear-to-br from-pink-50 to-purple-50 rounded-xl hover:shadow-md transition-all group border-2 border-transparent hover:border-pink-200"
            >
              <div className="w-12 h-12 bg-linear-to-brr from-pink-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-sm">All Tools</p>
                <p className="text-xs text-gray-600">Browse all tools</p>
              </div>
            </Link>

            <Link
              href="/blog"
              className="flex items-center gap-3 p-4 bg-linear-to-br from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-all group border-2 border-transparent hover:border-green-200"
            >
              <div className="w-12 h-12 bg-linear-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-sm">Blog</p>
                <p className="text-xs text-gray-600">Marketing tips</p>
              </div>
            </Link>

          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back to previous page
          </button>
        </div>

      </div>
    </div>
  )
}