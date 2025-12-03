'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function BrandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [logo, setLogo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      
      // Load current logo
      fetchLogo();
    }
  }, [status, session, router]);

  const fetchLogo = async () => {
    try {
      const response = await fetch('/api/branding/logo');
      if (response.ok) {
        const data = await response.json();
        setLogo(data.logoUrl);
      }
    } catch (error) {
      console.error('Failed to fetch logo:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!previewUrl) return;

    setUploading(true);
    try {
      const response = await fetch('/api/branding/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoData: previewUrl })
      });

      if (response.ok) {
        const data = await response.json();
        setLogo(data.logoUrl);
        setPreviewUrl(null);
        alert('Logo uploaded successfully!');
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove the logo?')) return;

    try {
      const response = await fetch('/api/branding/logo', {
        method: 'DELETE'
      });

      if (response.ok) {
        setLogo(null);
        alert('Logo removed successfully!');
      } else {
        alert('Failed to remove logo');
      }
    } catch (error) {
      console.error('Remove error:', error);
      alert('Failed to remove logo');
    }
  };

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
            onClick={() => router.push('/manage')}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
          >
            ← Back to Management
          </button>
        </div>

        <div className="bg-[#252d47] rounded-lg p-8 border border-[#3d4571] shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">Branding</h1>
          <p className="text-gray-400 mb-8">Upload and manage your organization's logo</p>

          {/* Current Logo */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Current Logo</h2>
            <div className="bg-[#1a1f3a] border border-[#3d4571] rounded-lg p-6 flex items-center justify-center min-h-[200px]">
              {logo ? (
                <div className="text-center">
                  <div className="relative w-64 h-32 mb-4">
                    <Image
                      src={logo}
                      alt="Organization Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <button
                    onClick={handleRemove}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Remove Logo
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No logo uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload New Logo */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Upload New Logo</h2>
            <div className="bg-[#1a1f3a] border border-[#3d4571] rounded-lg p-6">
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Select Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full px-4 py-2 bg-[#252d47] border border-[#3d4571] rounded-lg text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Recommended: PNG or SVG format, transparent background, max 2MB
                </p>
              </div>

              {previewUrl && (
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Preview</label>
                  <div className="bg-[#252d47] border border-[#3d4571] rounded-lg p-4 flex items-center justify-center min-h-[150px]">
                    <div className="relative w-48 h-24">
                      <Image
                        src={previewUrl}
                        alt="Logo Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={!previewUrl || uploading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </button>
                {previewUrl && (
                  <button
                    onClick={() => setPreviewUrl(null)}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
