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
import type { ReportStats, DailyBreakdown } from "@server";

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
  const [weeklyBreakdown, setWeeklyBreakdown] = useState<DailyBreakdown[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch stats for selected time range
      const { stats } = await reportsService.getAttendanceStats(timeRange);
      setData(stats);
      
      // Fetch weekly breakdown if week is selected
      if (timeRange === 'week') {
        const { breakdown } = await reportsService.getWeeklyBreakdown();
        setWeeklyBreakdown(breakdown);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [timeRange]);

  const generateCSV = () => {
    const headers = ['Date', 'Day', 'Present', 'Late', 'Absent', 'Rate'];
    const rows = weeklyBreakdown.map(row => [
      row.date, 
      row.day, 
      row.present, 
      row.late, 
      row.absent, 
      `${Math.round(((row.present + row.late) / (row.present + row.late + row.absent || 1)) * 100)}%`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (exportFormat === "csv") {
      const csv = generateCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `attendance-report-${timeRange}-${Date.now()}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setIsExporting(false); setShowExportSheet(false);
    toast({ title: "Report Downloaded", description: `Attendance report exported as ${exportFormat.toUpperCase()} successfully.` });
  };

  const handleSendNotification = async () => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    setIsSendingNotification(true);

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

    // Trigger notification
    const result = await notificationTriggerService.triggerNotification({
      slotNumber: 1, // Default to slot 1 for manual triggers
      slotTime: currentTime,
      presentCount: attendanceData.presentCount,
      lateCount: attendanceData.lateCount,
      totalCount: attendanceData.totalCount,
      attendanceRate: attendanceData.attendanceRate,
      triggeredBy: user.id,
    });

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
      toast({
        title: "Failed to Send",
        description: result.message || "Failed to send notifications",
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

          {/* Row: Weekly + Department */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Weekly Breakdown */}
            {timeRange === "week" && (
              <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                <h2 className="text-overline mb-3">Daily Breakdown</h2>
                <div className="card-elevated p-4">
                  <div className="space-y-3">
                    {weeklyBreakdown.map((day) => {
                      const total = day.present + day.late + day.absent || 1;
                      return (
                        <div key={day.day + day.date} className="flex items-center gap-3">
                          <span className="w-8 text-sm font-medium text-muted-foreground">{day.day}</span>
                          <div className="flex-1 flex items-center gap-1 h-6">
                            <div className="bg-success h-full rounded-l" style={{ width: `${(day.present / total) * 100}%` }} />
                            <div className="bg-warning h-full" style={{ width: `${(day.late / total) * 100}%` }} />
                            <div className="bg-destructive h-full rounded-r" style={{ width: `${(day.absent / total) * 100}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(((day.present + day.late) / total) * 100)}%</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-success rounded" /><span className="text-xs text-muted-foreground">Present</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-warning rounded" /><span className="text-xs text-muted-foreground">Late</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-destructive rounded" /><span className="text-xs text-muted-foreground">Absent</span></div>
                  </div>
                </div>
              </div>
            )}

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
                <p className="text-xs text-muted-foreground">{timeRange === "today" ? "1 day" : timeRange === "week" ? "5 days" : "~30 days"} of attendance data • {data.totalEmployees} employees</p>
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
