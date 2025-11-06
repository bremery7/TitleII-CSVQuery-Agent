'use client';

import { useState, useEffect } from 'react';

interface FileManagerProps {
  onClose: () => void;
}

interface FileInfo {
  name: string;
  size?: number;
  uploadedAt?: string;
}

export default function FileManager({ onClose }: FileManagerProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/files`);
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };


  const toggleFileSelection = (filename: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filename)) {
      newSelected.delete(filename);
    } else {
      newSelected.add(filename);
    }
    setSelectedFiles(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.name)));
    }
  };

  const handleDelete = async () => {
    if (selectedFiles.size === 0) return;

    const confirmMessage = selectedFiles.size === 1
      ? `Are you sure you want to delete "${Array.from(selectedFiles)[0]}"?`
      : `Are you sure you want to delete ${selectedFiles.size} files?`;

    if (!confirm(confirmMessage)) return;

    setDeleting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: Array.from(selectedFiles) })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully deleted ${selectedFiles.size} file(s)`);
        setSelectedFiles(new Set());
        await fetchFiles(); // Refresh the list
      } else {
        alert('Failed to delete files: ' + data.error);
      }
    } catch (error) {
      alert('Failed to delete files: ' + error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-white">Manage Files</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading files...</div>
      ) : files.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📁</div>
          <div className="text-gray-400">No files uploaded yet</div>
          <div className="text-sm text-gray-500 mt-2">
            Use the "Upload CSV" button to add files
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header with Select All and Delete Button */}
          <div className="flex items-center justify-between pb-3 border-b border-[#3d4571]">
            <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={selectedFiles.size === files.length && files.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-[#3d4571] bg-[#1a1f3a] text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">
                Select All ({files.length})
              </span>
            </label>

            <button
              onClick={handleDelete}
              disabled={selectedFiles.size === 0 || deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
            >
              <span>🗑️</span>
              <span>
                {deleting
                  ? 'Deleting...'
                  : `Delete ${selectedFiles.size > 0 ? `(${selectedFiles.size})` : ''}`
                }
              </span>
            </button>
          </div>

          {/* File List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {files.map((file) => (
              <label
                key={file.name}
                className="flex items-center gap-3 p-3 bg-[#1a1f3a] hover:bg-[#2d3454] border border-[#3d4571] rounded-lg cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.name)}
                  onChange={() => toggleFileSelection(file.name)}
                  className="w-4 h-4 rounded border-[#3d4571] bg-[#252d47] text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📄</span>
                    <span className="text-gray-200 font-medium truncate">
                      {file.name}
                    </span>
                  </div>
                  {file.size && (
                    <div className="text-xs text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                      {file.uploadedAt && ` • Uploaded ${file.uploadedAt}`}
                    </div>
                  )}
                </div>

                {selectedFiles.has(file.name) && (
                  <div className="text-blue-400 text-xl">✓</div>
                )}
              </label>
            ))}
          </div>

          {/* Footer Info */}
          <div className="pt-3 border-t border-[#3d4571] text-sm text-gray-400">
            {selectedFiles.size > 0 ? (
              <span className="text-blue-400">
                {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
              </span>
            ) : (
              <span>Select files to delete them</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}