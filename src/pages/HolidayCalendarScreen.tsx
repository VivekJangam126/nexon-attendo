import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar as CalendarIcon, Sun, FileText, Briefcase } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { RecurringHoliday, SpecificHoliday } from "@server";

// Cache for employee holiday data
const employeeHolidayCache = new Map<string, {
  data: {
    recurring: RecurringHoliday[];
    specific: SpecificHoliday[];
  };
  timestamp: number;
}>();

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for employee data

interface WorkApplication {
  id: string;
  employee_id: string;
  holiday_date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  created_at: string;
}

const HolidayCalendarScreen = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recurringHolidays, setRecurringHolidays] = useState<RecurringHoliday[]>([]);
  const [specificHolidays, setSpecificHolidays] = useState<SpecificHoliday[]>([]);
  const [workApplications, setWorkApplications] = useState<WorkApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingForWork, setApplyingForWork] = useState<string | null>(null);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Memoize cache key and date range
  const cacheKey = useMemo(() => user?.id || 'no-user', [user?.id]);
  
  const dateRange = useMemo(() => {
    const startDate = new Date().toISOString().split("T")[0]; // Start from today
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // Next 12 months
    return { startDate, endDate };
  }, []);

  const fetchHolidays = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = employeeHolidayCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setRecurringHolidays(cached.data.recurring);
      setSpecificHolidays(cached.data.specific);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // Fetch holidays and work applications in parallel
      const [holidayResponse, workAppsResult] = await Promise.all([
        fetch(`/api/holidays?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}&view=employee`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }),
        supabase
          .from('employee_work_applications')
          .select('*')
          .eq('employee_id', user.id)
          .gte('holiday_date', dateRange.startDate)
          .lte('holiday_date', dateRange.endDate)
      ]);

      if (holidayResponse.ok) {
        const data = await holidayResponse.json();
        
        // Deduplicate recurring holidays by day_of_week
        const uniqueRecurringHolidays = data.recurring_holidays?.reduce((unique: RecurringHoliday[], holiday: RecurringHoliday) => {
          const exists = unique.find(h => h.day_of_week === holiday.day_of_week);
          if (!exists) {
            unique.push(holiday);
          }
          return unique;
        }, []) || [];
        
        const holidayData = {
          recurring: uniqueRecurringHolidays,
          specific: data.specific_holidays || []
        };

        // Cache the data
        employeeHolidayCache.set(cacheKey, {
          data: holidayData,
          timestamp: Date.now()
        });

        setRecurringHolidays(holidayData.recurring);
        setSpecificHolidays(holidayData.specific);
      }

      // Set work applications
      if (workAppsResult.data) {
        setWorkApplications(workAppsResult.data);
      }
    } catch (error) {
      console.error("[Employee Calendar] Error fetching holidays:", error);
    } finally {
      setLoading(false);
    }
  }, [user, cacheKey, dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // Group holidays by month
  const holidaysByMonth = useMemo(() => {
    const grouped: { [key: string]: SpecificHoliday[] } = {};
    
    specificHolidays.forEach(holiday => {
      const date = new Date(holiday.holiday_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(holiday);
    });
    
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [specificHolidays]);

  // Check if employee has applied to work on a specific date
  const hasWorkApplication = useCallback((date: string) => {
    return workApplications.find(app => app.holiday_date === date);
  }, [workApplications]);

  // Handle work application
  const handleApplyToWork = async (holidayDate: string, reason: string) => {
    if (!user) return;

    setApplyingForWork(holidayDate);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('employee_work_applications')
        .insert({
          employee_id: user.id,
          holiday_date: holidayDate,
          reason: reason,
          status: 'pending'
        });

      if (!error) {
        toast({
          title: "Application Submitted",
          description: "Your request to work on this holiday has been submitted for approval.",
        });
        
        // Refresh work applications
        const { data: newApps } = await supabase
          .from('employee_work_applications')
          .select('*')
          .eq('employee_id', user.id)
          .gte('holiday_date', dateRange.startDate)
          .lte('holiday_date', dateRange.endDate);
        
        if (newApps) {
          setWorkApplications(newApps);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to submit application. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setApplyingForWork(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="My Holidays">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Holidays">
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-amber-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">My Holiday Schedule</h2>
              <p className="text-sm text-gray-600">View your holidays and apply to work if needed</p>
            </div>
          </div>
        </div>

        {/* Recurring Holidays */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recurring Holidays</h3>
          </div>

          {recurringHolidays.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recurringHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="p-4 rounded-lg bg-amber-50 border border-amber-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-amber-600">
                        {dayNames[holiday.day_of_week].substring(0, 1)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{dayNames[holiday.day_of_week]}</p>
                      <p className="text-xs text-gray-600">Weekly holiday</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sun className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">No recurring holidays</p>
              <p className="text-xs text-gray-500">You work all days of the week</p>
            </div>
          )}
        </div>

        {/* Specific Holidays - Grouped by Month */}
        <div className="space-y-6">
          {holidaysByMonth.length > 0 ? (
            holidaysByMonth.map(([monthKey, holidays]) => {
              const firstHoliday = holidays[0];
              const date = new Date(firstHoliday.holiday_date);
              const monthName = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
              
              return (
                <div key={monthKey} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
                  {/* Month Header */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                    <CalendarIcon className="w-5 h-5 text-amber-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{monthName}</h3>
                    <span className="ml-auto bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                      {holidays.length} {holidays.length === 1 ? 'holiday' : 'holidays'}
                    </span>
                  </div>

                  {/* Holiday Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {holidays.map((holiday) => {
                      const holidayDate = new Date(holiday.holiday_date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      holidayDate.setHours(0, 0, 0, 0);
                      
                      const isToday = holidayDate.getTime() === today.getTime();
                      const isPast = holidayDate < today;
                      const isFuture = holidayDate > today;
                      const workApp = hasWorkApplication(holiday.holiday_date);

                      return (
                        <div
                          key={holiday.id}
                          className={`relative overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-sm ${
                            isToday
                              ? "bg-green-50 border-green-200"
                              : isPast
                              ? "bg-gray-50 border-gray-200 opacity-60"
                              : workApp
                              ? "bg-blue-50 border-blue-200"
                              : "bg-amber-50 border-amber-200"
                          }`}
                        >
                          {/* Holiday Header */}
                          <div className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    isToday 
                                      ? "bg-green-100" 
                                      : isPast 
                                      ? "bg-gray-100" 
                                      : workApp 
                                      ? "bg-blue-100" 
                                      : "bg-amber-100"
                                  }`}>
                                    <FileText className={`w-3 h-3 ${
                                      isToday 
                                        ? "text-green-600" 
                                        : isPast 
                                        ? "text-gray-500" 
                                        : workApp 
                                        ? "text-blue-600" 
                                        : "text-amber-600"
                                    }`} />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-medium text-gray-800 leading-tight">{holiday.reason}</h4>
                                    <p className="text-[10px] text-gray-500 font-normal">
                                      {holiday.holiday_type?.replace('_', ' ')}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-[10px] text-gray-600 font-normal">
                                    {holidayDate.toLocaleDateString("en-US", {
                                      weekday: "short",
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </p>
                                  
                                  {/* Status Badges - Only show if work application exists */}
                                  {workApp && (
                                    <div className="flex flex-wrap gap-1">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                                        workApp.status === 'approved' 
                                          ? 'bg-green-100 text-green-700 border-green-200'
                                          : workApp.status === 'rejected'
                                          ? 'bg-red-100 text-red-700 border-red-200'
                                          : 'bg-blue-100 text-blue-700 border-blue-200'
                                      }`}>
                                        {workApp.status === 'approved' ? 'Approved' : 
                                         workApp.status === 'rejected' ? 'Rejected' : 'Applied'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Date Display */}
                              <div className="text-right">
                                <div className={`text-lg font-semibold ${
                                  isToday ? "text-green-600" : isPast ? "text-gray-400" : workApp ? "text-blue-600" : "text-amber-600"
                                }`}>
                                  {holidayDate.getDate()}
                                </div>
                                <div className="text-[9px] font-medium text-gray-500 uppercase">
                                  {holidayDate.toLocaleDateString("en-US", { month: "short" })}
                                </div>
                              </div>
                            </div>

                            {/* Work Application Details - Only if exists */}
                            {workApp && workApp.reason && (
                              <div className="mt-2 p-2 bg-white/50 rounded border border-white/60">
                                <p className="text-[9px] text-gray-600">
                                  <span className="text-gray-500">Applied:</span> {workApp.reason}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Apply to Work Button - Only show if admin allowed work applications */}
                          {!isPast && !workApp && holiday.work_applications_allowed === true && (
                            <div className="px-3 pb-3">
                              <Button
                                onClick={() => handleApplyToWork(holiday.holiday_date, `Want to work on ${holiday.reason}`)}
                                disabled={applyingForWork === holiday.holiday_date}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-1.5 rounded text-[10px] shadow-sm hover:shadow transition-all duration-200"
                              >
                                {applyingForWork === holiday.holiday_date ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <div className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Applying...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1">
                                    <Briefcase className="w-2.5 h-2.5" />
                                    <span>Apply to Work</span>
                                  </div>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">No holidays assigned</p>
              <p className="text-xs text-gray-500">Your admin hasn't assigned any holidays yet</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Holidays are assigned by your administrator. If you need to work on a holiday, 
            use the "Apply to Work" button and wait for approval. You will not be marked absent on approved holidays.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HolidayCalendarScreen;
