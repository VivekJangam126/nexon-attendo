import { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle2, AlertCircle, XCircle, Filter } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import BottomNavigation from "@/components/BottomNavigation";
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
        <div className="w-8 h-8 bg-success-muted rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-success" />
        </div>
      );
    case "late":
      return (
        <div className="w-8 h-8 bg-warning-muted rounded-full flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-warning" />
        </div>
      );
    case "absent":
      return (
        <div className="w-8 h-8 bg-destructive-muted rounded-full flex items-center justify-center">
          <XCircle className="w-4 h-4 text-destructive" />
        </div>
      );
  }
};

const StatusBadge = ({ status }: { status: "present" | "late" | "absent" }) => {
  const configs = {
    present: { label: "Present", className: "bg-success-muted text-success" },
    late: { label: "Late", className: "bg-warning-muted text-warning" },
    absent: { label: "Absent", className: "bg-destructive-muted text-destructive" },
  };

  const config = configs[status];

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
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
  
  // Filter states
  const [dateRange, setDateRange] = useState<"week" | "month">("week");
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "late" | "absent">("all");

  useEffect(() => {
    const fetchHistory = async () => {
      if (!profile) {
        setLoading(false);
        return;
      }

      // Fetch 30 days of data (we'll filter on frontend)
      const { attendance, error: fetchError } = await attendanceService.getAttendanceHistory(profile, 30);
      
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      // Fill in missing dates with "absent" status (for 30 days)
      const filledRecords = fillMissingDates(attendance, 30);
      setRecords(filledRecords);
      setLoading(false);
    };

    fetchHistory();
  }, [profile]);

  // Apply filters whenever records, dateRange, or statusFilter changes
  useEffect(() => {
    let filtered = [...records];

    // Apply date range filter
    const days = dateRange === "week" ? 7 : 30;
    filtered = filtered.slice(0, days);

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    setFilteredRecords(filtered);
  }, [records, dateRange, statusFilter]);

  /**
   * Fill in missing dates with "absent" status
   * Creates a complete attendance record for the last N days
   */
  const fillMissingDates = (records: Attendance[], days: number): Attendance[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create a map of existing records by date
    const recordMap = new Map<string, Attendance>();
    records.forEach(record => {
      recordMap.set(record.date, record);
    });

    // Generate all dates for the last N days
    const allRecords: Attendance[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (recordMap.has(dateString)) {
        // Use existing record
        allRecords.push(recordMap.get(dateString)!);
      } else {
        // Create absent record for missing date
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
    
    // Parse the UTC time and convert to IST
    const utcDate = new Date(isoString);
    
    // Convert to IST by adding 5 hours 30 minutes
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
    
    // Format the time
    const hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // Calculate stats from ALL records (not filtered)
  const presentCount = records.filter(r => r.status === "present").length;
  const lateCount = records.filter(r => r.status === "late").length;
  const absentCount = records.filter(r => r.status === "absent").length;

  return (
    <MobileContainer>
      <div className="flex flex-col min-h-full pb-20">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 border-b border-border">
          <h1 className="text-display mb-1">Attendance History</h1>
          <p className="text-caption">View your past attendance records</p>
        </div>

        {/* Stats Summary */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="card-elevated p-3 text-center">
              <p className="text-2xl font-semibold text-success">{presentCount}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
            <div className="card-elevated p-3 text-center">
              <p className="text-2xl font-semibold text-warning">{lateCount}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
            <div className="card-elevated p-3 text-center">
              <p className="text-2xl font-semibold text-destructive">{absentCount}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>Filters:</span>
            </div>
            
            <Select value={dateRange} onValueChange={(value: "week" | "month") => setDateRange(value)}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
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
        <div className="flex-1 px-6 py-2 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-destructive-muted rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <p className="text-heading mb-1">Error Loading History</p>
              <p className="text-caption">{error}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-heading mb-1">No Records Yet</p>
              <p className="text-caption">Your attendance history will appear here</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-heading mb-1">No Records Found</p>
              <p className="text-caption">Try changing your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record, index) => (
                <div
                  key={record.id}
                  className="card-elevated p-4 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-4">
                    <StatusIcon status={record.status} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="font-medium text-sm">{formatDate(record.date)}</p>
                      </div>
                      {record.status === 'absent' ? (
                        <p className="text-xs text-muted-foreground">No attendance marked</p>
                      ) : (
                        <div className="space-y-1">
                          {record.check_in_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                In: {formatTime(record.check_in_time)}
                              </p>
                            </div>
                          )}
                          {record.check_out_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
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

        <BottomNavigation />
      </div>
    </MobileContainer>
  );
};

export default HistoryScreen;
