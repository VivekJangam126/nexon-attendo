import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar as CalendarIcon, Sun, FileText, ChevronDown, Briefcase, Clock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
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
      console.log('[Employee Calendar] Using cached data');
      setRecurringHolidays(cached.data.recurring);
      setSpecificHolidays(cached.data.specific);
      setLoading(false);
      return;
    }

    console.log('[Employee Calendar] Fetching fresh data for user:', user.id);
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

  // Filter holidays by selected month
  const filteredHolidays = useMemo(() => {
    if (selectedMonth === "all") {
      return specificHolidays;
    }
    
    const monthIndex = parseInt(selectedMonth);
    return specificHolidays.filter(holiday => {
      const holidayDate = new Date(holiday.holiday_date);
      return holidayDate.getMonth() === monthIndex;
    });
  }, [specificHolidays, selectedMonth]);

  // Group holidays by month for the filter dropdown
  const holidaysByMonth = useMemo(() => {
    const months: { [key: number]: number } = {};
    specificHolidays.forEach(holiday => {
      const month = new Date(holiday.holiday_date).getMonth();
      months[month] = (months[month] || 0) + 1;
    });
    return months;
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

        {/* Specific Holidays */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">Assigned Holidays</h3>
            </div>
            
            {/* Month Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter by month:</span>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All months ({specificHolidays.length})
                  </SelectItem>
                  {Object.entries(holidaysByMonth).map(([month, count]) => (
                    <SelectItem key={month} value={month}>
                      {monthNames[parseInt(month)]} ({count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredHolidays.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHolidays.map((holiday) => {
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
                    className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      isToday
                        ? "bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-green-100"
                        : isPast
                        ? "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 opacity-70"
                        : workApp
                        ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-blue-100"
                        : "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 shadow-amber-100"
                    }`}
                  >
                    {/* Holiday Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              isToday 
                                ? "bg-green-200" 
                                : isPast 
                                ? "bg-gray-200" 
                                : workApp 
                                ? "bg-blue-200" 
                                : "bg-amber-200"
                            }`}>
                              <FileText className={`w-6 h-6 ${
                                isToday 
                                  ? "text-green-700" 
                                  : isPast 
                                  ? "text-gray-600" 
                                  : workApp 
                                  ? "text-blue-700" 
                                  : "text-amber-700"
                              }`} />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-gray-900 leading-tight">{holiday.reason}</h4>
                              <p className="text-sm text-gray-600 font-medium">
                                {holiday.holiday_type?.replace('_', ' ').toUpperCase()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm text-gray-700 font-medium">
                              {holidayDate.toLocaleDateString("en-US", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                            
                            {/* Status Badges */}
                            <div className="flex flex-wrap gap-2">
                              {isToday && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-200 text-green-800 border border-green-300">
                                  TODAY
                                </span>
                              )}
                              {isPast && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700 border border-gray-300">
                                  PAST
                                </span>
                              )}
                              {workApp && (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                  workApp.status === 'approved' 
                                    ? 'bg-green-200 text-green-800 border-green-300'
                                    : workApp.status === 'rejected'
                                    ? 'bg-red-200 text-red-800 border-red-300'
                                    : 'bg-blue-200 text-blue-800 border-blue-300'
                                }`}>
                                  {workApp.status === 'approved' ? 'WORK APPROVED' : 
                                   workApp.status === 'rejected' ? 'WORK REJECTED' : 'WORK PENDING'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Large Date Display */}
                        <div className="text-right">
                          <div className={`text-4xl font-black ${
                            isToday ? "text-green-600" : isPast ? "text-gray-400" : workApp ? "text-blue-600" : "text-amber-600"
                          }`}>
                            {holidayDate.getDate()}
                          </div>
                          <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                            {holidayDate.toLocaleDateString("en-US", { month: "short" })}
                          </div>
                        </div>
                      </div>

                      {/* Work Application Status Details */}
                      {workApp && (
                        <div className="mt-4 p-4 bg-white/60 rounded-lg border border-white/40">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700 font-medium">
                              Applied on {new Date(workApp.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {workApp.reason && (
                            <p className="text-sm text-gray-600 mt-2 font-medium">
                              <span className="text-gray-500">Reason:</span> {workApp.reason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Apply to Work Button */}
                    {!isPast && !workApp && (
                      <div className="px-6 pb-6">
                        <Button
                          onClick={() => handleApplyToWork(holiday.holiday_date, `Want to work on ${holiday.reason}`)}
                          disabled={applyingForWork === holiday.holiday_date}
                          className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          {applyingForWork === holiday.holiday_date ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Applying...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <Briefcase className="w-5 h-5" />
                              <span>Apply to Work</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Decorative Corner */}
                    <div className={`absolute top-0 right-0 w-20 h-20 ${
                      isToday 
                        ? "bg-green-300/20" 
                        : isPast 
                        ? "bg-gray-300/20" 
                        : workApp 
                        ? "bg-blue-300/20" 
                        : "bg-amber-300/20"
                    } rounded-bl-full`} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">
                {selectedMonth === "all" ? "No holidays assigned" : `No holidays in ${monthNames[parseInt(selectedMonth)]}`}
              </p>
              <p className="text-xs text-gray-500">
                {selectedMonth === "all" 
                  ? "Your admin hasn't assigned any holidays yet" 
                  : "Try selecting a different month"}
              </p>
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
