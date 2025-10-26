'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface DataVisualizationProps {
  data: any[];
  onChartRefReady?: (ref: HTMLDivElement | null) => void;
  onExportPDF?: () => void;
  isExporting?: boolean;
}

const COLORS = ['#4a90e2', '#50c878', '#ff6b6b', '#ffd93d', '#a78bfa', '#fb923c'];

export default function DataVisualization({ data, onChartRefReady, onExportPDF, isExporting }: DataVisualizationProps) {
  const [groupBy, setGroupBy] = useState<string>('category');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [binSize, setBinSize] = useState<number>(1);
  const chartRef = useRef<HTMLDivElement>(null);

  // Expose chart ref to parent
  useEffect(() => {
    if (onChartRefReady && chartRef.current) {
      onChartRefReady(chartRef.current);
    }
  }, [onChartRefReady]);

  // ADD SAFETY CHECK - Don't render if no data
  if (!data || data.length === 0) {
    return null;
  }

  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  
  // Detect column types
  const columnTypes = useMemo(() => {
    if (data.length === 0) return {};
    const types: Record<string, 'string' | 'number' | 'date'> = {};
    
    columns.forEach(col => {
      const sampleValues = data.slice(0, 100).map(row => row[col]).filter(v => v != null);
      if (sampleValues.length === 0) {
        types[col] = 'string';
        return;
      }
      
      // Check if numeric (including percentage strings like "95%")
      const numericValues = sampleValues.filter(v => {
        if (typeof v === 'number') return true;
        const strVal = String(v).replace('%', '').trim();
        return !isNaN(Number(strVal));
      });
      if (numericValues.length / sampleValues.length > 0.8) {
        types[col] = 'number';
      } else {
        types[col] = 'string';
      }
    });
    
    return types;
  }, [data, columns]);
  
  const groupableColumns = columns.filter(col =>
    !col.includes('id') &&
    !col.includes('_at')
  );
  
  const isNumericColumn = columnTypes[groupBy] === 'number';

  const chartData = useMemo(() => {
    if (isNumericColumn) {
      // Numeric binning (handle percentage strings)
      const values = data.map(row => {
        const val = row[groupBy];
        if (typeof val === 'number') return val;
        const strVal = String(val).replace('%', '').trim();
        return parseFloat(strVal);
      }).filter(v => !isNaN(v));
      
      if (values.length === 0) return [];
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      
      // Determine appropriate bin size
      let effectiveBinSize = binSize;
      if (range <= 100 && range > 0) {
        // For percentage-like data (0-100), use selected bin size
        effectiveBinSize = binSize;
      } else if (range > 0) {
        // For other ranges, create ~20 bins
        effectiveBinSize = Math.ceil(range / 20);
      }
      
      const bins: Record<string, number> = {};
      
      values.forEach(val => {
        const binStart = Math.floor(val / effectiveBinSize) * effectiveBinSize;
        const binEnd = binStart + effectiveBinSize;
        const binLabel = `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`;
        bins[binLabel] = (bins[binLabel] || 0) + 1;
      });
      
      return Object.entries(bins)
        .map(([name, value]) => ({ 
          name, 
          value,
          sortKey: parseFloat(name.split('-')[0])
        }))
        .sort((a, b) => b.sortKey - a.sortKey) // Sort descending (highest first)
        .slice(0, 50); // Show up to 50 bins
    } else {
      // String grouping with case-insensitive consolidation and comma-separated handling
      const counts: Record<string, number> = {};
      const caseMap: Record<string, string> = {}; // Map lowercase to original case
      
      data.forEach(row => {
        let value = row[groupBy];
        
        if (!value || value === null || value === undefined) {
          value = 'Unknown';
        } else {
          value = String(value).trim();
        }
        
        // Split by comma and process each category
        const categories = value.split(',').map((cat: string) => cat.trim()).filter((cat: string) => cat.length > 0);
        
        // Use a Set to deduplicate categories within this row (case-insensitive)
        const uniqueCategories = new Set<string>();
        const categoryMap: Record<string, string> = {};
        
        categories.forEach((cat: string) => {
          const lowerCat = cat.toLowerCase();
          if (!uniqueCategories.has(lowerCat)) {
            uniqueCategories.add(lowerCat);
            categoryMap[lowerCat] = cat; // Keep original case
          }
        });
        
        // Count each unique category once per row
        uniqueCategories.forEach(lowerCat => {
          // Keep track of the first occurrence's case for display
          if (!caseMap[lowerCat]) {
            caseMap[lowerCat] = categoryMap[lowerCat];
          }
          
          counts[lowerCat] = (counts[lowerCat] || 0) + 1;
        });
      });

      return Object.entries(counts)
        .map(([lowerName, value]) => ({ 
          name: caseMap[lowerName], // Use original case for display
          value,
          sortKey: (() => {
            // Try to extract numeric value for sorting (e.g., "95%" -> 95)
            const numMatch = caseMap[lowerName].match(/([0-9.]+)/);
            return numMatch ? parseFloat(numMatch[1]) : 0;
          })()
        }))
        .sort((a, b) => {
          // If values look numeric, sort by numeric value (descending)
          // Otherwise sort by count (descending)
          const aHasNum = !isNaN(a.sortKey) && a.sortKey > 0;
          const bHasNum = !isNaN(b.sortKey) && b.sortKey > 0;
          if (aHasNum && bHasNum) {
            return b.sortKey - a.sortKey; // Sort by numeric value descending
          }
          return b.value - a.value; // Sort by count descending
        })
        .slice(0, 10);
    }
  }, [data, groupBy, isNumericColumn, binSize]);

  const stats = useMemo(() => {
    return {
      total: data.length,
      uniqueValues: new Set(data.map(row => row[groupBy])).size,
      topValue: chartData[0]?.name || 'N/A',
      topCount: chartData[0]?.value || 0
    };
  }, [data, groupBy, chartData]);

  return (
    <div className="space-y-6 mt-8">
      <div className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-white">📊 Data Visualization</h2>
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              <span>📄</span>
              <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 mb-2">Group By:</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full px-4 py-2 bg-[#1f2640] border border-[#3d4571] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {groupableColumns.map(col => (
                <option key={col} value={col}>
                  {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} {columnTypes[col] === 'number' ? '(Numeric)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Chart Type:</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="w-full px-4 py-2 bg-[#1f2640] border border-[#3d4571] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>

          {isNumericColumn && (
            <div>
              <label className="block text-gray-300 mb-2">Bin Size (%):</label>
              <select
                value={binSize}
                onChange={(e) => setBinSize(Number(e.target.value))}
                className="w-full px-4 py-2 bg-[#1f2640] border border-[#3d4571] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0.5">0.5%</option>
                <option value="1">1%</option>
                <option value="2">2%</option>
                <option value="5">5%</option>
                <option value="10">10%</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-[#1f2640] p-4 rounded-md border border-[#3d4571]">
            <div className="text-gray-400 text-sm">Total Entries</div>
            <div className="text-2xl font-semibold text-white">{stats.total}</div>
          </div>
          <div className="bg-[#1f2640] p-4 rounded-md border border-[#3d4571]">
            <div className="text-gray-400 text-sm">Unique {groupBy.replace(/_/g, ' ')}</div>
            <div className="text-2xl font-semibold text-white">{stats.uniqueValues}</div>
          </div>
          <div className="bg-[#1f2640] p-4 rounded-md border border-[#3d4571]">
            <div className="text-gray-400 text-sm">Top Value</div>
            <div className="text-lg font-semibold text-white truncate">{stats.topValue}</div>
          </div>
          <div className="bg-[#1f2640] p-4 rounded-md border border-[#3d4571]">
            <div className="text-gray-400 text-sm">Top Count</div>
            <div className="text-2xl font-semibold text-white">{stats.topCount}</div>
          </div>
        </div>
      </div>

      <div ref={chartRef} className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
        <h3 className="text-lg font-medium text-white mb-4">
          {chartData.length > 0 
            ? isNumericColumn 
              ? `Distribution by ${groupBy.replace(/_/g, ' ')} (${chartData.length} bins)` 
              : `Top 10 ${groupBy.replace(/_/g, ' ')}`
            : 'No Data'
          }
        </h3>
        
        {chartData.length > 0 ? (
          <>
            {chartType === 'bar' && (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3d4571" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#e0e0e0"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="#e0e0e0" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#252d47', 
                      border: '1px solid #3d4571',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#e0e0e0' }}
                  />
                  <Legend wrapperStyle={{ color: '#e0e0e0' }} />
                  <Bar dataKey="value" fill="#4a90e2" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartType === 'line' && (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3d4571" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#e0e0e0"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="#e0e0e0" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#252d47', 
                      border: '1px solid #3d4571',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#e0e0e0' }}
                  />
                  <Legend wrapperStyle={{ color: '#e0e0e0' }} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#4a90e2" 
                    strokeWidth={2}
                    name="Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {chartType === 'pie' && (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#252d47', 
                      border: '1px solid #3d4571',
                      borderRadius: '8px',
                      color: '#e0e0e0'
                    }}
                    itemStyle={{ color: '#e0e0e0' }}
                    labelStyle={{ color: '#e0e0e0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </>
        ) : (
          <div className="text-center text-gray-400 py-20">No data to visualize</div>
        )}
      </div>

      <div className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
        <h3 className="text-lg font-medium text-white mb-4">Breakdown by {groupBy.replace(/_/g, ' ')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#2d3561] to-[#3d4571]">
                <th className="px-4 py-3 text-left text-blue-400 font-semibold">
                  {groupBy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </th>
                <th className="px-4 py-3 text-left text-blue-400 font-semibold">Count</th>
                <th className="px-4 py-3 text-left text-blue-400 font-semibold">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((item, idx) => (
                <tr key={idx} className="border-b border-[#3d4571] hover:bg-[#2d3561]">
                  <td className="px-4 py-3 text-gray-300">{item.name}</td>
                  <td className="px-4 py-3 text-gray-300">{item.value}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {((item.value / stats.total) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}