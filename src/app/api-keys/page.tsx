"use client"
import React, { useState, useEffect } from 'react';
import { Copy, Eye, EyeOff, Plus, Trash2, AlertCircle, Key, Activity, TrendingUp, Calendar, Shield, Code } from 'lucide-react';

interface User {
  id: string;
  email: string;
  subscription_tier: 'free' | 'starter' | 'pro';
  [key: string]: any;
}

interface APIKey {
  id: number;
  key_name: string;
  api_key: string;
  monthly_requests: number;
  monthly_limit: number;
  is_active: boolean;
  created_at: string;
  last_used: string | null;
}

interface NewAPIKey {
  id: number;
  key_name: string;
  api_key: string;
  api_secret: string;
  monthly_limit: number;
  created_at: string;
}

export default function APIKeysPage() {
  const [user, setUser] = useState<User | null>(null);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<NewAPIKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    setUser(userData);
    
    if (userData.subscription_tier === 'pro') {
      fetchAPIKeys();
    }
  }, []);

  const fetchAPIKeys = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/keys', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.api_keys || []);
      } else {
        setError('Failed to fetch API keys');
      }
    } catch (error) {
      setError('Network error: Could not fetch API keys');
    }
  };

  const createAPIKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a key name');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key_name: newKeyName })
      });
      
      if (response.ok) {
        const newKey = await response.json();
        setNewlyCreatedKey(newKey);
        setApiKeys([...apiKeys, {
          id: newKey.id,
          key_name: newKey.key_name,
          api_key: newKey.api_key,
          monthly_requests: 0,
          monthly_limit: newKey.monthly_limit,
          is_active: true,
          created_at: newKey.created_at,
          last_used: null
        }]);
        setNewKeyName('');
        setShowCreateForm(false);
        setSuccess('API key created successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create API key');
      }
    } catch (error) {
      setError('Network error: Could not create API key');
    }
    setLoading(false);
  };

  const revokeAPIKey = async (keyId: number) => {
    if (!confirm('Are you sure? This will permanently revoke the API key and break any integrations using it.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setApiKeys(apiKeys.filter(key => key.id !== keyId));
        setSuccess('API key revoked successfully');
      } else {
        setError('Failed to revoke API key');
      }
    } catch (error) {
      setError('Network error: Could not revoke API key');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`${label} copied to clipboard!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Non-Pro user view
  if (user?.subscription_tier !== 'pro') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 text-center border">
            <Key className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">API Access</h1>
            <p className="text-gray-600 mb-8 text-lg">
              Unlock programmatic access to our influencer database with the Pro plan
            </p>
            
            <div className="bg-white rounded-lg p-6 mb-8 text-left max-w-md mx-auto shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Pro Plan Benefits:</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Unlimited searches</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">API access with 50,000 requests/month</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Rate limit: 100 requests/minute</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Export functionality</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Advanced filters</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Priority support</span>
                </li>
              </ul>
            </div>
            
            <div className="text-4xl font-bold text-green-600 mb-6">PKR 6,999/month</div>
            <button 
              onClick={() => window.location.href = '/pricing'}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Management</h1>
            <p className="text-gray-600 mt-1">Manage your API keys and monitor usage</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create API Key
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active API Keys</p>
                <p className="text-2xl font-bold text-gray-900">{apiKeys.filter(k => k.is_active).length}</p>
              </div>
              <Key className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {apiKeys.reduce((sum, key) => sum + key.monthly_requests, 0).toLocaleString()}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Limit</p>
                <p className="text-2xl font-bold text-gray-900">50,000</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Newly Created Key Alert */}
        {newlyCreatedKey && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  API Key Created Successfully!
                </h3>
                <p className="text-yellow-700 text-sm mb-4">
                  Save these credentials now - the secret will not be shown again.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-yellow-800 mb-1">API Key</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-yellow-100 px-3 py-2 rounded text-sm font-mono flex-1 break-all">
                        {newlyCreatedKey.api_key}
                      </code>
                      <button
                        onClick={() => copyToClipboard(newlyCreatedKey.api_key, 'API Key')}
                        className="p-2 text-yellow-600 hover:text-yellow-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-yellow-800 mb-1">API Secret</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-yellow-100 px-3 py-2 rounded text-sm font-mono flex-1 break-all">
                        {newlyCreatedKey.api_secret}
                      </code>
                      <button
                        onClick={() => copyToClipboard(newlyCreatedKey.api_secret, 'API Secret')}
                        className="p-2 text-yellow-600 hover:text-yellow-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setNewlyCreatedKey(null)}
                  className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  I&apos;ve Saved These Credentials
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create API Key Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Create New API Key</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., My Agency Integration, Production App"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Give your API key a descriptive name to identify its use</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={createAPIKey}
                  disabled={loading || !newKeyName.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Key'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewKeyName('');
                  }}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Keys List */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Your API Keys</h2>
          </div>
          
          {apiKeys.length === 0 ? (
            <div className="p-12 text-center">
              <Key className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
              <p className="text-gray-600 mb-6">Create your first API key to start using our API</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Create API Key
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {apiKeys.map((key) => (
                <div key={key.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{key.key_name}</h3>
                      <p className="text-sm text-gray-600">
                        Created {new Date(key.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        key.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {key.is_active ? 'Active' : 'Revoked'}
                      </span>
                      {key.is_active && (
                        <button
                          onClick={() => revokeAPIKey(key.id)}
                          className="p-2 text-red-600 hover:text-red-700 transition-colors"
                          title="Revoke API Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono flex-1 break-all">
                          {key.api_key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(key.api_key, 'API Key')}
                          className="p-2 text-gray-600 hover:text-gray-700 transition-colors"
                          title="Copy API Key"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Monthly Requests:</span>
                        <div className="font-medium">{key.monthly_requests.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Monthly Limit:</span>
                        <div className="font-medium">{key.monthly_limit.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Used:</span>
                        <div className="font-medium">
                          {key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Usage:</span>
                        <div className="font-medium">
                          {Math.round((key.monthly_requests / key.monthly_limit) * 100)}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Usage Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          (key.monthly_requests / key.monthly_limit) > 0.9 ? 'bg-red-500' :
                          (key.monthly_requests / key.monthly_limit) > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((key.monthly_requests / key.monthly_limit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Documentation Link */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Code className="w-6 h-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Ready to integrate?</h3>
              <p className="text-blue-700 mb-4">
                Check out our comprehensive API documentation with examples, SDKs, and integration guides.
              </p>
              <button 
                onClick={() => window.location.href = '/docs'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                View API Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}