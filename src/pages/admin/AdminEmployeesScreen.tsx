import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, UserCheck, Clock, UserX, Plus, ClipboardList, ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { AddEmployeeModal } from "@/components/admin/AddEmployeeModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { employeeService, dashboardService } from "@server";
import type { EmployeeWithAttendance } from "@server";
import { toast } from "@/hooks/use-toast";

type EmployeeStatus = "present" | "late" | "absent" | "not_marked" | "holiday";
type SortField = "name" | "email" | "role" | "check_in" | "status";
type SortDirection = "asc" | "desc" | null;

const StatusBadge = ({ status }: { status: EmployeeStatus }) => {
  const configs = {
    present: { label: "Present", icon: UserCheck, className: "bg-green-100 text-green-700" },
    late: { label: "Late", icon: Clock, className: "bg-amber-100 text-amber-700" },
    absent: { label: "Absent", icon: UserX, className: "bg-red-100 text-red-700" },
    not_marked: { label: "Awaiting", icon: Clock, className: "bg-gray-100 text-gray-700" },
    holiday: { label: "Holiday", icon: Clock, className: "bg-blue-100 text-blue-700" },
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
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeWithAttendance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Only show loading on initial load
      if (employees.length === 0) {
        setLoading(true);
      }
      
      // Fetch data in parallel for faster loading
      const [employeeResult, actionsResult] = await Promise.all([
        employeeService.getAllEmployees(),
        dashboardService.getPendingActions(),
      ]);
      
      setEmployees(employeeResult.employees);
      
      const pendingAction = actionsResult.actions.find(a => a.type === 'approval');
      setPendingCount(pendingAction?.count || 0);
      
      setLoading(false);
    };

    fetchData();
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

  const handleAddEmployeeSuccess = () => {
    // Refresh employee list
    const fetchData = async () => {
      const [employeeResult, actionsResult] = await Promise.all([
        employeeService.getAllEmployees(),
        dashboardService.getPendingActions(),
      ]);
      
      setEmployees(employeeResult.employees);
      
      const pendingAction = actionsResult.actions.find(a => a.type === 'approval');
      setPendingCount(pendingAction?.count || 0);
    };
    fetchData();
  };

  const handleAddSuccess = async () => {
    // Refresh employee list
    const [employeeResult, actionsResult] = await Promise.all([
      employeeService.getAllEmployees(),
      dashboardService.getPendingActions(),
    ]);
    
    setEmployees(employeeResult.employees);
    
    const pendingAction = actionsResult.actions.find(a => a.type === 'approval');
    setPendingCount(pendingAction?.count || 0);
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete || isDeleting) return;

    setIsDeleting(true);
    
    try {
      const result = await employeeService.deleteEmployee(employeeToDelete.id);
      
      if (result.success) {
        toast({
          title: "Employee Deleted",
          description: `${employeeToDelete.full_name} has been permanently deleted from the system.`,
        });
        
        // Refresh employee list
        const [employeeResult, actionsResult] = await Promise.all([
          employeeService.getAllEmployees(),
          dashboardService.getPendingActions(),
        ]);
        
        setEmployees(employeeResult.employees);
        
        const pendingAction = actionsResult.actions.find(a => a.type === 'approval');
        setPendingCount(pendingAction?.count || 0);
        
        setEmployeeToDelete(null);
      } else {
        toast({
          title: "Delete Failed",
          description: result.error?.message || "Failed to delete employee. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Delete Error",
        description: "An unexpected error occurred while deleting the employee.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, employee: EmployeeWithAttendance) => {
    e.stopPropagation(); // Prevent row click
    setEmployeeToDelete(employee);
  };

  if (loading) {
    return (
      <AdminLayout title="Employees">
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Employees">
      <div className="space-y-3">
        {/* Header with Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-900">{activeEmployees.length} Active Employees</h2>
              <p className="text-xs text-gray-600 mt-0.5">Manage and monitor your workforce</p>
            </div>
            {/* Desktop buttons */}
            <div className="hidden sm:flex gap-2">
              <button 
                onClick={() => setShowAddEmployeeModal(true)} 
                className="flex items-center gap-1.5 py-2 px-3 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </button>
              {pendingCount > 0 && (
                <button 
                  onClick={() => navigate("/admin/pending-approvals")} 
                  className="flex items-center gap-1.5 py-2 px-3 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  Pending ({pendingCount})
                </button>
              )}
            </div>
          </div>
          
          {/* Mobile buttons */}
          <div className="flex sm:hidden gap-2">
            <button 
              onClick={() => setShowAddEmployeeModal(true)} 
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </button>
            {pendingCount > 0 && (
              <button 
                onClick={() => navigate("/admin/pending-approvals")} 
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                Pending ({pendingCount})
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search by name or email..." 
              className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" 
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button 
              onClick={() => setFilterStatus(null)} 
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
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
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterStatus === status 
                    ? "bg-amber-600 text-white shadow-sm" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === 'not_marked' ? 'Awaiting' : status.charAt(0).toUpperCase() + status.slice(1)}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
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
            <p className="text-xs text-gray-600">
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
                    className="text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Employee
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('email')}
                    className="text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Email
                      {getSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('role')}
                    className="text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Role
                      {getSortIcon('role')}
                    </div>
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide px-4 py-3">
                    Designation
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide px-4 py-3">
                    Office
                  </th>
                  <th 
                    onClick={() => handleSort('check_in')}
                    className="text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Check-in
                      {getSortIcon('check_in')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-700 uppercase tracking-wide px-4 py-3">
                    Actions
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-amber-700">{employee.full_name.split(" ").map(n => n[0]).join("")}</span>
                        </div>
                        <div>
                          <p className="font-medium text-xs text-gray-900">{employee.full_name}</p>
                          <p className="text-xs text-gray-500">{employee.status}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{employee.email}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{employee.role_type || 'Employee'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{employee.designation || 'Not Assigned'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{employee.office_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatCheckInTime(employee.check_in_time) || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={employee.today_status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => handleDeleteClick(e, employee)}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-gray-600">No employees found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal 
        open={showAddEmployeeModal}
        onOpenChange={setShowAddEmployeeModal}
        onSuccess={handleAddEmployeeSuccess}
      />

      {/* Delete Employee Confirmation Dialog */}
      <AlertDialog open={!!employeeToDelete} onOpenChange={() => setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{employeeToDelete?.full_name}</strong>? 
              This action cannot be undone and will remove all associated data including:
              <br /><br />
              • Attendance records
              <br />
              • Leave requests and balances
              <br />
              • Performance data
              <br />
              • All other employee-related information
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEmployee}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </div>
              ) : (
                "Delete Permanently"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminEmployeesScreen;
