import { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown,
  UserCheck, Clock, UserX
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { reportsService } from "@server";
import type { ReportStats, DailyBreakdown, EmployeeAttendanceRecord } from "@server";

type TimeRange = "today" | "week" | "month";

const AdminAnalyticsScreen = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
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
      
      try {
        // Fetch stats for selected time range
        const { stats } = await reportsService.getAttendanceStats(timeRange);
        setData(stats);
        
        // Fetch detailed breakdown
        const { breakdown: detailed } = await reportsService.getDetailedBreakdown(timeRange);
        setDetailedBreakdown(detailed);
        
        // Fetch employee attendance records
        const { records } = await reportsService.getEmployeeAttendanceRecords(timeRange);
        setEmployeeRecords(records);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [timeRange]);

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
          <div>
            <h1 className="text-display mb-1">Analytics</h1>
            <p className="text-caption">Attendance insights and performance metrics</p>
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
      </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsScreen;
