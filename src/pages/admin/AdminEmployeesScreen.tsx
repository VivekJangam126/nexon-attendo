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
    present: { label: "Present", icon: UserCheck, className: "bg-green-100 text-green-700" },
    late: { label: "Late", icon: Clock, className: "bg-amber-100 text-amber-700" },
    absent: { label: "Absent", icon: UserX, className: "bg-red-100 text-red-700" },
    not_marked: { label: "Awaiting", icon: Clock, className: "bg-gray-100 text-gray-700" },
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
      
      const { employees: employeeData } = await employeeService.getAllEmployees();
      setEmployees(employeeData);
      
      const { actions } = await dashboardService.getPendingActions();
      const pendingAction = actions.find(a => a.type === 'approval');
      setPendingCount(pendingAction?.count || 0);
      
      setLoading(false);
    };

    fetchData();
    
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statuses = ['present', 'late', 'not_marked', 'absent'];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
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
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4 text-amber-600" />;
    }
    return <ArrowDown className="w-4 h-4 text-amber-600" />;
  };

  let filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || employee.today_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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

  const activeEmployees = employees.filter(e => e.status === 'active');
  const statusCounts = {
    present: activeEmployees.filter(e => e.today_status === 'present').length,
    late: activeEmployees.filter(e => e.today_status === 'late').length,
    not_marked: employees.filter(e => e.today_status === 'not_marked').length,
    absent: activeEmployees.filter(e => e.today_status === 'absent').length,
  };

  const formatCheckInTime = (isoString: string | null) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  };

  const handleEmployeeClick = (employee: EmployeeWithAttendance) => {
    if (employee.status === 'pending') {
      navigate('/admin/pending-approvals');
    } else {
      navigate(`/admin/employee/${employee.id}`);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Employees">
        <div className="flex items-center justify-center min-h-full">
          <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Employees">
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{activeEmployees.length} Active Employees</h2>
            <p className="text-sm text-gray-600 mt-1">Manage and monitor your workforce</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate("/admin/add-employee")} 
              className="flex items-center gap-2 py-2.5 px-4 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Employee
            </button>
            {pendingCount > 0 && (
              <button 
                onClick={() => navigate("/admin/pending-approvals")} 
                className="flex items-center gap-2 py-2.5 px-4 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200 transition-colors"
              >
                <ClipboardList className="w-5 h-5" />
                Pending ({pendingCount})
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search by name or email..." 
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" 
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button 
              onClick={() => setFilterStatus(null)} 
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                !filterStatus 
                  ? "bg-amber-600 text-white shadow-sm" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({activeEmployees.length})
            </button>
            {statuses.map(status => (
              <button 
                key={status} 
                onClick={() => setFilterStatus(status)} 
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  filterStatus === status 
                    ? "bg-amber-600 text-white shadow-sm" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === 'not_marked' ? 'Awaiting' : status.charAt(0).toUpperCase() + status.slice(1)}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  filterStatus === status 
                    ? 'bg-white/30' 
                    : 'bg-gray-200/50'
                }`}>
                  {statusCounts[status as keyof typeof statusCounts]}
                </span>
              </button>
            ))}
          </div>

          {filteredEmployees.length !== employees.length && (
            <p className="text-sm text-gray-600">
              Showing {filteredEmployees.length} of {employees.length}
            </p>
          )}
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th 
                    onClick={() => handleSort('name')}
                    className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wide px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2">
                      Employee
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('email')}
                    className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wide px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2">
                      Email
                      {getSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('role')}
                    className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wide px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2">
                      Role
                      {getSortIcon('role')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('check_in')}
                    className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wide px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2">
                      Check-in
                      {getSortIcon('check_in')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wide px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr 
                    key={employee.id} 
                    onClick={() => handleEmployeeClick(employee)} 
                    className={`cursor-pointer transition-colors ${
                      employee.status === 'pending'
                        ? 'bg-amber-50 hover:bg-amber-100 border-l-4 border-l-amber-500'
                        : employee.today_status === 'absent' 
                          ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' 
                          : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-amber-700">{employee.full_name.split(" ").map(n => n[0]).join("")}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{employee.full_name}</p>
                          <p className="text-xs text-gray-500">{employee.status}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{employee.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{employee.role}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatCheckInTime(employee.check_in_time) || "—"}</td>
                    <td className="px-6 py-4"><StatusBadge status={employee.today_status} /></td>
                    <td className="px-6 py-4"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No employees found</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEmployeesScreen;
