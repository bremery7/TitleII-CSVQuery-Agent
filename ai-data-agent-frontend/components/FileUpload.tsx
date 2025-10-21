'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  onClose: () => void;
  onUpload: (file: File) => void;
}

export default function FileUpload({ onClose, onUpload }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-white">Upload CSV File</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-[#3d4571] rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {selectedFile ? (
            <div className="space-y-3">
              <div className="text-green-400 text-xl">✓ File Selected</div>
              <div className="text-gray-300 text-lg font-medium">{selectedFile.name}</div>
              <div className="text-sm text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </div>
              <div className="flex gap-2 justify-center mt-4">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
                <button
                  onClick={() => setSelectedFile(null)}
                  disabled={uploading}
                  className="px-6 py-2 bg-[#1a1f3a] hover:bg-[#2d3454] border border-[#3d4571] text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-6xl">📁</div>
              <div className="text-gray-300 text-lg">
                Click to select a CSV file to upload
              </div>
              <div className="text-sm text-gray-500">
                Supported format: .csv
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Choose File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}