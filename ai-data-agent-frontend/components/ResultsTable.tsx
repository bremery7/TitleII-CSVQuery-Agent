'use client';

import { useState } from 'react';

interface ResultsTableProps {
  results: any[];
}

export default function ResultsTable({ results }: ResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  if (!results || results.length === 0) {
    return null;
  }

  const columns = Object.keys(results[0]);
  
  // Calculate pagination
  const totalPages = Math.ceil(results.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRows = results.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const exportToSpreadsheet = () => {
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
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-white">
          Query Results ({results.length} total rows)
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={exportToSpreadsheet}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
          >
            <span>📊</span>
            <span>Export to Spreadsheet</span>
          </button>
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1}-{Math.min(endIndex, results.length)} of {results.length}
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