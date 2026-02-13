import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, UserCheck, Clock, UserX, TrendingUp,
  Calendar, ChevronRight, AlertCircle
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 animate-fade-in-up">
            {[
              { icon: Users, value: stats.totalEmployees, label: "Total Employees", color: "text-primary", bg: "bg-accent" },
              { icon: UserCheck, value: stats.presentToday, label: "Present Today", color: "text-success", bg: "bg-success-muted" },
              { icon: Clock, value: stats.lateToday, label: "Late Today", color: "text-warning", bg: "bg-warning-muted" },
              { icon: UserX, value: stats.absentToday, label: "Absent Today", color: "text-destructive", bg: "bg-destructive-muted" },
            ].map((stat, i) => (
              <div key={i} className="card-elevated p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Row: Attendance Rate + Pending */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Attendance Rate */}
            <div className="card-elevated p-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Today's Attendance Rate</p>
                    <p className="text-xs text-muted-foreground">Based on {stats.totalEmployees} employees</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-success">{stats.attendanceRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-success h-2 rounded-full transition-all duration-500" style={{ width: `${stats.attendanceRate}%` }} />
              </div>
            </div>

            {/* Pending Actions */}
            {pendingActions.length > 0 && (
              <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                <h2 className="text-overline mb-3">Pending Actions</h2>
                <div className="space-y-2">
                  {pendingActions.map((action, index) => (
                    <button key={index} onClick={() => navigate(action.path)} className="card-elevated p-4 flex items-center gap-3 w-full text-left hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 bg-warning-muted rounded-full flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-warning" />
                      </div>
                      <p className="flex-1 text-sm font-medium">{action.title}</p>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-overline">Recent Activity</h2>
              <button onClick={() => navigate("/admin/reports")} className="text-xs text-primary font-medium">View All</button>
            </div>
            <div className="card-elevated divide-y divide-border">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">{activity.name.split(" ").map(n => n[0]).join("")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{activity.name}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    activity.status === "present" ? "bg-success-muted text-success" : "bg-warning-muted text-warning"
                  }`}>
                    {activity.status === "present" ? "Present" : "Late"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardScreen;
