'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import QueryForm from '@/components/QueryForm';
import ResultsView from '@/components/ResultsView';
import ConversationLog from '@/components/ConversationLog';
import FileManager from '@/components/FileManager';
import DatabaseInfo from '@/components/DatabaseInfo';
import MultiFileUpload from '@/components/MultiFileUpload';
import UserManagement from '@/components/UserManagement';
import ChangePassword from '@/components/ChangePassword';
import UserMenu from '@/components/UserMenu';

export default function Home() {
  const { session, status, logout } = useSession();
  const router = useRouter();
  const isAdmin = session?.role === 'admin';
  const [results, setResults] = useState<any[]>([]);
  const [conversation, setConversation] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [savedQueries, setSavedQueries] = useState<string[]>([]);
  const [insights, setInsights] = useState<string | null>(null);
  const [executiveSummary, setExecutiveSummary] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [aggregations, setAggregations] = useState<any>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [sql, setSql] = useState<string>('');
  const [showFileManager, setShowFileManager] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDatabaseInfo, setShowDatabaseInfo] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showSavedQueries, setShowSavedQueries] = useState(true);
  const [showRecentQueries, setShowRecentQueries] = useState(true);
  const [showSuggestedPrompts, setShowSuggestedPrompts] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Load saved queries from localStorage on mount
  useEffect(() => {
    if (status === 'authenticated') {
      const saved = localStorage.getItem('savedQueries');
      if (saved) {
        try {
          setSavedQueries(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to load saved queries:', error);
        }
      }
    }
  }, [status]);

  // Save queries to localStorage whenever they change
  useEffect(() => {
    if (status === 'authenticated' && savedQueries.length > 0) {
      localStorage.setItem('savedQueries', JSON.stringify(savedQueries));
    }
  }, [savedQueries, status]);

  // Check if database is empty on initial load (admin only)
  useEffect(() => {
    if (status !== 'authenticated' || !isAdmin) return;
    
    const checkDatabase = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/database-info`);
        const data = await response.json();
        
        // If no tables or no data, show upload modal
        if (!data.tables || data.tables.length === 0 || data.rowCount === 0) {
          setShowUploadModal(true);
        }
      } catch (error) {
        console.error('Failed to check database:', error);
        // On error, also show upload modal to be safe
        setShowUploadModal(true);
      }
    };

    checkDatabase();
  }, [status, isAdmin]);

  const handleQuery = async (query: string) => {
    setIsLoading(true);
    
    // Trim the query to avoid whitespace issues
    const trimmedQuery = query.trim();
    
    // Update current query in form
    setCurrentQuery(trimmedQuery);
    
    // Add to recent queries - filter out exact matches (case-sensitive)
    setRecentQueries(prev => {
      // Remove any existing instance of this query
      const filtered = prev.filter(q => q.trim() !== trimmedQuery);
      // Add to front and limit to 5
      return [trimmedQuery, ...filtered].slice(0, 5);
    });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Add timeout for very large queries (2 minutes)
      const controller = new AbortController();
      setAbortController(controller); // Store for stop button
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      const response = await fetch(`${apiUrl}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmedQuery }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setAbortController(null); // Clear after completion
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data.results || []);
      setConversation(data.conversation || []);
      setInsights(data.insights || null);
      setExecutiveSummary(data.executiveSummary || null);
      setAggregations(data.aggregations || null);
      setTotalCount(data.totalCount || data.results?.length || 0);
      setSql(data.sql || '');
    } catch (error) {
      console.error('Query failed:', error);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          alert('Query timed out. This query is taking too long to process (>2 minutes). Please try a more specific query or add filters to reduce the dataset size.');
        } else {
          alert(`Query failed: ${error.message}`);
        }
      } else {
        alert('Query failed. Please check the console for details.');
      }
      
      // Clear results on error
      setResults([]);
      setConversation([]);
      setInsights(null);
      setExecutiveSummary(null);
      setAggregations(null);
      setTotalCount(0);
      setSql('');
    } finally {
      setIsLoading(false);
      setAbortController(null); // Always clear abort controller
    }
  };

  const handleStopQuery = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  };

  const handleLoadQuery = (query: string) => {
    // Just load the query into the form without running it
    setCurrentQuery(query);
  };

  const handleSaveQuery = (query: string) => {
    if (savedQueries.includes(query)) {
      alert('This query is already saved!');
      return;
    }
    if (savedQueries.length >= 10) {
      alert('You can only save up to 10 queries. Please remove one first.');
      return;
    }
    setSavedQueries(prev => [...prev, query]);
  };

  const handleRemoveSavedQuery = (query: string) => {
    setSavedQueries(prev => prev.filter(q => q !== query));
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (data.success) {
        alert('File uploaded successfully!');
        setShowFileManager(false);
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      alert('Upload failed: ' + error);
    }
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#1a1f3a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (status !== 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1a1f3a] text-gray-200">
      {/* Header */}
      <div className="bg-[#252d47] border-b border-[#3d4571]">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-semibold text-white">Title II Reports Agent</h1>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button 
                  onClick={() => setShowUserManagement(!showUserManagement)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  <span>👥</span>
                  <span>Manage Users</span>
                </button>
              )}
              <UserMenu
                username={session.username}
                role={session.role}
                onChangePassword={() => setShowChangePassword(true)}
                onLogout={async () => {
                  await logout();
                  router.push('/login');
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {/* Action Buttons - Admin Only */}
        {isAdmin && (
          <div className="flex flex-wrap gap-3 mb-8">
            <button 
              onClick={() => {
                setShowUploadModal(!showUploadModal);
                setShowFileManager(false);
                setShowDatabaseInfo(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <span>📁</span>
              <span>Upload CSV</span>
            </button>
            <button 
              onClick={() => {
                setShowFileManager(!showFileManager);
                setShowUploadModal(false);
                setShowDatabaseInfo(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <span>📋</span>
              <span>Manage Files</span>
            </button>
            <button 
              onClick={() => {
                setShowDatabaseInfo(!showDatabaseInfo);
                setShowUploadModal(false);
                setShowFileManager(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              <span>📊</span>
              <span>Database Information</span>
            </button>
          </div>
        )}

        {/* Upload Modal - Admin Only */}
        {isAdmin && showUploadModal && (
          <div className="mb-8">
            <MultiFileUpload onClose={() => setShowUploadModal(false)} />
          </div>
        )}

        {/* File Manager Modal - Admin Only */}
        {isAdmin && showFileManager && (
          <div className="mb-8">
            <FileManager onClose={() => setShowFileManager(false)} />
          </div>
        )}

        {/* Database Info Modal */}
        {showDatabaseInfo && (
          <div className="mb-8">
            <DatabaseInfo onClose={() => setShowDatabaseInfo(false)} />
          </div>
        )}

        {/* User Management Modal - Admin Only */}
        {isAdmin && showUserManagement && (
          <div className="mb-8">
            <UserManagement onClose={() => setShowUserManagement(false)} />
          </div>
        )}

        {/* Change Password Modal */}
        {showChangePassword && (
          <ChangePassword onClose={() => setShowChangePassword(false)} />
        )}

        {/* Main Content with Sidebar Layout */}
        <div className="flex flex-col lg:flex-row gap-6 relative">
          {/* Left Sidebar - Fixed/Sticky on Desktop, Stacked on Mobile - Recent & Suggested Queries */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-8 space-y-4 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2">
              {/* Saved Queries */}
              {savedQueries.length > 0 && (
                <div className="bg-[#252d47] rounded-lg border border-[#3d4571] p-4">
                  <button
                    onClick={() => setShowSavedQueries(!showSavedQueries)}
                    className="flex items-center gap-2 mb-3 w-full group"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="4" y="4" width="16" height="16" rx="2"/>
                      <rect x="8" y="4" width="8" height="6" fill="currentColor" opacity="0.3"/>
                      <rect x="10" y="14" width="4" height="4" fill="currentColor"/>
                    </svg>
                    <h3 className="text-lg font-medium text-gray-300">Saved Queries</h3>
                    <span className="text-xs text-gray-500">
                      {savedQueries.length}/10
                    </span>
                    <span className="text-gray-400 text-xl ml-auto transition-transform duration-200 group-hover:text-gray-300" style={{ transform: showSavedQueries ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      ▼
                    </span>
                  </button>
                  {showSavedQueries && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                      {savedQueries.map((q, i) => (
                        <div key={i} className="relative group">
                          <button
                            onClick={() => handleQuery(q)}
                            disabled={isLoading}
                            className="w-full text-left px-3 py-2 pr-8 bg-[#1a1f3a] hover:bg-[#2d3454] border border-[#3d4571] text-gray-300 text-sm font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50"
                          >
                            {q}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSavedQuery(q);
                            }}
                            className="absolute right-2 top-2 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove from saved queries"
                          >
                            <span className="text-lg">×</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recent Queries */}
              {recentQueries.length > 0 && (
                <div className="bg-gradient-to-br from-blue-800/30 to-sky-800/30 rounded-lg border border-blue-500/40 p-4">
                  <button
                    onClick={() => setShowRecentQueries(!showRecentQueries)}
                    className="flex items-center gap-2 mb-3 w-full group"
                  >
                    <span className="text-xl">🕐</span>
                    <h3 className="text-lg font-medium text-sky-300">Recent Queries</h3>
                    <span className="text-sky-300 text-xl ml-auto transition-transform duration-200 group-hover:text-sky-200" style={{ transform: showRecentQueries ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      ▼
                    </span>
                  </button>
                  {showRecentQueries && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                      {recentQueries.slice(0, 4).map((q, i) => (
                        <div key={i} className="relative group">
                          <button
                            onClick={() => handleQuery(q)}
                            disabled={isLoading}
                            className="w-full text-left px-3 py-2 pr-8 bg-blue-900/40 hover:bg-blue-800/50 border border-blue-500/50 text-sky-100 text-sm font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50"
                          >
                            {q}
                          </button>
                          {!savedQueries.includes(q) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveQuery(q);
                              }}
                              className="absolute right-2 top-2 text-sky-300 hover:text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Save this query (up to 10 queries)"
                            >
                              <span className="text-lg font-bold">+</span>
                            </button>
                          )}
                          {savedQueries.includes(q) && (
                            <span
                              className="absolute right-2 top-2 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Already saved"
                            >
                              <span className="text-lg">⭐</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Suggested Prompts */}
              <div className="bg-[#252d47] rounded-lg border border-[#3d4571] p-4">
                <button
                  onClick={() => setShowSuggestedPrompts(!showSuggestedPrompts)}
                  className="flex items-center gap-2 mb-3 w-full group"
                >
                  <span className="text-xl">💡</span>
                  <h3 className="text-lg font-medium text-gray-400">Suggested Prompts</h3>
                  <span className="text-gray-400 text-xl ml-auto transition-transform duration-200 group-hover:text-gray-300" style={{ transform: showSuggestedPrompts ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </button>
                {showSuggestedPrompts && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                  <button
                    onClick={() => {
                      const query = "Show me all entries that have the InContext category and do not have captions.";
                      setCurrentQuery(query);
                      handleQuery(query);
                    }}
                    disabled={isLoading}
                    className="w-full text-left px-3 py-2 bg-[#1a1f3a] hover:bg-[#2d3454] border border-[#3d4571] text-gray-300 text-sm font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    Entries without captions
                  </button>
                  <button
                    onClick={() => {
                      const query = "Show me all entries that do not have audio descriptions and were created in the past 7 years.";
                      setCurrentQuery(query);
                      handleQuery(query);
                    }}
                    disabled={isLoading}
                    className="w-full text-left px-3 py-2 bg-[#1a1f3a] hover:bg-[#2d3454] border border-[#3d4571] text-gray-300 text-sm font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    No audio descriptions
                  </button>
                  <button
                    onClick={() => {
                      const query = "Show me all entries that have captions that are less than 95% accurate and have more than 100 plays.";
                      setCurrentQuery(query);
                      handleQuery(query);
                    }}
                    disabled={isLoading}
                    className="w-full text-left px-3 py-2 bg-[#1a1f3a] hover:bg-[#2d3454] border border-[#3d4571] text-gray-300 text-sm font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    Low caption accuracy
                  </button>
                  <button
                    onClick={() => {
                      const query = "Show me all entries owned by professor@university.com that do not have captions.";
                      setCurrentQuery(query);
                      handleQuery(query);
                    }}
                    disabled={isLoading}
                    className="w-full text-left px-3 py-2 bg-[#1a1f3a] hover:bg-[#2d3454] border border-[#3d4571] text-gray-300 text-sm font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    Owner-specific queries
                  </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Query Form */}
            <QueryForm 
              onSubmit={handleQuery} 
              isLoading={isLoading}
              initialQuery={currentQuery}
              onStop={handleStopQuery}
            />

            {/* Results with Tabs (includes AI Insights) */}
            <ResultsView 
              results={results} 
              insights={insights} 
              executiveSummary={executiveSummary} 
              query={currentQuery}
              aggregations={aggregations}
              totalCount={totalCount}
              sql={sql}
            />

            {/* Conversation Log */}
            <ConversationLog conversation={conversation} />
          </div>
        </div>
      </div>
    </div>
  );
}