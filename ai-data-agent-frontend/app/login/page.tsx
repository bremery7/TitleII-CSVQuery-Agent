'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

interface SSOStatus {
  ssoEnabled: boolean;
  provider: 'azure-ad' | null;
  localAuthEnabled: boolean;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ssoStatus, setSsoStatus] = useState<SSOStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [timeoutMessage, setTimeoutMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check for timeout parameter in URL
    const params = new URLSearchParams(window.location.search);
    const timeout = params.get('timeout');
    if (timeout === 'idle') {
      setTimeoutMessage('Your session expired due to inactivity. Please log in again.');
    } else if (timeout === 'absolute') {
      setTimeoutMessage('Your session expired after 8 hours. Please log in again.');
    }

    // Load SSO status
    setLoadingStatus(true);
    fetch('/api/sso-status')
      .then(res => res.json())
      .then(data => {
        console.log('SSO Status received:', data);
        setSsoStatus(data);
      })
      .catch(err => {
        console.error('Failed to load SSO status:', err);
        // Default to local auth enabled on error
        setSsoStatus({
          ssoEnabled: false,
          provider: null,
          localAuthEnabled: true,
        });
      })
      .finally(() => setLoadingStatus(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting NextAuth login...');
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
        callbackUrl: '/',
      });

      console.log('SignIn result:', result);

      if (result?.error || !result?.ok) {
        console.log('Login failed:', result?.error || 'Unknown error');
        setError('Invalid username or password');
      } else {
        console.log('Login successful, redirecting...');
        // Use window.location for hard redirect to ensure session is recognized
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Login exception:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAzureSignIn = async () => {
    try {
      setLoading(true);
      await signIn('azure-ad', { callbackUrl: '/' });
    } catch (err) {
      console.error('Azure sign-in error:', err);
      setError('Azure sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1729] via-[#1a1f3a] to-[#0f1729] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#252d47] rounded-lg p-8 border border-[#3d4571] shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">AI Data Agent</h1>
            <p className="text-gray-400">Sign in to continue</p>
          </div>

          {loadingStatus ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-400 mt-4">Loading...</p>
            </div>
          ) : (
          <div className="space-y-6">
            {timeoutMessage && (
              <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{timeoutMessage}</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Azure AD SSO Button */}
            {ssoStatus?.ssoEnabled && ssoStatus?.provider === 'azure-ad' && (
              <>
                <button
                  type="button"
                  onClick={handleAzureSignIn}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-white hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-3 border border-gray-300"
                >
                  <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                    <path d="M0 0h10.931v10.931H0V0z" fill="#f25022"/>
                    <path d="M12.069 0H23v10.931H12.069V0z" fill="#7fba00"/>
                    <path d="M0 12.069h10.931V23H0V12.069z" fill="#00a4ef"/>
                    <path d="M12.069 12.069H23V23H12.069V12.069z" fill="#ffb900"/>
                  </svg>
                  Sign in with Microsoft
                </button>

                {ssoStatus?.localAuthEnabled && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#3d4571]"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-[#252d47] text-gray-400">Or continue with username</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Local Auth Form */}
            {ssoStatus?.localAuthEnabled && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#1a1f3a] border border-[#3d4571] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#1a1f3a] border border-[#3d4571] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* Show message if both SSO and local auth are disabled */}
            {!ssoStatus?.ssoEnabled && !ssoStatus?.localAuthEnabled && (
              <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-4 py-3 rounded-lg text-sm text-center">
                Authentication is currently unavailable. Please contact your administrator.
              </div>
            )}

            {ssoStatus?.localAuthEnabled && (
              <>
                <div className="mt-6 text-center">
                  <button
                    onClick={() => router.push('/forgot-password')}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>

              </>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
