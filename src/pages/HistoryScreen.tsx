import { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle2, AlertCircle, XCircle, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { attendanceService } from "@server";
import type { Attendance } from "@server";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const StatusIcon = ({ status }: { status: "present" | "late" | "absent" | "holiday" | "on_leave" }) => {
  switch (status) {
    case "present":
      return (
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
        </div>
      );
    case "late":
      return (
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
        </div>
      );
    case "absent":
      return (
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
        </div>
      );
    case "holiday":
      return (
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
        </div>
      );
    case "on_leave":
      return (
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
        </div>
      );
  }
};

const StatusBadge = ({ status }: { status: "present" | "late" | "absent" | "holiday" | "on_leave" }) => {
  const configs = {
    present: { label: "Present", className: "bg-green-100 text-green-700" },
    late: { label: "Late", className: "bg-amber-100 text-amber-700" },
    absent: { label: "Absent", className: "bg-red-100 text-red-700" },
    holiday: { label: "Holiday", className: "bg-blue-100 text-blue-700" },
    on_leave: { label: "On Leave", className: "bg-purple-100 text-purple-700" },
  };

  const config = configs[status] || configs.absent;

  return (
    <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const HistoryScreen = () => {
  const { profile } = useAuth();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [dateRange, setDateRange] = useState<"week" | "month">("week");
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "late" | "absent" | "holiday" | "on_leave">("all");

  const fetchHistory = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    console.log('🔍 Fetching history for profile:', profile);
    setLoading(true);
    const { attendance, error: fetchError } = await attendanceService.getAttendanceHistory(profile, 30);
    
    console.log('📊 Attendance service response:', { attendance, error: fetchError });
    console.log('📈 Number of records returned:', attendance?.length || 0);
    if (attendance && attendance.length > 0) {
      console.log('📅 First 5 records:', attendance.slice(0, 5));
    }
    
    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const filledRecords = await fillMissingDates(attendance, 30);
    console.log('📋 Filled records count:', filledRecords.length);
    console.log('📋 First 5 filled records:', filledRecords.slice(0, 5));
    
    setRecords(filledRecords);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [profile]);

  useEffect(() => {
    let filtered = [...records];

    const days = dateRange === "week" ? 7 : 30;
    filtered = filtered.slice(0, days);

    if (statusFilter !== "all") {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    setFilteredRecords(filtered);
  }, [records, dateRange, statusFilter]);

  const fillMissingDates = async (records: Attendance[], days: number): Promise<Attendance[]> => {
    const now = new Date();
    // Get today's date in YYYY-MM-DD format in local timezone
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    // Get employee registration date to avoid showing absences before joining
    let registrationDate: Date | null = null;
    if (profile?.created_at) {
      registrationDate = new Date(profile.created_at);
    }

    const recordMap = new Map<string, Attendance>();
    records.forEach(record => {
      const normalizedDate = record.date.split('T')[0];
      recordMap.set(normalizedDate, record);
    });

    // Fetch holidays and leaves for this employee using Supabase directly
    const holidayDates = new Set<string>();
    const leaveDates = new Map<string, string>(); // date -> leave type

    if (profile?.id) {
      try {
        // Fetch recurring holidays
        const { data: recurringHolidays } = await supabase
          .from('employee_recurring_holidays')
          .select('day_of_week')
          .eq('employee_id', profile.id);

        if (recurringHolidays) {
          const holidayDays = new Set(recurringHolidays.map((h: any) => h.day_of_week));
          
          for (let i = 0; i < days; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Skip dates before registration
            if (registrationDate && date < registrationDate) {
              continue;
            }
            
            // Use local day of week, not UTC
            const dayOfWeek = date.getDay();
            const dateYear = date.getFullYear();
            const dateMonth = String(date.getMonth() + 1).padStart(2, '0');
            const dateDay = String(date.getDate()).padStart(2, '0');
            const dateString = `${dateYear}-${dateMonth}-${dateDay}`;
            
            if (holidayDays.has(dayOfWeek)) {
              holidayDates.add(dateString);
            }
          }
        }

        // Fetch specific holidays
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
        const startYear = thirtyDaysAgo.getFullYear();
        const startMonth = String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0');
        const startDay = String(thirtyDaysAgo.getDate()).padStart(2, '0');
        const startDate = `${startYear}-${startMonth}-${startDay}`;

        const { data: specificHolidays } = await supabase
          .from('employee_specific_holidays')
          .select('holiday_date')
          .eq('employee_id', profile.id)
          .gte('holiday_date', startDate);

        if (specificHolidays) {
          specificHolidays.forEach((h: any) => {
            holidayDates.add(h.holiday_date);
          });
        }

        // Fetch approved leaves
        const { data: approvedLeaves } = await supabase
          .from('leave_requests')
          .select('start_date, end_date, leave_type_id')
          .eq('employee_id', profile.id)
          .eq('status', 'approved')
          .gte('end_date', startDate);

        if (approvedLeaves) {
          // Get leave type names
          const leaveTypeIds = [...new Set(approvedLeaves.map((l: any) => l.leave_type_id))];
          if (leaveTypeIds.length > 0) {
            const { data: leaveTypes } = await supabase
              .from('leave_types')
              .select('id, name')
              .in('id', leaveTypeIds);

            const leaveTypeMap = new Map(leaveTypes?.map((lt: any) => [lt.id, lt.name]) || []);

            approvedLeaves.forEach((leave: any) => {
              const start = new Date(leave.start_date + 'T00:00:00');
              const end = new Date(leave.end_date + 'T00:00:00');
              const leaveTypeName = leaveTypeMap.get(leave.leave_type_id) || 'Leave';

              // Add all dates in the leave range
              for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dYear = d.getFullYear();
                const dMonth = String(d.getMonth() + 1).padStart(2, '0');
                const dDay = String(d.getDate()).padStart(2, '0');
                const dateStr = `${dYear}-${dMonth}-${dDay}`;
                leaveDates.set(dateStr, leaveTypeName);
              }
            });
          }
        }
      } catch (err) {
        console.error('Error fetching holidays/leaves:', err);
      }
    }

    const allRecords: Attendance[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dateYear = date.getFullYear();
      const dateMonth = String(date.getMonth() + 1).padStart(2, '0');
      const dateDay = String(date.getDate()).padStart(2, '0');
      const dateString = `${dateYear}-${dateMonth}-${dateDay}`;
      
      // Skip dates before employee registration, BUT allow existing attendance records
      // This allows copied historical data to show even if it's before registration
      if (registrationDate && date < registrationDate && !recordMap.has(dateString)) {
        continue;
      }

      if (recordMap.has(dateString)) {
        allRecords.push(recordMap.get(dateString)!);
      } else if (holidayDates.has(dateString)) {
        // Holiday - don't mark as absent
        allRecords.push({
          id: `holiday-${dateString}`,
          user_id: profile?.id || '',
          date: dateString,
          check_in_time: 'Holiday',
          check_out_time: null,
          status: 'holiday' as any,
          office_id: profile?.office_location || '',
          created_at: dateString,
          updated_at: dateString,
        } as any);
      } else if (leaveDates.has(dateString)) {
        // On leave - don't mark as absent
        const leaveType = leaveDates.get(dateString);
        allRecords.push({
          id: `leave-${dateString}`,
          user_id: profile?.id || '',
          date: dateString,
          check_in_time: `On Leave: ${leaveType}`,
          check_out_time: null,
          status: 'on_leave' as any,
          office_id: profile?.office_location || '',
          created_at: dateString,
          updated_at: dateString,
        } as any);
      } else {
        // Only mark as absent if it's a working day after registration
        allRecords.push({
          id: `absent-${dateString}`,
          user_id: profile?.id || '',
          date: dateString,
          check_in_time: null,
          check_out_time: null,
          status: 'absent',
          office_id: profile?.office_location || '',
          created_at: dateString,
          updated_at: dateString,
        } as Attendance);
      }
    }

    return allRecords;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "N/A";
    
    const utcDate = new Date(isoString);
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
    
    const hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const days = dateRange === "week" ? 7 : 30;
  const dateRangeRecords = records.slice(0, days);
  const presentCount = dateRangeRecords.filter(r => r.status === "present").length;
  const lateCount = dateRangeRecords.filter(r => r.status === "late").length;
  const absentCount = dateRangeRecords.filter(r => r.status === "absent").length;

  return (
    <DashboardLayout title="Attendance History">
      <div className="space-y-3 sm:space-y-4 lg:space-y-4">
        {/* Stats Summary */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-1">Summary</h2>
          <p className="text-xs text-gray-600 mb-3">
            {dateRange === "week" ? "Last 7 days" : "Last 30 days"} overview
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-medium text-gray-600 mb-1">Present</p>
              <p className="text-lg sm:text-xl font-bold text-green-600 mb-1">{presentCount}</p>
              <p className="text-xs text-gray-500">On time</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-medium text-gray-600 mb-1">Late</p>
              <p className="text-lg sm:text-xl font-bold text-amber-600 mb-1">{lateCount}</p>
              <p className="text-xs text-gray-500">After grace period</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-medium text-gray-600 mb-1">Absent</p>
              <p className="text-lg sm:text-xl font-bold text-red-600 mb-1">{absentCount}</p>
              <p className="text-xs text-gray-500">Not marked</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Filter className="w-4 h-4" />
              <span>Filter:</span>
            </div>
            
            <Select value={dateRange} onValueChange={(value: "week" | "month") => setDateRange(value)}>
              <SelectTrigger className="w-[120px] text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[120px] text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Records List */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">Attendance Records</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-10 bg-white rounded-lg border border-gray-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">Error Loading History</p>
              <p className="text-xs text-gray-600">{error}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-10 bg-white rounded-lg border border-gray-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">No Records Yet</p>
              <p className="text-xs text-gray-600">Your attendance history will appear here</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-10 bg-white rounded-lg border border-gray-200">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                <Filter className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5">No Records Found</p>
              <p className="text-xs text-gray-600">Try changing your filters</p>
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <StatusIcon status={record.status} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />
                        <p className="font-medium text-xs sm:text-sm text-gray-900">{formatDate(record.date)}</p>
                      </div>
                      {record.status === 'absent' ? (
                        <p className="text-xs text-gray-600">No attendance marked</p>
                      ) : record.status === 'holiday' ? (
                        <p className="text-xs text-gray-600">{record.check_in_time}</p>
                      ) : record.status === 'on_leave' ? (
                        <p className="text-xs text-gray-600">{record.check_in_time}</p>
                      ) : (
                        <div className="space-y-0.5">
                          {record.check_in_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />
                              <p className="text-xs text-gray-600">
                                In: {formatTime(record.check_in_time)}
                              </p>
                            </div>
                          )}
                          {record.check_out_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />
                              <p className="text-xs text-gray-600">
                                Out: {formatTime(record.check_out_time)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <StatusBadge status={record.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HistoryScreen;
