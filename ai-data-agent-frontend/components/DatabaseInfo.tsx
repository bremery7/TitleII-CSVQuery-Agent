'use client';

import { useState, useEffect } from 'react';

interface DatabaseInfoProps {
  onClose: () => void;
}

export default function DatabaseInfo({ onClose }: DatabaseInfoProps) {
  const [dbInfo, setDbInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const fetchDatabaseInfo = async () => {
    try {
      const response = await fetch('/api/database-info');
      if (!response.ok) {
        throw new Error('Failed to fetch database info');
      }
      const data = await response.json();
      setDbInfo(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch database info:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-white">Database Information</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading database info...</div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <div className="text-red-400 font-medium mb-2">Error Loading Database Info</div>
          <div className="text-red-300 text-sm">{error}</div>
          <div className="text-gray-400 text-xs mt-2">
            Make sure your backend has a /api/database-info endpoint
          </div>
        </div>
      ) : dbInfo ? (
        <div className="space-y-4">
          {/* Tables Section */}
          {dbInfo.tables && Array.isArray(dbInfo.tables) && dbInfo.tables.length > 0 ? (
            <div className="bg-[#1a1f3a] rounded-lg p-4 border border-[#3d4571]">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Tables ({dbInfo.tables.length})</h3>
              <div className="space-y-2">
                {dbInfo.tables.map((table: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-gray-300">
                    <span>📊</span>
                    <span>{table}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1f3a] rounded-lg p-4 border border-[#3d4571]">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Tables</h3>
              <div className="text-gray-500 text-sm">No tables found</div>
            </div>
          )}

          {/* Columns Section */}
          {dbInfo.columns && Array.isArray(dbInfo.columns) && dbInfo.columns.length > 0 ? (
            <div className="bg-[#1a1f3a] rounded-lg p-4 border border-[#3d4571]">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Columns ({dbInfo.columns.length})</h3>
              <div className="flex flex-wrap gap-2">
                {dbInfo.columns.map((col: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[#252d47] border border-[#3d4571] text-gray-300 text-sm rounded"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Row Count */}
          {dbInfo.rowCount !== undefined && (
            <div className="bg-[#1a1f3a] rounded-lg p-4 border border-[#3d4571]">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Total Rows</h3>
              <div className="text-2xl text-white font-semibold">{dbInfo.rowCount.toLocaleString()}</div>
            </div>
          )}

          {/* Debug: Show raw data */}
          <details className="bg-[#1a1f3a] rounded-lg p-4 border border-[#3d4571]">
            <summary className="text-sm font-medium text-gray-400 cursor-pointer">Raw Data (Debug)</summary>
            <pre className="mt-2 text-xs text-gray-400 overflow-auto">
              {JSON.stringify(dbInfo, null, 2)}
            </pre>
          </details>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          No database information available
        </div>
      )}
    </div>
  );
}