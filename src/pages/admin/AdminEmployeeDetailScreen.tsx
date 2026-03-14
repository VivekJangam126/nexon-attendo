import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Mail, Phone, Building2, Briefcase, 
  UserCheck, Clock, UserX, Calendar, Edit, Shield, 
  ToggleLeft, ToggleRight, CheckCircle2, Save, X
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { EmployeeLeaveBalanceCards } from "@/components/leave/EmployeeLeaveBalanceCards";
import { EmployeeTimeTracker } from "@/components/EmployeeTimeTracker";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { employeeService, officeService } from "@server";
import type { EmployeeWithAttendance, Office } from "@server";

type AttendanceStatus = "present" | "late" | "absent" | "holiday" | "not_marked";

const StatusBadge = ({ status }: { status: AttendanceStatus }) => {
  const configs: Record<AttendanceStatus, { label: string; icon: any; className: string }> = {
    present: { label: "Present", icon: UserCheck, className: "bg-green-100 text-green-700" },
    late: { label: "Late", icon: Clock, className: "bg-amber-100 text-amber-700" },
    absent: { label: "Absent", icon: UserX, className: "bg-red-100 text-red-700" },
    holiday: { label: "Holiday", icon: Calendar, className: "bg-blue-100 text-blue-700" },
    not_marked: { label: "Awaiting", icon: Clock, className: "bg-gray-100 text-gray-700" },
  };
  const config = configs[status] || configs.absent; // Fallback to absent if status not found
  const Icon = config.icon;
  return <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}><Icon className="w-3 h-3" />{config.label}</span>;
};

const AdminEmployeeDetailScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { profile: adminProfile } = useAuth();
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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const [editForm, setEditForm] = useState({
    email: "",
    role: "employee" as 'employee' | 'admin',
    office_location: "",
    designation: "",
    role_type: "Employee" as 'Employee' | 'Intern' | 'Unpaid Intern' | 'Paid Intern',
  });
  const [isSaving, setIsSaving] = useState(false);

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
        
        // Initialize edit form with current values
        setEditForm({
          email: employeeData.email,
          role: employeeData.role,
          office_location: employeeData.office_location || "",
          designation: employeeData.designation || "",
          role_type: employeeData.role_type || "Employee",
        });
      }
      setAttendanceHistory(history);
      setStats(employeeStats);
      setLoading(false);
    };

    const fetchOffices = async () => {
      const { offices: officeList } = await officeService.getActiveOffices();
      setOffices(officeList);
    };

    fetchEmployeeData();
    fetchOffices();
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

  const handleOpenEditDialog = () => {
    if (employee) {
      setEditForm({
        email: employee.email,
        role: employee.role,
        office_location: employee.office_location || "",
        designation: employee.designation || "",
        role_type: employee.role_type || "Employee",
      });
      setShowEditDialog(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    
    setIsSaving(true);
    const { success } = await employeeService.updateEmployeeProfile(id, {
      email: editForm.email,
      role: editForm.role,
      office_location: editForm.office_location,
      designation: editForm.designation,
      role_type: editForm.role_type,
    });
    
    setIsSaving(false);
    
    if (success) {
      toast({ title: "Profile Updated", description: "Employee profile has been updated successfully." });
      setShowEditDialog(false);
      
      // Refresh employee data
      const { employee: employeeData } = await employeeService.getEmployeeDetail(id);
      if (employeeData) {
        setEmployee(employeeData);
        setUserRole(employeeData.role);
      }
    } else {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
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

  const todayStatus: AttendanceStatus = employee.today_status === 'not_marked' ? 'not_marked' : employee.today_status as AttendanceStatus;

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-2 pb-2 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate("/admin/employees")} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
            <button onClick={handleOpenEditDialog} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <Edit className="w-4.5 h-4.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-base font-semibold text-amber-700">{employee.full_name.split(" ").map((n: string) => n[0]).join("")}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold mb-0.5 truncate">{employee.full_name}</h1>
              <p className="text-sm text-muted-foreground truncate">{employee.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={todayStatus} />
                {!isActive && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive-muted text-destructive">Deactivated</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-3 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Left column */}
            <div className="space-y-2.5">
              <div className="animate-fade-in-up">
                <h2 className="text-overline mb-2">Account Controls</h2>
                <div className="card-elevated divide-y divide-border">
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center"><Shield className="w-4.5 h-4.5 text-primary" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Role</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{employee.role_type || 'Employee'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center"><UserCheck className="w-4.5 h-4.5 text-primary" /></div>
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
                <h2 className="text-overline mb-2">Contact Information</h2>
                <div className="card-elevated divide-y divide-border">
                  {[
                    { icon: Mail, label: "Email", value: employee.email },
                    { icon: Building2, label: "Office", value: employee.office_name || 'Not assigned' },
                    { icon: Briefcase, label: "Role", value: employee.role_type || 'Employee' },
                    { icon: Briefcase, label: "Designation", value: employee.designation || 'Not Assigned' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center"><item.icon className="w-4.5 h-4.5 text-primary" /></div>
                      <div className="flex-1 min-w-0"><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-sm font-medium truncate">{item.value}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <h2 className="text-overline mb-2">Audit Trail</h2>
                <div className="card-elevated divide-y divide-border">
                  {[
                    { icon: Calendar, label: "Join Date", value: new Date(employee.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
                    { icon: Calendar, label: "Last Updated", value: new Date(employee.updated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center"><item.icon className="w-4.5 h-4.5 text-primary" /></div>
                      <div className="flex-1 min-w-0"><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-sm font-medium truncate">{item.value}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-2.5">
              {/* Stats */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                <h2 className="text-overline mb-2">Monthly Statistics</h2>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: `${stats.attendanceRate}%`, label: "Rate", color: "text-primary" },
                    { value: stats.presentCount, label: "Present", color: "text-success" },
                    { value: stats.lateCount, label: "Late", color: "text-warning" },
                    { value: stats.absentCount, label: "Absent", color: "text-destructive" },
                  ].map((s, i) => (
                    <div key={i} className="card-elevated p-2.5 text-center">
                      <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave Balance Cards */}
              <div style={{ animationDelay: "0.2s" }}>
                {id && <EmployeeLeaveBalanceCards employeeId={id} />}
              </div>

              {/* Time Tracker */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
                <h2 className="text-overline mb-2">Time Tracking</h2>
                <div className="card-elevated p-4">
                  <EmployeeTimeTracker
                    employeeId={id}
                    checkInTime={attendanceHistory.find(r => r.date === new Date().toISOString().split('T')[0])?.check_in_time || null}
                    checkOutTime={attendanceHistory.find(r => r.date === new Date().toISOString().split('T')[0])?.check_out_time || null}
                    isAdmin={true}
                    employeeName={employee.full_name}
                    currentUserId={adminProfile?.id}
                  />
                </div>
              </div>

              {/* Attendance History */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                <h2 className="text-overline mb-2">Recent Attendance</h2>
                <div className="card-elevated divide-y divide-border">
                  {attendanceHistory.slice(0, 5).map((record, index) => (
                    <div key={index} className="flex items-center gap-3 p-3">
                      <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center"><Calendar className="w-4.5 h-4.5 text-muted-foreground" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{new Date(record.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
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

        {/* Edit Profile Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Employee Profile</DialogTitle>
              <DialogDescription>Update employee information</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input 
                  type="email" 
                  value={editForm.email} 
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
                  autoComplete="off"
                  autoFocus={false}
                  onFocus={(e) => e.target.blur()}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Office Location</label>
                <select 
                  value={editForm.office_location} 
                  onChange={(e) => setEditForm({...editForm, office_location: e.target.value})} 
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select office</option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.name} - {office.city}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select 
                  value={editForm.role_type} 
                  onChange={(e) => setEditForm({...editForm, role_type: e.target.value as any})} 
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Employee">Employee</option>
                  <option value="Intern">Intern</option>
                  <option value="Unpaid Intern">Unpaid Intern</option>
                  <option value="Paid Intern">Paid Intern</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Designation</label>
                <select 
                  value={editForm.designation} 
                  onChange={(e) => setEditForm({...editForm, designation: e.target.value})} 
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select designation</option>
                  <option value="Software Developer">Software Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="HR Executive">HR Executive</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                </select>
              </div>
            </div>
            
            <DialogFooter className="flex gap-3">
              <button 
                onClick={() => setShowEditDialog(false)} 
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit} 
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
