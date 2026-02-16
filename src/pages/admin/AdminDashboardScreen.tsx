import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, UserCheck, Clock, UserX, TrendingUp, TrendingDown,
  Calendar, ChevronRight, AlertCircle, Activity, Minus
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { dashboardService } from "@server";
import type { DashboardStats, RecentActivity, PendingAction } from "@server";

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
  
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      // Fetch stats
      const { stats: dashboardStats } = await dashboardService.getDashboardStats();
      setStats(dashboardStats);

      // Fetch recent activity
      const { activities } = await dashboardService.getRecentActivity(4);
      setRecentActivity(activities);

      // Fetch pending actions
      const { actions } = await dashboardService.getPendingActions();
      setPendingActions(actions);

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

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
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-4 bg-primary text-primary-foreground rounded-b-3xl lg:rounded-none lg:bg-transparent lg:text-foreground">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-primary-foreground/80 lg:text-muted-foreground text-sm">Welcome back,</p>
              <h1 className="text-xl font-semibold">Admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground/80 lg:text-muted-foreground text-sm">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-y-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 animate-fade-in-up">
            {[
              { 
                icon: Users, 
                value: stats.totalEmployees, 
                label: "Total Employees", 
                color: "text-primary", 
                bg: "bg-accent",
                trend: null
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
                icon: Activity, 
                value: stats.notMarkedToday, 
                label: "Awaiting Check-in", 
                color: "text-muted-foreground", 
                bg: "bg-muted",
                percentage: stats.totalEmployees > 0 ? Math.round((stats.notMarkedToday / stats.totalEmployees) * 100) : 0
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
              <div key={i} className="card-elevated p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  {stat.percentage !== undefined && (
                    <span className="text-xs text-muted-foreground font-medium">{stat.percentage}%</span>
                  )}
                </div>
                <p className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Row: Attendance Rate + Pending */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Attendance Rate */}
            <div className="card-elevated p-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-success/20 to-success/5 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-base">Attendance Rate</p>
                    <p className="text-xs text-muted-foreground">Present + Late employees</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-success">{stats.attendanceRate}%</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-700 ${
                    stats.attendanceRate >= 90 ? 'bg-gradient-to-r from-success to-success/80' :
                    stats.attendanceRate >= 75 ? 'bg-gradient-to-r from-warning to-warning/80' :
                    'bg-gradient-to-r from-destructive to-destructive/80'
                  }`}
                  style={{ width: `${stats.attendanceRate}%` }} 
                />
              </div>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-muted-foreground">
                  {stats.presentToday + stats.lateToday} of {stats.totalEmployees} employees
                </span>
                <span className={`font-medium ${
                  stats.attendanceRate >= 90 ? 'text-success' :
                  stats.attendanceRate >= 75 ? 'text-warning' :
                  'text-destructive'
                }`}>
                  {stats.attendanceRate >= 90 ? '🌟 Excellent' :
                   stats.attendanceRate >= 75 ? '👍 Good' :
                   '⚠️ Needs Attention'}
                </span>
              </div>
            </div>

            {/* Pending Actions */}
            {pendingActions.length > 0 ? (
              <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pending Actions</h2>
                <div className="space-y-2">
                  {pendingActions.map((action, index) => (
                    <button key={index} onClick={() => navigate(action.path)} className="card-elevated p-4 flex items-center gap-3 w-full text-left hover:bg-muted/50 transition-all hover:shadow-md">
                      <div className="w-10 h-10 bg-warning-muted rounded-full flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-warning" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{action.title}</p>
                        <p className="text-xs text-muted-foreground">Requires your attention</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card-elevated p-5 flex flex-col items-center justify-center text-center animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                <div className="w-16 h-16 bg-success-muted rounded-full flex items-center justify-center mb-3">
                  <UserCheck className="w-8 h-8 text-success" />
                </div>
                <p className="font-medium text-sm mb-1">All Caught Up!</p>
                <p className="text-xs text-muted-foreground">No pending actions at the moment</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Check-ins</h2>
              <button onClick={() => navigate("/admin/employees")} className="text-xs text-primary font-medium hover:underline">View All</button>
            </div>
            {recentActivity.length > 0 ? (
              <div className="card-elevated divide-y divide-border">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="w-11 h-11 bg-gradient-to-br from-accent to-accent/50 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">{activity.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{activity.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                      activity.status === "present" 
                        ? "bg-success-muted text-success" 
                        : "bg-warning-muted text-warning"
                    }`}>
                      {activity.status === "present" ? "✓ On Time" : "⏰ Late"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-elevated p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No activity yet today</p>
                <p className="text-xs text-muted-foreground mt-1">Check-ins will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardScreen;
