import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, UserCheck, Clock, UserX } from "lucide-react";
import { reportsService } from "@server";
import type { ReportStats, DailyBreakdown } from "@server";

type TimeRange = "today" | "week" | "month";

export const OverviewTab = () => {
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
  const [breakdown, setBreakdown] = useState<DailyBreakdown[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { stats } = await reportsService.getAttendanceStats(timeRange);
      setData(stats);
      const { breakdown: detailed } = await reportsService.getDetailedBreakdown(timeRange);
      setBreakdown(detailed);
      setLoading(false);
    };
    fetchData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Time Range Selector */}
      <div className="flex gap-2 w-full sm:max-w-sm">
        {(["today", "week", "month"] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              timeRange === range
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Attendance Rate */}
        <div className="card-elevated p-4 sm:p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Attendance Rate</p>
              <p className="text-2xl sm:text-3xl font-bold">{data.attendanceRate}%</p>
            </div>
            <div
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                data.comparedToPrevious >= 0
                  ? "bg-success-muted text-success"
                  : "bg-destructive-muted text-destructive"
              }`}
            >
              {data.comparedToPrevious >= 0 ? (
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              {Math.abs(data.comparedToPrevious)}%
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-success h-3 rounded-full transition-all duration-500"
              style={{ width: `${data.attendanceRate}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="md:col-span-2 grid grid-cols-3 gap-2 sm:gap-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          {[
            { icon: UserCheck, value: data.present, label: "Present", color: "text-success", bg: "bg-success-muted" },
            { icon: Clock, value: data.late, label: "Late", color: "text-warning", bg: "bg-warning-muted" },
            { icon: UserX, value: data.absent, label: "Absent", color: "text-destructive", bg: "bg-destructive-muted" },
          ].map((stat, i) => (
            <div key={i} className="card-elevated p-3 sm:p-4 text-center">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.bg} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
              </div>
              <p className={`text-xl sm:text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
              {timeRange !== 'today' && (
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Total {timeRange === 'week' ? '7d' : '30d'}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        <h2 className="text-overline mb-3">
          {timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
        </h2>
        <div className="card-elevated p-3 sm:p-4">
          {breakdown.length > 0 ? (
            <>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {breakdown.map((day) => {
                  const total = day.present + day.late + day.absent || 1;
                  const rate = Math.round(((day.present + day.late) / total) * 100);
                  const presentPercent = (day.present / total) * 100;
                  const latePercent = (day.late / total) * 100;
                  const absentPercent = (day.absent / total) * 100;
                  
                  return (
                    <div key={day.date} className="flex items-center gap-2 sm:gap-3">
                      <div className="w-12 sm:w-16 flex-shrink-0">
                        <span className="text-xs font-medium text-muted-foreground block">{day.day}</span>
                        <span className="text-xs text-muted-foreground">{day.date.split('-').slice(1).join('/')}</span>
                      </div>
                      <div className="flex-1 flex items-center h-5 sm:h-6 bg-muted rounded-full overflow-hidden min-w-0">
                        {presentPercent > 0 && (
                          <div 
                            className="bg-success h-full" 
                            style={{ width: `${presentPercent}%` }} 
                          />
                        )}
                        {latePercent > 0 && (
                          <div 
                            className="bg-warning h-full" 
                            style={{ width: `${latePercent}%` }} 
                          />
                        )}
                        {absentPercent > 0 && (
                          <div 
                            className="bg-destructive h-full" 
                            style={{ width: `${absentPercent}%` }} 
                          />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground w-8 sm:w-10 text-right flex-shrink-0">{rate}%</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-success rounded" />
                  <span className="text-xs text-muted-foreground">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-warning rounded" />
                  <span className="text-xs text-muted-foreground">Late</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-destructive rounded" />
                  <span className="text-xs text-muted-foreground">Absent</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No attendance data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
