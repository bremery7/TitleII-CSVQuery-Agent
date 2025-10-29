'use client';

import { useEffect, useRef } from 'react';

interface AIInsightsProps {
  answer: string | null;
}

export default function AIInsights({ answer }: AIInsightsProps) {
  const insightsRef = useRef<HTMLDivElement>(null);

  // Removed auto-scroll due to bouncing issues
  // Users can manually scroll to see results

  if (!answer) return null;

  return (
    <div ref={insightsRef} className="mb-8 scroll-mt-8">
      <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-lg p-6 border border-blue-500/50 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              AI Insights
              <span className="text-xs font-normal text-gray-300 bg-blue-800/60 px-2 py-1 rounded">
                Powered by GPT-4
              </span>
            </h3>
            <div className="text-gray-100 leading-relaxed">
              {answer}
            </div>
            <div className="mt-3 text-xs text-gray-400">
              Analysis based on WCAG 2.1 AA standards and Title II compliance requirements. 
              Learn more at{' '}
              <a 
                href="https://www.w3.org/TR/WCAG21/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                W3C WCAG 2.1
              </a>
              {' '}and{' '}
              <a 
                href="https://www.w3.org/WAI/standards-guidelines/wcag/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                WCAG Guidelines
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
