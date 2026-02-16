import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Search, UserX, UserCheck, Trash2,
  Download, AlertTriangle, Eye
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/hooks/use-toast";
import { employeeService } from "@server";
import type { EmployeeWithAttendance } from "@server";
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

const EmployeeManagementScreen = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'blocked'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithAttendance | null>(null);
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | 'delete' | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const { employees: data, error } = await employeeService.getAllEmployees();
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive",
      });
    } else {
      setEmployees(data);
    }
    
    setLoading(false);
  };

  const filteredEmployees = employees.filter(emp => {
    // Search filter
    const matchesSearch = emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAction = (employee: EmployeeWithAttendance, action: 'activate' | 'deactivate' | 'delete') => {
    setSelectedEmployee(employee);
    setActionType(action);
  };

  const confirmAction = async () => {
    if (!selectedEmployee || !actionType) return;

    let result: { success: boolean; error: Error | null } | undefined;
    
    if (actionType === 'activate') {
      result = await employeeService.activateEmployee(selectedEmployee.id);
    } else if (actionType === 'deactivate') {
      result = await employeeService.deactivateEmployee(selectedEmployee.id);
    } else if (actionType === 'delete') {
      result = await employeeService.deleteEmployee(selectedEmployee.id);
    }

    if (result?.error) {
      toast({
        title: "Error",
        description: result.error.message,
        variant: "destructive",
      });
    } else {
      const actionMessages = {
        activate: `${selectedEmployee.full_name} has been activated successfully`,
        deactivate: `${selectedEmployee.full_name} has been deactivated`,
        delete: `${selectedEmployee.full_name} has been removed from the system`,
      };
      
      toast({
        title: "Success",
        description: actionMessages[actionType],
      });
      
      // Refresh employee list
      fetchEmployees();
    }

    setSelectedEmployee(null);
    setActionType(null);
  };

  const handleExport = () => {
    try {
      // Prepare CSV data
      const headers = ['Name', 'Email', 'Status', 'Role', 'Office', 'Created Date'];
      const csvRows = [headers.join(',')];

      // Add employee data
      filteredEmployees.forEach(emp => {
        // Format date properly for CSV
        const createdDate = new Date(emp.created_at);
        const formattedDate = `${createdDate.getMonth() + 1}/${createdDate.getDate()}/${createdDate.getFullYear()}`;
        
        const row = [
          `"${emp.full_name}"`,
          `"${emp.email}"`,
          `"${emp.status}"`,
          `"${emp.role}"`,
          `"${emp.office_name || 'Not Assigned'}"`,
          `"${formattedDate}"`,
        ];
        csvRows.push(row.join(','));
      });

      // Create CSV content
      const csvContent = csvRows.join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${filteredEmployees.length} employee(s) to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export employee data",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { label: "Active", className: "bg-success-muted text-success" },
      pending: { label: "Pending", className: "bg-warning-muted text-warning" },
      blocked: { label: "Blocked", className: "bg-destructive-muted text-destructive" },
      rejected: { label: "Rejected", className: "bg-muted text-muted-foreground" },
    };
    
    const config = configs[status as keyof typeof configs] || configs.active;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-4 border-b border-border">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate("/admin/settings")}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-display">Employee Management</h1>
              <p className="text-caption">Manage employee accounts and permissions</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          {/* Search and Actions */}
          <div className="mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                onClick={handleExport}
                disabled={filteredEmployees.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={filteredEmployees.length === 0 ? "No employees to export" : "Export to CSV"}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            
            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { value: 'all', label: 'All Employees', count: employees.length },
                { value: 'active', label: 'Active', count: employees.filter(e => e.status === 'active').length },
                { value: 'pending', label: 'Pending', count: employees.filter(e => e.status === 'pending').length },
                { value: 'blocked', label: 'Blocked', count: employees.filter(e => e.status === 'blocked').length },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value as typeof statusFilter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>

          {/* Info Card */}
          <div className="mb-6 card-elevated p-4 bg-accent/50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Important</p>
                <p className="text-muted-foreground">
                  Deactivating an employee will prevent them from logging in. 
                  Deleting an employee is permanent and cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="card-elevated p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-semibold">{employees.length}</p>
                </div>
                <div className="card-elevated p-4">
                  <p className="text-xs text-muted-foreground mb-1">Active</p>
                  <p className="text-2xl font-semibold text-success">
                    {employees.filter(e => e.status === 'active').length}
                  </p>
                </div>
                <div className="card-elevated p-4">
                  <p className="text-xs text-muted-foreground mb-1">Pending</p>
                  <p className="text-2xl font-semibold text-warning">
                    {employees.filter(e => e.status === 'pending').length}
                  </p>
                </div>
                <div className="card-elevated p-4">
                  <p className="text-xs text-muted-foreground mb-1">Blocked</p>
                  <p className="text-2xl font-semibold text-destructive">
                    {employees.filter(e => e.status === 'blocked').length}
                  </p>
                </div>
              </div>

              {/* Employee List */}
              <div className="card-elevated overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                          Employee
                        </th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                          Email
                        </th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                          Status
                        </th>
                        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                          Office
                        </th>
                        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-3">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredEmployees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-semibold text-primary">
                                  {employee.full_name.split(" ").map(n => n[0]).join("")}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{employee.full_name}</p>
                                <p className="text-xs text-muted-foreground">{employee.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {employee.email}
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(employee.status)}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {employee.office_name || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(`/admin/employee/${employee.id}`)}
                                className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {employee.status === 'active' ? (
                                <button
                                  onClick={() => handleAction(employee, 'deactivate')}
                                  className="p-2 hover:bg-warning/10 text-warning rounded-lg transition-colors"
                                  title="Deactivate"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              ) : employee.status === 'blocked' ? (
                                <button
                                  onClick={() => handleAction(employee, 'activate')}
                                  className="p-2 hover:bg-success/10 text-success rounded-lg transition-colors"
                                  title="Activate"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              ) : employee.status === 'pending' ? (
                                <button
                                  onClick={() => navigate('/admin/pending-approvals')}
                                  className="p-2 hover:bg-warning/10 text-warning rounded-lg transition-colors"
                                  title="Go to Pending Approvals"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              ) : null}
                              
                              {employee.status !== 'pending' && (
                                <button
                                  onClick={() => handleAction(employee, 'delete')}
                                  className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredEmployees.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No employees found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedEmployee && !!actionType} onOpenChange={() => {
        setSelectedEmployee(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'delete' && 'Delete Employee'}
              {actionType === 'activate' && 'Activate Employee'}
              {actionType === 'deactivate' && 'Deactivate Employee'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'delete' && (
                <>
                  Are you sure you want to delete <strong>{selectedEmployee?.full_name}</strong>? 
                  This action cannot be undone and will permanently remove all their data.
                </>
              )}
              {actionType === 'activate' && (
                <>
                  Activate <strong>{selectedEmployee?.full_name}</strong>? 
                  They will be able to log in and mark attendance.
                </>
              )}
              {actionType === 'deactivate' && (
                <>
                  Deactivate <strong>{selectedEmployee?.full_name}</strong>? 
                  They will not be able to log in until reactivated.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={actionType === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {actionType === 'delete' && 'Delete'}
              {actionType === 'activate' && 'Activate'}
              {actionType === 'deactivate' && 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default EmployeeManagementScreen;
