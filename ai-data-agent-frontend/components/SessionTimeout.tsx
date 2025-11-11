'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before timeout

export default function SessionTimeout() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Reset activity timer on user interaction
  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  // Track user activity
  useEffect(() => {
    if (status !== 'authenticated') return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [status, resetTimer]);

  // Check for idle timeout
  useEffect(() => {
    if (status !== 'authenticated') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const remaining = IDLE_TIMEOUT - timeSinceActivity;

      // Show warning 2 minutes before timeout
      if (remaining <= WARNING_TIME && remaining > 0) {
        setShowWarning(true);
        setTimeLeft(Math.ceil(remaining / 1000));
      }

      // Logout when timeout is reached
      if (remaining <= 0) {
        console.log('Session expired due to inactivity');
        signOut({ callbackUrl: '/login?timeout=idle' });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, lastActivity]);

  // Handle manual logout
  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  // Handle extend session
  const handleExtend = () => {
    resetTimer();
    // Trigger a session refresh by making a request
    fetch('/api/auth/session').then(() => {
      console.log('Session extended');
    });
  };

  if (!showWarning || status !== 'authenticated') return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1f3a] border-2 border-yellow-500 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-yellow-500 text-3xl">⚠️</div>
          <h2 className="text-xl font-bold text-white">Session Expiring Soon</h2>
        </div>
        
        <p className="text-gray-300 mb-4">
          Your session will expire due to inactivity in:
        </p>
        
        <div className="bg-[#252d47] rounded-lg p-4 mb-6 text-center">
          <div className="text-4xl font-bold text-yellow-400">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-400 mt-1">minutes remaining</div>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Click "Stay Logged In" to continue your session, or you will be automatically logged out.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleExtend}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Stay Logged In
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
}
