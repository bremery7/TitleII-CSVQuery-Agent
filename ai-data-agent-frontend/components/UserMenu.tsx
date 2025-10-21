'use client';

import { useState, useRef, useEffect } from 'react';

interface UserMenuProps {
  username: string;
  role: 'admin' | 'user';
  onChangePassword: () => void;
  onLogout: () => void;
}

export default function UserMenu({ username, role, onChangePassword, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#1a1f3a] hover:bg-[#252d47] border border-[#3d4571] rounded-lg transition-colors duration-200"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="text-left">
          <div className="text-white font-medium text-sm">{username}</div>
          {role === 'admin' && (
            <div className="text-xs text-blue-400">Admin</div>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#252d47] border border-[#3d4571] rounded-lg shadow-2xl overflow-hidden z-50">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-[#3d4571]">
            <div className="text-sm text-gray-400">Signed in as</div>
            <div className="text-white font-medium">{username}</div>
            {role === 'admin' && (
              <div className="mt-1 inline-block px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
                Administrator
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onChangePassword();
              }}
              className="w-full px-4 py-2 text-left text-gray-300 hover:bg-[#1a1f3a] hover:text-white transition-colors duration-150 flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>Change Password</span>
            </button>

            <div className="border-t border-[#3d4571] my-2"></div>

            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-150 flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
