import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ComplianceData {
  totalEntries: number;
  withCaptions: number;
  noCaptions: number;
  machineAccurate: number;
  machinePoor: number;
  humanAccurate: number;
  humanPoor: number;
  withEAD: number;
  withAD: number;
}

export async function buildCompliancePDF(
  executiveSummary: string,
  results: any[],
  query: string = 'No query specified'
): Promise<jsPDF> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPosition = 0;

  // Helper function to add header
  const addHeader = (title: string, isFirst: boolean = false) => {
    pdf.setFillColor(41, 98, 255);
    pdf.rect(0, 0, 210, isFirst ? 30 : 20, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(isFirst ? 20 : 14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 105, isFirst ? 15 : 12, { align: 'center' });
    
    if (isFirst) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('WCAG 2.1 AA Accessibility Analysis', 105, 23, { align: 'center' });
    }
    
    pdf.setTextColor(0, 0, 0);
    return isFirst ? 40 : 30;
  };

  // Add first page header
  yPosition = addHeader('Title II ADA Compliance Report', true);

  // Add query question
  pdf.setFillColor(240, 248, 255);
  pdf.rect(15, yPosition, 180, 12, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(60, 60, 60);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Query:', 20, yPosition + 4);
  pdf.setFont('helvetica', 'normal');
  const queryLines = pdf.splitTextToSize(query, 160);
  pdf.text(queryLines, 20, yPosition + 8);
  yPosition += 12 + (queryLines.length > 1 ? (queryLines.length - 1) * 4 : 0);
  yPosition += 5;

  // Add metadata
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, yPosition, { align: 'center' });
  yPosition += 5;
  pdf.text(`Total Records Analyzed: ${results.length.toLocaleString()}`, 105, yPosition, { align: 'center' });
  yPosition += 12;

  // Add Executive Summary section
  pdf.setFillColor(245, 245, 245);
  pdf.rect(15, yPosition, 180, 8, 'F');
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', 20, yPosition + 6);
  yPosition += 12;

  // Add executive summary text with better formatting
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(50, 50, 50);
  
  // Split text into paragraphs first
  const paragraphs = executiveSummary.split('\n').filter(p => p.trim().length > 0);
  
  paragraphs.forEach((paragraph: string) => {
    const lines = pdf.splitTextToSize(paragraph.trim(), 170);
    
    lines.forEach((line: string) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = addHeader('Title II ADA Compliance Report (continued)');
      }
      pdf.text(line, 20, yPosition);
      yPosition += 5;
    });
    
    // Add space between paragraphs
    yPosition += 3;
  });

  pdf.setTextColor(0, 0, 0);
  yPosition += 5;

  // Calculate compliance metrics from results
  const metrics = calculateMetrics(results);

  // Add Compliance Dashboard section
  if (yPosition > 200) {
    pdf.addPage();
    yPosition = addHeader('Title II ADA Compliance Report (continued)');
  }

  pdf.setFillColor(245, 245, 245);
  pdf.rect(15, yPosition, 180, 8, 'F');
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Title II Compliance Dashboard', 20, yPosition + 6);
  yPosition += 15;

  // Add metrics boxes
  const boxWidth = 35;
  const boxHeight = 20;
  const boxSpacing = 37;
  let xPos = 15;

  const metricsToShow = [
    { label: 'Total Entries', value: metrics.totalEntries, color: [100, 100, 100] },
    { label: 'With Captions', value: metrics.withCaptions, color: [34, 197, 94] },
    { label: 'No Captions', value: metrics.noCaptions, color: [239, 68, 68] },
    { label: 'With EAD', value: metrics.withEAD, color: [59, 130, 246] },
    { label: 'With AD', value: metrics.withAD, color: [20, 184, 166] },
  ];

  metricsToShow.forEach((metric, index) => {
    if (index > 0 && index % 5 === 0) {
      xPos = 15;
      yPosition += boxHeight + 5;
    }

    // Draw box
    pdf.setFillColor(250, 250, 250);
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(xPos, yPosition, boxWidth, boxHeight, 'FD');

    // Label
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(metric.label, xPos + boxWidth / 2, yPosition + 6, { align: 'center' });

    // Value
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
    pdf.text(metric.value.toLocaleString(), xPos + boxWidth / 2, yPosition + 15, { align: 'center' });
    pdf.setFont('helvetica', 'normal');

    xPos += boxSpacing;
  });

  yPosition += boxHeight + 15;

  // Add compliance breakdown
  if (yPosition > 220) {
    pdf.addPage();
    yPosition = addHeader('Title II ADA Compliance Report (continued)');
  }

  pdf.setFillColor(245, 245, 245);
  pdf.rect(15, yPosition, 180, 8, 'F');
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Compliance Breakdown', 20, yPosition + 6);
  yPosition += 15;

  // Compliance table
  const tableData = [
    ['Caption Type', 'Accurate (>=95%)', 'Poor (<95%)', 'Total', 'Compliance %'],
    [
      'Machine Captions',
      metrics.machineAccurate.toLocaleString(),
      metrics.machinePoor.toLocaleString(),
      (metrics.machineAccurate + metrics.machinePoor).toLocaleString(),
      metrics.machineAccurate + metrics.machinePoor > 0
        ? `${((metrics.machineAccurate / (metrics.machineAccurate + metrics.machinePoor)) * 100).toFixed(1)}%`
        : 'N/A'
    ],
    [
      'Human Captions',
      metrics.humanAccurate.toLocaleString(),
      metrics.humanPoor.toLocaleString(),
      (metrics.humanAccurate + metrics.humanPoor).toLocaleString(),
      metrics.humanAccurate + metrics.humanPoor > 0
        ? `${((metrics.humanAccurate / (metrics.humanAccurate + metrics.humanPoor)) * 100).toFixed(1)}%`
        : 'N/A'
    ],
    [
      'No Captions',
      '-',
      '-',
      metrics.noCaptions.toLocaleString(),
      '0%'
    ],
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [41, 98, 255], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      4: { halign: 'center' }
    },
    margin: { left: 15, right: 15 },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 15;

  // Add visual charts section
  if (yPosition > 200) {
    pdf.addPage();
    yPosition = addHeader('Title II ADA Compliance Report (continued)');
  }

  pdf.setFillColor(245, 245, 245);
  pdf.rect(15, yPosition, 180, 8, 'F');
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Overall Compliance Status', 20, yPosition + 6);
  yPosition += 15;

  // Draw simple bar chart for compliance
  const barChartData = [
    { label: 'Captions', compliant: metrics.machineAccurate + metrics.humanAccurate, nonCompliant: metrics.machinePoor + metrics.humanPoor + metrics.noCaptions },
    { label: 'EAD', compliant: metrics.withEAD, nonCompliant: metrics.totalEntries - metrics.withEAD },
    { label: 'AD', compliant: metrics.withAD, nonCompliant: metrics.totalEntries - metrics.withAD },
  ];

  const barWidth = 50;
  const barSpacing = 10;
  const maxBarHeight = 60;
  const chartStartX = 20;
  let chartX = chartStartX;

  barChartData.forEach((item) => {
    const total = item.compliant + item.nonCompliant;
    const compliantHeight = total > 0 ? (item.compliant / total) * maxBarHeight : 0;
    const nonCompliantHeight = total > 0 ? (item.nonCompliant / total) * maxBarHeight : 0;

    // Draw compliant (green) bar
    pdf.setFillColor(34, 197, 94);
    pdf.rect(chartX, yPosition + maxBarHeight - compliantHeight, barWidth, compliantHeight, 'F');

    // Draw non-compliant (red) bar
    pdf.setFillColor(239, 68, 68);
    pdf.rect(chartX, yPosition, barWidth, nonCompliantHeight, 'F');

    // Label
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.label, chartX + barWidth / 2, yPosition + maxBarHeight + 8, { align: 'center' });

    // Values
    pdf.setFontSize(8);
    if (compliantHeight > 8) {
      pdf.setTextColor(255, 255, 255);
      pdf.text(item.compliant.toString(), chartX + barWidth / 2, yPosition + maxBarHeight - compliantHeight / 2, { align: 'center' });
    }
    if (nonCompliantHeight > 8) {
      pdf.setTextColor(255, 255, 255);
      pdf.text(item.nonCompliant.toString(), chartX + barWidth / 2, yPosition + nonCompliantHeight / 2, { align: 'center' });
    }

    chartX += barWidth + barSpacing;
  });

  yPosition += maxBarHeight + 20;

  // Add legend
  pdf.setFontSize(9);
  pdf.setFillColor(34, 197, 94);
  pdf.rect(chartStartX, yPosition, 8, 4, 'F');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Compliant', chartStartX + 12, yPosition + 3);

  pdf.setFillColor(239, 68, 68);
  pdf.rect(chartStartX + 60, yPosition, 8, 4, 'F');
  pdf.text('Non-Compliant', chartStartX + 72, yPosition + 3);

  yPosition += 15;

  // Add caption compliance pie chart representation (simplified as boxes)
  if (yPosition > 220) {
    pdf.addPage();
    yPosition = addHeader('Title II ADA Compliance Report (continued)');
  }

  pdf.setFillColor(245, 245, 245);
  pdf.rect(15, yPosition, 180, 8, 'F');
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Caption Compliance Detail (WCAG 1.2.2)', 20, yPosition + 6);
  yPosition += 15;

  // Machine captions breakdown
  const machineTotal = metrics.machineAccurate + metrics.machinePoor;
  if (machineTotal > 0) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Machine Captions:', 20, yPosition);
    yPosition += 8;

    const machineAccuratePercent = (metrics.machineAccurate / machineTotal) * 100;
    const machinePoorPercent = (metrics.machinePoor / machineTotal) * 100;

    // Draw horizontal bar
    const barTotalWidth = 160;
    const accurateWidth = (machineAccuratePercent / 100) * barTotalWidth;
    const poorWidth = (machinePoorPercent / 100) * barTotalWidth;

    pdf.setFillColor(34, 197, 94);
    pdf.rect(20, yPosition, accurateWidth, 12, 'F');
    pdf.setFillColor(239, 68, 68);
    pdf.rect(20 + accurateWidth, yPosition, poorWidth, 12, 'F');

    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    if (accurateWidth > 20) {
      pdf.text(`>=95%: ${metrics.machineAccurate} (${machineAccuratePercent.toFixed(1)}%)`, 22, yPosition + 8);
    }
    if (poorWidth > 20) {
      pdf.text(`<95%: ${metrics.machinePoor} (${machinePoorPercent.toFixed(1)}%)`, 22 + accurateWidth, yPosition + 8);
    }

    yPosition += 18;
  }

  // Human captions breakdown
  const humanTotal = metrics.humanAccurate + metrics.humanPoor;
  if (humanTotal > 0) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Human Captions:', 20, yPosition);
    yPosition += 8;

    const humanAccuratePercent = (metrics.humanAccurate / humanTotal) * 100;
    const humanPoorPercent = (metrics.humanPoor / humanTotal) * 100;

    const barTotalWidth = 160;
    const accurateWidth = (humanAccuratePercent / 100) * barTotalWidth;
    const poorWidth = (humanPoorPercent / 100) * barTotalWidth;

    pdf.setFillColor(34, 197, 94);
    pdf.rect(20, yPosition, accurateWidth, 12, 'F');
    pdf.setFillColor(239, 68, 68);
    pdf.rect(20 + accurateWidth, yPosition, poorWidth, 12, 'F');

    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    if (accurateWidth > 20) {
      pdf.text(`>=95%: ${metrics.humanAccurate} (${humanAccuratePercent.toFixed(1)}%)`, 22, yPosition + 8);
    }
    if (poorWidth > 20) {
      pdf.text(`<95%: ${metrics.humanPoor} (${humanPoorPercent.toFixed(1)}%)`, 22 + accurateWidth, yPosition + 8);
    }

    yPosition += 18;
  }

  // Add pie charts for caption status
  if (yPosition > 180) {
    pdf.addPage();
    yPosition = addHeader('Title II ADA Compliance Report (continued)');
  }

  pdf.setFillColor(245, 245, 245);
  pdf.rect(15, yPosition, 180, 8, 'F');
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Caption Status Overview', 20, yPosition + 6);
  yPosition += 15;

  // Helper function to draw a pie chart
  const drawPieChart = (centerX: number, centerY: number, radius: number, data: Array<{label: string, value: number, color: number[]}>, title: string) => {
    let currentAngle = -Math.PI / 2; // Start at top
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
      // Draw empty circle
      pdf.setFillColor(200, 200, 200);
      pdf.circle(centerX, centerY, radius, 'F');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text('No Data', centerX, centerY, { align: 'center' });
      return;
    }

    // Draw pie slices
    data.forEach((item) => {
      if (item.value > 0) {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
        
        // Draw slice
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;
        
        // Create path for slice
        const points: number[] = [];
        points.push(centerX, centerY); // Center point
        
        // Add arc points
        const steps = Math.max(10, Math.ceil(Math.abs(sliceAngle) * 20));
        for (let i = 0; i <= steps; i++) {
          const angle = startAngle + (sliceAngle * i / steps);
          points.push(
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
          );
        }
        
        // Draw the slice
        pdf.setDrawColor(255, 255, 255);
        pdf.setLineWidth(0.5);
        
        // Use lines to create the slice
        pdf.lines([[points[2] - points[0], points[3] - points[1]]], points[0], points[1]);
        for (let i = 2; i < points.length - 2; i += 2) {
          pdf.lines([[points[i + 2] - points[i], points[i + 3] - points[i + 1]]], points[i], points[i + 1], [1, 1], 'F');
        }
        
        // Simpler approach: draw filled triangles
        for (let i = 0; i < steps; i++) {
          const angle1 = startAngle + (sliceAngle * i / steps);
          const angle2 = startAngle + (sliceAngle * (i + 1) / steps);
          
          pdf.triangle(
            centerX, centerY,
            centerX + radius * Math.cos(angle1), centerY + radius * Math.sin(angle1),
            centerX + radius * Math.cos(angle2), centerY + radius * Math.sin(angle2),
            'F'
          );
        }
        
        currentAngle += sliceAngle;
      }
    });

    // Add title below
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, centerX, centerY + radius + 8, { align: 'center' });
  };

  // Draw three pie charts side by side
  const pieRadius = 20;
  const pieY = yPosition + pieRadius + 5;
  const pieSpacing = 60;
  let pieX = 35;

  // Machine Captions pie
  if (machineTotal > 0) {
    drawPieChart(pieX, pieY, pieRadius, [
      { label: 'Accurate', value: metrics.machineAccurate, color: [34, 197, 94] },
      { label: 'Poor', value: metrics.machinePoor, color: [239, 68, 68] },
    ], 'Machine Captions');

    // Add legend
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setFillColor(34, 197, 94);
    pdf.rect(pieX - 20, pieY + pieRadius + 12, 4, 3, 'F');
    pdf.text(`Accurate: ${metrics.machineAccurate}`, pieX - 14, pieY + pieRadius + 14);
    pdf.setFillColor(239, 68, 68);
    pdf.rect(pieX - 20, pieY + pieRadius + 17, 4, 3, 'F');
    pdf.text(`Poor: ${metrics.machinePoor}`, pieX - 14, pieY + pieRadius + 19);
  }

  pieX += pieSpacing;

  // Human Captions pie
  if (humanTotal > 0) {
    drawPieChart(pieX, pieY, pieRadius, [
      { label: 'Accurate', value: metrics.humanAccurate, color: [34, 197, 94] },
      { label: 'Poor', value: metrics.humanPoor, color: [239, 68, 68] },
    ], 'Human Captions');

    // Add legend
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setFillColor(34, 197, 94);
    pdf.rect(pieX - 20, pieY + pieRadius + 12, 4, 3, 'F');
    pdf.text(`Accurate: ${metrics.humanAccurate}`, pieX - 14, pieY + pieRadius + 14);
    pdf.setFillColor(239, 68, 68);
    pdf.rect(pieX - 20, pieY + pieRadius + 17, 4, 3, 'F');
    pdf.text(`Poor: ${metrics.humanPoor}`, pieX - 14, pieY + pieRadius + 19);
  }

  pieX += pieSpacing;

  // Overall Caption Status pie
  const totalWithCaptions = metrics.withCaptions;
  const totalNoCaptions = metrics.noCaptions;
  
  drawPieChart(pieX, pieY, pieRadius, [
    { label: 'Has Captions', value: totalWithCaptions, color: [34, 197, 94] },
    { label: 'No Captions', value: totalNoCaptions, color: [239, 68, 68] },
  ], 'Caption Status');

  // Add legend
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setFillColor(34, 197, 94);
  pdf.rect(pieX - 20, pieY + pieRadius + 12, 4, 3, 'F');
  pdf.text(`Has: ${totalWithCaptions}`, pieX - 14, pieY + pieRadius + 14);
  pdf.setFillColor(239, 68, 68);
  pdf.rect(pieX - 20, pieY + pieRadius + 17, 4, 3, 'F');
  pdf.text(`None: ${totalNoCaptions}`, pieX - 14, pieY + pieRadius + 19);

  yPosition = pieY + pieRadius + 30;

  // Add Audio Description pie charts
  pdf.addPage();
  yPosition = addHeader('Title II ADA Compliance Report (continued)');

  pdf.setFillColor(245, 245, 245);
  pdf.rect(15, yPosition, 180, 8, 'F');
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Audio Description Compliance', 20, yPosition + 6);
  yPosition += 15;

  // Draw two pie charts for AD and EAD
  const adPieY = yPosition + pieRadius + 5;
  let adPieX = 60;

  // Audio Description pie
  const totalWithAD = metrics.withAD;
  const totalNoAD = metrics.totalEntries - metrics.withAD;
  
  if (totalWithAD > 0 || totalNoAD > 0) {
    drawPieChart(adPieX, adPieY, pieRadius, [
      { label: 'Has AD', value: totalWithAD, color: [20, 184, 166] },
      { label: 'No AD', value: totalNoAD, color: [239, 68, 68] },
    ], 'Audio Descriptions');

    // Add legend
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setFillColor(20, 184, 166);
    pdf.rect(adPieX - 20, adPieY + pieRadius + 12, 4, 3, 'F');
    pdf.text(`Has AD: ${totalWithAD}`, adPieX - 14, adPieY + pieRadius + 14);
    pdf.setFillColor(239, 68, 68);
    pdf.rect(adPieX - 20, adPieY + pieRadius + 17, 4, 3, 'F');
    pdf.text(`No AD: ${totalNoAD}`, adPieX - 14, adPieY + pieRadius + 19);
  }

  adPieX += pieSpacing + 30;

  // Extended Audio Description pie
  const totalWithEAD = metrics.withEAD;
  const totalNoEAD = metrics.totalEntries - metrics.withEAD;
  
  if (totalWithEAD > 0 || totalNoEAD > 0) {
    drawPieChart(adPieX, adPieY, pieRadius, [
      { label: 'Has EAD', value: totalWithEAD, color: [59, 130, 246] },
      { label: 'No EAD', value: totalNoEAD, color: [239, 68, 68] },
    ], 'Extended Audio Descriptions');

    // Add legend
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setFillColor(59, 130, 246);
    pdf.rect(adPieX - 20, adPieY + pieRadius + 12, 4, 3, 'F');
    pdf.text(`Has EAD: ${totalWithEAD}`, adPieX - 14, adPieY + pieRadius + 14);
    pdf.setFillColor(239, 68, 68);
    pdf.rect(adPieX - 20, adPieY + pieRadius + 17, 4, 3, 'F');
    pdf.text(`No EAD: ${totalNoEAD}`, adPieX - 14, adPieY + pieRadius + 19);
  }

  yPosition = adPieY + pieRadius + 30;

  // Add summary page
  pdf.addPage();
  yPosition = addHeader('Report Summary');

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  const summaryPoints = [
    'This report provides a comprehensive analysis of multimedia content accessibility',
    'compliance with Title II of the Americans with Disabilities Act (ADA) and WCAG 2.1',
    'AA standards.',
    '',
    'Key Requirements:',
    '',
    '  • All prerecorded multimedia content must have captions (SC 1.2.2)',
    '  • Caption accuracy should meet or exceed 99% for prerecorded content',
    '  • Audio descriptions required for video content (SC 1.2.5)',
    '  • Compliance deadline: April 24, 2026',
    '',
    'Compliance Status:',
    '',
    `  • Total entries analyzed: ${metrics.totalEntries.toLocaleString()}`,
    `  • Entries with captions: ${metrics.withCaptions.toLocaleString()} (${((metrics.withCaptions / metrics.totalEntries) * 100).toFixed(1)}%)`,
    `  • Entries without captions: ${metrics.noCaptions.toLocaleString()} (${((metrics.noCaptions / metrics.totalEntries) * 100).toFixed(1)}%)`,
    `  • Compliant entries (≥95% accuracy): ${(metrics.machineAccurate + metrics.humanAccurate).toLocaleString()}`,
    `  • Non-compliant entries: ${(metrics.machinePoor + metrics.humanPoor + metrics.noCaptions).toLocaleString()}`,
  ];

  summaryPoints.forEach(line => {
    if (yPosition > 270) {
      pdf.addPage();
      yPosition = 30;
    }

    if (line.startsWith('Key Requirements:') || line.startsWith('Compliance Status:')) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(line, 20, yPosition);
      pdf.setFont('helvetica', 'normal');
    } else {
      pdf.text(line, 20, yPosition);
    }
    yPosition += 6;
  });

  return pdf;
}

function calculateMetrics(results: any[]): ComplianceData {
  const hasCaptions = (row: any) => {
    const lang = row.captions_language || row.CAPTIONS_LANGUAGE;
    return lang && lang !== '-' && lang !== '';
  };

  const getAccuracy = (row: any) => {
    const acc = row.captions_accuracy || row.CAPTIONS_ACCURACY || '0';
    return parseFloat(String(acc).replace('%', ''));
  };

  const isMachine = (row: any) => {
    const mode = row.captions_creation_mode || row.CAPTIONS_CREATION_MODE || '';
    return String(mode).toLowerCase() === 'machine';
  };

  const isHuman = (row: any) => {
    const mode = row.captions_creation_mode || row.CAPTIONS_CREATION_MODE || '';
    return String(mode).toLowerCase() === 'human' || String(mode).toLowerCase() === 'upload';
  };

  const withCaptions = results.filter(hasCaptions).length;
  const noCaptions = results.length - withCaptions;

  const machineAccurate = results.filter(row => hasCaptions(row) && isMachine(row) && getAccuracy(row) >= 95).length;
  const machinePoor = results.filter(row => hasCaptions(row) && isMachine(row) && getAccuracy(row) < 95).length;
  const humanAccurate = results.filter(row => hasCaptions(row) && isHuman(row) && getAccuracy(row) >= 95).length;
  const humanPoor = results.filter(row => hasCaptions(row) && isHuman(row) && getAccuracy(row) < 95).length;

  // Simplified EAD/AD detection
  const withEAD = results.filter(row => {
    const ead = row.has_ead || row.HAS_EAD || row.is_ead || row.IS_EAD;
    return ead === true || ead === 'true' || ead === 1 || String(ead).toLowerCase() === 'yes';
  }).length;

  const withAD = results.filter(row => {
    const ad = row.has_audio_description_flavor || row.HAS_AUDIO_DESCRIPTION_FLAVOR || row.has_ad || row.HAS_AD;
    return ad === true || ad === 'true' || ad === 1 || String(ad).toLowerCase() === 'yes';
  }).length;

  return {
    totalEntries: results.length,
    withCaptions,
    noCaptions,
    machineAccurate,
    machinePoor,
    humanAccurate,
    humanPoor,
    withEAD,
    withAD,
  };
}
