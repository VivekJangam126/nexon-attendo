import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, CheckCircle2, Building2, Calendar, AlertCircle, LogOut } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
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
    navigate("/attendance-processing");
  };

  const handleCheckOut = async () => {
    if (!profile || !todayAttendance || checkingOut) return;

    setCheckingOut(true);

    try {
      if (!navigator.geolocation) {
        toast({
          title: "Location Not Supported",
          description: "Your browser doesn't support location services",
          variant: "destructive",
        });
        setCheckingOut(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          const result = await attendanceService.checkOut(profile, latitude, longitude);

          if (result.success) {
            toast({
              title: "Checked Out Successfully",
              description: `Work duration: ${result.workHours?.toFixed(1)} hours`,
            });

            const { attendance } = await attendanceService.getTodayAttendance(profile);
            setTodayAttendance(attendance);
          } else {
            toast({
              title: "Checkout Failed",
              description: result.message || "Please try again",
              variant: "destructive",
            });
          }

          setCheckingOut(false);
        },
        (error) => {
          console.error("Location error:", error);
          toast({
            title: "Location Error",
            description: "Could not get your location. Please enable location services.",
            variant: "destructive",
          });
          setCheckingOut(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      setCheckingOut(false);
    }
  };

  const formatTime = (isoString: string) => {
    const utcDate = new Date(isoString);
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
    
    const hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <DashboardLayout title={`${getGreeting()}, ${profile.full_name.split(' ')[0]}`}>
      <div className="space-y-2 sm:space-y-3 lg:space-y-4">
        {/* Date & Office Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3 lg:p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <Calendar className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-600" />
              <p className="text-xs font-medium text-gray-600">Today's Date</p>
            </div>
            <p className="text-sm sm:text-base font-semibold text-gray-900">{formattedDate}</p>
          </div>

          {profile.office_location && (
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3 lg:p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <Building2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-600" />
                <p className="text-xs font-medium text-gray-600">Office Location</p>
              </div>
              <p className="text-sm sm:text-base font-semibold text-gray-900">{profile.office_name || 'Assigned Office'}</p>
            </div>
          )}
        </div>

        {/* Attendance Status Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6 shadow-sm">
          <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5">Today's Attendance</h2>
              <p className="text-xs text-gray-600">Track your check-in and check-out times</p>
            </div>
            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              todayAttendance 
                ? "bg-green-100 text-green-700" 
                : "bg-gray-100 text-gray-700"
            }`}>
              {todayAttendance ? "✓ Present" : "Not Marked"}
            </span>
          </div>

          {todayAttendance ? (
            <div className="space-y-2 sm:space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                  <p className="text-xs font-medium text-gray-600 mb-0.5">Check-in Time</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{formatTime(todayAttendance.check_in_time)}</p>
                </div>

                {todayAttendance.check_out_time ? (
                  <>
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                      <p className="text-xs font-medium text-gray-600 mb-0.5">Check-out Time</p>
                      <p className="text-base sm:text-lg font-bold text-gray-900">{formatTime(todayAttendance.check_out_time)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 sm:p-3 border border-green-200">
                      <p className="text-xs font-medium text-green-700 mb-0.5">Work Duration</p>
                      <p className="text-base sm:text-lg font-bold text-green-700">
                        {(() => {
                          const checkIn = new Date(todayAttendance.check_in_time);
                          const checkOut = new Date(todayAttendance.check_out_time);
                          const diffMs = checkOut.getTime() - checkIn.getTime();
                          const hours = Math.floor(diffMs / (1000 * 60 * 60));
                          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          return `${hours}h ${minutes}m`;
                        })()}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-amber-50 rounded-lg p-2 sm:p-3 border border-amber-200">
                      <p className="text-xs font-medium text-amber-700 mb-0.5">Working Duration</p>
                      <p className="text-base sm:text-lg font-bold text-amber-700">{workDuration}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                      <p className="text-xs font-medium text-gray-600 mb-0.5">Auto Check-out</p>
                      <p className="text-base sm:text-lg font-bold text-gray-900">{defaultCheckoutTime}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Verification Status */}
              <div className="border-t border-gray-200 pt-2 sm:pt-3">
                <div className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">Location Verified</p>
                    <p className="text-xs text-gray-600">GPS validation completed</p>
                  </div>
                  <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-green-600 flex-shrink-0" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 sm:py-6">
              <Clock className="w-8 sm:w-10 h-8 sm:h-10 text-gray-400 mx-auto mb-2 sm:mb-3" />
              <p className="text-sm sm:text-base font-medium text-gray-900 mb-0.5">No attendance marked yet</p>
              <p className="text-xs sm:text-sm text-gray-600">
                {windowOpen 
                  ? "Ready to mark your attendance" 
                  : `Attendance window: ${windowDisplay}`
                }
              </p>
            </div>
          )}
        </div>

        {/* Status Message */}
        <div className={`rounded-lg p-3 sm:p-4 border ${
          todayAttendance 
            ? "bg-green-50 border-green-200" 
            : windowOpen 
              ? "bg-amber-50 border-amber-200" 
              : "bg-yellow-50 border-yellow-200"
        }`}>
          <div className="flex items-start gap-2 sm:gap-3">
            {todayAttendance ? (
              <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-green-600 flex-shrink-0 mt-0.5" />
            ) : windowOpen ? (
              <AlertCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`text-xs sm:text-sm font-medium ${
                todayAttendance 
                  ? "text-green-900" 
                  : windowOpen 
                    ? "text-amber-900" 
                    : "text-yellow-900"
              }`}>
                {todayAttendance 
                  ? "Attendance recorded successfully" 
                  : windowOpen 
                    ? "Ready to mark attendance" 
                    : "Attendance window is closed"
                }
              </p>
              <p className={`text-xs mt-0.5 ${
                todayAttendance 
                  ? "text-green-700" 
                  : windowOpen 
                    ? "text-amber-700" 
                    : "text-yellow-700"
              }`}>
                {todayAttendance 
                  ? "Your attendance for today has been marked." 
                  : windowOpen 
                    ? `Attendance window: ${windowDisplay}` 
                    : `Window: ${windowDisplay}`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          {/* Mark Attendance Button */}
          {!todayAttendance && (
            <button
              onClick={handleMarkAttendance}
              disabled={!canMarkAttendance || marking}
              className="py-2 sm:py-3 px-3 sm:px-4 bg-amber-600 text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              {marking ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Processing...</span>
                  <span className="sm:hidden">Wait...</span>
                </>
              ) : (
                "Mark Attendance"
              )}
            </button>
          )}

          {/* Checkout Button */}
          {canCheckOut && (
            <button
              onClick={handleCheckOut}
              disabled={checkingOut}
              className="py-2 sm:py-3 px-3 sm:px-4 bg-green-600 text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              {checkingOut ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">Checking Out...</span>
                  <span className="sm:hidden">Wait...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  Check Out
                </>
              )}
            </button>
          )}

          {/* Already Checked Out */}
          {todayAttendance && todayAttendance.check_out_time && (
            <button
              disabled
              className="py-2 sm:py-3 px-3 sm:px-4 bg-gray-200 text-gray-600 rounded-lg font-semibold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Checked Out
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardScreen;
