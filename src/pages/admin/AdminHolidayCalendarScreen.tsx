import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { RecurringHoliday, SpecificHoliday, HolidayType } from "@server";

interface Employee {
  id: string;
  full_name: string;
  email: string;
}

// Cache for holiday data to avoid repeated API calls
const holidayCache = new Map<string, {
  data: {
    recurring: RecurringHoliday[];
    specific: SpecificHoliday[];
  };
  timestamp: number;
}>();

// Cache TTL: 15 minutes (increased from 5 minutes)
const CACHE_TTL = 15 * 60 * 1000;

interface Employee {
  id: string;
  full_name: string;
  email: string;
}

const AdminHolidayCalendarScreen = () => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [holidayData, setHolidayData] = useState<{
    recurring: RecurringHoliday[];
    specific: SpecificHoliday[];
  }>({ recurring: [], specific: [] });
  const [workApplications, setWorkApplications] = useState<{[key: string]: any[]}>({});

  // Modal states
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [specificModalOpen, setSpecificModalOpen] = useState(false);
  const [workApplicationsModalOpen, setWorkApplicationsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateWorkApps, setSelectedDateWorkApps] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [holidayType, setHolidayType] = useState<HolidayType>("public_holiday");
  const [holidayReason, setHolidayReason] = useState("");
  const [workApplicationsAllowed, setWorkApplicationsAllowed] = useState(false);
  const [viewHolidaysModalOpen, setViewHolidaysModalOpen] = useState(false);
  const [selectedDateHolidays, setSelectedDateHolidays] = useState<any[]>([]);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Memoize cache key to avoid recalculation - use quarter-based caching
  const cacheKey = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const quarter = Math.floor(month / 3); // 0, 1, 2, 3 for each quarter
    return `${year}-Q${quarter}`;
  }, [currentDate]);

  // Memoize date range for current quarter for better caching
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const quarter = Math.floor(month / 3);
    
    // Fetch data for the entire quarter (3 months)
    const startMonth = quarter * 3;
    const endMonth = startMonth + 3;
    
    const startDate = new Date(year, startMonth, 1).toISOString().split("T")[0];
    const endDate = new Date(year, endMonth, 0).toISOString().split("T")[0];
    
    return { startDate, endDate };
  }, [currentDate]);

  // Optimized data fetching with caching
  const fetchHolidayData = useCallback(async (isNavigation = false) => {
    // Check cache first
    const cached = holidayCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[Admin Holiday Calendar] Using cached data for', cacheKey);
      setHolidayData(cached.data);
      return;
    }

    if (isNavigation) {
      setNavigationLoading(true);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log('[Admin Holiday Calendar] Fetching fresh data for', cacheKey);

      // Fetch holidays and work applications in parallel
      const [holidayResponse, workAppsResult] = await Promise.all([
        fetch(`/api/holidays?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }),
        supabase
          .from('employee_work_applications')
          .select(`
            *,
            employee:profiles!employee_work_applications_employee_id_fkey(full_name, email)
          `)
          .gte('holiday_date', dateRange.startDate)
          .lte('holiday_date', dateRange.endDate)
      ]);

      if (holidayResponse.ok) {
        const data = await holidayResponse.json();
        const holidayData = {
          recurring: data.recurring_holidays || [],
          specific: data.specific_holidays || []
        };

        // Cache the data
        holidayCache.set(cacheKey, {
          data: holidayData,
          timestamp: Date.now()
        });

        setHolidayData(holidayData);
        console.log('[Admin Holiday Calendar] Data cached for', cacheKey);
      }

      // Process work applications by date
      if (workAppsResult.data) {
        const workAppsByDate: {[key: string]: any[]} = {};
        workAppsResult.data.forEach(app => {
          if (!workAppsByDate[app.holiday_date]) {
            workAppsByDate[app.holiday_date] = [];
          }
          workAppsByDate[app.holiday_date].push(app);
        });
        setWorkApplications(workAppsByDate);
      } else {
        setWorkApplications({});
      }
    } catch (error) {
      console.error("Error fetching holiday data:", error);
    } finally {
      if (isNavigation) {
        setNavigationLoading(false);
      }
    }
  }, [cacheKey, dateRange.startDate, dateRange.endDate]);

  // Fetch employees only once
  const fetchEmployees = useCallback(async () => {
    if (employees.length > 0) return; // Already loaded

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: employeesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, role_type")
        .eq("status", "active")
        .order("full_name");

      if (employeesData) {
        setEmployees(employeesData as Employee[]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  }, [employees.length]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchHolidayData(),
        fetchEmployees()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchHolidayData, fetchEmployees]);

  // Fetch data when month changes
  useEffect(() => {
    if (!loading) {
      fetchHolidayData(true); // Pass true to indicate this is navigation
    }
  }, [cacheKey, fetchHolidayData, loading]);

  // Memoize calendar days calculation
  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [currentDate]);

  // Optimized holiday lookup with work applications
  const getHolidaysForDate = useCallback((day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();

    const recurring = holidayData.recurring.filter(h => h.day_of_week === dayOfWeek);
    const specific = holidayData.specific.filter(h => h.holiday_date === dateStr);
    
    const recurringEmployees = new Set(recurring.map(h => h.employee_id));
    const specificEmployees = new Set(specific.map(h => h.employee_id));
    const allEmployees = new Set([...recurringEmployees, ...specificEmployees]);

    const hasPublicHoliday = specific.some(h => 
      h.holiday_type === 'public_holiday' || h.holiday_type === 'festival'
    );

    // Get work applications for this date
    const dayWorkApps = workApplications[dateStr] || [];
    const approvedWorkApps = dayWorkApps.filter(app => app.status === 'approved');
    const pendingWorkApps = dayWorkApps.filter(app => app.status === 'pending');

    const result = { 
      recurring, 
      specific, 
      total: allEmployees.size,
      hasPublicHoliday,
      hasAnyHoliday: allEmployees.size > 0,
      workApplications: dayWorkApps.length,
      comingToWork: approvedWorkApps.length,
      pendingWork: pendingWorkApps.length,
      takingHoliday: Math.max(0, allEmployees.size - approvedWorkApps.length)
    };

    return result;
  }, [currentDate, holidayData.recurring, holidayData.specific, workApplications]);

  // Handle work applications modal
  const handleWorkApplicationsClick = async (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setSelectedDate(dateStr);
    const dayWorkApps = workApplications[dateStr] || [];
    setSelectedDateWorkApps(dayWorkApps);
    setWorkApplicationsModalOpen(true);
  };

  // Approve/Reject work application
  const handleWorkApplicationAction = async (applicationId: string, action: 'approved' | 'rejected') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('employee_work_applications')
        .update({ 
          status: action,
          approved_by: session.user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (!error) {
        toast({
          title: "Success",
          description: `Work application ${action} successfully.`,
        });
        
        // Update local state immediately
        setWorkApplications(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(date => {
            updated[date] = updated[date].map(app => 
              app.id === applicationId 
                ? { 
                    ...app, 
                    status: action,
                    approved_by: session.user.id,
                    approved_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                : app
            );
          });
          return updated;
        });
        
        // Also update modal data if it's open
        if (selectedDateWorkApps.length > 0) {
          const updatedApps = selectedDateWorkApps.map(app => 
            app.id === applicationId 
              ? { 
                  ...app, 
                  status: action,
                  approved_by: session.user.id,
                  approved_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              : app
          );
          setSelectedDateWorkApps(updatedApps);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to update application status.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    }
  };

  const handleDayHeaderClick = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    setSelectedEmployees([]);
    setWorkApplicationsAllowed(false);
    setRecurringModalOpen(true);
  };

  const handleDateClick = async (day: number) => {
    // Create date string without timezone conversion
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // getMonth() is 0-indexed
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    console.log('[Admin Calendar] Clicked on date:', dateStr);
    
    // Check if there are work applications for this date first
    const dayWorkApps = workApplications[dateStr] || [];
    if (dayWorkApps.length > 0) {
      console.log('[Admin Calendar] Found work applications for this date:', dayWorkApps);
      setSelectedDate(dateStr);
      setSelectedDateWorkApps(dayWorkApps);
      setWorkApplicationsModalOpen(true);
      return; // Don't show holiday modal if there are work applications
    }
    
    setSelectedDate(dateStr);
    
    // Fetch existing holidays for this date
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[Admin Calendar] No session found');
        return;
      }

      console.log('[Admin Calendar] Fetching holidays for date:', dateStr);
      const response = await fetch(`/api/holidays?date=${dateStr}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('[Admin Calendar] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Admin Calendar] Received holiday data:', data);
        console.log('[Admin Calendar] Employees with holidays:', data.employees?.length || 0);
        setSelectedDateHolidays(data.employees || []);
      } else {
        const errorText = await response.text();
        console.error('[Admin Calendar] API error:', response.status, errorText);
        setSelectedDateHolidays([]);
      }
    } catch (error) {
      console.error("[Admin Calendar] Error fetching date holidays:", error);
      setSelectedDateHolidays([]);
    }

    // Auto-select all employees so admin doesn't have to manually click "Select All"
    setSelectedEmployees(employees.map(e => e.id));
    setHolidayReason("");
    setHolidayType("public_holiday");
    // Don't reset workApplicationsAllowed here - let admin choose each time
    setSpecificModalOpen(true);
  };

  const handleCreateRecurringHoliday = async () => {
    if (selectedDay === null || selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one employee",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/holidays/recurring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          employee_ids: selectedEmployees,
          day_of_week: selectedDay,
          work_applications_allowed: workApplicationsAllowed,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Recurring holiday created for ${selectedEmployees.length} employee(s)`,
        });
        
        setRecurringModalOpen(false);
        
        // Invalidate cache and refresh data
        holidayCache.delete(cacheKey);
        await fetchHolidayData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create holiday",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create holiday",
        variant: "destructive",
      });
    }
  };

  const handleCreateSpecificHoliday = async () => {
    if (!selectedDate || selectedEmployees.length === 0 || !holidayReason) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload = {
        employee_ids: selectedEmployees,
        holiday_date: selectedDate,
        holiday_type: holidayType,
        reason: holidayReason,
        work_applications_allowed: workApplicationsAllowed,
      };

      console.log('[Admin] Creating specific holiday with payload:', payload);
      console.log('[Admin] work_applications_allowed value:', workApplicationsAllowed, typeof workApplicationsAllowed);

      const response = await fetch("/api/holidays/specific", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Holiday created for ${selectedEmployees.length} employee(s)`,
        });
        
        setSpecificModalOpen(false);
        
        // Reset form state after successful creation
        setSelectedEmployees([]);
        setHolidayReason("");
        setHolidayType("public_holiday");
        setWorkApplicationsAllowed(false);
        
        // Invalidate cache and refresh data
        holidayCache.delete(cacheKey);
        await fetchHolidayData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create holiday",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create holiday",
        variant: "destructive",
      });
    }
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const selectAllEmployees = () => {
    setSelectedEmployees(employees.map(e => e.id));
  };

  const clearAllEmployees = () => {
    setSelectedEmployees([]);
  };

  const handleDeleteSpecificHoliday = async (employeeId: string, date: string) => {
    try {
      const { error } = await supabase
        .from("employee_specific_holidays")
        .delete()
        .eq("employee_id", employeeId)
        .eq("holiday_date", date);

      if (!error) {
        toast({
          title: "Success",
          description: "Holiday deleted successfully",
        });
        
        // Update local state immediately
        setSelectedDateHolidays(prev => prev.filter(emp => emp.id !== employeeId));
        
        // Invalidate cache and refresh
        holidayCache.delete(cacheKey);
        await fetchHolidayData();
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to delete holiday",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete holiday",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllHolidaysForDate = async () => {
    if (!selectedDate || selectedDateHolidays.length === 0) return;

    try {
      const employeeIds = selectedDateHolidays.map(emp => emp.id);
      
      const { error } = await supabase
        .from("employee_specific_holidays")
        .delete()
        .in("employee_id", employeeIds)
        .eq("holiday_date", selectedDate);

      if (!error) {
        toast({
          title: "Success",
          description: `Deleted ${selectedDateHolidays.length} holiday(s) successfully`,
        });
        
        setSelectedDateHolidays([]);
        
        // Invalidate cache and refresh
        holidayCache.delete(cacheKey);
        await fetchHolidayData();
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to delete holidays",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete holidays",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecurringHoliday = async (employeeId: string, dayOfWeek: number) => {
    try {
      const { error } = await supabase
        .from("employee_recurring_holidays")
        .delete()
        .eq("employee_id", employeeId)
        .eq("day_of_week", dayOfWeek);

      if (!error) {
        toast({
          title: "Success",
          description: "Recurring holiday deleted successfully",
        });
        
        // Invalidate cache and refresh
        holidayCache.delete(cacheKey);
        await fetchHolidayData();
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to delete holiday",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete holiday",
        variant: "destructive",
      });
    }
  };

  // Optimized navigation - don't clear cache, just change date
  const previousMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Holiday Calendar" isAdmin>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Holiday Calendar" isAdmin>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-amber-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Holiday Management</h2>
                <p className="text-sm text-gray-600">Manage recurring and specific holidays</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Month Navigation */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={previousMonth}
                  disabled={navigationLoading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-4 flex items-center gap-2">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  {navigationLoading && (
                    <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  )}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={nextMonth}
                  disabled={navigationLoading}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm w-full max-w-4xl mx-auto">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
            {dayNames.map((day, index) => (
              <button
                key={day}
                onClick={() => handleDayHeaderClick(index)}
                className="p-2 sm:p-2.5 flex items-center justify-center font-semibold text-gray-700 bg-amber-50 hover:bg-amber-100 rounded transition-colors border border-amber-200 text-xs sm:text-sm"
              >
                {day}
              </button>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-16 sm:h-18" />;
              }

              const holidays = getHolidaysForDate(day);
              const hasHolidays = holidays.total > 0;
              const hasPublicHoliday = holidays.hasPublicHoliday;
              const hasAnyHoliday = holidays.hasAnyHoliday;
              
              // Check if this is today
              const today = new Date();
              const isToday = 
                day === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear();

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`h-16 sm:h-18 p-1 sm:p-1.5 rounded border transition-all flex flex-col items-center justify-start ${
                    isToday
                      ? "bg-green-100 border-green-400 ring-2 ring-green-500 hover:bg-green-200"
                      : hasPublicHoliday
                      ? "bg-red-50 border-red-300 hover:bg-red-100"
                      : hasAnyHoliday
                      ? "bg-amber-100 border-amber-300 hover:bg-amber-200"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className={`text-sm font-medium ${
                    isToday 
                      ? "text-green-900" 
                      : hasPublicHoliday 
                      ? "text-red-700" 
                      : "text-gray-900"
                  }`}>
                    {day}
                  </div>
                  
                  {/* Show holiday and work application info */}
                  {hasAnyHoliday && (
                    <div className="mt-0.5 flex flex-col items-center gap-1 w-full px-0.5">
                      {/* Total holiday count */}
                      <div className="flex items-center justify-center gap-0.5">
                        <Users className={`w-2.5 h-2.5 ${isToday ? "text-green-700" : hasPublicHoliday ? "text-red-600" : "text-amber-600"}`} />
                        <span className={`text-[10px] font-medium ${isToday ? "text-green-800" : hasPublicHoliday ? "text-red-700" : "text-amber-700"}`}>
                          {holidays.total}
                        </span>
                      </div>
                      
                      {/* Show holiday reason if there's a specific holiday */}
                      {holidays.specific.length > 0 && holidays.specific[0].reason && (
                        <div className={`text-[9px] text-center leading-tight truncate w-full ${
                          isToday ? "text-green-700" : hasPublicHoliday ? "text-red-600" : "text-amber-600"
                        }`} title={holidays.specific[0].reason}>
                          {holidays.specific[0].reason}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isToday && !hasAnyHoliday && (
                    <div className="mt-0.5 text-[10px] text-green-700 font-medium">Today</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recurring Holiday Modal */}
        <Dialog open={recurringModalOpen} onOpenChange={setRecurringModalOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Recurring Holiday - {selectedDay !== null && dayNames[selectedDay]}</DialogTitle>
              <DialogDescription>
                Select employees who DO NOT work on {selectedDay !== null && dayNames[selectedDay]}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllEmployees}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllEmployees}>
                  Clear All
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                {employees.map(employee => (
                  <div key={employee.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={employee.id}
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={() => toggleEmployee(employee.id)}
                    />
                    <Label htmlFor={employee.id} className="text-sm cursor-pointer flex-1">
                      {employee.full_name}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="work-applications-allowed"
                  checked={workApplicationsAllowed}
                  onCheckedChange={setWorkApplicationsAllowed}
                />
                <Label htmlFor="work-applications-allowed" className="text-sm cursor-pointer flex-1">
                  Allow employees to apply for work on this holiday
                </Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateRecurringHoliday} className="flex-1">
                  Confirm Holiday
                </Button>
                <Button variant="outline" onClick={() => setRecurringModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Specific Holiday Modal */}
        <Dialog open={specificModalOpen} onOpenChange={setSpecificModalOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Holiday Setup</DialogTitle>
              <DialogDescription>
                Date: {selectedDate && new Date(selectedDate).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Show existing holidays for this date */}
              {selectedDateHolidays.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-amber-900">
                      Existing holidays on this date ({selectedDateHolidays.length})
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAllHolidaysForDate}
                      className="text-xs"
                    >
                      Delete All
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedDateHolidays.map((emp: any) => (
                      <div key={emp.id} className="flex items-center justify-between bg-white p-2 rounded border border-amber-200">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-600">{emp.reason}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => selectedDate && handleDeleteSpecificHoliday(emp.id, selectedDate)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="holiday-type">Holiday Type</Label>
                <Select value={holidayType} onValueChange={(value) => setHolidayType(value as HolidayType)}>
                  <SelectTrigger id="holiday-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public_holiday">Public Holiday</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="company_event">Company Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Holi, Diwali, Independence Day"
                  value={holidayReason}
                  onChange={(e) => setHolidayReason(e.target.value)}
                />
              </div>

              <div>
                <Label>Add More Employees</Label>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={selectAllEmployees}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllEmployees}>
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {employees.map(employee => (
                  <div key={employee.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`specific-${employee.id}`}
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={() => toggleEmployee(employee.id)}
                    />
                    <Label htmlFor={`specific-${employee.id}`} className="text-sm cursor-pointer flex-1">
                      {employee.full_name}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="specific-work-applications-allowed"
                  checked={workApplicationsAllowed}
                  onCheckedChange={(checked) => {
                    console.log('[Admin] Work applications checkbox changed:', checked, typeof checked);
                    setWorkApplicationsAllowed(checked === true);
                  }}
                />
                <Label htmlFor="specific-work-applications-allowed" className="text-sm cursor-pointer flex-1">
                  Allow employees to apply for work on this holiday
                </Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateSpecificHoliday} className="flex-1">
                  Confirm Holiday
                </Button>
                <Button variant="outline" onClick={() => setSpecificModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Work Applications Modal */}
        <Dialog open={workApplicationsModalOpen} onOpenChange={setWorkApplicationsModalOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>Work Applications</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-bold">
                  {selectedDateWorkApps.length}
                </span>
              </DialogTitle>
              <DialogDescription>
                Employees who want to work on {selectedDate && new Date(selectedDate).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedDateWorkApps.length > 0 ? (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {selectedDateWorkApps.filter(app => app.status === 'approved').length}
                      </div>
                      <div className="text-xs text-gray-600">Approved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {selectedDateWorkApps.filter(app => app.status === 'pending').length}
                      </div>
                      <div className="text-xs text-gray-600">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {selectedDateWorkApps.filter(app => app.status === 'rejected').length}
                      </div>
                      <div className="text-xs text-gray-600">Rejected</div>
                    </div>
                  </div>

                  {/* Applications List */}
                  <div className="space-y-3">
                    {selectedDateWorkApps.map((app) => (
                      <div key={app.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">Employee {app.employee_id.substring(0, 8)}</h4>
                            <p className="text-sm text-gray-600 mt-1">{app.reason}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Applied: {new Date(app.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              app.status === 'approved' 
                                ? 'bg-green-100 text-green-700'
                                : app.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        {app.status === 'pending' && (
                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <Button
                              size="sm"
                              onClick={() => handleWorkApplicationAction(app.id, 'approved')}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleWorkApplicationAction(app.id, 'rejected')}
                              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No work applications for this date</p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setWorkApplicationsModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Work Applications Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Work Applications</h3>
              <p className="text-sm text-gray-600">Employees requesting to work on holidays</p>
            </div>
          </div>

          {Object.keys(workApplications).length > 0 ? (
            <div className="space-y-6">
              {/* Pending Applications */}
              {Object.values(workApplications).flat().filter(app => app.status === 'pending').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <h4 className="font-medium text-gray-900">Pending Approval</h4>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {Object.values(workApplications).flat().filter(app => app.status === 'pending').length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(workApplications).map(([date, apps]) =>
                      apps.filter(app => app.status === 'pending').map(app => (
                        <div key={app.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="font-medium text-gray-900">{app.employee?.full_name || `Employee ${app.employee_id.substring(0, 8)}`}</h5>
                              <p className="text-sm text-blue-700 font-medium">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            </div>
                            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              Pending
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{app.reason}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleWorkApplicationAction(app.id, 'approved')}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleWorkApplicationAction(app.id, 'rejected')}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Approved Applications */}
              {Object.values(workApplications).flat().filter(app => app.status === 'approved').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    <h4 className="font-medium text-gray-900">Approved to Work</h4>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      {Object.values(workApplications).flat().filter(app => app.status === 'approved').length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(workApplications).map(([date, apps]) =>
                      apps.filter(app => app.status === 'approved').map(app => (
                        <div key={app.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="font-medium text-gray-900">{app.employee?.full_name || `Employee ${app.employee_id.substring(0, 8)}`}</h5>
                              <p className="text-sm text-green-700 font-medium">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            </div>
                            <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-medium">
                              Approved
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{app.reason}</p>
                          <p className="text-xs text-gray-500">
                            Approved on {new Date(app.approved_at || app.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Rejected Applications */}
              {Object.values(workApplications).flat().filter(app => app.status === 'rejected').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                    <h4 className="font-medium text-gray-900">Rejected Applications</h4>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      {Object.values(workApplications).flat().filter(app => app.status === 'rejected').length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(workApplications).map(([date, apps]) =>
                      apps.filter(app => app.status === 'rejected').map(app => (
                        <div key={app.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="font-medium text-gray-900">{app.employee?.full_name || `Employee ${app.employee_id.substring(0, 8)}`}</h5>
                              <p className="text-sm text-red-700 font-medium">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            </div>
                            <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-medium">
                              Rejected
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{app.reason}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 className="text-sm font-medium text-gray-900 mb-1">No Work Applications</h4>
              <p className="text-sm text-gray-500">No employees have requested to work on holidays this month</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminHolidayCalendarScreen;
