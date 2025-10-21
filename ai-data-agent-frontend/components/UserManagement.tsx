'use client';

import { useState, useEffect } from 'react';
import EditUserModal from './EditUserModal';
import { useSession } from '@/hooks/useSession';

interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'user';
  createdAt: string;
  isSuperAdmin?: boolean;
}

interface UserManagementProps {
  onClose: () => void;
}

export default function UserManagement({ onClose }: UserManagementProps) {
  const { session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'user' as 'admin' | 'user',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('User created successfully!');
        setFormData({ username: '', password: '', email: '', role: 'user' });
        setShowCreateForm(false);
        fetchUsers();
      } else {
        alert('Failed to create user: ' + data.error);
      }
    } catch (error) {
      alert('Failed to create user: ' + error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('User deleted successfully!');
        fetchUsers();
      } else {
        const data = await response.json();
        alert('Failed to delete user: ' + data.error);
      }
    } catch (error) {
      alert('Failed to delete user: ' + error);
    }
  };

  return (
    <div className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-medium text-white">👥 User Management</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Create User Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ Create New User'}
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-[#1a1f3a] rounded-lg border border-[#3d4571]">
          <h3 className="text-lg font-medium text-white mb-4">Create New User</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 bg-[#252d47] border border-[#3d4571] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 bg-[#252d47] border border-[#3d4571] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-[#252d47] border border-[#3d4571] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
                className="w-full px-4 py-2 bg-[#252d47] border border-[#3d4571] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">Regular User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Create User
            </button>
          </div>
        </form>
      )}

      {/* Users List */}
      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading users...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1f3a] border-b border-[#3d4571]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Username</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3d4571]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#2d3454] transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-300">{user.username}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{user.email || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.role === 'admin' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-600 text-white'
                      }`}>
                        {user.role}
                      </span>
                      {user.isSuperAdmin && (
                        <span className="px-2 py-1 rounded text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold">
                          SUPER ADMIN
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {user.isSuperAdmin ? (
                      <span className="text-xs text-gray-500 italic">Protected</span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center text-gray-400 py-8">No users found</div>
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          currentUserRole={session?.role || 'user'}
          currentUserId={session?.userId}
          isSuperAdmin={session?.isSuperAdmin}
          onClose={() => setEditingUser(null)}
          onSave={() => {
            fetchUsers();
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}
