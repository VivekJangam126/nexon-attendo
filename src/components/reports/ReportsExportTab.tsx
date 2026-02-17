import { useState } from "react";
import { Download, FileText, FileSpreadsheet, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { reportsService } from "@server";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from "date-fns";

type ExportFormat = "pdf" | "excel";
type TimeRange = "today" | "week" | "month" | "custom";
type ReportTemplate = "daily" | "weekly" | "monthly" | "employee-specific" | null;

export const ReportsExportTab = () => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("excel");
  const [selectedRange, setSelectedRange] = useState<TimeRange>("week");
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined);
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined);

  const handleExport = async () => {
    // Validate custom range
    if (selectedRange === "custom") {
      if (!customDateFrom || !customDateTo) {
        toast({
          title: "Date Range Required",
          description: "Please select both start and end dates for custom range",
          variant: "destructive",
        });
        return;
      }
      
      if (customDateFrom > customDateTo) {
        toast({
          title: "Invalid Date Range",
          description: "Start date must be before end date",
          variant: "destructive",
        });
        return;
      }
    }

    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      let records, breakdown, stats;
      
      if (selectedRange === "custom" && customDateFrom && customDateTo) {
        // Use custom date range with actual check-in times
        // Format dates without timezone conversion
        const startDate = format(customDateFrom, 'yyyy-MM-dd');
        const endDate = format(customDateTo, 'yyyy-MM-dd');
        
        // Fetch actual attendance records with real check-in times
        const customRecords = await reportsService.getCustomRangeAttendanceRecords(startDate, endDate);
        records = customRecords;
        
        // Calculate number of days
        const daysDiff = Math.ceil((customDateTo.getTime() - customDateFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Generate breakdown for custom range with correct day names
        const breakdownData: any[] = [];
        for (let i = 0; i < daysDiff; i++) {
          const currentDate = new Date(customDateFrom);
          currentDate.setDate(currentDate.getDate() + i);
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          
          const dayRecords = customRecords.records.filter(r => r.date === dateStr);
          const present = dayRecords.filter(r => r.status === 'present').length;
          const late = dayRecords.filter(r => r.status === 'late').length;
          const absent = dayRecords.filter(r => r.status === 'absent').length;
          
          breakdownData.push({
            date: dateStr,
            day: dayNames[currentDate.getDay()],
            present,
            late,
            absent,
          });
        }
        
        breakdown = { breakdown: breakdownData };
        
        // Calculate stats for custom range
        const uniqueEmployees = new Set(customRecords.records.map(r => r.email)).size;
        const presentCount = customRecords.records.filter(r => r.status === 'present').length;
        const lateCount = customRecords.records.filter(r => r.status === 'late').length;
        const absentCount = customRecords.records.filter(r => r.status === 'absent').length;
        const totalRecords = customRecords.records.length;
        const attendanceRate = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords) * 100 : 0;
        
        stats = {
          stats: {
            totalEmployees: uniqueEmployees,
            present: presentCount,
            late: lateCount,
            absent: absentCount,
            attendanceRate: Math.round(attendanceRate * 10) / 10,
            comparedToPrevious: 0, // No comparison for custom range
          }
        };
      } else {
        // Use predefined range (not custom)
        const range = selectedRange as 'today' | 'week' | 'month';
        records = await reportsService.getEmployeeAttendanceRecords(range);
        breakdown = await reportsService.getDetailedBreakdown(range);
        stats = await reportsService.getAttendanceStats(range);
      }

      if (selectedFormat === "pdf") {
        generatePDF(records.records, breakdown.breakdown, stats.stats);
      } else if (selectedFormat === "excel") {
        generateExcel(records.records, breakdown.breakdown, stats.stats);
      }

      setIsExporting(false);
      toast({
        title: "Report Downloaded",
        description: `Attendance report exported as ${selectedFormat.toUpperCase()} successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      toast({
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTemplateExport = async (template: ReportTemplate) => {
    if (!template) return;
    
    setSelectedTemplate(template);
    setIsExporting(true);

    // Map template to time range
    let timeRange: 'today' | 'week' | 'month' = "week";
    if (template === "daily") timeRange = "today";
    else if (template === "weekly") timeRange = "week";
    else if (template === "monthly") timeRange = "month";

    try {
      const { records } = await reportsService.getEmployeeAttendanceRecords(timeRange);
      const { breakdown } = await reportsService.getDetailedBreakdown(timeRange);
      const { stats } = await reportsService.getAttendanceStats(timeRange);

      // Generate based on selected format
      if (selectedFormat === "pdf") {
        generatePDF(records, breakdown, stats);
      } else if (selectedFormat === "excel") {
        generateExcel(records, breakdown, stats);
      }

      setIsExporting(false);
      setSelectedTemplate(null);
      toast({
        title: "Template Report Downloaded",
        description: `${template.charAt(0).toUpperCase() + template.slice(1)} report exported successfully.`,
      });
    } catch (error) {
      setIsExporting(false);
      setSelectedTemplate(null);
      toast({
        title: "Export Failed",
        description: "Failed to generate template report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generatePDF = (records: any[], breakdown: any[], stats: any) => {
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const reportType = selectedRange.charAt(0).toUpperCase() + selectedRange.slice(1);
    
    let yPos = 20;
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('NEXUS ATTENDO - ATTENDANCE REPORT', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Type: ${reportType}`, 14, yPos);
    yPos += 5;
    doc.text(`Generated: ${reportDate} at ${reportTime}`, 14, yPos);
    yPos += 5;
    doc.text(`Total Employees: ${stats.totalEmployees}`, 14, yPos);
    yPos += 10;
    
    // Attendance Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ATTENDANCE SUMMARY', 14, yPos);
    yPos += 7;
    
    const totalRecords = records.length;
    const presentRecords = records.filter((r: any) => r.status === 'present').length;
    const lateRecords = records.filter((r: any) => r.status === 'late').length;
    const absentRecords = records.filter((r: any) => r.status === 'absent').length;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Records: ${totalRecords} (${stats.totalEmployees} employees × ${breakdown.length} days)`, 14, yPos);
    yPos += 5;
    doc.text(`Present: ${presentRecords} records - ${Math.round((presentRecords/totalRecords)*100)}%`, 14, yPos);
    yPos += 5;
    doc.text(`Late: ${lateRecords} records - ${Math.round((lateRecords/totalRecords)*100)}%`, 14, yPos);
    yPos += 5;
    doc.text(`Absent: ${absentRecords} records - ${Math.round((absentRecords/totalRecords)*100)}%`, 14, yPos);
    yPos += 5;
    doc.text(`Overall Attendance Rate: ${stats.attendanceRate}%`, 14, yPos);
    yPos += 5;
    doc.text(`Trend vs Previous Period: ${stats.comparedToPrevious > 0 ? '+' : ''}${stats.comparedToPrevious}%`, 14, yPos);
    yPos += 10;
    
    // Daily Breakdown
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DAILY BREAKDOWN', 14, yPos);
    yPos += 7;
    
    const breakdownData = breakdown.map((day: any) => {
      const rate = stats.totalEmployees > 0 
        ? Math.round(((day.present + day.late) / stats.totalEmployees) * 100) 
        : 0;
      return [day.date, day.day, day.present, day.late, day.absent, stats.totalEmployees, `${rate}%`];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Day', 'Present', 'Late', 'Absent', 'Total', 'Rate']],
      body: breakdownData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
      },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Detailed Records (grouped by date - show first 3 dates)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAILED EMPLOYEE ATTENDANCE RECORDS', 14, yPos);
    yPos += 7;
    
    // Group records by date
    const recordsByDate = new Map<string, any[]>();
    records.forEach((record: any) => {
      if (!recordsByDate.has(record.date)) {
        recordsByDate.set(record.date, []);
      }
      recordsByDate.get(record.date)!.push(record);
    });
    
    // Sort dates in descending order and take first 3
    const sortedDates = Array.from(recordsByDate.keys()).sort((a, b) => b.localeCompare(a)).slice(0, 3);
    
    sortedDates.forEach((date, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
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
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`DATE: ${dayName} ${formattedDate}`, 14, yPos);
      yPos += 5;
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Summary: ${dayPresent} Present | ${dayLate} Late | ${dayAbsent} Absent | ${dayRate}% Attendance`, 14, yPos);
      yPos += 5;
      
      // Sort records by status then name
      const sortedRecords = dateRecords.sort((a, b) => {
        const statusOrder = { present: 1, late: 2, absent: 3 };
        const statusCompare = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
        if (statusCompare !== 0) return statusCompare;
        return a.employeeName.localeCompare(b.employeeName);
      }).slice(0, 15); // Limit to 15 records per date for PDF
      
      const tableData = sortedRecords.map(record => [
        record.employeeName,
        record.email,
        record.checkInTime,
        record.status.toUpperCase()
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Employee', 'Email', 'Check-In', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [102, 126, 234], fontSize: 7 },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 60 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
        },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 8;
    });
    
    // Footer
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Generated by Nexus Attendo | ${reportDate} ${reportTime}`, 14, yPos);
    
    doc.save(`attendance-report-${selectedRange}-${Date.now()}.pdf`);
  };

  const generateExcel = (records: any[], breakdown: any[], stats: any) => {
    const wb = XLSX.utils.book_new();
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const reportType = selectedRange.charAt(0).toUpperCase() + selectedRange.slice(1);
    
    const totalRecords = records.length;
    const presentRecords = records.filter((r: any) => r.status === 'present').length;
    const lateRecords = records.filter((r: any) => r.status === 'late').length;
    const absentRecords = records.filter((r: any) => r.status === 'absent').length;

    // Summary Sheet - Matching CSV/PDF format
    const summaryData = [
      ['NEXUS ATTENDO - ATTENDANCE REPORT'],
      [`Report Type: ${reportType}`],
      [`Generated: ${reportDate} at ${reportTime}`],
      [`Total Employees: ${stats.totalEmployees}`],
      [],
      ['================================================================================'],
      ['ATTENDANCE SUMMARY'],
      ['--------------------------------------------------------------------------------'],
      [`Total Records: ${totalRecords} (${stats.totalEmployees} employees × ${breakdown.length} days)`],
      [`Present: ${presentRecords} records - ${Math.round((presentRecords/totalRecords)*100)}%`],
      [`Late: ${lateRecords} records - ${Math.round((lateRecords/totalRecords)*100)}%`],
      [`Absent: ${absentRecords} records - ${Math.round((absentRecords/totalRecords)*100)}%`],
      [`Overall Attendance Rate: ${stats.attendanceRate}%`],
      [`Trend vs Previous Period: ${stats.comparedToPrevious > 0 ? '+' : ''}${stats.comparedToPrevious}%`],
      [],
      ['================================================================================'],
      ['DAILY BREAKDOWN'],
      ['--------------------------------------------------------------------------------'],
      ['Date', 'Day', 'Present', 'Late', 'Absent', 'Total Employees', 'Attendance Rate'],
      ...breakdown.map((day: any) => {
        const rate = stats.totalEmployees > 0 
          ? Math.round(((day.present + day.late) / stats.totalEmployees) * 100) 
          : 0;
        const dateObj = new Date(day.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        return [formattedDate, day.day, day.present, day.late, day.absent, stats.totalEmployees, `${rate}%`];
      }),
      [],
      ['================================================================================'],
      ['DETAILED EMPLOYEE ATTENDANCE RECORDS'],
      ['--------------------------------------------------------------------------------'],
      []
    ];

    // Group records by date
    const recordsByDate = new Map<string, any[]>();
    records.forEach((record: any) => {
      if (!recordsByDate.has(record.date)) {
        recordsByDate.set(record.date, []);
      }
      recordsByDate.get(record.date)!.push(record);
    });
    
    // Sort dates in descending order
    const sortedDates = Array.from(recordsByDate.keys()).sort((a, b) => b.localeCompare(a));
    
    // Add each date section to summary sheet
    sortedDates.forEach((date) => {
      const dateRecords = recordsByDate.get(date)!;
      const dateObj = new Date(date + 'T00:00:00');
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      
      const dayPresent = dateRecords.filter(r => r.status === 'present').length;
      const dayLate = dateRecords.filter(r => r.status === 'late').length;
      const dayAbsent = dateRecords.filter(r => r.status === 'absent').length;
      const dayRate = stats.totalEmployees > 0 
        ? Math.round(((dayPresent + dayLate) / stats.totalEmployees) * 100) 
        : 0;
      
      summaryData.push([`DATE: ${dayName} ${formattedDate}`]);
      summaryData.push(['--------------------------------------------------------------------------------']);
      summaryData.push([`Summary: ${dayPresent} Present | ${dayLate} Late | ${dayAbsent} Absent | ${dayRate}% Attendance`]);
      summaryData.push([]);
      summaryData.push(['Employee Name', 'Email', 'Date', 'Check-In Time', 'Status']);
      
      // Sort records by status then name
      const sortedRecords = dateRecords.sort((a, b) => {
        const statusOrder = { present: 1, late: 2, absent: 3 };
        const statusCompare = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
        if (statusCompare !== 0) return statusCompare;
        return a.employeeName.localeCompare(b.employeeName);
      });
      
      sortedRecords.forEach(record => {
        const recordDateObj = new Date(record.date + 'T00:00:00');
        const recordFormattedDate = recordDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        summaryData.push([
          record.employeeName,
          record.email,
          recordFormattedDate,
          record.checkInTime,
          record.status.toUpperCase()
        ]);
      });
      
      summaryData.push([]);
      summaryData.push([]);
    });

    summaryData.push(['================================================================================']);
    summaryData.push(['END OF REPORT']);
    summaryData.push([`Generated by Nexus Attendo | ${reportDate} ${reportTime}`]);

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths for better display
    summarySheet['!cols'] = [
      { wch: 35 }, // Employee Name
      { wch: 40 }, // Email
      { wch: 15 }, // Date
      { wch: 15 }, // Check-In Time
      { wch: 10 }  // Status
    ];
    
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Attendance Report');

    // Save file
    XLSX.writeFile(wb, `attendance-report-${selectedRange}-${Date.now()}.xlsx`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Export Format Selection */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold mb-4">Select Export Format</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { format: "pdf" as ExportFormat, icon: FileText, label: "PDF", desc: "Document" },
            { format: "excel" as ExportFormat, icon: FileSpreadsheet, label: "Excel", desc: "Workbook" },
          ].map((item) => (
            <button
              key={item.format}
              onClick={() => setSelectedFormat(item.format)}
              className={`p-4 rounded-xl border-2 transition-colors ${
                selectedFormat === item.format
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <item.icon className={`w-8 h-8 mx-auto mb-2 ${selectedFormat === item.format ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Time Range Selection */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold mb-4">Select Time Range</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { range: "today" as TimeRange, label: "Today", desc: "1 day" },
            { range: "week" as TimeRange, label: "This Week", desc: "7 days" },
            { range: "month" as TimeRange, label: "This Month", desc: "30 days" },
            { range: "custom" as TimeRange, label: "Custom Range", desc: "Select dates" },
          ].map((item) => (
            <button
              key={item.range}
              onClick={() => setSelectedRange(item.range)}
              className={`p-4 rounded-xl border-2 transition-colors text-left ${
                selectedRange === item.range
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Calendar className={`w-6 h-6 mb-2 ${selectedRange === item.range ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </button>
          ))}
        </div>
        
        {/* Custom Date Range Picker */}
        {selectedRange === "custom" && (
          <div className="mt-4 p-4 border-2 border-primary rounded-lg bg-accent/50">
            <h4 className="text-sm font-semibold mb-3">Select Custom Date Range</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {customDateFrom ? format(customDateFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customDateFrom}
                      onSelect={setCustomDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {customDateTo ? format(customDateTo, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customDateTo}
                      onSelect={setCustomDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {customDateFrom && customDateTo && (
              <p className="text-xs text-muted-foreground mt-2">
                Selected: {format(customDateFrom, "MMM dd, yyyy")} - {format(customDateTo, "MMM dd, yyyy")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Report Templates */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold mb-4">Report Templates</h3>
        <div className="space-y-2">
          {[
            { id: "daily" as ReportTemplate, name: "Daily Attendance Report", desc: "Summary of today's attendance" },
            { id: "weekly" as ReportTemplate, name: "Weekly Summary Report", desc: "7-day attendance overview" },
            { id: "monthly" as ReportTemplate, name: "Monthly Report", desc: "30-day detailed analysis" },
          ].map((template) => (
            <div key={template.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div>
                <p className="text-sm font-medium">{template.name}</p>
                <p className="text-xs text-muted-foreground">{template.desc}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleTemplateExport(template.id)}
                disabled={isExporting && selectedTemplate === template.id}
              >
                {isExporting && selectedTemplate === template.id ? (
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full py-6 text-lg"
        size="lg"
      >
        {isExporting ? (
          <>
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-5 h-5 mr-2" />
            Download {selectedFormat.toUpperCase()} Report
          </>
        )}
      </Button>
    </div>
  );
};
