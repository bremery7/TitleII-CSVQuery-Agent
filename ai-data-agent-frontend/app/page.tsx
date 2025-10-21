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
  const [showFileManager, setShowFileManager] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDatabaseInfo, setShowDatabaseInfo] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Check if database is empty on initial load (admin only)
  useEffect(() => {
    if (status !== 'authenticated' || !isAdmin) return;
    
    const checkDatabase = async () => {
      try {
        const response = await fetch('/api/database-info');
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
    
    // Add to recent queries
    setRecentQueries(prev => {
      const updated = [query, ...prev.filter(q => q !== query)];
      return updated.slice(0, 5);
    });

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      setResults(data.results || []);
      setConversation(data.conversation || []);
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await fetch('/api/upload', {
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
        <div className="max-w-7xl mx-auto px-4 py-6">
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
      <div className="max-w-7xl mx-auto px-4 py-8">
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

        {/* Query Form with Recent Queries */}
        <QueryForm 
          onSubmit={handleQuery} 
          isLoading={isLoading} 
          recentQueries={recentQueries}
        />

        {/* Results with Tabs */}
        <ResultsView results={results} />

        {/* Conversation Log */}
        <ConversationLog conversation={conversation} />
      </div>
    </div>
  );
}