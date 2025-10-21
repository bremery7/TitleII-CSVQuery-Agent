'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login...');
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful, redirecting...');
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Invalid username or password');
      }
    } catch (err) {
      console.error('Login exception:', err);
      setError('An error occurred. Please try again.');
    } finally {
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

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

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/forgot-password')}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Forgot your password?
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p className="font-semibold mb-2">Default Credentials:</p>
            <div className="space-y-1 text-xs">
              <p className="text-gray-500">
                <span className="text-yellow-400 font-semibold">Super Admin:</span> superadmin / SuperAdmin123!
              </p>
              <p className="text-gray-500">
                <span className="text-blue-400 font-semibold">Admin:</span> admin / Admin123!
              </p>
              <p className="text-gray-500">
                <span className="text-gray-400 font-semibold">User:</span> user / User123!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
