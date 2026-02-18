import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, UserCheck, Clock, UserX, Plus, ClipboardList, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { employeeService, dashboardService } from "@server";
import type { EmployeeWithAttendance } from "@server";

type EmployeeStatus = "present" | "late" | "absent" | "not_marked";
type SortField = "name" | "email" | "role" | "check_in" | "status";
type SortDirection = "asc" | "desc" | null;

const StatusBadge = ({ status }: { status: EmployeeStatus }) => {
  const configs = {
    present: { label: "Present", icon: UserCheck, className: "bg-success-muted text-success" },
    late: { label: "Late", icon: Clock, className: "bg-warning-muted text-warning" },
    absent: { label: "Absent", icon: UserX, className: "bg-destructive-muted text-destructive" },
    not_marked: { label: "Awaiting", icon: Clock, className: "bg-muted text-muted-foreground" },
  };
  const config = configs[status];
  const Icon = config.icon;
  return (
    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="w-3 h-3" />{config.label}
    </span>
  );
};

const AdminEmployeesScreen = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch employees
      const { employees: employeeData } = await employeeService.getAllEmployees();
      setEmployees(employeeData);
      
      // Fetch pending count
      const { actions } = await dashboardService.getPendingActions();
      const pendingAction = actions.find(a => a.type === 'approval');
      setPendingCount(pendingAction?.count || 0);
      
      setLoading(false);
    };

    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statuses = ['present', 'late', 'not_marked', 'absent'];

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground/50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4 text-primary" />;
    }
    return <ArrowDown className="w-4 h-4 text-primary" />;
  };

  // Filter and sort employees
  let filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || employee.today_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Apply sorting
  if (sortField && sortDirection) {
    filteredEmployees = [...filteredEmployees].sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'name':
          compareValue = a.full_name.localeCompare(b.full_name);
          break;
        case 'email':
          compareValue = a.email.localeCompare(b.email);
          break;
        case 'role':
          compareValue = a.role.localeCompare(b.role);
          break;
        case 'check_in':
          const timeA = a.check_in_time ? new Date(a.check_in_time).getTime() : 0;
          const timeB = b.check_in_time ? new Date(b.check_in_time).getTime() : 0;
          compareValue = timeA - timeB;
          break;
        case 'status':
          const statusOrder = { present: 1, late: 2, not_marked: 3, absent: 4 };
          compareValue = statusOrder[a.today_status] - statusOrder[b.today_status];
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });
  }

  // Calculate status counts for filter badges
  const activeEmployees = employees.filter(e => e.status === 'active');
  const statusCounts = {
    present: activeEmployees.filter(e => e.today_status === 'present').length,
    late: activeEmployees.filter(e => e.today_status === 'late').length,
    not_marked: employees.filter(e => e.today_status === 'not_marked').length, // Includes pending/blocked
    absent: activeEmployees.filter(e => e.today_status === 'absent').length,
  };

  const formatCheckInTime = (isoString: string | null) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata', // Display in IST
    });
  };

  const handleEmployeeClick = (employee: EmployeeWithAttendance) => {
    // If employee is pending approval, go to pending approvals page
    if (employee.status === 'pending') {
      navigate('/admin/pending-approvals');
    } else {
      // Otherwise, go to employee detail page
      navigate(`/admin/employee/${employee.id}`);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-full">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-3 sm:pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-0.5 sm:mb-1">Employees</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">{activeEmployees.length} active employees</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate("/admin/add-employee")} 
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Add Employee</span>
              <span className="xs:hidden">Add</span>
            </button>
            {pendingCount > 0 && (
              <button 
                onClick={() => navigate("/admin/pending-approvals")} 
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 bg-warning-muted text-warning rounded-lg text-xs sm:text-sm font-medium"
              >
                <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Pending ({pendingCount})</span>
                <span className="xs:hidden">({pendingCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-2 sm:space-y-3 border-b border-border">
          <div className="relative w-full">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search by name or email..." 
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
            />
          </div>
          
          {/* Desktop filters - show all */}
          <div className="hidden sm:flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={() => setFilterStatus(null)} 
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                !filterStatus 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All ({activeEmployees.length})
            </button>
            {statuses.map(status => (
              <button 
                key={status} 
                onClick={() => setFilterStatus(status)} 
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterStatus === status 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {status === 'not_marked' ? 'Awaiting' : status.charAt(0).toUpperCase() + status.slice(1)}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filterStatus === status 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-background/50'
                }`}>
                  {statusCounts[status as keyof typeof statusCounts]}
                </span>
              </button>
            ))}
          </div>

          {/* Mobile filters - compact with dropdown */}
          <div className="flex sm:hidden gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            <button 
              onClick={() => setFilterStatus(null)} 
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                !filterStatus 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All ({activeEmployees.length})
            </button>
            <button 
              onClick={() => setFilterStatus('present')} 
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 ${
                filterStatus === 'present' 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Present
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filterStatus === 'present' 
                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                  : 'bg-background/50'
              }`}>
                {statusCounts.present}
              </span>
            </button>
            <button 
              onClick={() => setFilterStatus('late')} 
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 ${
                filterStatus === 'late' 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Late
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filterStatus === 'late' 
                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                  : 'bg-background/50'
              }`}>
                {statusCounts.late}
              </span>
            </button>
            <button 
              onClick={() => setFilterStatus('not_marked')} 
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 ${
                filterStatus === 'not_marked' 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Awaiting
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filterStatus === 'not_marked' 
                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                  : 'bg-background/50'
              }`}>
                {statusCounts.not_marked}
              </span>
            </button>
            <button 
              onClick={() => setFilterStatus('absent')} 
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 ${
                filterStatus === 'absent' 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Absent
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filterStatus === 'absent' 
                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                  : 'bg-background/50'
              }`}>
                {statusCounts.absent}
              </span>
            </button>
          </div>

          {filteredEmployees.length !== employees.length && (
            <p className="text-xs text-muted-foreground">
              Showing {filteredEmployees.length} of {employees.length}
            </p>
          )}
        </div>

        {/* Employee List - Card on mobile, Table on desktop */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 overflow-y-auto">
          {/* Desktop table */}
          <div className="hidden lg:block">
            <div className="card-elevated overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th 
                      onClick={() => handleSort('name')}
                      className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Employee
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('email')}
                      className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Email
                        {getSortIcon('email')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('role')}
                      className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Role
                        {getSortIcon('role')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('check_in')}
                      className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Check-in
                        {getSortIcon('check_in')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEmployees.map((employee) => (
                    <tr 
                      key={employee.id} 
                      onClick={() => handleEmployeeClick(employee)} 
                      className={`cursor-pointer transition-colors ${
                        employee.status === 'pending'
                          ? 'bg-warning/5 hover:bg-warning/10 border-l-4 border-l-warning'
                          : employee.today_status === 'absent' 
                            ? 'bg-destructive/5 hover:bg-destructive/10 border-l-4 border-l-destructive' 
                            : 'hover:bg-muted/30'
                      }`}
                      title={employee.status === 'pending' ? 'Click to approve/reject' : ''}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary">{employee.full_name.split(" ").map(n => n[0]).join("")}</span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{employee.full_name}</p>
                            <p className="text-xs text-muted-foreground">{employee.status}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{employee.email}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{employee.role}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatCheckInTime(employee.check_in_time) || "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={employee.today_status} /></td>
                      <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-2 sm:space-y-3 pb-4 pt-3">
            {filteredEmployees.map((employee, index) => (
              <div 
                key={employee.id} 
                onClick={() => handleEmployeeClick(employee)} 
                className={`card-elevated p-3 sm:p-4 animate-fade-in-up cursor-pointer transition-all ${
                  employee.status === 'pending'
                    ? 'bg-warning/5 border-l-4 border-l-warning hover:bg-warning/10'
                    : employee.today_status === 'absent'
                      ? 'bg-destructive/5 border-l-4 border-l-destructive hover:bg-destructive/10'
                      : 'hover:bg-muted/50'
                }`}
                style={{ animationDelay: `${index * 0.03}s` }}
                title={employee.status === 'pending' ? 'Click to approve/reject' : ''}
              >
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs sm:text-sm font-semibold text-primary">{employee.full_name.split(" ").map(n => n[0]).join("")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-sm sm:text-base truncate">{employee.full_name}</p>
                      <div className="flex-shrink-0">
                        <StatusBadge status={employee.today_status} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-0.5">{employee.role}</p>
                    <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                    {employee.check_in_time && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Check-in: {formatCheckInTime(employee.check_in_time)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12"><p className="text-muted-foreground">No employees found</p></div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEmployeesScreen;
