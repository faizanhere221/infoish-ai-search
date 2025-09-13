'use client'

import React, { useState } from 'react';
import { Copy, Key, Code, Play, Shield, Zap } from 'lucide-react';

const APIDocumentationPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedCode, setCopiedCode] = useState('');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const codeExamples = {
    curl: `curl -X GET "https://your-api-domain.com/api/v1/search?query=tech&platform=youtube&min_followers=10000&limit=10" \\
  -H "Authorization: Bearer pk_your_api_key_here" \\
  -H "X-API-Secret: sk_your_secret_here"`,
    
    python: `import requests

class InfluencerAPI:
    def __init__(self, api_key, api_secret):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = "https://your-api-domain.com"
    
    def search(self, query=None, **filters):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-API-Secret": self.api_secret,
            "Content-Type": "application/json"
        }
        
        params = {"query": query, **filters}
        response = requests.get(
            f"{self.base_url}/api/v1/search",
            headers=headers,
            params={k: v for k, v in params.items() if v is not None}
        )
        return response.json()

# Usage
api = InfluencerAPI("pk_your_key", "sk_your_secret")
results = api.search(query="beauty", platform="instagram", min_followers=5000)`,

    javascript: `class InfluencerAPI {
    constructor(apiKey, apiSecret) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.baseUrl = 'https://your-api-domain.com';
    }
    
    async search(query, filters = {}) {
        const params = new URLSearchParams({
            query: query || '',
            ...filters
        });
        
        const response = await fetch(\`\${this.baseUrl}/api/v1/search?\${params}\`, {
            headers: {
                'Authorization': \`Bearer \${this.apiKey}\`,
                'X-API-Secret': this.apiSecret,
                'Content-Type': 'application/json'
            }
        });
        
        return await response.json();
    }
}

// Usage
const api = new InfluencerAPI('pk_your_key', 'sk_your_secret');
const results = await api.search('tech', { platform: 'youtube', min_followers: 10000 });`
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/search',
      description: 'Search through Pakistani influencers with advanced filters',
      params: [
        { name: 'query', type: 'string', required: false, description: 'Keywords to search' },
        { name: 'platform', type: 'string', required: false, description: 'instagram, youtube, tiktok' },
        { name: 'category', type: 'string', required: false, description: 'Technology, Beauty, Food, etc.' },
        { name: 'min_followers', type: 'integer', required: false, description: 'Minimum total followers' },
        { name: 'max_followers', type: 'integer', required: false, description: 'Maximum total followers' },
        { name: 'engagement_min', type: 'float', required: false, description: 'Minimum engagement rate (0.0-100.0)' },
        { name: 'verified', type: 'boolean', required: false, description: 'Filter verified influencers only' },
        { name: 'limit', type: 'integer', required: false, description: 'Results per page (1-100, default: 20)' }
      ]
    },
    {
      method: 'GET',
      path: '/api/v1/stats',
      description: 'Get database statistics and platform breakdown',
      params: []
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center">
            <Key className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Access 1,800+ verified Pakistani influencers programmatically. 
              Perfect for agencies, marketing platforms, and developer integrations.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'authentication', label: 'Authentication' },
              { id: 'endpoints', label: 'Endpoints' },
              { id: 'examples', label: 'Examples' },
              { id: 'pricing', label: 'Pricing' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">API Overview</h2>
              <p className="text-lg text-gray-600 mb-6">
                The Pakistani Influencer Search API provides RESTful access to our comprehensive database 
                of verified content creators across Instagram, YouTube, and TikTok.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <Shield className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
                <p className="text-gray-600 text-sm">
                  Enterprise-grade security with API key authentication and rate limiting
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <Zap className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">High Performance</h3>
                <p className="text-gray-600 text-sm">
                  Fast response times with hybrid search and intelligent caching
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <Code className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Developer Friendly</h3>
                <p className="text-gray-600 text-sm">
                  Clear documentation, SDKs, and examples in multiple languages
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Base URL</h3>
              <div className="bg-gray-100 rounded p-4 font-mono text-sm">
                Production: <span className="text-green-600">https://your-api-domain.com</span><br />
                Development: <span className="text-blue-600">http://127.0.0.1:8000</span>
              </div>
            </div>
          </div>
        )}

        {/* Authentication Tab */}
        {activeTab === 'authentication' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Authentication</h2>
              <p className="text-lg text-gray-600 mb-6">
                All API requests require authentication using your API Key and Secret.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Required Headers</h3>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-400"># Headers required for all requests</div>
                <div><span className="text-blue-400">Authorization:</span> Bearer YOUR_API_KEY</div>
                <div><span className="text-blue-400">X-API-Secret:</span> YOUR_API_SECRET</div>
                <div><span className="text-blue-400">Content-Type:</span> application/json</div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-800 mb-2">Getting API Credentials</h3>
              <ol className="list-decimal list-inside text-yellow-700 space-y-2">
                <li>Upgrade to Pro Plan (PKR 6,999/month)</li>
                <li>Go to your dashboard and navigate to "API Keys"</li>
                <li>Click "Create API Key" and give it a name</li>
                <li>Copy both the API Key and Secret (secret shown only once)</li>
              </ol>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-800 mb-2">Error Responses</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-red-700">401 Unauthorized</h4>
                  <div className="bg-gray-900 text-gray-100 rounded p-3 mt-2 font-mono text-sm">
                    {`{
  "error": "Invalid API key",
  "status_code": 401
}`}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-red-700">429 Rate Limit Exceeded</h4>
                  <div className="bg-gray-900 text-gray-100 rounded p-3 mt-2 font-mono text-sm">
                    {`{
  "error": "Rate limit exceeded",
  "status_code": 429,
  "retry_after": 60
}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">API Endpoints</h2>
            </div>

            {endpoints.map((endpoint, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-lg font-mono text-gray-900">{endpoint.path}</code>
                </div>

                <p className="text-gray-600 mb-6">{endpoint.description}</p>

                {endpoint.params.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Query Parameters</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 text-sm font-medium text-gray-500">Parameter</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-500">Type</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-500">Required</th>
                            <th className="text-left py-2 text-sm font-medium text-gray-500">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {endpoint.params.map((param, paramIndex) => (
                            <tr key={paramIndex} className="border-b">
                              <td className="py-2 font-mono text-sm text-gray-900">{param.name}</td>
                              <td className="py-2 text-sm text-gray-600">{param.type}</td>
                              <td className="py-2 text-sm">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  param.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {param.required ? 'Required' : 'Optional'}
                                </span>
                              </td>
                              <td className="py-2 text-sm text-gray-600">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === 'examples' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Code Examples</h2>
            </div>

            {Object.entries(codeExamples).map(([language, code]) => (
              <div key={language} className="bg-white rounded-lg shadow-sm border">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">{language}</h3>
                  <button
                    onClick={() => copyToClipboard(code, language)}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedCode === language ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="p-4">
                  <pre className="bg-gray-900 text-gray-100 rounded p-4 overflow-x-auto text-sm">
                    <code>{code}</code>
                  </pre>
                </div>
              </div>
            ))}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-2">Example Response</h3>
              <pre className="bg-white border rounded p-4 overflow-x-auto text-sm">
                <code>{`{
  "success": true,
  "results": [
    {
      "id": "inf_123abc",
      "username": "tech_guru_pk",
      "full_name": "Ahmad Tech Reviews",
      "category": "Technology",
      "platforms": {
        "instagram": {
          "handle": "@tech_guru_pk",
          "followers": 45000
        },
        "youtube": {
          "channel": "TechGuruPK",
          "subscribers": 85000,
          "video_count": 234,
          "total_views": 2500000
        }
      },
      "metrics": {
        "total_followers": 155000,
        "engagement_rate": 4.8,
        "verified": true
      }
    }
  ],
  "total": 1,
  "response_time_ms": 245
}`}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">API Pricing</h2>
              <p className="text-lg text-gray-600 mb-6">
                API access is included with the Pro plan. Upgrade today to start building.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro Plan</h3>
                <div className="text-4xl font-bold text-green-600 mb-4">PKR 6,999/month</div>
                <p className="text-gray-600">Everything you need for professional integration</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">API Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      50,000 requests per month
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      100 requests per minute
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Multiple API keys
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Usage analytics
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Platform Features</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Unlimited searches
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Export functionality
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Advanced filters
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Priority support
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default APIDocumentationPage;