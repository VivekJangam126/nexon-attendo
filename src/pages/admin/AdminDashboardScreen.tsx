import { 
  Users, 
  UserCheck, 
  Clock, 
  UserX, 
  TrendingUp,
  Calendar,
  ChevronRight,
  AlertCircle,
  Building2
} from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import AdminBottomNavigation from "@/components/AdminBottomNavigation";

const AdminDashboardScreen = () => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const stats = {
    totalEmployees: 156,
    presentToday: 142,
    lateToday: 8,
    absentToday: 6,
    attendanceRate: 91.0,
  };

  const recentActivity = [
    { name: "Rahul Kumar", action: "Marked Present", time: "09:15 AM", status: "present" },
    { name: "Priya Sharma", action: "Marked Late", time: "10:32 AM", status: "late" },
    { name: "Amit Singh", action: "Marked Present", time: "09:28 AM", status: "present" },
    { name: "Neha Patel", action: "Marked Present", time: "09:05 AM", status: "present" },
  ];

  const pendingActions = [
    { title: "3 employees pending approval", type: "approval" },
    { title: "2 leave requests pending", type: "leave" },
  ];

  return (
    <MobileContainer>
      <div className="flex flex-col h-full min-h-[800px] pb-20">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 bg-primary text-primary-foreground rounded-b-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-primary-foreground/80 text-sm">Welcome back,</p>
              <h1 className="text-xl font-semibold">Admin</h1>
            </div>
            <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-5 overflow-y-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
            <div className="card-elevated p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-semibold">{stats.totalEmployees}</p>
              <p className="text-xs text-muted-foreground">Total Employees</p>
            </div>

            <div className="card-elevated p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-success-muted rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-success" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-success">{stats.presentToday}</p>
              <p className="text-xs text-muted-foreground">Present Today</p>
            </div>

            <div className="card-elevated p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-warning-muted rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-warning">{stats.lateToday}</p>
              <p className="text-xs text-muted-foreground">Late Today</p>
            </div>

            <div className="card-elevated p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-destructive-muted rounded-lg flex items-center justify-center">
                  <UserX className="w-5 h-5 text-destructive" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-destructive">{stats.absentToday}</p>
              <p className="text-xs text-muted-foreground">Absent Today</p>
            </div>
          </div>

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
              <div 
                className="bg-success h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.attendanceRate}%` }}
              />
            </div>
          </div>

          {/* Pending Actions */}
          {pendingActions.length > 0 && (
            <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <h2 className="text-overline mb-3">Pending Actions</h2>
              <div className="space-y-2">
                {pendingActions.map((action, index) => (
                  <div key={index} className="card-elevated p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-warning-muted rounded-full flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-warning" />
                    </div>
                    <p className="flex-1 text-sm font-medium">{action.title}</p>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-overline">Recent Activity</h2>
              <button className="text-xs text-primary font-medium">View All</button>
            </div>
            <div className="card-elevated divide-y divide-border">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {activity.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{activity.name}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    activity.status === "present" 
                      ? "bg-success-muted text-success" 
                      : "bg-warning-muted text-warning"
                  }`}>
                    {activity.status === "present" ? "Present" : "Late"}
                  </span>
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

export default AdminDashboardScreen;
