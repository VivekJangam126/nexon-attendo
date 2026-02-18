import { useState, useEffect } from "react";
import { Search, Filter, Calendar, Grid3x3, List, CalendarDays, X, ChevronDown, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { reportsService } from "@server";
import type { AttendanceHistoryRecord, EmployeeDetailedHistory } from "@server";
import { format } from "date-fns";

type ViewMode = "grid" | "list" | "calendar";
type StatusFilter = "all" | "present" | "late" | "absent";

export const AttendanceHistoryTab = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceHistoryRecord[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceHistoryRecord[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'name' | 'date' | 'status' | 'checkIn'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const recordsPerPage = 50;

  useEffect(() => {
    // Default to last 7 days
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    
    const startDate = weekAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    setDateRange({ start: startDate, end: endDate });
    fetchData(startDate, endDate);
  }, []);

  const fetchData = async (startDate: string, endDate: string, search?: string, status?: StatusFilter) => {
    setLoading(true);
    const statusArray = status && status !== "all" ? [status as 'present' | 'late' | 'absent'] : undefined;
    const { records: data } = await reportsService.getAttendanceHistory({
      startDate,
      endDate,
      searchQuery: search || searchQuery,
      status: statusArray,
    });
    setAllRecords(data);
    setRecords(data);
    setLoading(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(query, statusFilter);
  };

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status);
    applyFilters(searchQuery, status);
  };

  const applyFilters = (search: string, status: StatusFilter) => {
    let filtered = [...allRecords];

    // Apply search filter
    if (search) {
      filtered = filtered.filter(record =>
        record.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        record.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter(record => {
        return Object.values(record.dates).some(s => s === status);
      });
    }

    setRecords(filtered);
  };

  const handleQuickDateRange = (range: string) => {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (range) {
      case "today":
        start = today;
        break;
      case "yesterday":
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        end = start;
        break;
      case "last7":
        start = new Date(today);
        start.setDate(start.getDate() - 6);
        break;
      case "last30":
        start = new Date(today);
        start.setDate(start.getDate() - 29);
        break;
      case "thisMonth":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "lastMonth":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }

    setDateFrom(start);
    setDateTo(end);
    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];
    setDateRange({ start: startDate, end: endDate });
    fetchData(startDate, endDate, searchQuery, statusFilter);
  };

  const handleCustomDateRange = () => {
    if (dateFrom && dateTo) {
      const startDate = dateFrom.toISOString().split('T')[0];
      const endDate = dateTo.toISOString().split('T')[0];
      setDateRange({ start: startDate, end: endDate });
      fetchData(startDate, endDate, searchQuery, statusFilter);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    handleQuickDateRange("last7");
    setCurrentPage(1);
  };

  const handleSort = (field: 'name' | 'date' | 'status' | 'checkIn') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Flatten records for list view with sorting and pagination
  const flattenedRecords = records.flatMap(record => 
    Object.entries(record.dates).map(([date, status]) => ({
      employeeName: record.employeeName,
      email: record.email,
      userId: record.userId,
      date,
      status,
    }))
  );

  // Sort flattened records
  const sortedRecords = [...flattenedRecords].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'name') {
      comparison = a.employeeName.localeCompare(b.employeeName);
    } else if (sortField === 'date') {
      comparison = a.date.localeCompare(b.date);
    } else if (sortField === 'status') {
      const statusOrder = { present: 1, late: 2, absent: 3 };
      comparison = (statusOrder[a.status || 'absent'] || 4) - (statusOrder[b.status || 'absent'] || 4);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Paginate records
  const totalPages = Math.ceil(sortedRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedRecords = sortedRecords.slice(startIndex, endIndex);

  const getStatusIcon = (status: 'present' | 'late' | 'absent' | null) => {
    if (status === 'present') return '✓';
    if (status === 'late') return '⏰';
    if (status === 'absent') return '✗';
    return '-';
  };

  const getStatusColor = (status: 'present' | 'late' | 'absent' | null) => {
    if (status === 'present') return 'text-success bg-success-muted';
    if (status === 'late') return 'text-warning bg-warning-muted';
    if (status === 'absent') return 'text-destructive bg-destructive-muted';
    return 'text-muted-foreground bg-muted';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const dates = records.length > 0 ? Object.keys(records[0].dates).sort() : [];

  const activeFiltersCount = (searchQuery ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Filters and View Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="w-full sm:flex-1 sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="relative flex-1 sm:flex-none"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="px-2 sm:px-3"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="px-2 sm:px-3"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className="px-2 sm:px-3"
              >
                <CalendarDays className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="card-elevated p-4 space-y-4 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Advanced Filters</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Range Quick Select */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Quick Date Range</label>
                <Select onValueChange={handleQuickDateRange} defaultValue="last7">
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last7">Last 7 Days</SelectItem>
                    <SelectItem value="last30">Last 30 Days</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <label className="text-xs font-medium text-muted-foreground">Custom Date Range</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal text-xs">
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "MMM dd") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 justify-start text-left font-normal text-xs">
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "MMM dd") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {dateFrom && dateTo && (
                  <Button size="sm" onClick={handleCustomDateRange} className="w-full text-xs">
                    Apply Range
                  </Button>
                )}
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Status Filter</label>
                <Select value={statusFilter} onValueChange={(value) => handleStatusFilter(value as StatusFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="present">Present Only</SelectItem>
                    <SelectItem value="late">Late Only</SelectItem>
                    <SelectItem value="absent">Absent Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {searchQuery && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                    Search: {searchQuery}
                    <button onClick={() => handleSearch("")} className="hover:bg-primary/20 rounded p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {statusFilter !== "all" && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                    Status: {statusFilter}
                    <button onClick={() => handleStatusFilter("all")} className="hover:bg-primary/20 rounded p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <>
          {/* Mobile Card View (< 768px) */}
          <div className="md:hidden space-y-3">
            {records.map((record) => {
              const statusCounts = {
                present: Object.values(record.dates).filter(s => s === 'present').length,
                late: Object.values(record.dates).filter(s => s === 'late').length,
                absent: Object.values(record.dates).filter(s => s === 'absent').length,
              };
              const totalDays = dates.length;
              const attendanceRate = totalDays > 0 
                ? Math.round(((statusCounts.present + statusCounts.late) / totalDays) * 100) 
                : 0;

              return (
                <div key={record.userId} className="card-elevated p-4">
                  <div 
                    className="cursor-pointer"
                    onClick={() => setSelectedEmployee(record.userId)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium flex items-center gap-2">
                          {record.employeeName}
                          <User className="w-3 h-3 text-muted-foreground" />
                        </p>
                        <p className="text-xs text-muted-foreground">{record.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{attendanceRate}%</p>
                        <p className="text-xs text-muted-foreground">Rate</p>
                      </div>
                    </div>

                    {/* Status Summary */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-2 rounded-lg bg-success-muted">
                        <p className="text-lg font-bold text-success">{statusCounts.present}</p>
                        <p className="text-xs text-muted-foreground">Present</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-warning-muted">
                        <p className="text-lg font-bold text-warning">{statusCounts.late}</p>
                        <p className="text-xs text-muted-foreground">Late</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-destructive-muted">
                        <p className="text-lg font-bold text-destructive">{statusCounts.absent}</p>
                        <p className="text-xs text-muted-foreground">Absent</p>
                      </div>
                    </div>

                    {/* Date Pills - Horizontal Scroll */}
                    <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
                      <div className="flex gap-2 min-w-max pb-1">
                        {dates.map((date) => {
                          const status = record.dates[date];
                          const dateObj = new Date(date + 'T00:00:00');
                          const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                          const dayNum = dateObj.getDate();
                          return (
                            <div key={date} className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${getStatusColor(status)}`}>
                                {getStatusIcon(status)}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{day}</p>
                              <p className="text-xs font-medium">{dayNum}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {records.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No attendance records found</p>
              </div>
            )}
          </div>

          {/* Desktop Table View (≥ 768px) */}
          <div className="hidden md:block card-elevated overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground sticky left-0 bg-muted/50 z-10">
                    Employee
                  </th>
                  {dates.map((date) => {
                    const dateObj = new Date(date + 'T00:00:00');
                    const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = dateObj.getDate();
                    return (
                      <th key={date} className="px-3 py-3 text-center text-xs font-medium text-muted-foreground min-w-[60px]">
                        <div>{day}</div>
                        <div className="text-xs text-muted-foreground">{dayNum}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((record) => (
                  <tr key={record.userId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 sticky left-0 bg-background z-10">
                      <div 
                        className="cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setSelectedEmployee(record.userId)}
                      >
                        <p className="text-sm font-medium flex items-center gap-2">
                          {record.employeeName}
                          <User className="w-3 h-3 text-muted-foreground" />
                        </p>
                        <p className="text-xs text-muted-foreground">{record.email}</p>
                      </div>
                    </td>
                    {dates.map((date) => {
                      const status = record.dates[date];
                      return (
                        <td key={date} className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No attendance records found</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {/* Sort Controls */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={sortField === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('name')}
              className="text-xs"
            >
              Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              variant={sortField === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('date')}
              className="text-xs"
            >
              Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              variant={sortField === 'status' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('status')}
              className="text-xs"
            >
              Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
          </div>

          {/* Records List */}
          <div className="space-y-2">
            {paginatedRecords.map((record, idx) => {
              const dateObj = new Date(record.date + 'T00:00:00');
              const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div key={`${record.userId}_${record.date}_${idx}`} className="card-elevated p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div 
                      className="cursor-pointer hover:text-primary transition-colors flex-1 min-w-0"
                      onClick={() => setSelectedEmployee(record.userId)}
                    >
                      <p className="text-sm font-medium flex items-center gap-2 truncate">
                        {record.employeeName}
                        <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{record.email}</p>
                    </div>
                    <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium flex-shrink-0 ${getStatusColor(record.status)}`}>
                      {record.status?.toUpperCase() || 'N/A'}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{formatted}</p>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {sortedRecords.length > recordsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, sortedRecords.length)} of {sortedRecords.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-w-[32px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {sortedRecords.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No attendance records found</p>
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <CalendarView 
          records={records} 
          dateRange={dateRange}
          onEmployeeClick={(userId) => setSelectedEmployee(userId)}
        />
      )}

      {/* Employee Drill-Down Modal */}
      {selectedEmployee && (
        <EmployeeDrillDown
          userId={selectedEmployee}
          dateRange={dateRange}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
};

// Calendar View Component
const CalendarView = ({ 
  records, 
  dateRange,
  onEmployeeClick 
}: { 
  records: AttendanceHistoryRecord[];
  dateRange: { start: string; end: string };
  onEmployeeClick: (userId: string) => void;
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const getDateStats = (dateStr: string) => {
    let present = 0, late = 0, absent = 0;
    
    records.forEach(record => {
      const status = record.dates[dateStr];
      if (status === 'present') present++;
      else if (status === 'late') late++;
      else if (status === 'absent') absent++;
    });

    const total = present + late + absent;
    const rate = total > 0 ? ((present + late) / total) * 100 : 0;
    
    return { present, late, absent, total, rate };
  };

  const getDateColor = (rate: number) => {
    if (rate >= 95) return 'bg-success/20 border-success';
    if (rate >= 90) return 'bg-warning/20 border-warning';
    return 'bg-destructive/20 border-destructive';
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const today = new Date().toISOString().split('T')[0];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="card-elevated p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Calendar Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const stats = getDateStats(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`aspect-square border-2 rounded-lg p-2 transition-all hover:shadow-md ${
                isToday ? 'border-primary' : 'border-border'
              } ${isSelected ? 'ring-2 ring-primary' : ''} ${
                stats.total > 0 ? getDateColor(stats.rate) : 'bg-muted/30'
              }`}
            >
              <div className="text-sm font-medium mb-1">{day}</div>
              {stats.total > 0 && (
                <div className="text-xs space-y-0.5">
                  <div className="text-success">✓ {stats.present}</div>
                  <div className="text-warning">⏰ {stats.late}</div>
                  <div className="text-destructive">✗ {stats.absent}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold mb-3">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {records.map(record => {
              const status = record.dates[selectedDate];
              if (!status) return null;
              return (
                <div 
                  key={record.userId}
                  onClick={() => onEmployeeClick(record.userId)}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{record.employeeName}</p>
                    <p className="text-xs text-muted-foreground">{record.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    status === 'present' ? 'bg-success/20 text-success' :
                    status === 'late' ? 'bg-warning/20 text-warning' :
                    'bg-destructive/20 text-destructive'
                  }`}>
                    {status.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Employee Drill-Down Component
const EmployeeDrillDown = ({ 
  userId, 
  dateRange,
  onClose 
}: { 
  userId: string;
  dateRange: { start: string; end: string };
  onClose: () => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState<EmployeeDetailedHistory | null>(null);

  useEffect(() => {
    const fetchEmployeeHistory = async () => {
      setLoading(true);
      const { employee } = await reportsService.getEmployeeDetailedHistory(userId, dateRange.start, dateRange.end);
      setEmployeeData(employee);
      setLoading(false);
    };
    fetchEmployeeHistory();
  }, [userId, dateRange]);

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!employeeData) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {employeeData.employeeName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{employeeData.email}</p>
        </DialogHeader>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
          <div className="card-elevated p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Days</p>
            <p className="text-2xl font-bold">{employeeData.stats.totalDays}</p>
          </div>
          <div className="card-elevated p-4">
            <p className="text-xs text-muted-foreground mb-1">Present</p>
            <p className="text-2xl font-bold text-success">{employeeData.stats.presentCount}</p>
          </div>
          <div className="card-elevated p-4">
            <p className="text-xs text-muted-foreground mb-1">Late</p>
            <p className="text-2xl font-bold text-warning">{employeeData.stats.lateCount}</p>
          </div>
          <div className="card-elevated p-4">
            <p className="text-xs text-muted-foreground mb-1">Absent</p>
            <p className="text-2xl font-bold text-destructive">{employeeData.stats.absentCount}</p>
          </div>
        </div>

        <div className="card-elevated p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-1">Attendance Rate</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${employeeData.stats.attendanceRate}%` }}
              />
            </div>
            <span className="text-lg font-bold">{employeeData.stats.attendanceRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="space-y-2">
          <h4 className="font-semibold">Attendance History</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {employeeData.records.map((record, idx) => (
              <div key={idx} className="card-elevated p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(record.date + 'T00:00:00').toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    {record.checkInTime && (
                      <p className="text-xs text-muted-foreground">
                        Check-in: {record.checkInTime}
                        {record.checkOutTime && ` • Check-out: ${record.checkOutTime}`}
                      </p>
                    )}
                    {record.officeName && (
                      <p className="text-xs text-muted-foreground">Office: {record.officeName}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    record.status === 'present' ? 'bg-success/20 text-success' :
                    record.status === 'late' ? 'bg-warning/20 text-warning' :
                    'bg-destructive/20 text-destructive'
                  }`}>
                    {record.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
