import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Trash2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
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

interface SyncStatus {
  currentYear: { year: number; count: number };
  nextYear: { year: number; count: number };
}

const AdminHolidayCalendarScreen = () => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recurringHolidays, setRecurringHolidays] = useState<RecurringHoliday[]>([]);
  const [specificHolidays, setSpecificHolidays] = useState<SpecificHoliday[]>([]);
  const [masterHolidays, setMasterHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [holidayData, setHolidayData] = useState<{
    [key: string]: {
      recurring: RecurringHoliday[];
      specific: SpecificHoliday[];
      master: any[];
    };
  }>({});

  // Modal states
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [specificModalOpen, setSpecificModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [holidayType, setHolidayType] = useState<HolidayType>("public_holiday");
  const [holidayReason, setHolidayReason] = useState("");
  const [viewHolidaysModalOpen, setViewHolidaysModalOpen] = useState(false);
  const [selectedDateHolidays, setSelectedDateHolidays] = useState<any[]>([]);
  
  // Sync status states
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Get current month key
  const getMonthKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}`;
  };

  // Get data for current month from cache
  const currentMonthKey = getMonthKey(currentDate);
  const currentMonthData = holidayData[currentMonthKey] || {
    recurring: [],
    specific: [],
    master: []
  };

  useEffect(() => {
    fetchData();
    fetchSyncStatus();
    // Pre-load adjacent months for instant navigation
    const timer = setTimeout(() => {
      preloadAdjacentMonths();
    }, 100);
    return () => clearTimeout(timer);
  }, [currentDate]);

  const fetchData = async () => {
    const monthKey = getMonthKey(currentDate);
    
    // If data already cached, skip loading
    if (holidayData[monthKey]) {
      return;
    }

    // Only show loading on initial load
    if (Object.keys(holidayData).length === 0) {
      setLoading(true);
    }

    try {
      // Fetch employees only once
      if (employees.length === 0) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: employeesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("role", "employee")
          .eq("status", "active")
          .order("full_name");

        if (employeesData) {
          setEmployees(employeesData as Employee[]);
        }
      }

      await fetchMonthData(currentDate);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthData = async (date: Date) => {
    const monthKey = getMonthKey(date);
    
    // Skip if already cached
    if (holidayData[monthKey]) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0];
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];

      // Fetch master holidays and API data in parallel for speed
      const [masterHolidaysResponse, apiResponse] = await Promise.all([
        supabase
          .from("master_public_holidays")
          .select("*")
          .gte("holiday_date", startDate)
          .lte("holiday_date", endDate)
          .eq("is_active", true),
        fetch(`/api/holidays?start_date=${startDate}&end_date=${endDate}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
      ]);

      const masterHolidaysData = masterHolidaysResponse.data || [];
      
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        
        // Cache the data for this month
        setHolidayData(prev => ({
          ...prev,
          [monthKey]: {
            recurring: data.recurring_holidays || [],
            specific: data.specific_holidays || [],
            master: masterHolidaysData
          }
        }));
      }
    } catch (error) {
      console.error("Error fetching month data:", error);
    }
  };

  const preloadAdjacentMonths = () => {
    // Pre-load previous and next month data in background
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    
    fetchMonthData(prevMonth);
    fetchMonthData(nextMonth);
  };

  const getDaysInMonth = () => {
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
  };

  const getHolidaysForDate = (day: number) => {
    // Create date string without timezone conversion
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // getMonth() is 0-indexed
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Get day of week for the date
    const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    const dayOfWeek = date.getDay();

    const recurring = currentMonthData.recurring.filter(h => h.day_of_week === dayOfWeek);
    const specific = currentMonthData.specific.filter(h => h.holiday_date === dateStr);
    
    // Check if this date has a master public holiday
    const masterHoliday = currentMonthData.master.find(h => h.holiday_date === dateStr);
    
    // Get unique holiday names for this date
    const holidayNames = new Set<string>();
    
    // Add master holiday name first (priority)
    if (masterHoliday) {
      holidayNames.add(masterHoliday.holiday_name);
    }
    
    // Add specific holiday names
    specific.forEach(h => {
      if (!masterHoliday || h.reason !== masterHoliday.holiday_name) {
        holidayNames.add(h.reason);
      }
    });
    
    // Check if any holiday is a public holiday or festival OR if there's a master holiday
    const hasPublicHoliday = masterHoliday || specific.some(h => 
      h.holiday_type === 'public_holiday' || h.holiday_type === 'festival'
    );

    return { 
      recurring, 
      specific, 
      total: recurring.length + specific.length,
      holidayNames: Array.from(holidayNames),
      hasPublicHoliday,
      masterHoliday
    };
  };

  const handleDayHeaderClick = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    setSelectedEmployees([]);
    setRecurringModalOpen(true);
  };

  const handleDateClick = async (day: number) => {
    // Create date string without timezone conversion
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // getMonth() is 0-indexed
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setSelectedDate(dateStr);
    
    // Fetch existing holidays for this date
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/holidays?date=${dateStr}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedDateHolidays(data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching date holidays:", error);
    }

    setSelectedEmployees([]);
    setHolidayReason("");
    setHolidayType("public_holiday");
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

    console.log('[Holiday Calendar] Creating recurring holiday:', {
      employee_ids: selectedEmployees,
      day_of_week: selectedDay,
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[Holiday Calendar] No session found');
        return;
      }

      console.log('[Holiday Calendar] Sending request to /api/holidays/recurring');

      const response = await fetch("/api/holidays/recurring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          employee_ids: selectedEmployees,
          day_of_week: selectedDay,
        }),
      });

      console.log('[Holiday Calendar] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Holiday Calendar] Success:', data);
        toast({
          title: "Success",
          description: `Recurring holiday created for ${selectedEmployees.length} employee(s)`,
        });
        
        // Optimistically update the UI immediately
        const monthKey = getMonthKey(currentDate);
        const newRecurringHolidays = selectedEmployees.map(empId => ({
          id: `temp-${empId}-${selectedDay}`,
          employee_id: empId,
          day_of_week: selectedDay!,
          created_at: new Date().toISOString()
        }));
        
        // Update cache with new holidays
        setHolidayData(prev => {
          const currentData = prev[monthKey] || { recurring: [], specific: [], master: [] };
          return {
            ...prev,
            [monthKey]: {
              ...currentData,
              recurring: [...currentData.recurring, ...newRecurringHolidays]
            }
          };
        });
        
        setRecurringModalOpen(false);
        
        // No need to clear cache - the optimistic update is already correct
        // The server data will match what we added optimistically
      } else {
        const error = await response.json();
        console.error('[Holiday Calendar] Error response:', error);
        toast({
          title: "Error",
          description: error.error || "Failed to create holiday",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[Holiday Calendar] Exception:', error);
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

      const response = await fetch("/api/holidays/specific", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          employee_ids: selectedEmployees,
          holiday_date: selectedDate,
          holiday_type: holidayType,
          reason: holidayReason,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Holiday created for ${selectedEmployees.length} employee(s)`,
        });
        
        // Optimistically update the UI immediately
        const monthKey = getMonthKey(currentDate);
        const newHolidays = selectedEmployees.map(empId => ({
          id: `temp-${empId}-${selectedDate}`,
          employee_id: empId,
          holiday_date: selectedDate,
          holiday_type: holidayType,
          reason: holidayReason,
          created_at: new Date().toISOString()
        }));
        
        // Update cache with new holidays
        setHolidayData(prev => {
          const currentData = prev[monthKey] || { recurring: [], specific: [], master: [] };
          return {
            ...prev,
            [monthKey]: {
              ...currentData,
              specific: [...currentData.specific, ...newHolidays]
            }
          };
        });
        
        setSpecificModalOpen(false);
        
        // No need to clear cache - the optimistic update is already correct
        // The server data will match what we added optimistically
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Direct delete using Supabase for faster deletion
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
        
        // Update local state immediately for instant UI update
        setSelectedDateHolidays(prev => prev.filter(emp => emp.id !== employeeId));
        
        // Update cache by removing the deleted holiday
        const monthKey = getMonthKey(currentDate);
        setHolidayData(prev => {
          const currentData = prev[monthKey];
          if (!currentData) return prev;
          
          return {
            ...prev,
            [monthKey]: {
              ...currentData,
              specific: currentData.specific.filter(
                h => !(h.employee_id === employeeId && h.holiday_date === date)
              )
            }
          };
        });
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Bulk delete all holidays for this date
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
        
        // Clear local state immediately
        setSelectedDateHolidays([]);
        
        // Update cache by removing all deleted holidays
        const monthKey = getMonthKey(currentDate);
        setHolidayData(prev => {
          const currentData = prev[monthKey];
          if (!currentData) return prev;
          
          return {
            ...prev,
            [monthKey]: {
              ...currentData,
              specific: currentData.specific.filter(
                h => !(employeeIds.includes(h.employee_id) && h.holiday_date === selectedDate)
              )
            }
          };
        });
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Direct delete using Supabase for faster deletion
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
        
        // Update cache by removing the deleted recurring holiday
        const monthKey = getMonthKey(currentDate);
        setHolidayData(prev => {
          const currentData = prev[monthKey];
          if (!currentData) return prev;
          
          return {
            ...prev,
            [monthKey]: {
              ...currentData,
              recurring: currentData.recurring.filter(
                h => !(h.employee_id === employeeId && h.day_of_week === dayOfWeek)
              )
            }
          };
        });
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

  // Sync functions
  const fetchSyncStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[Sync Status] No session found');
        return;
      }

      console.log('[Sync Status] Fetching sync status...');
      const response = await fetch('/api/holidays/sync', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('[Sync Status] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Sync Status] Received data:', data);
        setSyncStatus(data.status);
      } else {
        const errorData = await response.json();
        console.error('[Sync Status] Error response:', errorData);
      }
    } catch (error) {
      console.error('[Sync Status] Error fetching sync status:', error);
    }
  };

  const handleManualSync = async () => {
    console.log('[Admin Calendar] Manual sync triggered');
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[Admin Calendar] No session found');
        return;
      }

      console.log('[Admin Calendar] Calling /api/holidays/sync...');
      const response = await fetch('/api/holidays/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('[Admin Calendar] Sync response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Admin Calendar] Sync response data:', data);
        setSyncStatus(data.status);
        toast({
          title: "Success",
          description: data.message || "Holiday sync completed successfully",
        });
        
        // Clear cache and force reload current month data
        setHolidayData({});
        
        // Force fetch current month data
        const monthKey = getMonthKey(currentDate);
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split("T")[0];
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split("T")[0];

        // Fetch fresh data
        const [masterHolidaysResponse, apiResponse] = await Promise.all([
          supabase
            .from("master_public_holidays")
            .select("*")
            .gte("holiday_date", startDate)
            .lte("holiday_date", endDate)
            .eq("is_active", true),
          fetch(`/api/holidays?start_date=${startDate}&end_date=${endDate}`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          })
        ]);

        const masterHolidaysData = masterHolidaysResponse.data || [];
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          
          // Update cache with fresh data
          setHolidayData({
            [monthKey]: {
              recurring: apiData.recurring_holidays || [],
              specific: apiData.specific_holidays || [],
              master: masterHolidaysData
            }
          });
        }
        
        // Also refresh sync status
        await fetchSyncStatus();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to sync holidays",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync holidays",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const previousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    setCurrentDate(newDate);
    // Pre-fetch data for the new month if not cached
    const monthKey = getMonthKey(newDate);
    if (!holidayData[monthKey]) {
      // Data will be fetched by useEffect
    }
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    setCurrentDate(newDate);
    // Pre-fetch data for the new month if not cached
    const monthKey = getMonthKey(newDate);
    if (!holidayData[monthKey]) {
      // Data will be fetched by useEffect
    }
  };

  const days = getDaysInMonth();

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
              {/* Sync Status & Button */}
              <div className="flex items-center gap-2 text-xs">
                {syncStatus ? (
                  <>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span className="text-gray-600">
                        {syncStatus.currentYear.year}: {syncStatus.currentYear.count} holidays
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {syncStatus.nextYear.count > 0 ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                      )}
                      <span className="text-gray-600">
                        {syncStatus.nextYear.year}: {syncStatus.nextYear.count} holidays
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-gray-500">Loading sync status...</span>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="h-6 px-2 text-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync'}
                </Button>
              </div>
              
              {/* Month Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-4">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <Button variant="outline" size="sm" onClick={nextMonth}>
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
                      : hasHolidays
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
                  
                  {/* Show holiday name for public holidays/festivals */}
                  {holidays.holidayNames.length > 0 && (
                    <div className="mt-0.5 text-[9px] sm:text-[10px] font-medium text-center leading-tight px-0.5 line-clamp-2 max-w-full">
                      <span className={hasPublicHoliday ? "text-red-600" : "text-amber-700"}>
                        {holidays.holidayNames[0]}
                      </span>
                    </div>
                  )}
                  
                  {/* Show employee count for all holidays including public holidays */}
                  {hasHolidays && (
                    <div className="mt-0.5 flex items-center justify-center gap-0.5">
                      <Users className={`w-2.5 h-2.5 ${isToday ? "text-green-700" : hasPublicHoliday ? "text-red-600" : "text-amber-600"}`} />
                      <span className={`text-[10px] ${isToday ? "text-green-800" : hasPublicHoliday ? "text-red-700" : "text-amber-700"}`}>
                        {holidays.total}
                      </span>
                    </div>
                  )}
                  
                  {isToday && !hasHolidays && (
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
      </div>
    </DashboardLayout>
  );
};

export default AdminHolidayCalendarScreen;
