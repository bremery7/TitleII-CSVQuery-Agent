'use client';

import { useState } from 'react';

interface QueryFormProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  recentQueries?: string[];
  onLoadQuery?: (query: string) => void;
}

const SUGGESTED_PROMPTS = [
  "Show me all entries that have the InContext category and do not have captions.",
  "Show me all entries that do not have audio descriptions and were created in the past 7 years.",
  "Show me all entries that have captions that are less than 95% accurate and have more than 100 plays.",
  "Show me all entries owned by professor@university.com that do not have captions."
];

export default function QueryForm({ onSubmit, isLoading, recentQueries = [], onLoadQuery }: QueryFormProps) {
  const [query, setQuery] = useState('');
  const [showRecentQueries, setShowRecentQueries] = useState(true);

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

  const handleSuggestedPrompt = (prompt: string) => {
    // Automatically run the query when clicking a suggested prompt
    onSubmit(prompt);
  };

  const handleRecentQuery = (recentQuery: string) => {
    // Load into text area for editing
    setQuery(recentQuery);
    if (onLoadQuery) {
      onLoadQuery(recentQuery);
    }
  };

  return (
    <div className="space-y-6">
      {/* Query Input Section */}
      <div className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
        <h2 className="text-xl font-medium mb-2 text-white">Enter Search</h2>
        <p className="text-sm text-gray-400 mb-4">
          (Enter search in natural language, this Agent is designed to convert natural language to database queries. See "Suggested Prompts" below for ideas.)
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
          
          {/* Suggested Prompts - Inside Query Box */}
          <div className="pt-2 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💡</span>
              <h3 className="text-lg font-medium text-gray-400">Suggested Prompts</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestedPrompt(prompt)}
                  disabled={isLoading}
                  className="text-left px-3 py-2 bg-[#1a1f3a] hover:bg-[#2d3454] border border-[#3d4571] text-gray-300 text-sm font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
          >
            {isLoading ? 'Running Query...' : 'Run Query'}
          </button>
        </form>
      </div>

      {/* Recent Queries */}
      {recentQueries.length > 0 && (
        <div className={`bg-gradient-to-br from-blue-800/30 to-sky-800/30 rounded-lg border border-blue-500/40 transition-all duration-200 ${showRecentQueries ? 'p-6' : 'p-3'}`}>
          <button
            onClick={() => setShowRecentQueries(!showRecentQueries)}
            className="flex items-center justify-between w-full group"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🕐</span>
              <h3 className="text-lg font-medium text-sky-300">Recent Queries</h3>
            </div>
            <span className="text-sky-300 text-xl transition-transform duration-200 group-hover:text-sky-200" style={{ transform: showRecentQueries ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▼
            </span>
          </button>
          {showRecentQueries && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {recentQueries.slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleRecentQuery(q)}
                  disabled={isLoading}
                  className="text-left px-4 py-2 bg-blue-900/40 hover:bg-blue-800/50 border border-blue-500/50 text-sky-100 text-sm font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 truncate"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}