/**
 * PDF Generation Service (Server-Side)
 * Generates attendance report PDFs on the backend
 * Note: This uses jsPDF which works in Node.js with CommonJS require
 */

// Use dynamic import for jsPDF in Node.js context
const jsPDF = require('jspdf');
const autoTable = require('jspdf-autotable');

export interface PDFReportData {
  records: any[];
  breakdown: any[];
  stats: any;
  reportType: string;
  dateRange: string;
}

export const pdfGenerationService = {
  /**
   * Generate PDF report and return as Buffer
   */
  async generateReport(data: PDFReportData): Promise<Buffer> {
    const { records, breakdown, stats, reportType, dateRange } = data;
    
    // Create jsPDF instance - use .jsPDF for v4
    const doc = new jsPDF.jsPDF();
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    // Constants for layout
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const headerHeight = 25;
    const footerHeight = 15;
    const bottomMargin = footerHeight + 5;
    
    let currentPage = 1;
    
    // Helper function to add header and footer
    const addHeaderFooter = () => {
      // For now, we'll skip images and add text headers/footers
      // Images require base64 encoding which we'll handle separately
      
      // Header
      doc.setFillColor(52, 73, 94);
      doc.rect(0, 0, pageWidth, headerHeight, 'F');
      doc.setFontSize(16);
      doc.setFont('times', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('NEXUS ATTENDO', pageWidth / 2, 12, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('times', 'normal');
      doc.text('Attendance Management System', pageWidth / 2, 18, { align: 'center' });
      
      // Footer
      doc.setFillColor(52, 73, 94);
      doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('© Nexus Attendo', pageWidth / 2, pageHeight - 8, { align: 'center' });
      
      // Page number
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${currentPage}`, pageWidth - 14, pageHeight - footerHeight - 3, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    };
    
    // Add header and footer to first page
    addHeaderFooter();
    
    let yPos = headerHeight + 10;
    
    // Report Title
    doc.setFontSize(22);
    doc.setFont('times', 'bold');
    doc.text('Attendance Report', 105, yPos, { align: 'center' });
    yPos += 10;
    
    // Report Info Box
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(14, yPos, pageWidth - 28, 26, 1, 1, 'FD');
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Report Period:', 18, yPos);
    doc.setFont('times', 'normal');
    doc.text(reportType, 50, yPos);
    
    doc.setFont('times', 'bold');
    doc.text('Total Employees:', pageWidth - 70, yPos);
    doc.setFont('times', 'normal');
    doc.text(stats.totalEmployees.toString(), pageWidth - 18, yPos, { align: 'right' });
    yPos += 6;
    
    doc.setFont('times', 'bold');
    doc.text('Date Range:', 18, yPos);
    doc.setFont('times', 'normal');
    doc.text(dateRange, 50, yPos);
    
    doc.setFont('times', 'bold');
    doc.text('Generated:', pageWidth - 70, yPos);
    doc.setFont('times', 'normal');
    doc.text(`${reportDate} ${reportTime}`, pageWidth - 18, yPos, { align: 'right' });
    yPos += 6;
    
    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Nexus Attendo - Employee Attendance Management System', 105, yPos, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 12;
    
    // Attendance Summary Section
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text('Attendance Summary', 14, yPos);
    yPos += 10;
    
    // Calculate correct percentages
    const totalRecords = records.length;
    const presentRecords = records.filter((r: any) => r.status === 'present').length;
    const lateRecords = records.filter((r: any) => r.status === 'late').length;
    const absentRecords = records.filter((r: any) => r.status === 'absent').length;
    
    const workingDays = breakdown.length;
    const totalPossibleAttendance = stats.totalEmployees * workingDays;
    const presentPercentage = totalPossibleAttendance > 0 ? Math.round((presentRecords / totalPossibleAttendance) * 100) : 0;
    const latePercentage = totalPossibleAttendance > 0 ? Math.round((lateRecords / totalPossibleAttendance) * 100) : 0;
    const absentPercentage = totalPossibleAttendance > 0 ? Math.round((absentRecords / totalPossibleAttendance) * 100) : 0;
    
    // Summary Cards
    const cardWidth = (pageWidth - 40) / 4;
    const cardHeight = 26;
    const cardY = yPos;
    const cardSpacing = 4;
    
    // Present Card
    doc.setFillColor(220, 252, 231);
    doc.setDrawColor(187, 247, 208);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, cardY, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setFontSize(22);
    doc.setFont('times', 'bold');
    doc.setTextColor(22, 163, 74);
    doc.text(presentRecords.toString(), 14 + cardWidth / 2, cardY + 11, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('Present', 14 + cardWidth / 2, cardY + 17, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    doc.text(`${presentPercentage}%`, 14 + cardWidth / 2, cardY + 22, { align: 'center' });
    
    // Late Card
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(253, 224, 71);
    doc.roundedRect(14 + cardWidth + cardSpacing, cardY, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setTextColor(202, 138, 4);
    doc.setFontSize(22);
    doc.setFont('times', 'bold');
    doc.text(lateRecords.toString(), 14 + cardWidth + cardSpacing + cardWidth / 2, cardY + 11, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('Late', 14 + cardWidth + cardSpacing + cardWidth / 2, cardY + 17, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    doc.text(`${latePercentage}%`, 14 + cardWidth + cardSpacing + cardWidth / 2, cardY + 22, { align: 'center' });
    
    // Absent Card
    doc.setFillColor(254, 226, 226);
    doc.setDrawColor(252, 165, 165);
    doc.roundedRect(14 + (cardWidth + cardSpacing) * 2, cardY, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(22);
    doc.setFont('times', 'bold');
    doc.text(absentRecords.toString(), 14 + (cardWidth + cardSpacing) * 2 + cardWidth / 2, cardY + 11, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('Absent', 14 + (cardWidth + cardSpacing) * 2 + cardWidth / 2, cardY + 17, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    doc.text(`${absentPercentage}%`, 14 + (cardWidth + cardSpacing) * 2 + cardWidth / 2, cardY + 22, { align: 'center' });
    
    // Rate Card
    doc.setFillColor(224, 231, 255);
    doc.setDrawColor(165, 180, 252);
    doc.roundedRect(14 + (cardWidth + cardSpacing) * 3, cardY, cardWidth, cardHeight, 2, 2, 'FD');
    doc.setTextColor(67, 56, 202);
    doc.setFontSize(22);
    doc.setFont('times', 'bold');
    doc.text(`${stats.attendanceRate}%`, 14 + (cardWidth + cardSpacing) * 3 + cardWidth / 2, cardY + 11, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('Attendance Rate', 14 + (cardWidth + cardSpacing) * 3 + cardWidth / 2, cardY + 17, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    const trend = stats.comparedToPrevious > 0 ? `↑ +${stats.comparedToPrevious}%` : stats.comparedToPrevious < 0 ? `↓ ${stats.comparedToPrevious}%` : '—';
    doc.text(trend, 14 + (cardWidth + cardSpacing) * 3 + cardWidth / 2, cardY + 22, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setLineWidth(0.1);
    yPos += cardHeight + 14;
    
    // Daily Breakdown
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text('Daily Breakdown', 14, yPos);
    yPos += 8;
    
    const breakdownData = breakdown.map((day: any) => {
      const rate = stats.totalEmployees > 0 
        ? Math.round(((day.present + day.late) / stats.totalEmployees) * 100) 
        : 0;
      
      const dateObj = new Date(day.date + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      
      return [formattedDate, day.day, day.present.toString(), day.late.toString(), day.absent.toString(), stats.totalEmployees.toString(), `${rate}%`];
    });
    
    autoTable.default(doc, {
      startY: yPos,
      head: [['Date', 'Day', 'Present', 'Late', 'Absent', 'Total', 'Rate']],
      body: breakdownData,
      theme: 'grid',
      headStyles: { 
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        font: 'times',
        cellPadding: 3
      },
      bodyStyles: { 
        fontSize: 9,
        font: 'times',
        halign: 'center',
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { cellWidth: 24, halign: 'left' },
        1: { cellWidth: 22 },
        2: { cellWidth: 22, halign: 'right' },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 26, fontStyle: 'bold', halign: 'right' },
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 6) {
          const rateValue = data.cell.raw as string;
          if (rateValue === '0%') {
            data.cell.styles.fillColor = [240, 240, 240];
            data.cell.styles.textColor = [150, 150, 150];
          }
        }
      },
      didDrawPage: function(data) {
        // Add header and footer to each new page
        if (data.pageNumber > currentPage) {
          currentPage = data.pageNumber;
          addHeaderFooter();
        }
      },
      margin: { top: headerHeight + 5, bottom: bottomMargin }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 14;
    
    // Detailed Records
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text('Detailed Employee Records', 14, yPos);
    yPos += 8;
    
    // Group records by date
    const recordsByDate = new Map<string, any[]>();
    records.forEach((record: any) => {
      if (!recordsByDate.has(record.date)) {
        recordsByDate.set(record.date, []);
      }
      recordsByDate.get(record.date)!.push(record);
    });
    
    const sortedDates = Array.from(recordsByDate.keys()).sort((a, b) => b.localeCompare(a)).slice(0, 3);
    
    sortedDates.forEach((date) => {
      if (yPos > pageHeight - bottomMargin - 50) {
        currentPage++;
        doc.addPage();
        addHeaderFooter();
        yPos = headerHeight + 10;
      }
      
      const dateRecords = recordsByDate.get(date)!;
      const dateObj = new Date(date + 'T00:00:00');
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      
      const dayPresent = dateRecords.filter(r => r.status === 'present').length;
      const dayLate = dateRecords.filter(r => r.status === 'late').length;
      const dayAbsent = dateRecords.filter(r => r.status === 'absent').length;
      const dayRate = stats.totalEmployees > 0 
        ? Math.round(((dayPresent + dayLate) / stats.totalEmployees) * 100) 
        : 0;
      
      // Date Header Box
      doc.setFillColor(52, 73, 94);
      doc.rect(14, yPos - 4, pageWidth - 28, 11, 'F');
      doc.setFontSize(11);
      doc.setFont('times', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`${dayName}, ${formattedDate}`, 18, yPos + 3);
      doc.setFontSize(9);
      doc.setFont('times', 'normal');
      doc.text(`${dayPresent} Present  |  ${dayLate} Late  |  ${dayAbsent} Absent  |  ${dayRate}% Rate`, pageWidth - 18, yPos + 3, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      yPos += 9;
      
      const sortedRecords = dateRecords.sort((a, b) => {
        const statusOrder = { present: 1, late: 2, absent: 3 };
        const statusCompare = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
        if (statusCompare !== 0) return statusCompare;
        return a.employeeName.localeCompare(b.employeeName);
      }); // Show all records - autoTable will handle pagination
      
      const tableData = sortedRecords.map(record => [
        record.employeeName,
        record.email,
        record.checkInTime,
        record.checkOutTime || '-',
        record.status.toUpperCase()
      ]);
      
      autoTable.default(doc, {
        startY: yPos,
        head: [['Employee Name', 'Email', 'Check-In', 'Check-Out', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [52, 73, 94],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          font: 'times',
          cellPadding: 2.5
        },
        bodyStyles: { 
          fontSize: 8,
          font: 'times',
          cellPadding: 2.5
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 45, halign: 'left' },
          1: { cellWidth: 50, halign: 'left' },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 21, halign: 'center', fontStyle: 'bold' },
        },
        didParseCell: function(data) {
          if (data.column.index === 4 && data.section === 'body') {
            const status = data.cell.raw as string;
            if (status === 'PRESENT') {
              data.cell.styles.textColor = [22, 163, 74];
              data.cell.styles.fillColor = [220, 252, 231];
              data.cell.styles.fontStyle = 'bold';
            } else if (status === 'LATE') {
              data.cell.styles.textColor = [202, 138, 4];
              data.cell.styles.fillColor = [254, 243, 199];
              data.cell.styles.fontStyle = 'bold';
            } else if (status === 'ABSENT') {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fillColor = [254, 226, 226];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        didDrawPage: function(data) {
          // Add header and footer to each new page created by autoTable
          if (data.pageNumber > currentPage) {
            currentPage = data.pageNumber;
            addHeaderFooter();
          }
        },
        margin: { top: headerHeight + 5, bottom: bottomMargin }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 12;
    });
    
    // Footer section
    if (yPos > pageHeight - bottomMargin - 30) {
      currentPage++;
      doc.addPage();
      addHeaderFooter();
      yPos = headerHeight + 10;
    }
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 8;
    
    // Signature block
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    doc.setTextColor(60, 60, 60);
    
    const signatureY = yPos;
    doc.text('Prepared By:', 14, signatureY);
    doc.text('Approved By:', pageWidth / 2 + 7, signatureY);
    
    yPos += 15;
    doc.setDrawColor(100, 100, 100);
    doc.line(14, yPos, 80, yPos);
    doc.line(pageWidth / 2 + 7, yPos, pageWidth / 2 + 73, yPos);
    
    yPos += 4;
    doc.setFontSize(8);
    doc.setFont('times', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('HR Manager', 14, yPos);
    doc.text('Director / Authorized Signatory', pageWidth / 2 + 7, yPos);
    
    yPos += 10;
    doc.setFontSize(8);
    doc.setFont('times', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text(`This report was automatically generated by Nexus Attendo on ${reportDate} at ${reportTime}`, 105, yPos, { align: 'center' });
    yPos += 4;
    doc.text('For any discrepancies or queries, please contact the HR department', 105, yPos, { align: 'center' });
    
    // Convert to Buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  },
};
