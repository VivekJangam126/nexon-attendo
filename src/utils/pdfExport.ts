/**
 * PDF Export Utility for Performance Dashboard
 * Generates professional performance reports
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { EmployeePerformanceCard } from '@server';

export const exportPerformanceToPDF = (employees: EmployeePerformanceCard[]) => {
  try {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Performance Dashboard Report', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${currentDate}`, 20, 30);
    doc.text(`Total Employees: ${employees.length}`, 20, 38);
    
    // Calculate summary statistics
    const totalEmployees = employees.length;
    const avgScore = employees.reduce((sum, emp) => 
      sum + (emp.current_month_metrics?.overall_score || 0), 0) / (totalEmployees || 1);
    const highPerformers = employees.filter(emp => 
      (emp.current_month_metrics?.overall_score || 0) >= 90).length;
    const avgAttendance = employees.reduce((sum, emp) => 
      sum + (emp.current_month_metrics?.attendance_rate || 0), 0) / (totalEmployees || 1);
    
    // Summary section
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Summary Statistics', 20, 55);
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Average Performance Score: ${avgScore.toFixed(1)}/100`, 20, 65);
    doc.text(`High Performers (90+): ${highPerformers}`, 20, 72);
    doc.text(`Average Attendance Rate: ${avgAttendance.toFixed(1)}%`, 20, 79);
    
    // Prepare table data
    const tableData = employees.map(emp => {
      const metrics = emp.current_month_metrics;
      return [
        emp.employee_name || 'Unknown',
        emp.designation || 'Not Assigned',
        metrics ? `${Math.round(metrics.overall_score)}/100` : 'No Data',
        metrics ? `${metrics.attendance_rate.toFixed(1)}%` : 'No Data',
        metrics ? `${metrics.punctuality_score.toFixed(1)}%` : 'No Data',
        metrics ? `${metrics.avg_breaks_per_day.toFixed(1)}` : 'No Data',
        metrics ? `${metrics.days_present}/${metrics.total_working_days}` : 'No Data'
      ];
    });
    
    // Employee performance table
    autoTable(doc, {
      startY: 90,
      head: [['Employee Name', 'Designation', 'Score', 'Attendance', 'Punctuality', 'Avg Breaks', 'Days Present']],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [245, 158, 11], // Amber color
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // Light gray
      },
      columnStyles: {
        0: { cellWidth: 35 }, // Employee Name
        1: { cellWidth: 25 }, // Designation
        2: { cellWidth: 20 }, // Score
        3: { cellWidth: 22 }, // Attendance
        4: { cellWidth: 22 }, // Punctuality
        5: { cellWidth: 20 }, // Avg Breaks
        6: { cellWidth: 25 }, // Days Present
      },
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      doc.text('Nexus Corporate - Performance Dashboard', 20, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    const fileName = `performance-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return fileName;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};