import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, UserCheck, Clock, UserX, TrendingUp,
  Calendar, ChevronRight, AlertCircle, Activity
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { dashboardService, reportsService } from "@server";
import type { DashboardStats, RecentActivity, PendingAction, DailyBreakdown } from "@server";

const AdminDashboardScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    notMarkedToday: 0,
    attendanceRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [weeklyBreakdown, setWeeklyBreakdown] = useState<DailyBreakdown[]>([]);
  
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      const { stats: dashboardStats } = await dashboardService.getDashboardStats();
      setStats(dashboardStats);

      const { activities } = await dashboardService.getRecentActivity(3);
      setRecentActivity(activities);

      const { actions } = await dashboardService.getPendingActions();
      setPendingActions(actions);

      const { breakdown } = await reportsService.getWeeklyBreakdown();
      setWeeklyBreakdown(breakdown);

      setLoading(false);
    };

    fetchDashboardData();
    
    // Auto-refresh every 10 seconds for more responsive updates
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getAttendanceStatus = () => {
    if (stats.attendanceRate >= 90) return { label: 'Excellent', color: 'text-success' };
    if (stats.attendanceRate >= 75) return { label: 'Good', color: 'text-warning' };
    return { label: 'Needs Attention', color: 'text-destructive' };
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-full">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const status = getAttendanceStatus();

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Compact Header */}
        <div className="px-4 sm:px-6 md:px-8 pt-3 md:pt-4 pb-3 border-b border-border bg-background">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Welcome back,</p>
              <h1 className="text-base md:text-lg font-semibold">Admin</h1>
            </div>
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 md:px-8 py-4 space-y-4 overflow-y-auto">
          {/* Hero Card - Attendance Rate */}
          <div className="card-elevated p-5 rounded-xl animate-fade-in-up">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Attendance Rate</p>
                <p className="text-3xl sm:text-4xl font-bold">{stats.attendanceRate}%</p>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                stats.attendanceRate >= 90 ? 'bg-success-muted text-success' :
                stats.attendanceRate >= 75 ? 'bg-warning-muted text-warning' :
                'bg-destructive-muted text-destructive'
              }`}>
                {status.label}
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-700 ${
                  stats.attendanceRate >= 90 ? 'bg-success' :
                  stats.attendanceRate >= 75 ? 'bg-warning' :
                  'bg-destructive'
                }`}
                style={{ width: `${stats.attendanceRate}%` }} 
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.presentToday + stats.lateToday} of {stats.totalEmployees} marked today
            </p>
          </div>

          {/* Quick Stats Grid - 2x2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            {[
              { 
                icon: Users, 
                value: stats.totalEmployees, 
                label: "Total", 
                color: "text-primary", 
                bg: "bg-accent"
              },
              { 
                icon: UserCheck, 
                value: stats.presentToday, 
                label: "Present", 
                color: "text-success", 
                bg: "bg-success-muted",
                percentage: stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0
              },
              { 
                icon: Clock, 
                value: stats.lateToday, 
                label: "Late", 
                color: "text-warning", 
                bg: "bg-warning-muted",
                percentage: stats.totalEmployees > 0 ? Math.round((stats.lateToday / stats.totalEmployees) * 100) : 0
              },
              { 
                icon: UserX, 
                value: stats.absentToday, 
                label: "Absent", 
                color: "text-destructive", 
                bg: "bg-destructive-muted",
                percentage: stats.totalEmployees > 0 ? Math.round((stats.absentToday / stats.totalEmployees) * 100) : 0
              },
            ].map((stat, i) => (
              <div key={i} className="card-elevated p-3 sm:p-4 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 ${stat.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.color}`} />
                  </div>
                  {stat.percentage !== undefined && (
                    <span className="text-[10px] text-muted-foreground font-medium">{stat.percentage}%</span>
                  )}
                </div>
                <p className={`text-lg sm:text-xl font-bold ${stat.color} leading-tight`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Weekly Overview */}
          <div className="card-elevated p-3.5 sm:p-4 rounded-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Weekly Overview</h2>
              <button 
                onClick={() => navigate("/admin/history")} 
                className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5 whitespace-nowrap"
              >
                View Reports <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            
            {weeklyBreakdown.length > 0 ? (
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {weeklyBreakdown.map((day, index) => {
                  const isToday = day.date === new Date().toISOString().split('T')[0];
                  const total = day.present + day.late + day.absent || 1;
                  const rate = Math.round(((day.present + day.late) / total) * 100);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => navigate("/admin/history")}
                      className={`flex-shrink-0 w-[52px] sm:w-[60px] px-2 py-2 rounded-lg text-center transition-colors ${
                        isToday 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <div className={`text-[10px] sm:text-xs font-medium ${isToday ? '' : 'text-muted-foreground'}`}>
                        {day.day}
                      </div>
                      <div className={`text-base sm:text-lg font-bold mt-0.5 leading-tight ${
                        isToday ? '' : 
                        rate >= 90 ? 'text-success' :
                        rate >= 75 ? 'text-warning' :
                        'text-destructive'
                      }`}>
                        {day.present + day.late}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No data available</p>
            )}
          </div>

          {/* Pending Actions */}
          {pendingActions.length > 0 ? (
            <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <div className="space-y-2">
                {pendingActions.map((action, index) => (
                  <button 
                    key={index} 
                    onClick={() => navigate(action.path)} 
                    className="w-full card-elevated p-3.5 sm:p-4 rounded-xl flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-warning-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{action.title}</p>
                      <p className="text-xs text-muted-foreground">Requires attention</p>
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="card-elevated p-3.5 sm:p-4 rounded-xl flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-success-muted rounded-full flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium">All Caught Up</p>
                <p className="text-xs text-muted-foreground">No pending approvals</p>
              </div>
            </div>
          )}

          {/* Recent Check-ins */}
          <div className="animate-fade-in-up pb-2" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Recent Check-ins</h2>
              <button 
                onClick={() => navigate("/admin/employees")} 
                className="text-xs text-primary font-medium hover:underline whitespace-nowrap"
              >
                View All
              </button>
            </div>
            {recentActivity.length > 0 ? (
              <div className="card-elevated rounded-xl divide-y divide-border">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-2.5 sm:gap-3 p-3 hover:bg-muted/30 transition-colors first:rounded-t-xl last:rounded-b-xl">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {activity.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.name}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                      activity.status === "present" 
                        ? "bg-success-muted text-success" 
                        : "bg-warning-muted text-warning"
                    }`}>
                      {activity.status === "present" ? "On Time" : "Late"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-elevated p-6 rounded-xl text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                  <Activity className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">Check-ins will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardScreen;
