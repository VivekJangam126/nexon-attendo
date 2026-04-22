import { useState, useEffect, useMemo } from "react";
import { Search, Filter, AlertTriangle, TrendingUp, TrendingDown, Users, Download, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { performanceAnalyticsService } from "@server";
import type { EmployeePerformanceCard, PerformanceAlert } from "@server";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { exportPerformanceToPDF } from "@/utils/pdfExport";

// Skeleton component for loading state
const EmployeeCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="h-6 bg-gray-200 rounded-full w-12"></div>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-20"></div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-3 bg-gray-200 rounded w-18"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

const AdminPerformanceDashboard = () => {
  const { session } = useAuth();
  const [employees, setEmployees] = useState<EmployeePerformanceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAlerts, setFilterAlerts] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState(20); // Show 20 initially

  useEffect(() => {
    if (session) {
      fetchPerformanceData();
    }
  }, [session]);

  const fetchPerformanceData = async () => {
    if (!session?.access_token) {
      toast({
        title: "Error",
        description: "Not authenticated",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/performance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API Error:', error);
        
        toast({
          title: "Error",
          description: error.details || "Failed to fetch performance data",
          variant: "destructive",
        });
        setEmployees([]);
        return;
      }

      const data = await response.json();
      
      if (data.success && data.employees) {
        setEmployees(data.employees);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch performance data",
          variant: "destructive",
        });
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setEmployees([]);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load performance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    try {
      if (employees.length === 0) {
        toast({
          title: "No Data",
          description: "No employee data available to export",
          variant: "destructive",
        });
        return;
      }

      const fileName = exportPerformanceToPDF(employees);
      toast({
        title: "Export Successful",
        description: `Performance report exported as ${fileName}`,
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  const calculateCurrentMonthMetrics = async () => {
    if (!session?.access_token) {
      toast({
        title: "Error",
        description: "Not authenticated",
        variant: "destructive",
      });
      return;
    }

    setCalculating(true);
    
    toast({
      title: "Calculating Metrics",
      description: "Processing all employees in batches...",
    });

    try {
      const response = await fetch('/api/performance-metrics-calc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Calculation API Error:', error);
        
        toast({
          title: "Calculation Failed",
          description: error.details || error.error || "Failed to calculate metrics",
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Metrics Updated",
          description: result.message,
        });
        
        // Refresh data after calculation
        await fetchPerformanceData();
      } else {
        toast({
          title: "Calculation Failed",
          description: result.error || "Failed to calculate metrics",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to calculate metrics",
        variant: "destructive",
      });
    } finally {
      setCalculating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 80) return "text-blue-600 bg-blue-50";
    if (score >= 70) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return "bg-red-100 text-red-800 border-red-200";
      case 'red': return "bg-red-50 text-red-700 border-red-100";
      case 'yellow': return "bg-amber-50 text-amber-700 border-amber-100";
      default: return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  // Memoize filtered employees to avoid recalculation on every render
  const filteredEmployees = useMemo(() => {
    const filtered = employees.filter(emp => {
      const matchesSearch = emp.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || emp.status === filterStatus;
      
      const matchesAlerts = filterAlerts === "all" || 
        (filterAlerts === "with_alerts" && emp.alert_count > 0) ||
        (filterAlerts === "no_alerts" && emp.alert_count === 0);

      return matchesSearch && matchesStatus && matchesAlerts;
    });

    // Sort alphabetically by employee name
    const sorted = filtered.sort((a, b) => 
      a.employee_name.localeCompare(b.employee_name)
    );

    // Return only the first displayCount employees for better performance
    return sorted.slice(0, displayCount);
  }, [employees, searchQuery, filterStatus, filterAlerts, displayCount]);

  // Memoize statistics to avoid recalculation
  const statistics = useMemo(() => {
    const totalEmployees = employees.length;
    const avgScore = employees.length > 0 
      ? employees.reduce((sum, emp) => sum + (emp.current_month_metrics?.overall_score || 0), 0) / totalEmployees
      : 0;
    const totalAlerts = employees.reduce((sum, emp) => sum + emp.alert_count, 0);
    const highPerformers = employees.filter(emp => 
      (emp.current_month_metrics?.overall_score || 0) >= 90).length;

    return { totalEmployees, avgScore, totalAlerts, highPerformers };
  }, [employees]);

  if (loading) {
    return (
      <AdminLayout title="Performance Dashboard">
        <div className="space-y-4">
          {/* Header Stats Skeleton */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 md:p-4 shadow-sm animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gray-200 rounded-md sm:rounded-lg self-start"></div>
                  <div className="min-w-0">
                    <div className="h-3 bg-gray-200 rounded w-16 sm:w-20 mb-1"></div>
                    <div className="h-4 sm:h-5 md:h-6 bg-gray-200 rounded w-8 sm:w-10 md:w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls Skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm animate-pulse">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
              </div>
            </div>
          </div>

          {/* Employee Cards Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <EmployeeCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Performance Dashboard">
      <div className="space-y-4">
        {/* Header Stats */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 md:p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-50 rounded-md sm:rounded-lg self-start">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600 leading-tight">Total Employees</p>
                <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 leading-none">{statistics.totalEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 md:p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-50 rounded-md sm:rounded-lg self-start">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600 leading-tight">Avg Performance</p>
                <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 leading-none">{statistics.avgScore.toFixed(1)}/100</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 md:p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-amber-50 rounded-md sm:rounded-lg self-start">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600 leading-tight">Active Alerts</p>
                <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 leading-none">{statistics.totalAlerts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-3 md:p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-50 rounded-md sm:rounded-lg self-start">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600 leading-tight">High Performers</p>
                <p className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 leading-none">{statistics.highPerformers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search employees..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Filters */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="blocked">Blocked</option>
              </select>

              <select
                value={filterAlerts}
                onChange={(e) => setFilterAlerts(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                <option value="all">All Alerts</option>
                <option value="with_alerts">With Alerts</option>
                <option value="no_alerts">No Alerts</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={calculateCurrentMonthMetrics}
                disabled={calculating}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
                {calculating ? 'Calculating...' : 'Calculate Metrics'}
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Employee Performance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <EmployeePerformanceCard key={employee.employee_id} employee={employee} />
          ))}
        </div>

        {/* Load More Button */}
        {employees.length > displayCount && (
          <div className="text-center py-4">
            <button
              onClick={() => setDisplayCount(prev => prev + 20)}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
            >
              Load More ({employees.length - displayCount} remaining)
            </button>
          </div>
        )}

        {filteredEmployees.length === 0 && employees.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No employees found matching your criteria</p>
          </div>
        )}

        {employees.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No employee data available</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

// Employee Performance Card Component
const EmployeePerformanceCard = ({ employee }: { employee: EmployeePerformanceCard }) => {
  const metrics = employee.current_month_metrics;
  const score = metrics?.overall_score || 0;
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 80) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 70) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return "bg-red-100 text-red-800";
      case 'red': return "bg-red-50 text-red-700";
      case 'yellow': return "bg-amber-50 text-amber-700";
      default: return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-amber-700">
              {employee.employee_name.split(" ").map(n => n[0]).join("")}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900">{employee.employee_name}</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-600">{employee.designation || 'Not Assigned'}</p>
              {employee.role_type && employee.role_type !== 'Employee' && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  {employee.role_type}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getScoreColor(score)}`}>
          {score.toFixed(0)}/100
        </div>
      </div>

      {/* Metrics */}
      {metrics ? (
        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Attendance:</span>
            <span className="font-medium">{metrics.attendance_rate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Punctuality:</span>
            <span className="font-medium">{metrics.punctuality_score.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Avg Breaks:</span>
            <span className="font-medium">{metrics.avg_breaks_per_day.toFixed(1)}/day</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">This Month:</span>
            <span className="font-medium">{metrics.days_present}/{metrics.total_working_days} days</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">No metrics available</p>
        </div>
      )}

      {/* Alerts */}
      {employee.active_alerts.length > 0 && (
        <div className="space-y-1">
          {employee.active_alerts.slice(0, 2).map((alert) => (
            <div
              key={alert.id}
              className={`px-2 py-1 rounded text-xs font-medium ${getAlertSeverityColor(alert.severity)}`}
            >
              {alert.title}
            </div>
          ))}
          {employee.active_alerts.length > 2 && (
            <p className="text-xs text-gray-500">+{employee.active_alerts.length - 2} more alerts</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPerformanceDashboard;