'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ManagePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (userRole !== 'admin') {
        router.push('/');
        return;
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f1729] via-[#1a1f3a] to-[#0f1729] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1729] via-[#1a1f3a] to-[#0f1729] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
          >
            ← Back to Home
          </button>
        </div>

        <div className="bg-[#252d47] rounded-lg p-8 border border-[#3d4571] shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">Management</h1>
          <p className="text-gray-400 mb-8">Manage users, authentication, and system settings</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Management Card */}
            <button
              onClick={() => router.push('/manage/users')}
              className="bg-[#1a1f3a] hover:bg-[#252d47] border border-[#3d4571] rounded-lg p-6 text-left transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-600/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">User Management</h3>
              <p className="text-gray-400 text-sm">Add, edit, and remove users. Manage user roles and permissions.</p>
            </button>

            {/* Branding Card */}
            <button
              onClick={() => router.push('/manage/branding')}
              className="bg-[#1a1f3a] hover:bg-[#252d47] border border-[#3d4571] rounded-lg p-6 text-left transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-600/20 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Branding</h3>
              <p className="text-gray-400 text-sm">Upload and manage your organization's logo and branding.</p>
            </button>

            {/* SSO Configuration Card */}
            <button
              onClick={() => router.push('/manage/sso')}
              className="bg-[#1a1f3a] hover:bg-[#252d47] border border-[#3d4571] rounded-lg p-6 text-left transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-600/20 rounded-lg">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">SSO Configuration</h3>
              <p className="text-gray-400 text-sm">Configure Single Sign-On with Microsoft Azure AD (Entra ID).</p>
            </button>

            {/* System Settings Card (Placeholder) */}
            <button
              onClick={() => alert('System settings coming soon!')}
              className="bg-[#1a1f3a] hover:bg-[#252d47] border border-[#3d4571] rounded-lg p-6 text-left transition-colors group opacity-60 cursor-not-allowed"
              disabled
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gray-600/20 rounded-lg">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">System Settings</h3>
              <p className="text-gray-400 text-sm">Configure application settings and preferences. (Coming Soon)</p>
            </button>

            {/* Audit Logs Card (Placeholder) */}
            <button
              onClick={() => alert('Audit logs coming soon!')}
              className="bg-[#1a1f3a] hover:bg-[#252d47] border border-[#3d4571] rounded-lg p-6 text-left transition-colors group opacity-60 cursor-not-allowed"
              disabled
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-yellow-600/20 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Audit Logs</h3>
              <p className="text-gray-400 text-sm">View system activity and user actions. (Coming Soon)</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
