import { useState } from "react";
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  Users,
  UserCheck,
  Clock,
  UserX,
  BarChart3
} from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import AdminBottomNavigation from "@/components/AdminBottomNavigation";

type TimeRange = "today" | "week" | "month";

const AdminReportsScreen = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  const reportData = {
    today: {
      totalEmployees: 156,
      present: 142,
      late: 8,
      absent: 6,
      attendanceRate: 91.0,
      comparedToPrevious: 2.3,
    },
    week: {
      totalEmployees: 156,
      present: 145,
      late: 6,
      absent: 5,
      attendanceRate: 93.0,
      comparedToPrevious: 1.5,
    },
    month: {
      totalEmployees: 156,
      present: 148,
      late: 4,
      absent: 4,
      attendanceRate: 95.0,
      comparedToPrevious: -0.8,
    },
  };

  const data = reportData[timeRange];

  const weeklyBreakdown = [
    { day: "Mon", present: 148, late: 5, absent: 3 },
    { day: "Tue", present: 145, late: 7, absent: 4 },
    { day: "Wed", present: 150, late: 3, absent: 3 },
    { day: "Thu", present: 142, late: 8, absent: 6 },
    { day: "Fri", present: 140, late: 10, absent: 6 },
  ];

  const departmentStats = [
    { name: "Engineering", employees: 45, rate: 96 },
    { name: "Design", employees: 12, rate: 92 },
    { name: "Marketing", employees: 18, rate: 89 },
    { name: "HR", employees: 8, rate: 100 },
    { name: "Finance", employees: 15, rate: 93 },
    { name: "Operations", employees: 22, rate: 91 },
  ];

  return (
    <MobileContainer>
      <div className="flex flex-col h-full min-h-[800px] pb-20">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display mb-1">Reports</h1>
              <p className="text-caption">Attendance analytics</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="px-6 py-4">
          <div className="flex gap-2">
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
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-2 overflow-y-auto space-y-5">
          {/* Summary Card */}
          <div className="card-elevated p-5 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-3xl font-bold">{data.attendanceRate}%</p>
              </div>
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                data.comparedToPrevious >= 0 
                  ? "bg-success-muted text-success" 
                  : "bg-destructive-muted text-destructive"
              }`}>
                {data.comparedToPrevious >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
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
          <div className="grid grid-cols-3 gap-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="card-elevated p-3 text-center">
              <div className="w-8 h-8 bg-success-muted rounded-full flex items-center justify-center mx-auto mb-2">
                <UserCheck className="w-4 h-4 text-success" />
              </div>
              <p className="text-xl font-semibold text-success">{data.present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
            <div className="card-elevated p-3 text-center">
              <div className="w-8 h-8 bg-warning-muted rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <p className="text-xl font-semibold text-warning">{data.late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
            <div className="card-elevated p-3 text-center">
              <div className="w-8 h-8 bg-destructive-muted rounded-full flex items-center justify-center mx-auto mb-2">
                <UserX className="w-4 h-4 text-destructive" />
              </div>
              <p className="text-xl font-semibold text-destructive">{data.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </div>

          {/* Weekly Breakdown */}
          {timeRange === "week" && (
            <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <h2 className="text-overline mb-3">Daily Breakdown</h2>
              <div className="card-elevated p-4">
                <div className="space-y-3">
                  {weeklyBreakdown.map((day) => (
                    <div key={day.day} className="flex items-center gap-3">
                      <span className="w-8 text-sm font-medium text-muted-foreground">{day.day}</span>
                      <div className="flex-1 flex items-center gap-1 h-6">
                        <div 
                          className="bg-success h-full rounded-l"
                          style={{ width: `${(day.present / 156) * 100}%` }}
                        />
                        <div 
                          className="bg-warning h-full"
                          style={{ width: `${(day.late / 156) * 100}%` }}
                        />
                        <div 
                          className="bg-destructive h-full rounded-r"
                          style={{ width: `${(day.absent / 156) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {Math.round((day.present / 156) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
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
                      <div 
                        className={`h-2 rounded-full ${
                          dept.rate >= 95 ? "bg-success" : dept.rate >= 90 ? "bg-warning" : "bg-destructive"
                        }`}
                        style={{ width: `${dept.rate}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium w-10 text-right ${
                      dept.rate >= 95 ? "text-success" : dept.rate >= 90 ? "text-warning" : "text-destructive"
                    }`}>
                      {dept.rate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AdminBottomNavigation />
      </div>
    </MobileContainer>
  );
};

export default AdminReportsScreen;
