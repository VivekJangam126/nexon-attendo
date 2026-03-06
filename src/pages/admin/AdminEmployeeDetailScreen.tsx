import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Mail, Phone, Building2, Briefcase, 
  UserCheck, Clock, UserX, Calendar, Edit, Shield, 
  ToggleLeft, ToggleRight, CheckCircle2, Key, Copy, X
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

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
        // Initialize edit form
        setEditForm({
          full_name: employeeData.full_name,
          email: employeeData.email,
          phone: employeeData.phone || '',
        });
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

  const handleEditClick = () => {
    if (employee) {
      setEditForm({
        full_name: employee.full_name,
        email: employee.email,
        phone: employee.phone || '',
      });
      setShowEditDialog(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    
    setIsSavingEdit(true);
    const { success } = await employeeService.updateEmployee(id, editForm);
    
    if (success) {
      // Update local state
      if (employee) {
        setEmployee({
          ...employee,
          full_name: editForm.full_name,
          email: editForm.email,
          phone: editForm.phone,
        });
      }
      setShowEditDialog(false);
      toast({ title: "Profile Updated", description: "Employee profile has been updated successfully." });
    } else {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
    
    setIsSavingEdit(false);
  };

  const handleResetPassword = async () => {
    if (!id) return;
    
    setIsResettingPassword(true);
    const { success, tempPassword: newPassword } = await employeeService.resetPassword(id, '');
    
    if (success && newPassword) {
      setTempPassword(newPassword);
      toast({ 
        title: "Password Reset", 
        description: "A temporary password has been generated. Share it with the employee." 
      });
    } else {
      toast({ title: "Error", description: "Failed to reset password.", variant: "destructive" });
      setShowResetPasswordDialog(false);
    }
    
    setIsResettingPassword(false);
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(tempPassword);
    toast({ title: "Copied!", description: "Password copied to clipboard." });
  };

  const closeResetDialog = () => {
    setShowResetPasswordDialog(false);
    setTempPassword('');
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
            <div className="flex gap-2">
              <button 
                onClick={() => setShowResetPasswordDialog(true)} 
                className="p-2 hover:bg-primary-foreground/10 lg:hover:bg-muted rounded-lg transition-colors"
                title="Reset Password"
              >
                <Key className="w-5 h-5" />
              </button>
              <button 
                onClick={handleEditClick} 
                className="p-2 hover:bg-primary-foreground/10 lg:hover:bg-muted rounded-lg transition-colors"
                title="Edit Profile"
              >
                <Edit className="w-5 h-5" />
              </button>
            </div>
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
                    { icon: Phone, label: "Phone", value: employee.phone || 'Not provided' },
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

        {/* Edit Employee Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Employee Profile</DialogTitle>
              <DialogDescription>Update employee information. Changes will be saved immediately.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <DialogFooter>
              <button
                onClick={() => setShowEditDialog(false)}
                className="px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors"
                disabled={isSavingEdit}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={isSavingEdit}
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={showResetPasswordDialog} onOpenChange={closeResetDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Reset Employee Password</DialogTitle>
              <DialogDescription>
                {tempPassword ? 'Password has been reset. Share this temporary password with the employee.' : 'Generate a new temporary password for this employee.'}
              </DialogDescription>
            </DialogHeader>
            {tempPassword ? (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Temporary Password:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-background border border-input rounded text-sm font-mono">
                      {tempPassword}
                    </code>
                    <button
                      onClick={copyPasswordToClipboard}
                      className="p-2 hover:bg-background rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm text-warning-foreground">
                    ⚠️ The employee will be required to change this password on their next login.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  This will generate a random temporary password and require the employee to change it on their next login.
                </p>
              </div>
            )}
            <DialogFooter>
              {tempPassword ? (
                <button
                  onClick={closeResetDialog}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    onClick={closeResetDialog}
                    className="px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors"
                    disabled={isResettingPassword}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                  </button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminEmployeeDetailScreen;
