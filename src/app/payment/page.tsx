// src/app/payment/page.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { Copy, Clock, Shield, CheckCircle, Upload } from 'lucide-react';

interface PaymentDetails {
  payment_reference: string;
  amount: number;
  currency: string;
  plan_details: {
    name: string;
    description: string;
    billing_cycle: string;
  };
  bank_details: {
    account_title: string;
    account_number: string;
    bank_name: string;
    iban: string;
    branch_code: string;
  };
  instructions: string[];
  expires_in_days: number;
}

const PaymentPage: React.FC = () => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get payment details from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const paymentData = urlParams.get('payment_data');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    setUser(userData);
    
    if (paymentData) {
      try {
        setPaymentDetails(JSON.parse(decodeURIComponent(paymentData)));
      } catch (error) {
        console.error('Error parsing payment data:', error);
        // Redirect back to pricing if no valid data
        window.location.href = '/pricing';
      }
    } else {
      // Redirect to pricing if no payment data
      window.location.href = '/pricing';
    }
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
      alert('Copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Copied to clipboard!');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a JPG, PNG, WEBP, or PDF file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUploadProof = async () => {
  if (!selectedFile || !paymentDetails) {
    alert('Please select a file first');
    return;
  }

  setUploadStatus('uploading');
  
  try {
    const formData = new FormData();
    formData.append('proof', selectedFile);
    formData.append('payment_reference', paymentDetails.payment_reference);
    formData.append('user_email', user?.email || '');
    formData.append('transaction_id', transactionId);
    formData.append('notes', notes);

    const response = await fetch('/api/payment/upload-proof', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setUploadStatus('success');
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    setUploadStatus('error');
    alert('Upload failed: ' + error.message);
  }
};

  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (uploadStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Proof Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you! We've received your payment proof. Your subscription will be activated within 24 hours after verification.
          </p>
          <div className="space-y-3 text-sm text-left bg-gray-50 p-4 rounded-lg mb-6">
            <p><strong>Reference:</strong> {paymentDetails.payment_reference}</p>
            <p><strong>Plan:</strong> {paymentDetails.plan_details.name}</p>
            <p><strong>Amount:</strong> PKR {paymentDetails.amount.toLocaleString()}</p>
          </div>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
          <p className="text-gray-600">Follow the instructions below to activate your subscription</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Instructions */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Transfer Money</h2>
            </div>

            {/* Plan Details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">{paymentDetails.plan_details.name}</h3>
              <p className="text-green-700 text-sm mb-2">{paymentDetails.plan_details.description}</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-green-800">
                  PKR {paymentDetails.amount.toLocaleString()}
                </span>
                <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                  {paymentDetails.plan_details.billing_cycle}
                </span>
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Bank Account Details:</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Account Title</p>
                    <p className="font-semibold">{paymentDetails.bank_details.account_title}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(paymentDetails.bank_details.account_title)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Account Number</p>
                    <p className="font-semibold">{paymentDetails.bank_details.account_number}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(paymentDetails.bank_details.account_number)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">IBAN</p>
                    <p className="font-semibold">{paymentDetails.bank_details.iban}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(paymentDetails.bank_details.iban)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Bank</p>
                    <p className="font-semibold">{paymentDetails.bank_details.bank_name}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="text-sm text-yellow-700">Payment Reference</p>
                    <p className="font-bold text-yellow-800">{paymentDetails.payment_reference}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(paymentDetails.payment_reference)}
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Important Instructions:</h4>
                <ul className="space-y-1 text-sm text-blue-700">
                  {paymentDetails.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Upload Proof */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Upload Payment Proof</h2>
            </div>

            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Screenshot/Receipt *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label htmlFor="proof-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP or PDF (Max 5MB)</p>
                  </label>
                </div>
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-2">✓ Selected: {selectedFile.name}</p>
                )}
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID if available"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information about the payment"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUploadProof}
                disabled={!selectedFile || uploadStatus === 'uploading'}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Submit Payment Proof'}
              </button>
            </div>

            {/* Status Messages */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Processing Time</p>
                  <p className="text-xs text-yellow-700">We verify payments within 24 hours</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Secure & Private</p>
                  <p className="text-xs text-blue-700">Your payment information is encrypted and secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Need help with your payment?</p>
          <button
            onClick={() => window.location.href = '/contact'}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;