import React from 'react';
import { X } from 'lucide-react';
import { LEGAL_TEXT } from '../constants/legalText';

export default function PrivacyPolicyPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-gray-400">Expert Arena by Aakar Co.</p>
          </div>
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 sm:p-8">
          <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
            {LEGAL_TEXT.privacy}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Last updated: May 28, 2026</p>
          <p>© 2026 Aakar Co. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
