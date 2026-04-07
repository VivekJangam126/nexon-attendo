import { useState } from "react";
import { Download, FileText, FileSpreadsheet, Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { reportsService } from "@server";
import { supabase } from "@/lib/supabase";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from "date-fns";

type ExportFormat = "pdf" | "excel";
type TimeRange = "today" | "week" | "month" | "custom";
type ReportTemplate = "daily" | "weekly" | "monthly" | "employee-specific" | null;

// Helper function to calculate duration from formatted time strings
const calculateDuration = (checkInTime: string | null, checkOutTime: string | null): string => {
  if (!checkInTime || !checkOutTime || checkOutTime === '-') {
    return '-';
  }

  try {
    // Parse time strings like "2:30 PM" or "02:30 PM"
    const parseTime = (timeStr: string): Date => {
      const [time, period] = timeStr.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) {
        hour24 = hours + 12;
      } else if (period === 'AM' && hours === 12) {
        hour24 = 0;
      }
      
      const now = new Date();
      const dateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour24, minutes, 0);
      return dateObj;
    };

    const checkInDate = parseTime(checkInTime);
    const checkOutDate = parseTime(checkOutTime);
    
    // If checkout is before checkin, it means checkout happened next day
    if (checkOutDate < checkInDate) {
      checkOutDate.setDate(checkOutDate.getDate() + 1);
    }

    // Calculate difference in milliseconds
    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours === 0) {
      return `${minutes}m`;
    }
    
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } catch (error) {
    console.error('Error calculating duration:', error);
    return '-';
  }
};

// Helper function to parse duration string to total minutes
const parseDurationToMinutes = (durationStr: string): number => {
  if (!durationStr || durationStr === '-') {
    return 0;
  }

  try {
    let totalMinutes = 0;
    const parts = durationStr.split(' ');
    
    for (const part of parts) {
      if (part.endsWith('h')) {
        totalMinutes += parseInt(part) * 60;
      } else if (part.endsWith('m')) {
        totalMinutes += parseInt(part);
      }
    }
    
    return totalMinutes;
  } catch (error) {
    console.error('Error parsing duration:', error);
    return 0;
  }
};

// Helper function to format minutes back to duration string
const formatMinutesToDuration = (totalMinutes: number): string => {
  if (totalMinutes === 0) {
    return '-';
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}m`;
  }
  
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

// Helper function to resolve shift display text for a record
const resolveShiftDisplay = (record: any): string => {
  const shiftMode = record.shift_mode || 'fixed';
  
  if (shiftMode === 'fixed') {
    // For fixed shifts, show Morning or Evening from shift_type
    const shiftType = record.shift_type || 'evening';
    return shiftType.charAt(0).toUpperCase() + shiftType.slice(1);
  } else if (shiftMode === 'custom') {
    // For custom shifts, show startTime - endTime from shift_config
    if (record.shift_config && record.shift_config.startTime && record.shift_config.endTime) {
      return `${record.shift_config.startTime} - ${record.shift_config.endTime}`;
    }
    return 'Custom';
  } else if (shiftMode === 'rotating') {
    // For rotating shifts, resolve current shift (would use resolveShift if available)
    // Format: "Morning (This Week)" or "Evening (This Week)"
    const currentShift = record.shift_type || 'morning';
    return `${currentShift.charAt(0).toUpperCase() + currentShift.slice(1)} (Rotating)`;
  }
  
  return 'Fixed';
};

// Helper function to group records by shift type
const groupRecordsByShiftType = (records: any[]): { fixed: any[]; custom: any[]; rotating: any[] } => {
  const grouped = {
    fixed: [] as any[],
    custom: [] as any[],
    rotating: [] as any[]
  };

  records.forEach((record: any) => {
    const shiftMode = record.shift_mode || 'fixed';
    if (shiftMode === 'custom') {
      grouped.custom.push(record);
    } else if (shiftMode === 'rotating') {
      grouped.rotating.push(record);
    } else {
      grouped.fixed.push(record);
    }
  });

  return grouped;
};

export const ReportsExportTab = () => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("excel");
  const [selectedRange, setSelectedRange] = useState<TimeRange>("week");
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
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
        await generatePDF(records.records, breakdown.breakdown, stats.stats);
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
        description: error instanceof Error ? error.message : "Failed to generate report. Please try again.",
        variant: "destructive",
      });
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
        await generatePDF(records, breakdown, stats);
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

  const handleSendEmail = async () => {
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

    setIsSendingEmail(true);

    try {
      // Fetch report data (same as export)
      let records, breakdown, stats;
      
      if (selectedRange === "custom" && customDateFrom && customDateTo) {
        const startDate = format(customDateFrom, 'yyyy-MM-dd');
        const endDate = format(customDateTo, 'yyyy-MM-dd');
        
        const customRecords = await reportsService.getCustomRangeAttendanceRecords(startDate, endDate);
        records = customRecords;
        
        const daysDiff = Math.ceil((customDateTo.getTime() - customDateFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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
            comparedToPrevious: 0,
          }
        };
      } else {
        const range = selectedRange as 'today' | 'week' | 'month';
        records = await reportsService.getEmployeeAttendanceRecords(range);
        breakdown = await reportsService.getDetailedBreakdown(range);
        stats = await reportsService.getAttendanceStats(range);
      }

      // Generate FULL PDF using the same function as download
      // This will create the complete professional PDF with all sections
      const doc = await generatePDF(records.records, breakdown.breakdown, stats.stats, true);
      
      // Convert PDF to base64
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      
      // Calculate date range text
      const reportDate = new Date().toLocaleDateString('en-GB');
      const reportType = selectedRange.charAt(0).toUpperCase() + selectedRange.slice(1);
      let dateRangeText = '';
      
      if (selectedRange === 'custom' && customDateFrom && customDateTo) {
        dateRangeText = `${format(customDateFrom, 'dd MMM yyyy')} - ${format(customDateTo, 'dd MMM yyyy')}`;
      } else if (selectedRange === 'today') {
        dateRangeText = reportDate;
      } else if (selectedRange === 'week') {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        dateRangeText = `${weekStart.toLocaleDateString('en-GB')} - ${reportDate}`;
      } else if (selectedRange === 'month') {
        const monthStart = new Date();
        monthStart.setDate(monthStart.getDate() - 29);
        dateRangeText = `${monthStart.toLocaleDateString('en-GB')} - ${reportDate}`;
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Send to backend
      const response = await fetch('/api/send-report-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          timeRange: selectedRange,
          customDateFrom: selectedRange === 'custom' && customDateFrom ? format(customDateFrom, 'yyyy-MM-dd') : undefined,
          customDateTo: selectedRange === 'custom' && customDateTo ? format(customDateTo, 'yyyy-MM-dd') : undefined,
          pdfBase64,
          reportData: {
            reportType,
            dateRange: dateRangeText,
            stats: stats.stats,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send email');
      }

      setIsSendingEmail(false);
      toast({
        title: "✅ Report Sent Successfully",
        description: result.message || "The attendance report has been sent to HR email.",
      });
    } catch (error) {
      console.error('Email send error:', error);
      setIsSendingEmail(false);
      toast({
        title: "Failed to Send Email",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const generatePDF = async (records: any[], breakdown: any[], stats: any, forEmail: boolean = false) => {
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const reportType = selectedRange.charAt(0).toUpperCase() + selectedRange.slice(1);
    
    // Calculate date range for report
    let dateRangeText = '';
    if (selectedRange === 'custom' && customDateFrom && customDateTo) {
      dateRangeText = `${format(customDateFrom, 'dd MMM yyyy')} - ${format(customDateTo, 'dd MMM yyyy')}`;
    } else if (selectedRange === 'today') {
      dateRangeText = reportDate;
    } else if (selectedRange === 'week') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      dateRangeText = `${weekStart.toLocaleDateString('en-GB')} - ${reportDate}`;
    } else if (selectedRange === 'month') {
      const monthStart = new Date();
      monthStart.setDate(monthStart.getDate() - 29);
      dateRangeText = `${monthStart.toLocaleDateString('en-GB')} - ${reportDate}`;
    }
    
    // Load header and footer images
    const headerImg = new Image();
    const footerImg = new Image();
    
    headerImg.src = '/header.png';
    footerImg.src = '/footer.png';
    
    // Wait for images to load with error handling
    try {
      await Promise.all([
        new Promise((resolve, reject) => { 
          headerImg.onload = resolve;
          headerImg.onerror = reject;
          // Timeout after 5 seconds
          setTimeout(() => reject(new Error('Header image load timeout')), 5000);
        }),
        new Promise((resolve, reject) => { 
          footerImg.onload = resolve;
          footerImg.onerror = reject;
          // Timeout after 5 seconds
          setTimeout(() => reject(new Error('Footer image load timeout')), 5000);
        })
      ]);
    } catch (error) {
      console.error('Error loading images:', error);
      // Continue without images if they fail to load
      toast({
        title: "Warning",
        description: "PDF generated without header/footer images",
        variant: "default",
      });
    }
    
    // Constants for layout
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const headerHeight = 25;
    const footerHeight = 15;
    const bottomMargin = footerHeight + 5; // Space before footer
    
    let currentPage = 1;
    const totalPages = 3; // Will be updated dynamically
    
    // Helper function to add header, footer, and page number to current page
    const addHeaderFooter = () => {
      doc.addImage(headerImg, 'PNG', 0, 0, pageWidth, headerHeight);
      doc.addImage(footerImg, 'PNG', 0, pageHeight - footerHeight, pageWidth, footerHeight);
      
      // Add page number
      doc.setFontSize(8);
      doc.setFont('times', 'normal');
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
    doc.text(dateRangeText, 50, yPos);
    
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
    
    // CORRECT CALCULATION: Sum from daily breakdown (unique employees per day)
    // Each day has unique employee counts, so we sum across all days
    const presentRecords = breakdown.reduce((sum: number, day: any) => sum + day.present, 0);
    const lateRecords = breakdown.reduce((sum: number, day: any) => sum + day.late, 0);
    const absentRecords = breakdown.reduce((sum: number, day: any) => sum + day.absent, 0);
    
    // Total possible attendance = employees × days
    const workingDays = breakdown.length;
    const totalPossibleAttendance = stats.totalEmployees * workingDays;
    const presentPercentage = totalPossibleAttendance > 0 ? Math.round((presentRecords / totalPossibleAttendance) * 100) : 0;
    const latePercentage = totalPossibleAttendance > 0 ? Math.round((lateRecords / totalPossibleAttendance) * 100) : 0;
    const absentPercentage = totalPossibleAttendance > 0 ? Math.round((absentRecords / totalPossibleAttendance) * 100) : 0;
    
    // Summary Cards with improved styling
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
      
      // Format date nicely
      const dateObj = new Date(day.date + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      
      return [formattedDate, day.day, day.present.toString(), day.late.toString(), day.absent.toString(), stats.totalEmployees.toString(), `${rate}%`];
    });
    
    autoTable(doc, {
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
        // Highlight zero attendance days
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
    
    // Detailed Records (grouped by shift type, then by date)
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text('Detailed Employee Records', 14, yPos);
    yPos += 8;
    
    // Group records by shift type
    const groupedByShift = groupRecordsByShiftType(records);
    const shiftGroups = [
      { key: 'fixed', label: 'FIXED SHIFT', records: groupedByShift.fixed },
      { key: 'custom', label: 'CUSTOM SHIFT', records: groupedByShift.custom },
      { key: 'rotating', label: 'ROTATING SHIFT', records: groupedByShift.rotating }
    ];
    
    // Render each shift group that has records
    shiftGroups.forEach((shiftGroup) => {
      if (shiftGroup.records.length === 0) return; // Skip empty sections
      
      // Shift section header
      if (yPos > pageHeight - bottomMargin - 80) {
        currentPage++;
        doc.addPage();
        addHeaderFooter();
        yPos = headerHeight + 10;
      }
      
      doc.setFillColor(41, 128, 185); // Blue header for shift sections
      doc.rect(14, yPos - 4, pageWidth - 28, 10, 'F');
      doc.setFontSize(13);
      doc.setFont('times', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`${shiftGroup.label}`, 18, yPos + 2);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
      
      // Group records by date within shift
      const recordsByDate = new Map<string, any[]>();
      shiftGroup.records.forEach((record: any) => {
        if (!recordsByDate.has(record.date)) {
          recordsByDate.set(record.date, []);
        }
        recordsByDate.get(record.date)!.push(record);
      });
      
      // Sort dates in descending order
      const sortedDates = Array.from(recordsByDate.keys()).sort((a, b) => b.localeCompare(a));
      
      sortedDates.forEach((date) => {
      // Check if we need a new page (with more space for footer)
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
      
      // Sort records by status then name
      const sortedRecords = dateRecords.sort((a, b) => {
        const statusOrder = { present: 1, late: 2, absent: 3 };
        const statusCompare = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
        if (statusCompare !== 0) return statusCompare;
        return a.employeeName.localeCompare(b.employeeName);
      }); // Show all records - autoTable will handle pagination
      
      const tableData = sortedRecords.map(record => {
        const statusDisplay = record.status.toUpperCase();
        const duration = calculateDuration(record.checkInTime, record.checkOutTime);
        const shiftDetail = resolveShiftDisplay(record);
        return [
          record.employeeName,
          record.email,
          record.checkInTime,
          record.checkOutTime || '-',
          duration,
          shiftDetail,
          statusDisplay
        ];
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [['Employee Name', 'Email', 'Check-In', 'Check-Out', 'Duration', 'Shift', 'Status']],
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
          0: { cellWidth: 40, halign: 'left' },
          1: { cellWidth: 45, halign: 'left' },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        },
        didParseCell: function(data) {
          // Color code status column with badge-like styling
          if (data.column.index === 6 && data.section === 'body') {
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
    }); // End of shift group forEach
    
    }); // End shift groups
    
    // Weekly/Monthly Summary Section - Total Duration by Employee (Skip for daily reports)
    if (selectedRange !== 'today') {
      if (yPos > pageHeight - bottomMargin - 50) {
        currentPage++;
        doc.addPage();
        addHeaderFooter();
        yPos = headerHeight + 10;
      }
      
      // Calculate date range from records for summary
      const summaryRecordDates = records.map((r: any) => new Date(r.date + 'T00:00:00')).sort((a, b) => a.getTime() - b.getTime());
      const summaryDateRangeText = summaryRecordDates.length > 0
        ? `(${summaryRecordDates[0].toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${summaryRecordDates[summaryRecordDates.length - 1].toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})`
        : '';
      
      const summaryTitle = selectedRange === 'month' ? 'Monthly Summary' : 'Weekly Summary';
      
      doc.setFontSize(16);
      doc.setFont('times', 'bold');
      doc.text(`${summaryTitle} - Total Hours Worked ${summaryDateRangeText}`, 14, yPos);
      yPos += 8;
      
      // Group records by employee and calculate total duration
      const employeeSummaryDuration = new Map<string, { email: string; totalMinutes: number }>();
      records.forEach((record: any) => {
        const duration = calculateDuration(record.checkInTime, record.checkOutTime);
        const durationMinutes = parseDurationToMinutes(duration);
        
        if (!employeeSummaryDuration.has(record.employeeName)) {
          employeeSummaryDuration.set(record.employeeName, { email: record.email, totalMinutes: 0 });
        }
        
        const existing = employeeSummaryDuration.get(record.employeeName)!;
        existing.totalMinutes += durationMinutes;
      });
      
      // Sort employees by total duration (descending)
      const summaryData = Array.from(employeeSummaryDuration.entries())
        .sort((a, b) => b[1].totalMinutes - a[1].totalMinutes)
        .map(([name, data]) => [
          name,
          data.email,
          formatMinutesToDuration(data.totalMinutes)
        ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Employee Name', 'Email', 'Total Hours Worked']],
        body: summaryData,
        theme: 'grid',
        headStyles: { 
          fillColor: [46, 125, 50],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          font: 'times',
          cellPadding: 3,
          halign: 'center'
        },
        bodyStyles: { 
          fontSize: 9,
          font: 'times',
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [245, 248, 245]
        },
        columnStyles: {
          0: { cellWidth: 70, halign: 'left' },
          1: { cellWidth: 80, halign: 'left' },
          2: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
        },
        didDrawPage: function(data) {
          if (data.pageNumber > currentPage) {
            currentPage = data.pageNumber;
            addHeaderFooter();
          }
        },
        margin: { top: headerHeight + 5, bottom: bottomMargin }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 14;
    }
    
    // Footer section with signature block
    if (yPos > pageHeight - bottomMargin - 30) {
      currentPage++;
      doc.addPage();
      addHeaderFooter();
      yPos = headerHeight + 10;
    }
    
    // Add separator line
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
    
    // Report generation info
    doc.setFontSize(8);
    doc.setFont('times', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text(`This report was automatically generated by Nexus Attendo on ${reportDate} at ${reportTime}`, 105, yPos, { align: 'center' });
    yPos += 4;
    doc.text('For any discrepancies or queries, please contact the HR department', 105, yPos, { align: 'center' });
    
    // If generating for email, return the doc object; otherwise save it
    if (forEmail) {
      return doc;
    } else {
      doc.save(`attendance-report-${selectedRange}-${Date.now()}.pdf`);
    }
  };

  const generateExcel = (records: any[], breakdown: any[], stats: any) => {
    const wb = XLSX.utils.book_new();
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const reportType = selectedRange.charAt(0).toUpperCase() + selectedRange.slice(1);
    
    // CORRECT CALCULATION: Sum from daily breakdown (unique employees per day)
    const presentRecords = breakdown.reduce((sum: number, day: any) => sum + day.present, 0);
    const lateRecords = breakdown.reduce((sum: number, day: any) => sum + day.late, 0);
    const absentRecords = breakdown.reduce((sum: number, day: any) => sum + day.absent, 0);
    const totalRecords = presentRecords + lateRecords + absentRecords;

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

    // Group records by shift type (matching PDF structure)
    const groupedByShift = groupRecordsByShiftType(records);
    const shiftGroups = [
      { key: 'fixed', label: 'FIXED SHIFT', records: groupedByShift.fixed },
      { key: 'custom', label: 'CUSTOM SHIFT', records: groupedByShift.custom },
      { key: 'rotating', label: 'ROTATING SHIFT', records: groupedByShift.rotating }
    ];

    // Process each shift group
    shiftGroups.forEach((shiftGroup) => {
      if (shiftGroup.records.length === 0) return; // Skip empty shift groups

      // Add shift section header
      summaryData.push([`${shiftGroup.label}`]);
      summaryData.push(['================================================================================']);
      summaryData.push([]);

      // Group records by date within shift
      const recordsByDate = new Map<string, any[]>();
      shiftGroup.records.forEach((record: any) => {
        if (!recordsByDate.has(record.date)) {
          recordsByDate.set(record.date, []);
        }
        recordsByDate.get(record.date)!.push(record);
      });

      // Sort dates in descending order
      const sortedDates = Array.from(recordsByDate.keys()).sort((a, b) => b.localeCompare(a));

      // Add each date section within shift
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
        summaryData.push(['Employee Name', 'Email', 'Date', 'Check-In Time', 'Check-Out Time', 'Duration', 'Shift', 'Status']);
        
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
          const duration = calculateDuration(record.checkInTime, record.checkOutTime);
          const shiftDetail = resolveShiftDisplay(record);
          summaryData.push([
            record.employeeName,
            record.email,
            recordFormattedDate,
            record.checkInTime,
            record.checkOutTime || '-',
            duration,
            shiftDetail,
            record.status.toUpperCase()
          ]);
        });
        
        summaryData.push([]);
        summaryData.push([]);
      });

      // Add separator between shift groups
      summaryData.push([]);
      summaryData.push(['================================================================================']);
      summaryData.push([]);
    });

    // Weekly/Monthly Summary Section (Skip for daily reports)
    if (selectedRange !== 'today') {
      summaryData.push([]);
      summaryData.push(['================================================================================']);
    const excelRecordDates = records.map((r: any) => new Date(r.date + 'T00:00:00')).sort((a, b) => a.getTime() - b.getTime());
    const excelDateRangeText = excelRecordDates.length > 0
      ? ` (${excelRecordDates[0].toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${excelRecordDates[excelRecordDates.length - 1].toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})`
      : '';
    
    const excelSummaryTitle = selectedRange === 'month' ? 'MONTHLY SUMMARY' : 'WEEKLY SUMMARY';
    
    summaryData.push([`${excelSummaryTitle} - TOTAL HOURS WORKED${excelDateRangeText}`]);
    summaryData.push(['--------------------------------------------------------------------------------']);
    summaryData.push([]);
    summaryData.push(['Employee Name', 'Email', 'Total Hours Worked']);
    
    // Calculate total duration for each employee
    const employeeSummaryDurationExcel = new Map<string, { email: string; totalMinutes: number }>();
    records.forEach((record: any) => {
      const duration = calculateDuration(record.checkInTime, record.checkOutTime);
      const durationMinutes = parseDurationToMinutes(duration);
      
      if (!employeeSummaryDurationExcel.has(record.employeeName)) {
        employeeSummaryDurationExcel.set(record.employeeName, { email: record.email, totalMinutes: 0 });
      }
      
      const existing = employeeSummaryDurationExcel.get(record.employeeName)!;
      existing.totalMinutes += durationMinutes;
    });
    
    // Sort employees by total duration (descending) and add to summary
    Array.from(employeeSummaryDurationExcel.entries())
      .sort((a, b) => b[1].totalMinutes - a[1].totalMinutes)
      .forEach(([name, data]) => {
        summaryData.push([
          name,
          data.email,
          formatMinutesToDuration(data.totalMinutes)
        ]);
      });
    
      summaryData.push([]);
      summaryData.push(['================================================================================']);
    }
    
    summaryData.push(['END OF REPORT']);
    summaryData.push([`Generated by Nexus Attendo | ${reportDate} ${reportTime}`]);

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths for better display
    summarySheet['!cols'] = [
      { wch: 35 }, // Employee Name
      { wch: 40 }, // Email
      { wch: 15 }, // Date
      { wch: 15 }, // Check-In Time
      { wch: 15 }, // Check-Out Time
      { wch: 15 }, // Duration
      { wch: 18 }, // Shift
      { wch: 10 }  // Status
    ];
    
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Attendance Report');

    // Save file
    XLSX.writeFile(wb, `attendance-report-${selectedRange}-${Date.now()}.xlsx`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Export Format Selection */}
      <div className="card-elevated p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Select Export Format</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { format: "pdf" as ExportFormat, icon: FileText, label: "PDF", desc: "Document" },
            { format: "excel" as ExportFormat, icon: FileSpreadsheet, label: "Excel", desc: "Workbook" },
          ].map((item) => (
            <button
              key={item.format}
              onClick={() => setSelectedFormat(item.format)}
              className={`p-3 sm:p-4 rounded-xl border-2 transition-colors ${
                selectedFormat === item.format
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <item.icon className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 ${selectedFormat === item.format ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Time Range Selection */}
      <div className="card-elevated p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Select Time Range</h3>
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
              className={`p-3 sm:p-4 rounded-xl border-2 transition-colors text-left ${
                selectedRange === item.range
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Calendar className={`w-5 h-5 sm:w-6 sm:h-6 mb-2 ${selectedRange === item.range ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </button>
          ))}
        </div>
        
        {/* Custom Date Range Picker */}
        {selectedRange === "custom" && (
          <div className="mt-4 p-3 sm:p-4 border-2 border-primary rounded-lg bg-accent/50">
            <h4 className="text-sm font-semibold mb-3">Select Custom Date Range</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal text-xs sm:text-sm">
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
                    <Button variant="outline" className="w-full justify-start text-left font-normal text-xs sm:text-sm">
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
      <div className="card-elevated p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Report Templates</h3>
        <div className="space-y-2">
          {[
            { id: "daily" as ReportTemplate, name: "Daily Attendance Report", desc: "Summary of today's attendance" },
            { id: "weekly" as ReportTemplate, name: "Weekly Summary Report", desc: "7-day attendance overview" },
            { id: "monthly" as ReportTemplate, name: "Monthly Report", desc: "30-day detailed analysis" },
          ].map((template) => (
            <div key={template.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-medium truncate">{template.name}</p>
                <p className="text-xs text-muted-foreground truncate">{template.desc}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleTemplateExport(template.id)}
                disabled={isExporting && selectedTemplate === template.id}
                className="flex-shrink-0"
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

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Send to Email Button */}
        <Button
          onClick={handleSendEmail}
          disabled={isSendingEmail || isExporting}
          className="h-12 sm:h-14 text-sm sm:text-base"
          size="lg"
          variant="outline"
        >
          {isSendingEmail ? (
            <>
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
              <span className="truncate">Sending...</span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Send to Email</span>
            </>
          )}
        </Button>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting || isSendingEmail}
          className="h-12 sm:h-14 text-sm sm:text-base"
          size="lg"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
              <span className="truncate">Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Download {selectedFormat.toUpperCase()}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
