import { useState, useEffect } from "react";
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

const AdminHolidayCalendarScreen = () => {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recurringHolidays, setRecurringHolidays] = useState<RecurringHoliday[]>([]);
  const [specificHolidays, setSpecificHolidays] = useState<SpecificHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [holidayData, setHolidayData] = useState<{
    [key: string]: {
      recurring: RecurringHoliday[];
      specific: SpecificHoliday[];
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
    specific: []
  };

  // Debug current month data
  console.log('[Holiday Calendar] Current month data:', {
    monthKey: currentMonthKey,
    hasData: !!holidayData[currentMonthKey],
    recurring: currentMonthData.recurring?.length || 0,
    specific: currentMonthData.specific?.length || 0,
    allKeys: Object.keys(holidayData)
  });

  useEffect(() => {
    fetchData();
    // Pre-load adjacent months for instant navigation
    const timer = setTimeout(() => {
      preloadAdjacentMonths();
    }, 100);
    return () => clearTimeout(timer);
  }, [currentDate]);

  // Force refresh on component mount
  useEffect(() => {
    console.log('[Admin Holiday Calendar] Component mounted, forcing data refresh');
    fetchMonthData(currentDate, true);
  }, []);

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
          .select("id, full_name, email, role_type")
          .in("role_type", ["Employee", "Admin", "Super Admin"])
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

  const fetchMonthData = async (date: Date, forceRefresh = false) => {
    const monthKey = getMonthKey(date);
    
    // Skip if already cached and not forcing refresh
    if (holidayData[monthKey] && !forceRefresh) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0];
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];

      console.log('[Admin Holiday Calendar] Fetching data for:', { startDate, endDate, forceRefresh });

      // Fetch API data
      const response = await fetch(`/api/holidays?start_date=${startDate}&end_date=${endDate}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('[Admin Holiday Calendar] Received data:', {
          recurring: data.recurring_holidays?.length || 0,
          specific: data.specific_holidays?.length || 0,
          debug: data.debug,
          sample_data: {
            recurring: data.recurring_holidays?.slice(0, 2),
            specific: data.specific_holidays?.slice(0, 2)
          }
        });
        
        // Cache the data for this month
        setHolidayData(prev => ({
          ...prev,
          [monthKey]: {
            recurring: data.recurring_holidays || [],
            specific: data.specific_holidays || []
          }
        }));
      } else {
        console.error('[Admin Holiday Calendar] API error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('[Admin Holiday Calendar] Error details:', errorText);
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
    
    // Debug logging for specific dates
    if (day === 21) { // March 21 has specific holidays according to test data
      console.log('[Holiday Calendar] Debug for day', day, '(March 21):', {
        dateStr,
        dayOfWeek,
        currentMonthData: {
          recurring: currentMonthData.recurring?.length || 0,
          specific: currentMonthData.specific?.length || 0,
          recurring_sample: currentMonthData.recurring?.slice(0, 2),
          specific_sample: currentMonthData.specific?.slice(0, 2)
        },
        filtered: {
          recurring: recurring.length,
          specific: specific.length,
          recurring_data: recurring,
          specific_data: specific
        }
      });
    }
    
    // Check if any holiday is a public holiday or festival
    const hasPublicHoliday = specific.some(h => 
      h.holiday_type === 'public_holiday' || h.holiday_type === 'festival'
    );

    // Count unique employees (not individual records)
    const recurringEmployees = new Set(recurring.map(h => h.employee_id));
    const specificEmployees = new Set(specific.map(h => h.employee_id));
    const allEmployees = new Set([...recurringEmployees, ...specificEmployees]);

    const result = { 
      recurring, 
      specific, 
      total: allEmployees.size, // Count unique employees, not records
      hasPublicHoliday
    };

    // Debug logging for days with holidays
    if (result.total > 0) {
      console.log('[Holiday Calendar] Found holidays for day', day, ':', result);
    }

    return result;
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
        
        setRecurringModalOpen(false);
        
        // Force refresh the current month data to get the actual saved data
        await fetchMonthData(currentDate, true);
        
        console.log('[Holiday Calendar] Data refreshed after holiday creation');
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
        
        setSpecificModalOpen(false);
        
        // Force refresh the current month data to get the actual saved data
        await fetchMonthData(currentDate, true);
        
        console.log('[Holiday Calendar] Data refreshed after specific holiday creation');
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
                  
                  {/* Show employee count for holidays */}
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
