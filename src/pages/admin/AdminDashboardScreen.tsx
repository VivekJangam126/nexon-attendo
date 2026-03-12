import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, UserCheck, Clock, UserX, TrendingUp, AlertCircle, Activity
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardCard from "@/components/DashboardCard";
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      const { stats: dashboardStats } = await dashboardService.getDashboardStats();
      setStats(dashboardStats);

      const { activities } = await dashboardService.getRecentActivity(5);
      setRecentActivity(activities);

      const { actions } = await dashboardService.getPendingActions();
      setPendingActions(actions);

      const { breakdown } = await reportsService.getWeeklyBreakdown();
      setWeeklyBreakdown(breakdown);

      setLoading(false);
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" isAdmin>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const attendancePercentage = stats.totalEmployees > 0 
    ? Math.round(((stats.presentToday + stats.lateToday) / stats.totalEmployees) * 100)
    : 0;

  return (
    <DashboardLayout title="Dashboard" isAdmin>
      <div className="space-y-2 sm:space-y-3 lg:space-y-4">
        {/* Attendance Rate Hero Card */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-3 sm:p-4 lg:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm font-medium text-amber-700 mb-1">Today's Attendance Rate</p>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-900 mb-1">{stats.attendanceRate}%</p>
              <p className="text-xs sm:text-sm text-amber-700">
                {stats.presentToday + stats.lateToday} of {stats.totalEmployees} employees marked
              </p>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-white flex items-center justify-center border-4 border-amber-200 flex-shrink-0">
              <div className="text-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-600">{attendancePercentage}%</p>
                <p className="text-xs text-gray-600">Present</p>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 sm:mt-4 w-full bg-white rounded-full h-2 sm:h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-700"
              style={{ width: `${stats.attendanceRate}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <DashboardCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={Users}
            color="blue"
          />
          <DashboardCard
            title="Present Today"
            value={stats.presentToday}
            subtitle={`${Math.round((stats.presentToday / stats.totalEmployees) * 100)}% of total`}
            icon={UserCheck}
            color="green"
          />
          <DashboardCard
            title="Late Today"
            value={stats.lateToday}
            subtitle={`${Math.round((stats.lateToday / stats.totalEmployees) * 100)}% of total`}
            icon={Clock}
            color="amber"
          />
          <DashboardCard
            title="Absent Today"
            value={stats.absentToday}
            subtitle={`${Math.round((stats.absentToday / stats.totalEmployees) * 100)}% of total`}
            icon={UserX}
            color="red"
          />
        </div>

        {/* Weekly Overview & Pending Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
          {/* Weekly Overview */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Weekly Overview</h2>
              <button 
                onClick={() => navigate("/admin/reports")}
                className="text-xs sm:text-sm text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap"
              >
                View Reports →
              </button>
            </div>
            
            {weeklyBreakdown.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {weeklyBreakdown.map((day, index) => {
                  const total = day.present + day.late + day.absent || 1;
                  const rate = Math.round(((day.present + day.late) / total) * 100);
                  const isToday = day.date === new Date().toISOString().split('T')[0];
                  
                  return (
                    <div
                      key={index}
                      className={`flex-shrink-0 w-16 sm:w-20 p-2 sm:p-3 rounded-lg text-center transition-all ${
                        isToday 
                          ? 'bg-amber-100 border-2 border-amber-500' 
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <p className={`text-xs font-medium mb-1 ${isToday ? 'text-amber-700' : 'text-gray-600'}`}>
                        {day.day}
                      </p>
                      <p className={`text-base sm:text-lg font-bold ${
                        rate >= 90 ? 'text-green-600' :
                        rate >= 75 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {day.present + day.late}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{rate}%</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-6 text-xs sm:text-sm">No data available</p>
            )}
          </div>

          {/* Pending Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Pending Actions</h2>
            
            {pendingActions.length > 0 ? (
              <div className="space-y-2">
                {pendingActions.map((action, index) => (
                  <button 
                    key={index}
                    onClick={() => navigate(action.path)}
                    className="w-full p-2 sm:p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors text-left"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">{action.title}</p>
                        <p className="text-xs text-gray-600">Requires attention</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-1 sm:mb-2" />
                <p className="text-xs sm:text-sm font-medium text-gray-900">All Caught Up</p>
                <p className="text-xs text-gray-500">No pending approvals</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Check-ins</h2>
            <button 
              onClick={() => navigate("/admin/employees")}
              className="text-xs sm:text-sm text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap"
            >
              View All →
            </button>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-orange-600">
                      {activity.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{activity.name}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                    activity.status === "present" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-orange-100 text-orange-700"
                  }`}>
                    {activity.status === "present" ? "On Time" : "Late"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-gray-900">No activity yet</p>
              <p className="text-xs text-gray-500">Check-ins will appear here</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboardScreen;
