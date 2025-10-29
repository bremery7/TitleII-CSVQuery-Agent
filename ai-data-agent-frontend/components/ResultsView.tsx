'use client';

import { useState, useEffect, useRef } from 'react';
import ResultsTable from './ResultsTable';
import ComplianceDashboard from './ComplianceDashboard';

interface ResultsViewProps {
  results: any[];
  insights?: string | null;
  executiveSummary?: string | null;
  query?: string;
}

export default function ResultsView({ results, insights, executiveSummary, query }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('chart');
  const [exporting, setExporting] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Reset to chart view and scroll to results when they update
    if (results.length > 0) {
      setActiveTab('chart');
      
      if (resultsRef.current) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
      }
    }
  }, [results]);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF;
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default;
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Data Analysis Report', 105, yPosition, { align: 'center' });
      yPosition += 10;
      
      // Metadata
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 105, yPosition, { align: 'center' });
      yPosition += 5;
      pdf.text(`Total Records: ${results.length}`, 105, yPosition, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      yPosition += 15;

      // Build professional PDF from data if on chart tab
      if (activeTab === 'chart') {
        try {
          console.log('Attempting to build compliance PDF...', { hasExecutiveSummary: !!executiveSummary, resultsCount: results.length });
          // Use the new clean PDF builder
          const { buildCompliancePDF } = await import('../utils/pdfBuilder');
          const compilancePdf = await buildCompliancePDF(
            executiveSummary || 'No executive summary available', 
            results,
            query || 'No query specified'
          );
          compilancePdf.save(`Title_II_Compliance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
          setExporting(false);
          return;
        } catch (pdfError) {
          console.error('PDF generation failed:', pdfError);
          alert(`PDF generation failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
          setExporting(false);
          return;
        }
      }

      // Summary Statistics for table export
      if (results.length > 0) {
        if (yPosition > 240) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Summary', 14, yPosition);
        yPosition += 8;

        // Calculate some basic stats
        const columns = Object.keys(results[0]);
        const numericColumns = columns.filter(col => {
          const sampleVal = results[0][col];
          return typeof sampleVal === 'number' || !isNaN(Number(sampleVal));
        });

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        // Create summary boxes
        const boxWidth = 85;
        const boxHeight = 15;
        let xPos = 14;
        
        // Total Records Box
        pdf.setFillColor(59, 130, 246);
        pdf.rect(xPos, yPosition, boxWidth, boxHeight, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Total Records', xPos + 5, yPosition + 6);
        pdf.setFontSize(16);
        pdf.text(String(results.length), xPos + 5, yPosition + 12);
        
        xPos += boxWidth + 8;
        
        // Columns Box
        pdf.setFillColor(80, 200, 120);
        pdf.rect(xPos, yPosition, boxWidth, boxHeight, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Data Columns', xPos + 5, yPosition + 6);
        pdf.setFontSize(16);
        pdf.text(String(columns.length), xPos + 5, yPosition + 12);
        
        yPosition += boxHeight + 12;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

        // Column names
        pdf.setFont('helvetica', 'bold');
        pdf.text('Available Columns:', 14, yPosition);
        yPosition += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        
        const columnText = columns.join(', ');
        const splitText = pdf.splitTextToSize(columnText, 180);
        pdf.text(splitText, 14, yPosition);
        yPosition += (splitText.length * 5) + 10;
      }

      // Sample Data Table
      if (results.length > 0) {
        if (yPosition > 220) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Sample Data (Top 20 Records)', 14, yPosition);
        yPosition += 8;

        // Select most important columns (limit to 6 for readability)
        const allColumns = Object.keys(results[0]);
        const importantColumns = allColumns
          .filter(col => !col.toLowerCase().includes('id') || col === 'entry_id')
          .slice(0, 6);

        const columns = importantColumns.map(key => ({
          header: key.replace(/_/g, ' ').toUpperCase(),
          dataKey: key,
        }));

        const limitedResults = results.slice(0, 20);
        const rows = limitedResults.map(row => {
          const rowData: any = {};
          importantColumns.forEach(key => {
            let value = row[key];
            if (value !== null && value !== undefined) {
              value = String(value);
              // Truncate long values
              if (value.length > 30) {
                value = value.substring(0, 27) + '...';
              }
            } else {
              value = '-';
            }
            rowData[key] = value;
          });
          return rowData;
        });

        autoTable(pdf, {
          startY: yPosition,
          columns: columns,
          body: rows,
          styles: {
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak',
            cellWidth: 'wrap',
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9,
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250],
          },
          margin: { left: 14, right: 14 },
          tableWidth: 'auto',
          columnStyles: importantColumns.reduce((acc, col, idx) => {
            acc[col] = { cellWidth: 'auto' };
            return acc;
          }, {} as any),
        });

        const finalY = (pdf as any).lastAutoTable.finalY + 8;
        
        if (finalY < 280) {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100, 100, 100);
          
          if (results.length > 20) {
            pdf.text(`Showing 20 of ${results.length} total records. `, 14, finalY);
          }
          if (allColumns.length > importantColumns.length) {
            pdf.text(`Displaying ${importantColumns.length} of ${allColumns.length} columns for readability.`, 14, finalY + 4);
          }
        }
      }

      pdf.save(`data-analysis-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <div ref={resultsRef} className="mb-8 scroll-mt-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-4 border-b border-[#3d4571]">
        <button
          onClick={() => setActiveTab('table')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'table'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>📊</span>
            <span>Table View</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('chart')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'chart'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>📈</span>
            <span>Chart View</span>
          </span>
        </button>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-sm text-gray-400">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div ref={contentRef} className="transition-opacity duration-200">
        {activeTab === 'table' ? (
          <>
            <ResultsTable results={results} />
          </>
        ) : (
          <>
            {/* Executive Summary under Chart View */}
            {executiveSummary && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-lg p-6 border border-slate-600/50 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-500 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📊</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        Executive Summary
                        <span className="text-xs font-normal text-gray-300 bg-slate-700/80 px-2 py-1 rounded">
                          Title II Compliance Status
                        </span>
                      </h3>
                      <div className="text-gray-100 leading-relaxed">
                        {executiveSummary}
                      </div>
                      <div className="mt-3 text-xs text-gray-400">
                        Content inventory and accessibility metrics for institutional compliance review. WCAG 2.1 AA compliance deadline: April 24, 2026.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <ComplianceDashboard 
              data={results} 
              onChartRefReady={(ref) => { chartRef.current = ref; }}
              onExportPDF={handleExportPDF}
              isExporting={exporting}
            />
          </>
        )}
      </div>
    </div>
  );
}
