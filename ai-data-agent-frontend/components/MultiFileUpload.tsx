'use client';

import { useState, useRef } from 'react';

interface MultiFileUploadProps {
  onClose: () => void;
}

export default function MultiFileUpload({ onClose }: MultiFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: string }>({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files).filter(f => f.name.endsWith('.csv'));
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'));
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const newProgress: { [key: string]: string } = {};

    for (const file of selectedFiles) {
      try {
        newProgress[file.name] = 'Uploading...';
        setUploadProgress({ ...newProgress });

        const formData = new FormData();
        formData.append('csvFile', file);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/upload`, {
          method: 'POST',
          body: formData,
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned an invalid response');
        }

        const data = await response.json();
        if (data.success) {
          newProgress[file.name] = '✅ Success';
        } else {
          newProgress[file.name] = '❌ Failed: ' + (data.message || data.error);
        }
      } catch (error) {
        newProgress[file.name] = '❌ Error: ' + (error instanceof Error ? error.message : String(error));
      }
      setUploadProgress({ ...newProgress });
    }

    setUploading(false);
    
    // Show summary
    const successCount = Object.values(newProgress).filter(v => v.includes('✅')).length;
    const failCount = selectedFiles.length - successCount;
    
    if (failCount === 0) {
      alert(`✅ Successfully uploaded ${successCount} file(s)!`);
      setSelectedFiles([]);
      setUploadProgress({});
      // Auto-close modal after successful upload
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      alert(`Upload complete: ${successCount} succeeded, ${failCount} failed. Check the status below.`);
    }
  };

  return (
    <div className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium text-white">Upload CSV Files</h2>
        <div className="flex items-center gap-3">
          {selectedFiles.length > 0 && (
            <button
              onClick={handleUploadAll}
              disabled={uploading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium shadow-lg"
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-[#3d4571] bg-[#1a1f3a]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="text-6xl mb-3">📁</div>
        <div className="text-gray-300 text-lg mb-2">
          Drag & drop CSV files here
        </div>
        <div className="text-gray-500 text-sm mb-4">or</div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
        >
          Browse Files
        </button>
        <div className="text-xs text-gray-500 mt-3">
          Supports multiple CSV files up to 500MB each
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#3d4571]">
            <h3 className="text-base font-medium text-white">
              Selected Files ({selectedFiles.length})
            </h3>
            <span className="text-sm text-gray-400">
              Ready to upload
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-[#1a1f3a] border border-[#3d4571] rounded-lg"
              >
                <span className="text-2xl">📄</span>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-200 font-medium truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </div>
                  {uploadProgress[file.name] && (
                    <div className="text-xs mt-1 text-gray-400">
                      {uploadProgress[file.name]}
                    </div>
                  )}
                </div>
                {!uploading && (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
