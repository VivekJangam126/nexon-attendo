import { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle2, AlertCircle, XCircle, Filter } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { attendanceService } from "@server";
import type { Attendance } from "@server";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const StatusIcon = ({ status }: { status: "present" | "late" | "absent" }) => {
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
  }
};

const StatusBadge = ({ status }: { status: "present" | "late" | "absent" }) => {
  const configs = {
    present: { label: "Present", className: "bg-green-100 text-green-700" },
    late: { label: "Late", className: "bg-amber-100 text-amber-700" },
    absent: { label: "Absent", className: "bg-red-100 text-red-700" },
  };

  const config = configs[status];

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
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "late" | "absent">("all");

  useEffect(() => {
    const fetchHistory = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }

      const { attendance, error: fetchError } = await attendanceService.getAttendanceHistory(profile, 30);
      
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const filledRecords = fillMissingDates(attendance, 30);
      setRecords(filledRecords);
      setLoading(false);
    };

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

  const fillMissingDates = (records: Attendance[], days: number): Attendance[] => {
    const now = new Date();
    const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    istDate.setHours(0, 0, 0, 0);

    const recordMap = new Map<string, Attendance>();
    records.forEach(record => {
      const normalizedDate = record.date.split('T')[0];
      recordMap.set(normalizedDate, record);
    });

    const allRecords: Attendance[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(istDate);
      date.setDate(date.getDate() - i);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      if (recordMap.has(dateString)) {
        allRecords.push(recordMap.get(dateString)!);
      } else {
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
      <div className="space-y-2 sm:space-y-3 lg:space-y-4">
        {/* Stats Summary */}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Summary</h2>
          <p className="text-xs text-gray-600 mb-2">
            {dateRange === "week" ? "Last 7 days" : "Last 30 days"} overview
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3 lg:p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-600 mb-0.5">Present</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{presentCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">On time</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3 lg:p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-600 mb-0.5">Late</p>
              <p className="text-lg sm:text-2xl font-bold text-amber-600">{lateCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">After grace period</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3 lg:p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-600 mb-0.5">Absent</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">{absentCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Not marked</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 lg:p-4 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Filter:</span>
            </div>
            
            <Select value={dateRange} onValueChange={(value: "week" | "month") => setDateRange(value)}>
              <SelectTrigger className="w-[100px] sm:w-[120px] text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[100px] sm:w-[120px] text-xs h-8">
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
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Attendance Records</h2>
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
