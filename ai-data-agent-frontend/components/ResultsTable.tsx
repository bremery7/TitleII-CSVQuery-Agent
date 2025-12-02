'use client';

import { useState } from 'react';

interface ResultsTableProps {
  results: any[];
  totalCount?: number;
  sql?: string;
}

export default function ResultsTable({ results, totalCount, sql }: ResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const rowsPerPage = 10;

  if (!results || results.length === 0) {
    return null;
  }

  const columns = Object.keys(results[0]);
  
  // Calculate pagination
  const totalPages = Math.ceil((totalCount || results.length) / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRows = results.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const exportToSpreadsheet = async () => {
    // If we have SQL, call backend API to export all rows
    if (sql) {
      setIsExporting(true);
      try {
        console.log('[Export] Starting export with SQL:', sql.substring(0, 100) + '...');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        console.log('[Export] API URL:', apiUrl);
        
        // Add timeout for large exports (5 minutes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000);
        
        const response = await fetch(`${apiUrl}/api/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('[Export] Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('[Export] Error response:', errorData);
          throw new Error(errorData.error || 'Export failed');
        }

        // Download the file
        const blob = await response.blob();
        console.log('[Export] Blob size:', blob.size, 'bytes');
        
        // Detect file type from response
        const contentType = response.headers.get('content-type');
        const isCSV = contentType?.includes('csv');
        const extension = isCSV ? 'csv' : 'xlsx';
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query-results-${new Date().toISOString().split('T')[0]}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log('[Export] Download initiated successfully');
      } catch (error) {
        console.error('[Export] Export failed:', error);
        if (error instanceof Error && error.name === 'AbortError') {
          alert('Export timed out. The dataset is very large. Please try a more specific query or contact support.');
        } else {
          alert(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`);
        }
      } finally {
        setIsExporting(false);
      }
    } else {
      // Fallback: export preview data as CSV
      const columns = Object.keys(results[0]);
      const csv = [
        columns.join(','),
        ...results.map(row => 
          columns.map(col => {
            const value = row[col];
            const stringValue = value !== null && value !== undefined ? String(value) : '';
            return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query-results-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-white">
          Query Results ({(totalCount || results.length).toLocaleString()} total rows)
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={exportToSpreadsheet}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
          >
            <span>📊</span>
            <span>{isExporting ? 'Exporting...' : 'Export to Spreadsheet'}</span>
          </button>
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1}-{Math.min(endIndex, results.length)} of {(totalCount || results.length).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-[#252d47] rounded-lg border border-[#3d4571] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1a1f3a] border-b border-[#3d4571]">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3d4571]">
              {currentRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#2d3454] transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {startIndex + idx + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-3 text-sm text-gray-300">
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-[#1a1f3a] px-4 py-3 border-t border-[#3d4571]">
            <div className="flex items-center justify-between">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm bg-[#252d47] hover:bg-[#2d3454] disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded-lg border border-[#3d4571] transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {/* First page */}
                {currentPage > 2 && (
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      className="px-3 py-1 text-sm bg-[#252d47] hover:bg-[#2d3454] text-gray-300 rounded border border-[#3d4571]"
                    >
                      1
                    </button>
                    {currentPage > 3 && <span className="text-gray-500">...</span>}
                  </>
                )}

                {/* Current page and neighbors */}
                {[currentPage - 1, currentPage, currentPage + 1].map(page => {
                  if (page < 1 || page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 text-sm rounded border transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-[#252d47] hover:bg-[#2d3454] text-gray-300 border-[#3d4571]'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                {/* Last page */}
                {currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && <span className="text-gray-500">...</span>}
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="px-3 py-1 text-sm bg-[#252d47] hover:bg-[#2d3454] text-gray-300 rounded border border-[#3d4571]"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm bg-[#252d47] hover:bg-[#2d3454] disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded-lg border border-[#3d4571] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}