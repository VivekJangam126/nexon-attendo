import { useState, useEffect } from "react";
import { 
  Download, FileText, Calendar, Users, Clock, UserCheck, UserX, Search, Filter, Grid, List, MoreHorizontal, X, ChevronDown
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { reportsService } from "@server";
import type { ReportStats, DailyBreakdown, EmployeeAttendanceRecord } from "@server";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { savePDF } from '@/utils/downloadHelper';

type TimeRange = "today" | "week" | "month" | "custom";
type ExportFormat = "pdf" | "excel";
type ActiveTab = "history" | "export";
type ViewMode = "grid" | "list";
type FilterType = "all" | "present" | "absent" | "late";

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  attendance: {
    sat: string;
    sun: string;
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
  };
}

const AdminReportsNewScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("history");
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("week");
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("excel");
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [showLegend, setShowLegend] = useState(false);
  
  // Data states
  const [data, setData] = useState<ReportStats>({
    totalEmployees: 0,
    present: 0,
    late: 0,
    absent: 0,
    attendanceRate: 0,
    comparedToPrevious: 0,
  });
  const [employeeRecords, setEmployeeRecords] = useState<EmployeeAttendanceRecord[]>([]);
  const [detailedBreakdown, setDetailedBreakdown] = useState<DailyBreakdown[]>([]);

  // Custom date range
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Enhanced employee data with departments and more realistic attendance (no H - holidays)
  const [employees] = useState<Employee[]>([
    { id: 1, name: "Abhijeet Telegaonkar", email: "telegaonkarabhi@gmail.com", department: "Development", attendance: { sat: "✓", sun: "✗", mon: "✓", tue: "✓", wed: "✓", thu: "✗", fri: "✓" } },
    { id: 2, name: "Aditi Kamble", email: "aditi@devconsoftware.com", department: "Development", attendance: { sat: "✗", sun: "✓", mon: "✓", tue: "✓", wed: "✗", thu: "✓", fri: "✓" } },
    { id: 3, name: "Aditya Telgote", email: "adityatelgote2020@gmail.com", department: "Design", attendance: { sat: "✗", sun: "✗", mon: "✗", tue: "✗", wed: "✗", thu: "✗", fri: "✗" } },
    { id: 4, name: "Ajinkya Uday Sasne", email: "ajinkyasasne@devconsoftware.com", department: "Development", attendance: { sat: "✓", sun: "✗", mon: "L", tue: "✓", wed: "L", thu: "✗", fri: "L" } },
    { id: 5, name: "Amruta Navnath Kadam", email: "amruta@smartnetnada.com", department: "HR", attendance: { sat: "✗", sun: "✗", mon: "L", tue: "✓", wed: "✓", thu: "✗", fri: "✗" } },
    { id: 6, name: "Anchal Gutte", email: "anchal@smartnetnada.com", department: "Marketing", attendance: { sat: "✗", sun: "✗", mon: "✓", tue: "✓", wed: "L", thu: "✗", fri: "✓" } },
    { id: 7, name: "Anil Jajurkar", email: "aniljajurkar3627@gmail.com", department: "Development", attendance: { sat: "L", sun: "✗", mon: "✓", tue: "L", wed: "✓", thu: "L", fri: "L" } },
    { id: 8, name: "Ankit Lal Sinha", email: "ankitsinha2250@gmail.com", department: "QA", attendance: { sat: "✓", sun: "✗", mon: "L", tue: "✓", wed: "✓", thu: "✗", fri: "✓" } },
    { id: 9, name: "Siddhesh Lalit Jadhav", email: "siddheshjabhav7@devconsoftware.com", department: "Management", attendance: { sat: "✓", sun: "✗", mon: "✓", tue: "✓", wed: "✓", thu: "✓", fri: "✓" } },
    { id: 10, name: "Priya Sharma", email: "priya.sharma@devconsoftware.com", department: "Development", attendance: { sat: "✓", sun: "✗", mon: "✓", tue: "L", wed: "✓", thu: "✓", fri: "✓" } },
    { id: 11, name: "Rahul Patil", email: "rahul.patil@devconsoftware.com", department: "Design", attendance: { sat: "✗", sun: "✗", mon: "✓", tue: "✓", wed: "✓", thu: "L", fri: "✗" } },
    { id: 12, name: "Sneha Desai", email: "sneha.desai@devconsoftware.com", department: "HR", attendance: { sat: "✗", sun: "✗", mon: "✓", tue: "✓", wed: "✓", thu: "✓", fri: "✓" } },
  ]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchData();
    }
  }, [activeTab, selectedTimeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsResult, detailedResult, recordsResult] = await Promise.all([
        reportsService.getAttendanceStats(selectedTimeRange === "custom" ? "week" : selectedTimeRange),
        reportsService.getDetailedBreakdown(selectedTimeRange === "custom" ? "week" : selectedTimeRange),
        reportsService.getEmployeeAttendanceRecords(selectedTimeRange === "custom" ? "week" : selectedTimeRange),
      ]);
      
      setData(statsResult.stats || {
        totalEmployees: 51,
        present: 0,
        late: 0,
        absent: 0,
        attendanceRate: 0,
        comparedToPrevious: 0,
      });
      setDetailedBreakdown(detailedResult.breakdown || []);
      setEmployeeRecords(recordsResult.records || []);
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = () => {
    const lines: string[] = [];
    
    const reportDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const reportTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Header
    lines.push('NEXUS ATTENDO - ATTENDANCE REPORT');
    lines.push(`Report Type: ${selectedTimeRange.charAt(0).toUpperCase() + selectedTimeRange.slice(1)}`);
    lines.push(`Generated: ${reportDate} at ${reportTime}`);
    lines.push(`Total Employees: ${data.totalEmployees}`);
    lines.push('');
    
    // Summary
    lines.push('ATTENDANCE SUMMARY');
    lines.push(`Present:,${data.present}`);
    lines.push(`Late:,${data.late}`);
    lines.push(`Absent:,${data.absent}`);
    lines.push(`Attendance Rate:,${data.attendanceRate}%`);
    lines.push('');
    
    // Daily Breakdown
    lines.push('DAILY BREAKDOWN');
    lines.push('Date,Day,Present,Late,Absent,Total,Rate');
    detailedBreakdown.forEach(day => {
      const total = day.present + day.late + day.absent;
      const rate = total > 0 ? Math.round(((day.present + day.late) / total) * 100) : 0;
      lines.push(`${day.date},${day.day},${day.present},${day.late},${day.absent},${total},${rate}%`);
    });
    lines.push('');
    
    // Employee Records
    lines.push('EMPLOYEE ATTENDANCE RECORDS');
    lines.push('Employee Name,Email,Date,Check-In Time,Status');
    employeeRecords.forEach(record => {
      const escapedName = record.employeeName.includes(',') ? `"${record.employeeName}"` : record.employeeName;
      const escapedEmail = record.email.includes(',') ? `"${record.email}"` : record.email;
      lines.push(`${escapedName},${escapedEmail},${record.date},${record.checkInTime},${record.status.toUpperCase()}`);
    });
    
    return lines.join('\n');
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    const reportDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const reportTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Attendance Report - ${selectedTimeRange.charAt(0).toUpperCase() + selectedTimeRange.slice(1)}`, 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${reportDate} at ${reportTime}`, 14, 28);
    
    let yPos = 38;
    
    // Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPos);
    yPos += 8;
    
    const summaryData = [
      ['Total Employees', data.totalEmployees.toString()],
      ['Present', data.present.toString()],
      ['Late', data.late.toString()],
      ['Absent', data.absent.toString()],
      ['Attendance Rate', `${data.attendanceRate}%`],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234] },
      margin: { left: 14 },
      tableWidth: 90,
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Daily Breakdown
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Breakdown', 14, yPos);
    yPos += 8;
    
    const breakdownData = detailedBreakdown.map(row => {
      const total = row.present + row.late + row.absent;
      const rate = total > 0 ? Math.round(((row.present + row.late) / total) * 100) : 0;
      const dateObj = new Date(row.date + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short'
      });
      return [formattedDate, row.day, row.present, row.late, row.absent, total, `${rate}%`];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Day', 'Present', 'Late', 'Absent', 'Total', 'Rate']],
      body: breakdownData,
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234] },
      margin: { left: 14, right: 14 },
    });
    
    savePDF(doc, `attendance-report-${selectedTimeRange}-${Date.now()}.pdf`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Fetch fresh data for export
      await fetchData();
      
      if (selectedFormat === "excel") {
        const csv = generateCSV();
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csv;
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-report-${selectedTimeRange}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        generatePDF();
      }
      
      toast({
        title: "Report Downloaded",
        description: `Attendance report exported as ${selectedFormat.toUpperCase()} successfully.`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case "today": return "Today\n1 day";
      case "week": return "This Week\n7 days";
      case "month": return "This Month\n30 days";
      case "custom": return "Custom Range\nSelect dates";
      default: return "";
    }
  };

  const getTimeRangeDays = (range: TimeRange) => {
    switch (range) {
      case "today": return "1 day";
      case "week": return "7 days";
      case "month": return "30 days";
      case "custom": return "Select dates";
      default: return "";
    }
  };

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case "✓": return <span className="text-green-600 font-bold text-lg">✓</span>;
      case "✗": return <span className="text-red-600 font-bold text-lg">✗</span>;
      case "L": return <span className="text-yellow-600 font-bold text-sm bg-yellow-100 px-1 rounded">L</span>;
      default: return <span className="text-gray-400">-</span>;
    }
  };

  const getAttendanceClass = (status: string) => {
    switch (status) {
      case "✓": return "bg-green-50 border-green-200";
      case "✗": return "bg-red-50 border-red-200";
      case "L": return "bg-yellow-50 border-yellow-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusFromAttendance = (attendance: Employee['attendance']): FilterType => {
    const values = Object.values(attendance);
    if (values.includes("L")) return "late";
    if (values.includes("✓")) return "present";
    if (values.every(v => v === "✗")) return "absent";
    return "present";
  };

  const filteredEmployees = employees.filter(emp => {
    // Search filter
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    if (activeFilter === "all") return matchesSearch;
    
    const empStatus = getStatusFromAttendance(emp.attendance);
    const matchesFilter = activeFilter === empStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getAttendanceStats = () => {
    const stats = { present: 0, absent: 0, late: 0 };
    employees.forEach(emp => {
      const values = Object.values(emp.attendance);
      if (values.includes("L")) stats.late++;
      else if (values.includes("✓")) stats.present++;
      else if (values.every(v => v === "✗")) stats.absent++;
    });
    return stats;
  };

  const attendanceStats = getAttendanceStats();

  const clearSearch = () => {
    setSearchTerm("");
  };

  const clearFilters = () => {
    setActiveFilter("all");
    setSearchTerm("");
  };

  return (
    <DashboardLayout title="History & Reports" isAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">History & Reports</h2>
              <p className="text-sm text-gray-600">Attendance analytics and detailed history</p>
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700">
              Alert
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "history", label: "History" },
                { id: "export", label: "Export" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-amber-500 text-amber-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "history" && (
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center space-x-1"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                        {activeFilter !== "all" && (
                          <span className="ml-1 bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded-full">
                            1
                          </span>
                        )}
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                      
                      {showFilters && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Filter by Status</div>
                            {[
                              { key: "all", label: "All Employees", count: employees.length },
                              { key: "present", label: "Present", count: attendanceStats.present },
                              { key: "absent", label: "Absent", count: attendanceStats.absent },
                              { key: "late", label: "Late", count: attendanceStats.late },
                            ].map((filter) => (
                              <button
                                key={filter.key}
                                onClick={() => {
                                  setActiveFilter(filter.key as FilterType);
                                  setShowFilters(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center justify-between ${
                                  activeFilter === filter.key ? "bg-amber-50 text-amber-700" : "text-gray-700"
                                }`}
                              >
                                <span>{filter.label}</span>
                                <span className="text-xs text-gray-500">{filter.count}</span>
                              </button>
                            ))}
                            {activeFilter !== "all" && (
                              <div className="border-t border-gray-200 mt-2 pt-2">
                                <button
                                  onClick={clearFilters}
                                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                                >
                                  Clear Filters
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      variant={viewMode === "grid" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={viewMode === "grid" ? "bg-amber-600 hover:bg-amber-700" : ""}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant={viewMode === "list" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className={viewMode === "list" ? "bg-amber-600 hover:bg-amber-700" : ""}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowLegend(!showLegend)}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Legend */}
                {showLegend && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-amber-900 mb-3">Attendance Legend</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600 font-bold text-lg">✓</span>
                        <span className="text-gray-700">Present - Employee attended work</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-red-600 font-bold text-lg">✗</span>
                        <span className="text-gray-700">Absent - Employee did not attend</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-yellow-600 font-bold text-sm bg-yellow-100 px-1 rounded">L</span>
                        <span className="text-gray-700">Late - Arrived after scheduled time</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results Summary */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Showing {filteredEmployees.length} of {employees.length} employees
                    {activeFilter !== "all" && ` (filtered by ${activeFilter})`}
                    {searchTerm && ` (search: "${searchTerm}")`}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>{attendanceStats.present}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="text-red-600 font-bold">✗</span>
                      <span>{attendanceStats.absent}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="text-yellow-600 font-bold text-sm bg-yellow-100 px-1 rounded">L</span>
                      <span>{attendanceStats.late}</span>
                    </span>
                  </div>
                </div>

                {/* Grid View */}
                {viewMode === "grid" && (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                              Employee
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                              Sat<br />14
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                              Sun<br />15
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                              Mon<br />16
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                              Tue<br />17
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                              Wed<br />18
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                              Thu<br />19
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fri<br />20
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredEmployees.map((employee, index) => (
                            <tr key={employee.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="px-6 py-4 border-r border-gray-200">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                  <div className="text-sm text-gray-500">{employee.email}</div>
                                  <div className="text-xs text-gray-400">{employee.department}</div>
                                </div>
                              </td>
                              <td className={`px-4 py-4 text-center border-r border-gray-200 ${getAttendanceClass(employee.attendance.sat)}`}>
                                {getAttendanceIcon(employee.attendance.sat)}
                              </td>
                              <td className={`px-4 py-4 text-center border-r border-gray-200 ${getAttendanceClass(employee.attendance.sun)}`}>
                                {getAttendanceIcon(employee.attendance.sun)}
                              </td>
                              <td className={`px-4 py-4 text-center border-r border-gray-200 ${getAttendanceClass(employee.attendance.mon)}`}>
                                {getAttendanceIcon(employee.attendance.mon)}
                              </td>
                              <td className={`px-4 py-4 text-center border-r border-gray-200 ${getAttendanceClass(employee.attendance.tue)}`}>
                                {getAttendanceIcon(employee.attendance.tue)}
                              </td>
                              <td className={`px-4 py-4 text-center border-r border-gray-200 ${getAttendanceClass(employee.attendance.wed)}`}>
                                {getAttendanceIcon(employee.attendance.wed)}
                              </td>
                              <td className={`px-4 py-4 text-center border-r border-gray-200 ${getAttendanceClass(employee.attendance.thu)}`}>
                                {getAttendanceIcon(employee.attendance.thu)}
                              </td>
                              <td className={`px-4 py-4 text-center ${getAttendanceClass(employee.attendance.fri)}`}>
                                {getAttendanceIcon(employee.attendance.fri)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* List View */}
                {viewMode === "list" && (
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Employee Attendance Records</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {filteredEmployees.map((employee) => (
                        <div key={employee.id} className="p-6 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">{employee.name}</h4>
                                  <p className="text-sm text-gray-500">{employee.email}</p>
                                  <p className="text-xs text-gray-400">{employee.department}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="grid grid-cols-7 gap-2">
                                {Object.entries(employee.attendance).map(([day, status]) => (
                                  <div key={day} className="text-center">
                                    <div className="text-xs text-gray-500 mb-1 capitalize">{day}</div>
                                    <div className={`w-8 h-8 rounded flex items-center justify-center ${getAttendanceClass(status)}`}>
                                      {getAttendanceIcon(status)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {filteredEmployees.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || activeFilter !== "all" 
                        ? "Try adjusting your search or filters" 
                        : "No employee data available"}
                    </p>
                    {(searchTerm || activeFilter !== "all") && (
                      <Button variant="outline" onClick={clearFilters}>
                        Clear all filters
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
            {activeTab === "export" && (
              <div className="space-y-6">
                {/* Export Format Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Select Export Format</h3>
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <button
                      onClick={() => setSelectedFormat("pdf")}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        selectedFormat === "pdf"
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <FileText className={`w-8 h-8 mx-auto mb-2 ${
                        selectedFormat === "pdf" ? "text-amber-600" : "text-gray-400"
                      }`} />
                      <div className="text-center">
                        <p className="font-medium text-gray-900">PDF</p>
                        <p className="text-sm text-gray-500">Document</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setSelectedFormat("excel")}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        selectedFormat === "excel"
                          ? "border-amber-500 bg-amber-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <FileText className={`w-8 h-8 mx-auto mb-2 ${
                        selectedFormat === "excel" ? "text-amber-600" : "text-gray-400"
                      }`} />
                      <div className="text-center">
                        <p className="font-medium text-gray-900">Excel</p>
                        <p className="text-sm text-gray-500">Workbook</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Time Range Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Select Time Range</h3>
                  <div className="grid grid-cols-2 gap-4 max-w-2xl">
                    {(["today", "week", "month", "custom"] as TimeRange[]).map((range) => (
                      <button
                        key={range}
                        onClick={() => setSelectedTimeRange(range)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedTimeRange === range
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Calendar className={`w-5 h-5 mb-2 ${
                          selectedTimeRange === range ? "text-amber-600" : "text-gray-400"
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {range === "today" ? "Today" : 
                             range === "week" ? "This Week" :
                             range === "month" ? "This Month" : "Custom Range"}
                          </p>
                          <p className="text-sm text-gray-500">{getTimeRangeDays(range)}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedTimeRange === "custom" && (
                    <div className="mt-4 grid grid-cols-2 gap-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Report Templates */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Report Templates</h3>
                  <div className="space-y-3">
                    {[
                      {
                        title: "Daily Attendance Report",
                        description: "Summary of today's attendance",
                        icon: Clock
                      },
                      {
                        title: "Weekly Summary Report", 
                        description: "7-day attendance overview",
                        icon: Calendar
                      },
                      {
                        title: "Monthly Report",
                        description: "30-day detailed analysis",
                        icon: Users
                      }
                    ].map((template, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <template.icon className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{template.title}</p>
                            <p className="text-sm text-gray-500">{template.description}</p>
                          </div>
                        </div>
                        <Download className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export Actions */}
                <div className="flex space-x-4 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Send to Email</span>
                  </Button>
                  
                  <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700"
                  >
                    {isExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download {selectedFormat.toUpperCase()}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminReportsNewScreen;