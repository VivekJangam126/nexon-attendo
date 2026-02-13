import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, UserCheck, Clock, UserX, Plus, ClipboardList } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { employeeService, dashboardService } from "@server";
import type { EmployeeWithAttendance } from "@server";

type EmployeeStatus = "present" | "late" | "absent" | "not_marked";

const StatusBadge = ({ status }: { status: EmployeeStatus }) => {
  const configs = {
    present: { label: "Present", icon: UserCheck, className: "bg-success-muted text-success" },
    late: { label: "Late", icon: Clock, className: "bg-warning-muted text-warning" },
    absent: { label: "Absent", icon: UserX, className: "bg-destructive-muted text-destructive" },
    not_marked: { label: "Pending", icon: Clock, className: "bg-muted text-muted-foreground" },
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
  }, []);

  const statuses = ['present', 'late', 'absent', 'not_marked'];

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || employee.today_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatCheckInTime = (isoString: string | null) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-display mb-1">Employees</h1>
              <p className="text-caption">{employees.length} total employees</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/admin/add-employee")} className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" />Add Employee
            </button>
            <button onClick={() => navigate("/admin/pending-approvals")} className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-4 bg-warning-muted text-warning rounded-lg text-sm font-medium">
              <ClipboardList className="w-4 h-4" />
              Pending {pendingCount > 0 && `(${pendingCount})`}
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or ID..." className="input-field pl-12" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => setFilterStatus(null)} className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!filterStatus ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>All</button>
            {statuses.map(status => (
              <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {status === 'not_marked' ? 'Not Marked' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Employee List - Card on mobile, Table on desktop */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 overflow-y-auto">
          {/* Desktop table */}
          <div className="hidden lg:block">
            <div className="card-elevated overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Employee</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Email</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Role</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Check-in</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">Status</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} onClick={() => navigate(`/admin/employee/${employee.id}`)} className="hover:bg-muted/30 cursor-pointer transition-colors">
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
          <div className="lg:hidden space-y-3 pb-4">
            {filteredEmployees.map((employee, index) => (
              <div key={employee.id} onClick={() => navigate(`/admin/employee/${employee.id}`)} className="card-elevated p-4 animate-fade-in-up cursor-pointer hover:bg-muted/50 transition-colors" style={{ animationDelay: `${index * 0.03}s` }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">{employee.full_name.split(" ").map(n => n[0]).join("")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{employee.full_name}</p>
                      <StatusBadge status={employee.today_status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{employee.role}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{employee.email}</span>
                    </div>
                    {employee.check_in_time && <p className="text-xs text-muted-foreground mt-1">Check-in: {formatCheckInTime(employee.check_in_time)}</p>}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
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
