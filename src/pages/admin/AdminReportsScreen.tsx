import { useState, useEffect } from "react";
import { 
  Download, TrendingUp, TrendingDown,
  UserCheck, Clock, UserX, FileText, Send
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { reportsService, notificationTriggerService } from "@server";
import type { ReportStats, DailyBreakdown, EmployeeAttendanceRecord } from "@server";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type TimeRange = "today" | "week" | "month";

const AdminReportsScreen = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [showNotificationSheet, setShowNotificationSheet] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportStats>({
    totalEmployees: 0,
    present: 0,
    late: 0,
    absent: 0,
    attendanceRate: 0,
    comparedToPrevious: 0,
  });
  const [detailedBreakdown, setDetailedBreakdown] = useState<DailyBreakdown[]>([]);
  const [employeeRecords, setEmployeeRecords] = useState<EmployeeAttendanceRecord[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch stats for selected time range
      const { stats } = await reportsService.getAttendanceStats(timeRange);
      setData(stats);
      
      // Fetch detailed breakdown for CSV export
      const { breakdown: detailed } = await reportsService.getDetailedBreakdown(timeRange);
      setDetailedBreakdown(detailed);
      
      // Fetch employee attendance records for CSV export
      const { records } = await reportsService.getEmployeeAttendanceRecords(timeRange);
      setEmployeeRecords(records);
      
      setLoading(false);
    };

    fetchData();
  }, [timeRange]);

  const generateCSV = () => {
    const lines: string[] = [];
    
    // Format date for header
    const reportDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const reportTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Header with company info
    lines.push('NEXUS ATTENDO - ATTENDANCE REPORT');
    lines.push(`Report Type: ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`);
    lines.push(`Generated: ${reportDate} at ${reportTime}`);
    lines.push(`Total Employees: ${data.totalEmployees}`);
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('');
    
    // Calculate summary from actual employee records (not from backend stats which may be cached)
    const actualPresent = employeeRecords.filter(r => r.status === 'present').length;
    const actualLate = employeeRecords.filter(r => r.status === 'late').length;
    const actualAbsent = employeeRecords.filter(r => r.status === 'absent').length;
    const actualTotalRecords = employeeRecords.length; // Total attendance records (employees × days)
    const actualTotalEmployees = data.totalEmployees; // Total number of employees
    
    // Summary Section with better formatting
    lines.push('ATTENDANCE SUMMARY');
    lines.push('-'.repeat(80));
    
    // For multi-day reports, show both per-record and per-employee percentages
    if (timeRange === 'today') {
      // For today, calculate based on total employees
      const presentPercent = actualTotalEmployees > 0 ? Math.round((actualPresent / actualTotalEmployees) * 100) : 0;
      const latePercent = actualTotalEmployees > 0 ? Math.round((actualLate / actualTotalEmployees) * 100) : 0;
      const absentPercent = actualTotalEmployees > 0 ? Math.round((actualAbsent / actualTotalEmployees) * 100) : 0;
      
      lines.push(`Present:,${actualPresent},employees,(${presentPercent}%)`);
      lines.push(`Late:,${actualLate},employees,(${latePercent}%)`);
      lines.push(`Absent:,${actualAbsent},employees,(${absentPercent}%)`);
    } else {
      // For week/month, calculate based on total records
      const presentPercent = actualTotalRecords > 0 ? Math.round((actualPresent / actualTotalRecords) * 100) : 0;
      const latePercent = actualTotalRecords > 0 ? Math.round((actualLate / actualTotalRecords) * 100) : 0;
      const absentPercent = actualTotalRecords > 0 ? Math.round((actualAbsent / actualTotalRecords) * 100) : 0;
      
      const numDays = timeRange === 'week' ? 7 : 30;
      lines.push(`Total Records:,${actualTotalRecords},(${actualTotalEmployees} employees × ${numDays} days)`);
      lines.push(`Present:,${actualPresent},records,(${presentPercent}%)`);
      lines.push(`Late:,${actualLate},records,(${latePercent}%)`);
      lines.push(`Absent:,${actualAbsent},records,(${absentPercent}%)`);
    }
    
    lines.push(`Overall Attendance Rate:,${data.attendanceRate}%`);
    lines.push(`Trend vs Previous Period:,${data.comparedToPrevious > 0 ? '+' : ''}${data.comparedToPrevious}%`);
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('');
    
    // Daily Breakdown Section - Calculate from actual employee records
    lines.push('DAILY BREAKDOWN');
    lines.push('-'.repeat(80));
    lines.push('Date,Day,Present,Late,Absent,Total Employees,Attendance Rate');
    
    // Group employee records by date to get accurate counts
    const recordsByDateForBreakdown = new Map<string, typeof employeeRecords>();
    employeeRecords.forEach(record => {
      if (!recordsByDateForBreakdown.has(record.date)) {
        recordsByDateForBreakdown.set(record.date, []);
      }
      recordsByDateForBreakdown.get(record.date)!.push(record);
    });
    
    // Sort dates and generate breakdown
    const sortedDatesForBreakdown = Array.from(recordsByDateForBreakdown.keys()).sort((a, b) => a.localeCompare(b));
    
    sortedDatesForBreakdown.forEach(date => {
      const records = recordsByDateForBreakdown.get(date)!;
      const present = records.filter(r => r.status === 'present').length;
      const late = records.filter(r => r.status === 'late').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const total = records.length;
      const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
      
      const dateObj = new Date(date + 'T00:00:00');
      const day = dateObj.getDate().toString().padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[dateObj.getDay()];
      // Use text format with leading apostrophe to prevent Excel interpretation
      const formattedDate = `'${day}-${month}-${year}`;
      
      lines.push(`${formattedDate},${dayName},${present},${late},${absent},${total},${rate}%`);
    });
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('');
    
    // Employee Attendance Records Section - Grouped by Date
    lines.push('DETAILED EMPLOYEE ATTENDANCE RECORDS');
    lines.push('-'.repeat(80));
    
    // Group records by date
    const recordsByDate = new Map<string, typeof employeeRecords>();
    employeeRecords.forEach(record => {
      if (!recordsByDate.has(record.date)) {
        recordsByDate.set(record.date, []);
      }
      recordsByDate.get(record.date)!.push(record);
    });
    
    // Sort dates in descending order (most recent first)
    const sortedDates = Array.from(recordsByDate.keys()).sort((a, b) => b.localeCompare(a));
    
    sortedDates.forEach((date, dateIndex) => {
      const records = recordsByDate.get(date)!;
      
      // Date header
      const dateObj = new Date(date + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        weekday: 'long'
      });
      
      lines.push('');
      lines.push(`DATE: ${formattedDate}`);
      lines.push('-'.repeat(80));
      
      // Count status for this date
      const datePresent = records.filter(r => r.status === 'present').length;
      const dateLate = records.filter(r => r.status === 'late').length;
      const dateAbsent = records.filter(r => r.status === 'absent').length;
      const dateRate = records.length > 0 ? Math.round(((datePresent + dateLate) / records.length) * 100) : 0;
      
      lines.push(`Summary: ${datePresent} Present | ${dateLate} Late | ${dateAbsent} Absent | ${dateRate}% Attendance`);
      lines.push('');
      lines.push('Employee Name,Email,Date,Check-In Time,Status');
      
      // Sort records by status (Present, Late, Absent) then by name
      const sortedRecords = records.sort((a, b) => {
        const statusOrder = { present: 1, late: 2, absent: 3 };
        const statusCompare = statusOrder[a.status] - statusOrder[b.status];
        if (statusCompare !== 0) return statusCompare;
        return a.employeeName.localeCompare(b.employeeName);
      });
      
      sortedRecords.forEach(record => {
        const escapedName = record.employeeName.includes(',') ? `"${record.employeeName}"` : record.employeeName;
        const escapedEmail = record.email.includes(',') ? `"${record.email}"` : record.email;
        
        // Format date for each record
        const recordDateObj = new Date(record.date + 'T00:00:00');
        const recordDay = recordDateObj.getDate().toString().padStart(2, '0');
        const recordMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const recordMonth = recordMonthNames[recordDateObj.getMonth()];
        const recordYear = recordDateObj.getFullYear();
        const recordFormattedDate = `'${recordDay}-${recordMonth}-${recordYear}`;
        
        lines.push(`${escapedName},${escapedEmail},${recordFormattedDate},${record.checkInTime},${record.status.toUpperCase()}`);
      });
      
      // Add spacing between dates (except for last date)
      if (dateIndex < sortedDates.length - 1) {
        lines.push('');
      }
    });
    
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('');
    lines.push('END OF REPORT');
    lines.push(`Generated by Nexus Attendo | ${reportDate} ${reportTime}`);
    
    return lines.join('\n');
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Format date for header
    const reportDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const reportTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Attendance Report - ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`, 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${reportDate} at ${reportTime}`, 14, 28);
    
    let yPos = 38;
    
    // Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryData = [
      ['Total Employees', data.totalEmployees.toString()],
      ['Present', data.present.toString()],
      ['Late', data.late.toString()],
      ['Absent', data.absent.toString()],
      ['Attendance Rate', `${data.attendanceRate}%`],
      ['Compared to Previous', `${data.comparedToPrevious > 0 ? '+' : ''}${data.comparedToPrevious}%`],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234] },
      margin: { left: 14 },
      tableWidth: 90,
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Daily Breakdown Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Breakdown', 14, yPos);
    yPos += 8;
    
    const breakdownData = detailedBreakdown.map(row => {
      const total = row.present + row.late + row.absent;
      const rate = total > 0 ? Math.round(((row.present + row.late) / total) * 100) : 0;
      const dateObj = new Date(row.date + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short'
      });
      return [formattedDate, row.day, row.present, row.late, row.absent, total, `${rate}%`];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Day', 'Present', 'Late', 'Absent', 'Total', 'Rate']],
      body: breakdownData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234] },
      margin: { left: 14, right: 14 },
    });
    
    // Add new page for employee records if needed
    doc.addPage();
    yPos = 20;
    
    // Employee Attendance Records Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Attendance Records', 14, yPos);
    yPos += 8;
    
    const employeeData = employeeRecords.map(record => {
      const dateObj = new Date(record.date + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short'
      });
      return [
        record.employeeName,
        record.email,
        formattedDate,
        record.checkInTime,
        record.status.toUpperCase()
      ];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Employee', 'Email', 'Date', 'Check-In', 'Status']],
      body: employeeData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
      },
    });
    
    // Save the PDF
    doc.save(`attendance-report-${timeRange}-${Date.now()}.pdf`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      if (exportFormat === "csv") {
        const csv = generateCSV();
        // Add UTF-8 BOM for Excel compatibility
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csv;
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-report-${timeRange}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        generatePDF();
      }
      
      setIsExporting(false);
      setShowExportSheet(false);
      toast({
        title: "Report Downloaded",
        description: `Attendance report exported as ${exportFormat.toUpperCase()} successfully.`
      });
    } catch (error) {
      setIsExporting(false);
      toast({
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendNotification = async () => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    setIsSendingNotification(true);

    try {
      // Get current attendance data
      const attendanceData = await notificationTriggerService.getCurrentAttendanceData();
      
      if (attendanceData.error) {
        toast({ title: "Error", description: attendanceData.error.message, variant: "destructive" });
        setIsSendingNotification(false);
        return;
      }

      // Use current time as slot time
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const currentTime = `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;

      // Trigger notification via backend service
      const result = await notificationTriggerService.triggerNotification({
        slotNumber: 1,
        slotTime: currentTime,
        presentCount: attendanceData.presentCount,
        lateCount: attendanceData.lateCount,
        totalCount: attendanceData.totalCount,
        attendanceRate: attendanceData.attendanceRate,
        triggeredBy: user.id,
      });

      console.log('Notification result:', result);

      setIsSendingNotification(false);
      setShowNotificationSheet(false);

      if (result.success) {
        const totalSent = result.emailsSent + result.smsSent;
        const totalFailed = result.emailsFailed + result.smsFailed;
        
        toast({
          title: "Notifications Sent!",
          description: `Successfully sent ${totalSent} notification(s). ${totalFailed > 0 ? `${totalFailed} failed.` : ''}`,
        });
      } else {
        console.error('Notification failed:', result);
        toast({
          title: "Failed to Send",
          description: result.message || result.error?.message || "Failed to send notifications",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Notification error:', error);
      setIsSendingNotification(false);
      setShowNotificationSheet(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const departmentStats = [
    { name: "Coming Soon", employees: 0, rate: 0 },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-full">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display mb-1">Reports</h1>
              <p className="text-caption">Attendance analytics</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNotificationSheet(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                <Send className="w-4 h-4" />Send Alert
              </button>
              <button onClick={() => setShowExportSheet(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
                <Download className="w-4 h-4" />Export
              </button>
            </div>
          </div>
        </div>

        {/* Time Range */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 max-w-sm">
            {(["today", "week", "month"] as TimeRange[]).map((range) => (
              <button key={range} onClick={() => setTimeRange(range)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${timeRange === range ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-2 overflow-y-auto space-y-5">
          {/* Top row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Summary */}
            <div className="card-elevated p-5 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <p className="text-3xl font-bold">{data.attendanceRate}%</p>
                </div>
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${data.comparedToPrevious >= 0 ? "bg-success-muted text-success" : "bg-destructive-muted text-destructive"}`}>
                  {data.comparedToPrevious >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(data.comparedToPrevious)}%
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div className="bg-success h-3 rounded-full transition-all duration-500" style={{ width: `${data.attendanceRate}%` }} />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="lg:col-span-2 grid grid-cols-3 gap-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              {[
                { icon: UserCheck, value: data.present, label: "Present", color: "text-success", bg: "bg-success-muted" },
                { icon: Clock, value: data.late, label: "Late", color: "text-warning", bg: "bg-warning-muted" },
                { icon: UserX, value: data.absent, label: "Absent", color: "text-destructive", bg: "bg-destructive-muted" },
              ].map((stat, i) => (
                <div key={i} className="card-elevated p-4 text-center">
                  <div className={`w-10 h-10 ${stat.bg} rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Row: Daily Breakdown + Department */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Daily Breakdown - Show for all time ranges */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <h2 className="text-overline mb-3">
                {timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
              </h2>
              <div className="card-elevated p-4">
                {detailedBreakdown.length > 0 ? (
                  <>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {detailedBreakdown.map((day) => {
                        const total = day.present + day.late + day.absent || 1;
                        const rate = Math.round(((day.present + day.late) / total) * 100);
                        return (
                          <div key={day.date} className="flex items-center gap-3">
                            <div className="w-16 flex-shrink-0">
                              <span className="text-xs font-medium text-muted-foreground block">{day.day}</span>
                              <span className="text-xs text-muted-foreground">{day.date.split('-').slice(1).join('/')}</span>
                            </div>
                            <div className="flex-1 flex items-center gap-1 h-6">
                              <div className="bg-success h-full rounded-l" style={{ width: `${(day.present / total) * 100}%` }} />
                              <div className="bg-warning h-full" style={{ width: `${(day.late / total) * 100}%` }} />
                              <div className="bg-destructive h-full rounded-r" style={{ width: `${(day.absent / total) * 100}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right flex-shrink-0">{rate}%</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-success rounded" /><span className="text-xs text-muted-foreground">Present</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-warning rounded" /><span className="text-xs text-muted-foreground">Late</span></div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-destructive rounded" /><span className="text-xs text-muted-foreground">Absent</span></div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No attendance data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Department Stats */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-overline mb-3">By Department</h2>
              <div className="card-elevated divide-y divide-border">
                {departmentStats.map((dept) => (
                  <div key={dept.name} className="flex items-center gap-4 p-4">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{dept.name}</p>
                      <p className="text-xs text-muted-foreground">{dept.employees} employees</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full ${dept.rate >= 95 ? "bg-success" : dept.rate >= 90 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${dept.rate}%` }} />
                      </div>
                      <span className={`text-sm font-medium w-10 text-right ${dept.rate >= 95 ? "text-success" : dept.rate >= 90 ? "text-warning" : "text-destructive"}`}>{dept.rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Export Sheet */}
        <Sheet open={showExportSheet} onOpenChange={setShowExportSheet}>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader className="text-left">
              <SheetTitle>Export Report</SheetTitle>
              <SheetDescription>Download attendance report for {timeRange === "today" ? "today" : timeRange === "week" ? "this week" : "this month"}</SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">Select Format</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["csv", "pdf"] as const).map((fmt) => (
                    <button key={fmt} onClick={() => setExportFormat(fmt)} className={`p-4 rounded-xl border-2 transition-colors ${exportFormat === fmt ? "border-primary bg-accent" : "border-border"}`}>
                      <FileText className={`w-6 h-6 mx-auto mb-2 ${exportFormat === fmt ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-medium text-sm">{fmt.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">{fmt === "csv" ? "Spreadsheet" : "Document"}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm font-medium mb-1">Report Summary</p>
                <p className="text-xs text-muted-foreground">
                  {timeRange === "today" ? "1 day" : timeRange === "week" ? "7 days" : "30 days"} of attendance data
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.totalEmployees} employees • {employeeRecords.length} attendance records
                </p>
              </div>
              <button onClick={handleExport} disabled={isExporting} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {isExporting ? (<><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Exporting...</>) : (<><Download className="w-5 h-5" />Download {exportFormat.toUpperCase()}</>)}
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Notification Sheet */}
        <Sheet open={showNotificationSheet} onOpenChange={setShowNotificationSheet}>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader className="text-left">
              <SheetTitle>Send Attendance Alert</SheetTitle>
              <SheetDescription>Send SMS & Email notification to HR contacts</SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-4">
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm font-medium mb-2">Current Attendance</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-success">{data.present}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-warning">{data.late}</p>
                    <p className="text-xs text-muted-foreground">Late</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.present + data.late}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Attendance Rate: <span className="font-semibold text-foreground">{data.attendanceRate}%</span>
                  </p>
                </div>
              </div>
              <button onClick={handleSendNotification} disabled={isSendingNotification} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {isSendingNotification ? (<><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Sending...</>) : (<><Send className="w-5 h-5" />Send Now</>)}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                SMS & Email will be sent to all enabled HR contacts immediately
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
};

export default AdminReportsScreen;
