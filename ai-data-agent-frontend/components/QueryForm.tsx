'use client';

import { useState, useEffect } from 'react';

interface QueryFormProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

export default function QueryForm({ onSubmit, isLoading, initialQuery = '' }: QueryFormProps) {
  const [query, setQuery] = useState('');

  // Update query when initialQuery changes
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, allow Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (query.trim()) {
        onSubmit(query);
      }
    }
  };

  return (
    <div className="mb-6">
      {/* Query Input Section */}
      <div className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
        <h2 className="text-xl font-medium mb-2 text-white">Enter Search</h2>
        <p className="text-sm text-gray-400 mb-4">
          (Enter search in natural language. This Agent is designed to convert natural language to database queries and provide WCAG 2.1 AA compliance insights.)
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., give me all entries where the owner is rkalised and... (Press Enter to run, Shift+Enter for new line)"
            className="w-full h-24 px-4 py-3 bg-[#1a1f3a] border border-[#3d4571] rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
          >
            {isLoading ? 'Running Query...' : 'Run Query'}
          </button>
        </form>
      </div>
    </div>
  );
}