import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, CheckCircle2, Building2, Calendar, AlertCircle, LogOut, TrendingUp, Zap, Award } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { EmployeeTimeTracker } from "@/components/EmployeeTimeTracker";
import { BreakLogsHistory } from "@/components/BreakLogsHistory";
import FaceVerificationModal from "@/components/face/FaceVerificationModal";
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
  const [breakRefreshTrigger, setBreakRefreshTrigger] = useState(0); // Add refresh trigger
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [checkingFaceRegistration, setCheckingFaceRegistration] = useState(false);

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
    setCheckingFaceRegistration(true);

    try {
      // Check if employee has face registered via API
      const response = await fetch('/api/face-recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check-registration',
          employee_id: profile.id,
        }),
      });

      const faceStatus = await response.json();
      setFaceRegistered(faceStatus.registered);
      setCheckingFaceRegistration(false);

      console.log('Face registration check:', faceStatus);

      if (faceStatus.registered && faceStatus.mlServiceAvailable) {
        // Face is registered and ML service is available - show face verification
        console.log('Showing face verification modal');
        setShowFaceVerification(true);
        setMarking(false); // Reset marking state, will be set again in face verification
      } else {
        // No face registration or ML service unavailable - proceed with standard attendance
        console.log('Proceeding with standard attendance - Face registered:', faceStatus.registered, 'ML available:', faceStatus.mlServiceAvailable);
        navigate("/attendance-processing");
      }
    } catch (error) {
      console.error('Face registration check failed:', error);
      setCheckingFaceRegistration(false);
      // Fallback to standard attendance
      navigate("/attendance-processing");
    }
  };

  const handleFaceVerificationComplete = async (success: boolean, confidence?: number) => {
    setShowFaceVerification(false);
    
    if (success) {
      toast({
        title: "Face Verified",
        description: `Identity confirmed (${confidence?.toFixed(1)}% confidence)`,
      });
      // Proceed to attendance processing with face verification data
      navigate("/attendance-processing", { 
        state: { 
          faceVerified: true, 
          faceConfidence: confidence,
          selfieData: null // Will be handled by the face verification modal
        } 
      });
    } else {
      toast({
        title: "Face Verification Failed",
        description: "Please try again or contact admin for assistance",
        variant: "destructive",
      });
      setMarking(false);
    }
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
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* Welcome Hero Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-100 via-amber-50 to-orange-50 p-5 shadow-sm animate-fade-in-up border border-amber-200">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-200/30 animate-pulse" />
          <div className="absolute -bottom-3 -left-3 h-20 w-20 rounded-full bg-amber-200/30 animate-pulse delay-200" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div>
                <h1 className="text-base sm:text-lg font-bold text-gray-800 mb-0.5">
                  {getGreeting()}, {profile.full_name.split(' ')[0]}! 👋
                </h1>
                <p className="text-amber-700 text-sm">
                  {formattedDate} • Track attendance
                </p>
              </div>
              <div className="mt-2 sm:mt-0 hidden sm:flex items-center justify-center w-10 h-10 bg-amber-200/40 rounded-lg backdrop-blur-sm">
                <Zap className="w-5 h-5 text-amber-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up delay-100">
          {/* Today Status */}
          <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-amber-200 hover:scale-105">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Status</p>
                <p className="text-sm font-bold text-gray-900">
                  {todayAttendance ? "Present" : "Pending"}
                </p>
              </div>
            </div>
          </div>

          {/* Office Location */}
          {profile.office_location && (
            <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200 hover:scale-105">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Location</p>
                  <p className="text-sm font-bold text-gray-900">
                    {profile.office_name || 'Assigned'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Real-Time Clock & Break Management */}
        <div className="animate-fade-in-up delay-150">
          <EmployeeTimeTracker
            employeeId={profile.id}
            checkInTime={todayAttendance?.check_in_time || null}
            checkOutTime={todayAttendance?.check_out_time || null}
            currentUserId={profile.id}
            onBreakUpdate={handleBreakUpdate}
          />
        </div>

        {/* Break Logs History */}
        <div className="animate-fade-in-up delay-175">
          <BreakLogsHistory
            employeeId={profile.id}
            employeeName={profile.full_name}
            refreshTrigger={breakRefreshTrigger}
          />
        </div>

        {/* Main Attendance Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-fade-in-up delay-200">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-0.5">Today's Attendance</h2>
                <p className="text-xs text-gray-600">
                  {todayAttendance 
                    ? "Check-in and check-out times" 
                    : "Mark to get started"}
                </p>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                todayAttendance 
                  ? "bg-green-100 text-green-700" 
                  : "bg-gray-100 text-gray-700"
              }`}>
                {todayAttendance ? "✓ Present" : "Not Marked"}
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-5">
            {todayAttendance ? (
              <div className="space-y-4">
                {/* Time Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Check-in Time */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="p-1 bg-blue-500/20 rounded">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Check-in</p>
                    </div>
                    <p className="text-base font-bold text-blue-900 mb-1">
                      {formatTime(todayAttendance.check_in_time)}
                    </p>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      <p className="text-xs text-blue-700 font-medium">Marked</p>
                    </div>
                  </div>

                  {/* Check-out Time or Work Duration */}
                  {todayAttendance.check_out_time ? (
                    <>
                      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="p-1 bg-red-500/20 rounded">
                            <LogOut className="w-3.5 h-3.5 text-red-600" />
                          </div>
                          <p className="text-xs font-semibold text-red-900 uppercase tracking-wide">Check-out</p>
                        </div>
                        <p className="text-base font-bold text-red-900 mb-1">
                          {formatTime(todayAttendance.check_out_time)}
                        </p>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-red-600" />
                          <p className="text-xs text-red-700 font-medium">Completed</p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="p-1 bg-green-500/20 rounded">
                            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <p className="text-xs font-semibold text-green-900 uppercase tracking-wide">Duration</p>
                        </div>
                        <p className="text-base font-bold text-green-900 mb-1">
                          {(() => {
                            const checkIn = new Date(todayAttendance.check_in_time);
                            const checkOut = new Date(todayAttendance.check_out_time);
                            const diffMs = checkOut.getTime() - checkIn.getTime();
                            const hours = Math.floor(diffMs / (1000 * 60 * 60));
                            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                            return `${hours}h ${minutes}m`;
                          })()}
                        </p>
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3 text-green-600" />
                          <p className="text-xs text-green-700 font-medium">Completed</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="p-1 bg-gray-500/20 rounded">
                          <Clock className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                        <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Auto Check-out</p>
                      </div>
                      <p className="text-base font-bold text-gray-900 mb-1">{defaultCheckoutTime}</p>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-gray-600" />
                        <p className="text-xs text-gray-700 font-medium">System managed</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Verification Status */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
                    <div className="p-1.5 bg-green-500/20 rounded">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-900 text-xs">Location Verified</p>
                      <p className="text-xs text-green-700">GPS validation completed</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                  <Clock className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">No Attendance Marked</h3>
                <p className="text-gray-600 text-sm">
                  {windowOpen 
                    ? "Ready to mark your attendance!" 
                    : `Window: ${windowDisplay}`
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status Alert Banner */}
        <div className={`rounded-lg p-4 border-l-4 animate-fade-in-up delay-300 ${
          todayAttendance 
            ? "bg-green-50 border-green-500 border" 
            : windowOpen 
              ? "bg-blue-50 border-blue-500 border" 
              : "bg-yellow-50 border-yellow-500 border"
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 pt-0.5">
              {todayAttendance ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : windowOpen ? (
                <AlertCircle className="w-5 h-5 text-blue-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-semibold mb-1 ${
                todayAttendance 
                  ? "text-green-900" 
                  : windowOpen 
                    ? "text-blue-900" 
                    : "text-yellow-900"
              }`}>
                {todayAttendance 
                  ? "✓ Attendance Recorded" 
                  : windowOpen 
                    ? "Ready to Mark" 
                    : "Window Closed"
                }
              </h3>
              <p className={`text-sm ${
                todayAttendance 
                  ? "text-green-700" 
                  : windowOpen 
                    ? "text-blue-700" 
                    : "text-yellow-700"
              }`}>
                {todayAttendance 
                  ? "Your attendance has been marked successfully" 
                  : windowOpen 
                    ? `Mark your attendance now. ${windowDisplay}` 
                    : `Attendance window is closed. ${windowDisplay}`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center animate-fade-in-up delay-400">
          <div className="w-full max-w-md space-y-3">
            {/* Mark Attendance Button */}
            {!todayAttendance && (
              <button
                onClick={handleMarkAttendance}
                disabled={!canMarkAttendance || marking}
                className="group relative overflow-hidden w-full py-3 px-6 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg font-semibold text-sm hover:from-amber-700 hover:to-amber-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-amber-600 disabled:hover:to-amber-500 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity duration-300" />
                {marking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Mark Attendance</span>
                  </>
                )}
              </button>
            )}

            {/* Checkout Button */}
            {canCheckOut && (
              <button
                onClick={handleCheckOut}
                disabled={checkingOut}
                className="group relative overflow-hidden w-full py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg font-semibold text-sm hover:from-green-700 hover:to-emerald-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-green-600 disabled:hover:to-emerald-500 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity duration-300" />
                {checkingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Checking Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Check Out</span>
                  </>
                )}
              </button>
            )}

            {/* Already Checked Out */}
            {todayAttendance && todayAttendance.check_out_time && (
              <div className="w-full py-3 px-6 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 border border-gray-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Checked Out</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Face Verification Modal */}
      <FaceVerificationModal
        isOpen={showFaceVerification}
        onClose={() => {
          setShowFaceVerification(false);
          setMarking(false);
        }}
        onVerificationComplete={handleFaceVerificationComplete}
        employeeName={profile?.full_name || 'Employee'}
        employeeId={profile?.id || ''}
      />
    </DashboardLayout>
  );
};

export default DashboardScreen;
