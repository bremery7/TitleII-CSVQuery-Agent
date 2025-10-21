'use client';

import { useState } from 'react';

interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'user';
  createdAt: string;
  isSuperAdmin?: boolean;
}

interface EditUserModalProps {
  user: User;
  currentUserRole: 'admin' | 'user';
  currentUserId?: string;
  isSuperAdmin?: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function EditUserModal({ user, currentUserRole, currentUserId, isSuperAdmin, onClose, onSave }: EditUserModalProps) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email || '');
  const [role, setRole] = useState(user.role);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEditingAdmin = user.role === 'admin';
  const canChangePassword = !isEditingAdmin || isSuperAdmin; // Super admins can change admin passwords
  const isEditingSelf = user.id === currentUserId;
  const canChangeRole = !isEditingSelf; // Can't change own role

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updates: any = {
        username,
        email: email || undefined,
        role,
      };

      // Only include password if provided and user is not an admin
      if (newPassword && canChangePassword) {
        updates.password = newPassword;
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSave();
          onClose();
        }, 1500);
      } else {
        if (data.details) {
          setError(data.details.join('. '));
        } else {
          setError(data.error || 'Failed to update user');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#252d47] rounded-lg p-8 max-w-md w-full border border-[#3d4571] shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Edit User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-4">
            ✓ User updated successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {isEditingAdmin && !isSuperAdmin && (
              <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-4 py-3 rounded-lg text-sm">
                ⚠️ Only super admins can change passwords for admin users. Regular admins must use "Change Password" or "Forgot Password".
              </div>
            )}

            {isEditingAdmin && isSuperAdmin && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
                ✓ As a super admin, you can change this admin's password.
              </div>
            )}

            {isEditingSelf && (
              <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 px-4 py-3 rounded-lg text-sm">
                ℹ️ You are editing your own account. You cannot change your own role.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#1a1f3a] border border-[#3d4571] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-[#1a1f3a] border border-[#3d4571] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                className="w-full px-4 py-2 bg-[#1a1f3a] border border-[#3d4571] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !canChangeRole}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              {!canChangeRole && (
                <p className="text-xs text-gray-400 mt-1">
                  You cannot change your own role
                </p>
              )}
            </div>

            {canChangePassword && (
              <>
                <div className="border-t border-[#3d4571] pt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1a1f3a] border border-[#3d4571] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave blank to keep current password"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Leave blank to keep the current password
                  </p>
                </div>

                {newPassword && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-gray-300">
                    <p className="font-semibold text-blue-400 mb-2">Password Requirements:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>At least 8 characters long</li>
                      <li>At least one uppercase letter (A-Z)</li>
                      <li>At least one lowercase letter (a-z)</li>
                      <li>At least one number (0-9)</li>
                      <li>At least one special character (!@#$%^&*)</li>
                    </ul>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
