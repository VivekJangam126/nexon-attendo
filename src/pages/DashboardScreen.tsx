import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, CheckCircle2, AlertCircle, LogOut } from "lucide-react";
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
          description: ('error' in result ? result.error : result.message) || "Failed to check out",
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
      <div className="flex flex-col min-h-full pb-20 md:pb-0 bg-gray-50/30">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-6 bg-gradient-to-r from-white to-gray-50/50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {getGreeting()}, {profile.full_name.split(' ')[0]}
              </h1>
              <p className="text-sm text-gray-600">{formattedDate}</p>
            </div>
            <button
              onClick={() => navigate("/profile")}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-primary/5"
            >
              View Profile
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Attendance Status Card */}
            <div className="bg-gradient-to-r from-white to-gray-50/50 rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Today's Attendance</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Window: {windowDisplay}</span>
                </div>
              </div>

              {todayAttendance ? (
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(todayAttendance.status)}`}>
                    {getStatusIcon(todayAttendance.status)}
                    <span className="capitalize">{todayAttendance.status}</span>
                  </div>

                  {/* Time Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/70 rounded-lg p-4 border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Check In</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatTime(todayAttendance.check_in_time)}
                      </p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-4 border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        {todayAttendance.check_out_time ? 'Check Out' : 'Duration'}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {todayAttendance.check_out_time 
                          ? formatTime(todayAttendance.check_out_time)
                          : workDuration
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  {windowOpen ? (
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center mx-auto">
                        <MapPin className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Check In</h3>
                        <p className="text-sm text-gray-600 mb-6">
                          Tap the button below to mark your attendance for today
                        </p>
                      </div>
                      <button
                        onClick={handleMarkAttendance}
                        disabled={marking}
                        className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary disabled:from-primary/50 disabled:to-primary/60 text-primary-foreground py-3.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <Clock className="w-10 h-10 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance Window Closed</h3>
                        <p className="text-sm text-gray-600">
                          Attendance window: {windowDisplay}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>



            {/* Time Tracker */}
            <EmployeeTimeTracker 
              employeeId={profile?.id || ''}
              checkInTime={todayAttendance?.check_in_time || null}
              checkOutTime={todayAttendance?.check_out_time || null}
              currentUserId={user?.id}
              onBreakUpdate={handleBreakUpdate}
            />

            {/* Break Logs */}
            <BreakLogsHistory 
              employeeId={profile?.id || ''}
              refreshTrigger={breakRefreshTrigger}
            />
          </div>
        </div>

        {/* Bottom Checkout Button */}
        {canCheckOut && (
          <div className="px-4 sm:px-6 lg:px-8 py-4 bg-white border-t border-gray-200">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={handleCheckOut}
                disabled={checkingOut}
                className="w-full max-w-xs mx-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-400 disabled:to-red-500 text-white py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardScreen;