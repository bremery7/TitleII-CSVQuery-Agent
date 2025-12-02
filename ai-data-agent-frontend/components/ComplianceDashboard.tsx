'use client';

import { useMemo, useRef, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface ComplianceDashboardProps {
  data: any[];
  aggregations?: any;
  totalCount?: number;
  onChartRefReady?: (ref: HTMLDivElement | null) => void;
  onExportPDF?: () => void;
  isExporting?: boolean;
}

const COLORS = {
  machine: '#4a90e2',
  human: '#50c878',
  none: '#ff6b6b',
  ead: '#ffd93d',
  ad: '#a78bfa',
  good: '#50c878',
  poor: '#ff6b6b',
  medium: '#ffd93d'
};

export default function ComplianceDashboard({ data, aggregations, totalCount, onChartRefReady, onExportPDF, isExporting }: ComplianceDashboardProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onChartRefReady && chartRef.current) {
      onChartRefReady(chartRef.current);
    }
  }, [onChartRefReady]);

  // Use server-side aggregations if available, otherwise calculate client-side
  const useServerAggregations = aggregations && totalCount;

  // Caption Analysis - use server aggregations if available
  const captionData = useMemo(() => {
    if (useServerAggregations && aggregations?.captionData) {
      return {
        ...aggregations.captionData,
        total: totalCount
      };
    }

    // Fallback to client-side calculation
    const hasCaptions = (row: any) => {
      const captionFields = [
        row.captions_language,
        row.CAPTIONS_LANGUAGE,
        row.caption_language,
        row.captions_usage_type,
        row.CAPTIONS_USAGE_TYPE,
        row.caption_type
      ];
      return captionFields.some(field => 
        field && 
        field !== null && 
        field !== '-' &&
        String(field).trim() !== '' &&
        String(field).toLowerCase() !== 'none'
      );
    };

    const getAccuracy = (row: any) => {
      const accuracyField = row.captions_accuracy || row.CAPTIONS_ACCURACY || row.caption_accuracy || '0';
      return parseFloat(String(accuracyField).replace('%', ''));
    };

    const isMachine = (row: any) => {
      const creationMode = row.captions_creation_mode || row.CAPTIONS_CREATION_MODE || '';
      return String(creationMode).toLowerCase() === 'machine';
    };

    const isHuman = (row: any) => {
      const creationMode = row.captions_creation_mode || row.CAPTIONS_CREATION_MODE || '';
      return String(creationMode).toLowerCase() === 'human' ||
             String(creationMode).toLowerCase() === 'upload';
    };

    const machineAccurate = data.filter(row => 
      hasCaptions(row) && isMachine(row) && getAccuracy(row) >= 95
    ).length;
    
    const machinePoor = data.filter(row => 
      hasCaptions(row) && isMachine(row) && getAccuracy(row) < 95
    ).length;
    
    const humanAccurate = data.filter(row => 
      hasCaptions(row) && isHuman(row) && getAccuracy(row) >= 95
    ).length;
    
    const humanPoor = data.filter(row => 
      hasCaptions(row) && isHuman(row) && getAccuracy(row) < 95
    ).length;
    
    const noCaptions = data.filter(row => !hasCaptions(row)).length;

    return {
      machineAccurate,
      machinePoor,
      humanAccurate,
      humanPoor,
      noCaptions,
      withCaptions: data.length - noCaptions,
      total: data.length
    };
  }, [data, useServerAggregations, aggregations, totalCount]);

  // Audio Description Analysis - use server aggregations if available
  const audioDescData = useMemo(() => {
    if (useServerAggregations && aggregations?.audioDescData) {
      return {
        ...aggregations.audioDescData,
        total: totalCount
      };
    }

    // Fallback to client-side calculation
    const hasEADField = (row: any) => {
      const eadField = row.has_ead || row.HAS_EAD || row.is_ead || row.IS_EAD || row.ead || row.EAD;
      return eadField === true || 
             eadField === 'true' || 
             eadField === 1 ||
             String(eadField).toLowerCase() === 'yes' ||
             String(eadField).toLowerCase() === 'true';
    };

    const hasADField = (row: any) => {
      const adField = row.has_audio_description_flavor || row.HAS_AUDIO_DESCRIPTION_FLAVOR || row.has_ad || row.HAS_AD || row.ad || row.AD;
      return adField === true || 
             adField === 'true' || 
             adField === 1 ||
             String(adField).toLowerCase() === 'yes' ||
             String(adField).toLowerCase() === 'true';
    };

    const hasEAD = data.filter(row => hasEADField(row)).length;
    const hasAD = data.filter(row => hasADField(row)).length;
    const noEAD = data.length - hasEAD;
    const noAD = data.length - hasAD;

    return {
      hasEAD,
      noEAD,
      hasAD,
      noAD,
      total: data.length
    };
  }, [data, useServerAggregations, aggregations, totalCount]);

  // Caption Accuracy Distribution - use server aggregations if available
  const accuracyDistribution = useMemo(() => {
    if (useServerAggregations && aggregations?.accuracyDistribution) {
      // Add colors to server data
      return aggregations.accuracyDistribution.map((item: any, index: number) => ({
        ...item,
        color: ['#ff6b6b', '#ffd93d', '#a78bfa', '#50c878'][index]
      }));
    }

    // Fallback to client-side calculation
    const getAccuracy = (row: any) => {
      const accuracyField = row.captions_accuracy || row.CAPTIONS_ACCURACY || row.caption_accuracy || '0';
      return parseFloat(String(accuracyField).replace('%', ''));
    };

    const hasCaptions = (row: any) => {
      const captionFields = [
        row.captions_language,
        row.CAPTIONS_LANGUAGE,
        row.caption_language,
        row.captions_usage_type,
        row.CAPTIONS_USAGE_TYPE,
        row.caption_type
      ];
      return captionFields.some(field => 
        field && 
        field !== null && 
        field !== '-' &&
        String(field).trim() !== '' &&
        String(field).toLowerCase() !== 'none'
      );
    };

    const captionedData = data.filter(row => hasCaptions(row));

    return [
      { 
        range: '80-85%', 
        count: captionedData.filter(row => {
          const acc = getAccuracy(row);
          return acc >= 80 && acc < 85;
        }).length,
        color: '#ff6b6b'
      },
      { 
        range: '85-90%', 
        count: captionedData.filter(row => {
          const acc = getAccuracy(row);
          return acc >= 85 && acc < 90;
        }).length,
        color: '#ffd93d'
      },
      { 
        range: '90-95%', 
        count: captionedData.filter(row => {
          const acc = getAccuracy(row);
          return acc >= 90 && acc < 95;
        }).length,
        color: '#a78bfa'
      },
      { 
        range: '95-100%', 
        count: captionedData.filter(row => {
          const acc = getAccuracy(row);
          return acc >= 95;
        }).length,
        color: '#50c878'
      }
    ];
  }, [data, useServerAggregations, aggregations]);

  // Pie chart data
  const machineCaptionPieData = [
    { name: 'Accurate (≥95%)', value: captionData.machineAccurate, color: COLORS.good },
    { name: 'Poor (<95%)', value: captionData.machinePoor, color: COLORS.poor }
  ];

  const humanCaptionPieData = [
    { name: 'Accurate (≥95%)', value: captionData.humanAccurate, color: COLORS.good },
    { name: 'Poor (<95%)', value: captionData.humanPoor, color: COLORS.poor }
  ];

  const noCaptionsPieData = [
    { name: 'Has Captions', value: data.length - captionData.noCaptions, color: COLORS.good },
    { name: 'No Captions', value: captionData.noCaptions, color: COLORS.none }
  ];

  const eadPieData = [
    { name: 'Has EAD', value: audioDescData.hasEAD, color: COLORS.good },
    { name: 'No EAD', value: audioDescData.noEAD, color: COLORS.none }
  ];

  const adPieData = [
    { name: 'Has AD', value: audioDescData.hasAD, color: COLORS.good },
    { name: 'No AD', value: audioDescData.noAD, color: COLORS.none }
  ];

  // Bar chart data - Overall compliance (captions must have ≥95% accuracy to be compliant)
  const overallComplianceData = [
    { 
      name: 'Captions', 
      compliant: captionData.machineAccurate + captionData.humanAccurate,
      nonCompliant: captionData.machinePoor + captionData.humanPoor + captionData.noCaptions
    },
    { 
      name: 'EAD', 
      compliant: audioDescData.hasEAD,
      nonCompliant: audioDescData.noEAD
    },
    { 
      name: 'AD', 
      compliant: audioDescData.hasAD,
      nonCompliant: audioDescData.noAD
    }
  ];

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div ref={chartRef} className="space-y-6 mt-8">
      {/* Header */}
      <div className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-white">📊 Title II Compliance Dashboard</h2>
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
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-[#1f2640] p-4 rounded-md border border-[#3d4571]">
            <div className="text-gray-400 text-sm">Total Entries</div>
            <div className="text-2xl font-semibold text-white">{(totalCount || data.length).toLocaleString()}</div>
          </div>
          <div className="bg-[#1f2640] p-4 rounded-md border border-[#3d4571]">
            <div className="text-gray-400 text-sm">With Captions</div>
            <div className="text-2xl font-semibold text-green-400">{(captionData.withCaptions || (totalCount || data.length) - captionData.noCaptions).toLocaleString()}</div>
          </div>
          <div className="bg-[#1f2640] p-4 rounded-md border border-[#3d4571]">
            <div className="text-gray-400 text-sm">No Captions</div>
            <div className="text-2xl font-semibold text-red-400">{captionData.noCaptions.toLocaleString()}</div>
          </div>
          <div className="bg-[#1f2640] p-4 rounded-md border border-[#3d4571]">
            <div className="text-gray-400 text-sm">With EAD</div>
            <div className="text-2xl font-semibold text-green-400">{audioDescData.hasEAD.toLocaleString()}</div>
          </div>
          <div className="bg-[#1f2640] p-4 rounded-md border border-[#3d4571]">
            <div className="text-gray-400 text-sm">With AD</div>
            <div className="text-2xl font-semibold text-green-400">{audioDescData.hasAD.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Overall Compliance Bar Chart */}
      <div className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
        <h3 className="text-lg font-medium text-white mb-4">Overall Compliance Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={overallComplianceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3d4571" />
            <XAxis dataKey="name" stroke="#e0e0e0" />
            <YAxis stroke="#e0e0e0" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1f3a', 
                border: '2px solid #4a90e2',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}
              labelStyle={{ 
                color: '#ffffff', 
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}
              itemStyle={{
                color: '#e0e0e0',
                fontSize: '13px'
              }}
            />
            <Legend wrapperStyle={{ color: '#e0e0e0' }} />
            <Bar dataKey="compliant" fill={COLORS.good} name="Compliant" stackId="a" />
            <Bar dataKey="nonCompliant" fill={COLORS.none} name="Non-Compliant" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Caption Accuracy Distribution */}
      <div className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
        <h3 className="text-lg font-medium text-white mb-4">Caption Accuracy Distribution</h3>
        <p className="text-sm text-gray-400 mb-6">Distribution of caption accuracy across all entries with captions</p>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={accuracyDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3d4571" />
            <XAxis 
              dataKey="range" 
              stroke="#e0e0e0"
              label={{ value: 'Accuracy Range', position: 'insideBottom', offset: -5, fill: '#e0e0e0' }}
            />
            <YAxis 
              stroke="#e0e0e0"
              label={{ value: 'Number of Entries', angle: -90, position: 'insideLeft', fill: '#e0e0e0' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1f3a', 
                border: '2px solid #4a90e2',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}
              labelStyle={{ 
                color: '#ffffff', 
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}
              itemStyle={{
                color: '#e0e0e0',
                fontSize: '13px'
              }}
            />
            <Bar dataKey="count" name="Entries" radius={[8, 8, 0, 0]}>
              {accuracyDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {accuracyDistribution.map((entry, index) => (
            <div key={index} className="bg-[#1f2640] p-3 rounded-md border border-[#3d4571]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-gray-300 text-sm font-medium">{entry.range}</span>
              </div>
              <div className="text-white text-xl font-semibold">{entry.count}</div>
              <div className="text-gray-400 text-xs">entries</div>
            </div>
          ))}
        </div>
      </div>

      {/* Caption Compliance - Pie Charts */}
      <div className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
        <h3 className="text-lg font-medium text-white mb-6">Caption Compliance (WCAG 1.2.2)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Machine Captions */}
          <div className="bg-[#1f2640] rounded-lg p-6 border border-[#3d4571]">
            <h4 className="text-md font-medium text-gray-300 mb-6 text-center">Machine Captions</h4>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={machineCaptionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {machineCaptionPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1f3a', 
                      border: '2px solid #4a90e2',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {machineCaptionPieData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-gray-300">{entry.name}</span>
                  </div>
                  <span className="text-white font-semibold">{entry.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#3d4571] flex justify-between text-sm">
                <span className="text-gray-400">Total</span>
                <span className="text-gray-300 font-semibold">{captionData.machineAccurate + captionData.machinePoor}</span>
              </div>
            </div>
          </div>

          {/* Human Captions */}
          <div className="bg-[#1f2640] rounded-lg p-6 border border-[#3d4571]">
            <h4 className="text-md font-medium text-gray-300 mb-6 text-center">Human Captions</h4>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={humanCaptionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {humanCaptionPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1f3a', 
                      border: '2px solid #4a90e2',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {humanCaptionPieData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-gray-300">{entry.name}</span>
                  </div>
                  <span className="text-white font-semibold">{entry.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#3d4571] flex justify-between text-sm">
                <span className="text-gray-400">Total</span>
                <span className="text-gray-300 font-semibold">{captionData.humanAccurate + captionData.humanPoor}</span>
              </div>
            </div>
          </div>

          {/* No Captions */}
          <div className="bg-[#1f2640] rounded-lg p-6 border border-[#3d4571]">
            <h4 className="text-md font-medium text-gray-300 mb-6 text-center">Caption Status</h4>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={noCaptionsPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {noCaptionsPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1f3a', 
                      border: '2px solid #4a90e2',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {noCaptionsPieData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-gray-300">{entry.name}</span>
                  </div>
                  <span className="text-white font-semibold">{entry.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#3d4571] flex justify-between text-sm">
                <span className="text-gray-400">Total</span>
                <span className="text-gray-300 font-semibold">{data.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Description Compliance - Pie Charts */}
      <div className="bg-[#252d47] rounded-lg p-6 border border-[#3d4571]">
        <h3 className="text-lg font-medium text-white mb-6">Audio Description Compliance (WCAG 1.2.5)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* EAD */}
          <div className="bg-[#1f2640] rounded-lg p-6 border border-[#3d4571]">
            <h4 className="text-md font-medium text-gray-300 mb-6 text-center">Extended Audio Description (EAD)</h4>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={eadPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {eadPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1f3a', 
                      border: '2px solid #4a90e2',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {eadPieData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-gray-300">{entry.name}</span>
                  </div>
                  <span className="text-white font-semibold">{entry.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#3d4571] flex justify-between text-sm">
                <span className="text-gray-400">Total</span>
                <span className="text-gray-300 font-semibold">{data.length}</span>
              </div>
            </div>
          </div>

          {/* AD */}
          <div className="bg-[#1f2640] rounded-lg p-6 border border-[#3d4571]">
            <h4 className="text-md font-medium text-gray-300 mb-6 text-center">Audio Description (AD)</h4>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={adPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {adPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1f3a', 
                      border: '2px solid #4a90e2',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {adPieData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-gray-300">{entry.name}</span>
                  </div>
                  <span className="text-white font-semibold">{entry.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#3d4571] flex justify-between text-sm">
                <span className="text-gray-400">Total</span>
                <span className="text-gray-300 font-semibold">{data.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
