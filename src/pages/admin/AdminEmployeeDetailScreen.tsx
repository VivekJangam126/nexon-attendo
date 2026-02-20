import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Mail, Phone, Building2, Briefcase, 
  UserCheck, Clock, UserX, Calendar, Edit, Shield, 
  ToggleLeft, ToggleRight, CheckCircle2
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { employeeService } from "@server";
import type { EmployeeWithAttendance } from "@server";

type AttendanceStatus = "present" | "late" | "absent";

const StatusBadge = ({ status }: { status: AttendanceStatus }) => {
  const configs = {
    present: { label: "Present", icon: UserCheck, className: "bg-success-muted text-success" },
    late: { label: "Late", icon: Clock, className: "bg-warning-muted text-warning" },
    absent: { label: "Absent", icon: UserX, className: "bg-destructive-muted text-destructive" },
  };
  const config = configs[status]; const Icon = config.icon;
  return <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}><Icon className="w-3 h-3" />{config.label}</span>;
};

const AdminEmployeeDetailScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<EmployeeWithAttendance | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Array<{
    date: string;
    check_in_time: string | null;
    check_out_time: string | null;
    status: AttendanceStatus;
  }>>([]);
  const [stats, setStats] = useState({
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    attendanceRate: 0,
  });
  const [isActive, setIsActive] = useState(true);
  const [userRole, setUserRole] = useState<'employee' | 'admin'>('employee');
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!id) return;
      
      setLoading(true);
      const { employee: employeeData, attendanceHistory: history, stats: employeeStats } = 
        await employeeService.getEmployeeDetail(id);
      
      if (employeeData) {
        setEmployee(employeeData);
        setIsActive(employeeData.status === 'active');
        setUserRole(employeeData.role);
      }
      setAttendanceHistory(history);
      setStats(employeeStats);
      setLoading(false);
    };

    fetchEmployeeData();
  }, [id]);

  const formatCheckInTime = (isoString: string | null) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleRoleChange = async (newRole: 'employee' | 'admin') => {
    if (!id) return;
    
    const { success } = await employeeService.updateEmployeeRole(id, newRole);
    if (success) {
      setUserRole(newRole);
      toast({ title: "Role Updated", description: `Employee is now ${newRole}.` });
    } else {
      toast({ title: "Error", description: "Failed to update role.", variant: "destructive" });
    }
  };

  const handleToggleActive = () => {
    if (isActive) { 
      setShowDeactivateDialog(true); 
    } else { 
      confirmActivate();
    }
  };

  const confirmActivate = async () => {
    if (!id) return;
    
    const { success } = await employeeService.updateEmployeeStatus(id, 'active');
    if (success) {
      setIsActive(true); 
      toast({ title: "Account Activated", description: `Employee's account has been activated.` });
    } else {
      toast({ title: "Error", description: "Failed to activate account.", variant: "destructive" });
    }
  };

  const confirmDeactivate = async () => {
    if (!id) return;
    
    const { success } = await employeeService.updateEmployeeStatus(id, 'blocked');
    if (success) {
      setIsActive(false); 
      setShowDeactivateDialog(false);
      toast({ title: "Account Deactivated", description: `Employee's account has been deactivated.` });
    } else {
      toast({ title: "Error", description: "Failed to deactivate account.", variant: "destructive" });
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

  if (!employee) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-full p-6">
          <p className="text-muted-foreground">Employee not found</p>
          <button onClick={() => navigate("/admin/employees")} className="mt-4 text-primary font-medium">Back to Employees</button>
        </div>
      </AdminLayout>
    );
  }

  const todayStatus = employee.today_status === 'not_marked' ? 'present' : employee.today_status;

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-6 bg-primary text-primary-foreground rounded-b-3xl lg:rounded-none lg:bg-transparent lg:text-foreground lg:border-b lg:border-border">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <button onClick={() => navigate("/admin/employees")} className="p-2 -ml-2 hover:bg-primary-foreground/10 lg:hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={() => toast({ title: "Edit Mode", description: "Edit functionality will be available with backend." })} className="p-2 hover:bg-primary-foreground/10 lg:hover:bg-muted rounded-lg transition-colors">
              <Edit className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-foreground/20 lg:bg-accent rounded-full flex items-center justify-center">
              <span className="text-xl font-semibold lg:text-primary">{employee.full_name.split(" ").map((n: string) => n[0]).join("")}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold mb-1">{employee.full_name}</h1>
              <p className="text-primary-foreground/80 lg:text-muted-foreground text-sm">{employee.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={todayStatus} />
                {!isActive && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-destructive-muted text-destructive">Deactivated</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
            {/* Left column */}
            <div className="space-y-5">
              {/* Account Controls */}
              <div className="animate-fade-in-up">
                <h2 className="text-overline mb-3">Account Controls</h2>
                <div className="card-elevated divide-y divide-border">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Role</p>
                      <div className="flex gap-2 mt-1.5">
                        {(['employee', 'admin'] as const).map((r) => (
                          <button key={r} onClick={() => handleRoleChange(r)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${userRole === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center"><UserCheck className="w-5 h-5 text-primary" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Account Status</p>
                      <p className="text-xs text-muted-foreground">{isActive ? "Active" : "Deactivated"}</p>
                    </div>
                    <button onClick={handleToggleActive} className="text-primary">
                      {isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
                <h2 className="text-overline mb-3">Contact Information</h2>
                <div className="card-elevated divide-y divide-border">
                  {[
                    { icon: Mail, label: "Email", value: employee.email },
                    { icon: Building2, label: "Office", value: employee.office_name || 'Not assigned' },
                    { icon: Briefcase, label: "Role", value: employee.role },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center"><item.icon className="w-5 h-5 text-primary" /></div>
                      <div><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-sm font-medium">{item.value}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <h2 className="text-overline mb-3">Audit Trail</h2>
                <div className="card-elevated divide-y divide-border">
                  {[
                    { icon: Calendar, label: "Join Date", value: new Date(employee.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
                    { icon: Calendar, label: "Last Updated", value: new Date(employee.updated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center"><item.icon className="w-5 h-5 text-primary" /></div>
                      <div><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-sm font-medium">{item.value}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Stats */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                <h2 className="text-overline mb-3">Monthly Statistics</h2>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { value: `${stats.attendanceRate}%`, label: "Rate", color: "text-primary" },
                    { value: stats.presentCount, label: "Present", color: "text-success" },
                    { value: stats.lateCount, label: "Late", color: "text-warning" },
                    { value: stats.absentCount, label: "Absent", color: "text-destructive" },
                  ].map((s, i) => (
                    <div key={i} className="card-elevated p-3 text-center">
                      <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendance History */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                <h2 className="text-overline mb-3">Recent Attendance</h2>
                <div className="card-elevated divide-y divide-border">
                  {attendanceHistory.slice(0, 5).map((record, index) => (
                    <div key={index} className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center"><Calendar className="w-5 h-5 text-muted-foreground" /></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{new Date(record.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                        <p className="text-xs text-muted-foreground">{formatCheckInTime(record.check_in_time) || "No check-in"}</p>
                      </div>
                      <StatusBadge status={record.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deactivation Confirm */}
        <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
          <AlertDialogContent className="max-w-[340px] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate Account</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to deactivate this employee's account? They will not be able to log in.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row gap-3">
              <AlertDialogCancel className="flex-1 mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeactivate} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">Deactivate</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminEmployeeDetailScreen;
