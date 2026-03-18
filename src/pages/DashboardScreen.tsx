import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, CheckCircle2, Building2, Calendar, AlertCircle, LogOut, TrendingUp, Zap, Award } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { EmployeeTimeTracker } from "@/components/EmployeeTimeTracker";
import { BreakLogsHistory } from "@/components/BreakLogsHistory";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { attendanceService, attendanceSettingsService } from "@server";
import type { Attendance } from "@server";

const DashboardScreen = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [windowOpen, setWindowOpen] = useState(false);
  const [windowDisplay, setWindowDisplay] = useState<string>('Loading...');
  const [workDuration, setWorkDuration] = useState<string>('0h 0m');
  const [defaultCheckoutTime, setDefaultCheckoutTime] = useState<string>('6:30 PM');
  const [breakRefreshTrigger, setBreakRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }

      const { attendance } = await attendanceService.getTodayAttendance(profile);
      setTodayAttendance(attendance);

      const { isOpen, windowDisplay: display } = await attendanceService.isWindowOpen();
      setWindowOpen(isOpen);
      setWindowDisplay(display);

      const { defaultCheckoutTime: time } = await attendanceSettingsService.getCheckoutSettings();
      if (time) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        setDefaultCheckoutTime(`${displayHour}:${minutes} ${ampm}`);
      }

      setLoading(false);
    };

    fetchData();
  }, [profile]);

  useEffect(() => {
    if (!todayAttendance || todayAttendance.check_out_time) {
      return;
    }

    const updateDuration = () => {
      const checkInTime = new Date(todayAttendance.check_in_time);
      const now = new Date();
      const diffMs = now.getTime() - checkInTime.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setWorkDuration(`${hours}h ${minutes}m`);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000);

    return () => clearInterval(interval);
  }, [todayAttendance]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (!loading && profile) {
      if (profile.status === "pending") {
        navigate("/registration-pending");
      } else if (profile.status === "rejected" || profile.status === "blocked") {
        navigate("/account-blocked");
      }
    }
  }, [loading, user, profile, navigate]);

  const handleBreakUpdate = () => {
    setBreakRefreshTrigger(prev => prev + 1);
  };

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const canMarkAttendance = !todayAttendance && windowOpen;
  const canCheckOut = todayAttendance && !todayAttendance.check_out_time;

  const handleMarkAttendance = async () => {
    if (!profile || marking) return;
    
    setMarking(true);

    try {
      // Navigate directly to attendance processing (no face verification)
      navigate("/attendance-processing");
    } catch (error) {
      console.error('Attendance marking failed:', error);
      setMarking(false);
      toast({
        title: "Error",
        description: "Failed to start attendance marking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCheckOut = async () => {
    if (!profile || !todayAttendance || checkingOut) return;

    setCheckingOut(true);

    try {
      const result = await attendanceService.checkOut(profile);
      
      if (result.success) {
        setTodayAttendance(result.attendance || null);
        toast({
          title: "Checked Out Successfully",
          description: `Work duration: ${result.workHours?.toFixed(1)} hours`,
        });
      } else {
        toast({
          title: "Checkout Failed",
          description: result.error || "Failed to check out",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Checkout Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setCheckingOut(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-50 border-green-200';
      case 'late': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'absent': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle2 className="w-4 h-4" />;
      case 'late': return <Clock className="w-4 h-4" />;
      case 'absent': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-full">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-2 pb-2 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-semibold">{getGreeting()}</h1>
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <span className="text-sm font-semibold text-primary">
                {profile.full_name.split(' ').map(n => n[0]).join('')}
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-3 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Attendance Status Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Today's Attendance</h2>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Window: {windowDisplay}</span>
                </div>
              </div>

              {todayAttendance ? (
                <div className="space-y-3">
                  {/* Status Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(todayAttendance.status)}`}>
                    {getStatusIcon(todayAttendance.status)}
                    <span className="capitalize">{todayAttendance.status}</span>
                  </div>

                  {/* Time Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Check In</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatTime(todayAttendance.check_in_time)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        {todayAttendance.check_out_time ? 'Check Out' : 'Duration'}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {todayAttendance.check_out_time 
                          ? formatTime(todayAttendance.check_out_time)
                          : workDuration
                        }
                      </p>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  {canCheckOut && (
                    <button
                      onClick={handleCheckOut}
                      disabled={checkingOut}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {checkingOut ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Checking Out...
                        </>
                      ) : (
                        <>
                          <LogOut className="w-4 h-4" />
                          Check Out
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  {windowOpen ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <MapPin className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-1">Ready to Check In</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Tap the button below to mark your attendance
                        </p>
                      </div>
                      <button
                        onClick={handleMarkAttendance}
                        disabled={marking}
                        className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {marking ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Mark Attendance
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <Clock className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-gray-900 mb-1">Attendance Window Closed</h3>
                        <p className="text-sm text-gray-600">
                          Attendance window: {windowDisplay}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">This Week</span>
                </div>
                <p className="text-lg font-bold text-gray-900">5/5</p>
                <p className="text-xs text-gray-600">Days Present</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Avg Hours</span>
                </div>
                <p className="text-lg font-bold text-gray-900">8.2</p>
                <p className="text-xs text-gray-600">Per Day</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">Streak</span>
                </div>
                <p className="text-lg font-bold text-gray-900">12</p>
                <p className="text-xs text-gray-600">Days</p>
              </div>
            </div>

            {/* Time Tracker */}
            <EmployeeTimeTracker 
              todayAttendance={todayAttendance}
              defaultCheckoutTime={defaultCheckoutTime}
            />

            {/* Break Logs */}
            <BreakLogsHistory 
              refreshTrigger={breakRefreshTrigger}
              onBreakUpdate={handleBreakUpdate}
            />

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/history")}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">View History</p>
                    <p className="text-xs text-gray-600">Past attendance</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate("/leave-management")}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Leave Request</p>
                    <p className="text-xs text-gray-600">Apply for leave</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardScreen;