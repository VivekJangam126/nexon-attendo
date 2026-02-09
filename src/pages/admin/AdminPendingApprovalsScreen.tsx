import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle2, XCircle, Eye, User, Mail, Building2, Calendar } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
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
import { toast } from "@/hooks/use-toast";

interface PendingEmployee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  officeLocation: string;
  submittedDate: string;
  status: "pending" | "approved" | "rejected";
}

const mockPending: PendingEmployee[] = [
  { id: "p1", name: "Arjun Mehta", email: "arjun.mehta@gmail.com", department: "Engineering", role: "Frontend Developer", officeLocation: "Head Office", submittedDate: "2024-01-18" },
  { id: "p2", name: "Sneha Gupta", email: "sneha.gupta@gmail.com", department: "Design", role: "Product Designer", officeLocation: "Head Office", submittedDate: "2024-01-17" },
  { id: "p3", name: "Rohit Verma", email: "rohit.verma@gmail.com", department: "Marketing", role: "Content Writer", officeLocation: "Branch Office", submittedDate: "2024-01-16" },
].map((e) => ({ ...e, status: "pending" as const }));

const AdminPendingApprovalsScreen = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState(mockPending);
  const [selectedEmployee, setSelectedEmployee] = useState<PendingEmployee | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, status: "approved" as const } : e)));
    toast({ title: "Employee Approved", description: "The employee has been approved and can now log in." });
  };

  const handleReject = () => {
    if (rejectTarget) {
      setEmployees((prev) => prev.map((e) => (e.id === rejectTarget ? { ...e, status: "rejected" as const } : e)));
      toast({ title: "Registration Rejected", description: "The employee registration has been rejected." });
    }
    setShowRejectDialog(false);
    setRejectReason("");
    setRejectTarget(null);
  };

  const pendingList = employees.filter((e) => e.status === "pending");

  return (
    <MobileContainer>
      <div className="flex flex-col h-full min-h-[800px]">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 border-b border-border flex items-center gap-3">
          <button onClick={() => navigate("/admin/employees")} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-title">Pending Approvals</h1>
            <p className="text-caption">{pendingList.length} registration requests</p>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 px-6 py-4 overflow-y-auto">
          {pendingList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-success-muted rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <p className="text-heading mb-1">All caught up!</p>
              <p className="text-caption">No pending registrations to review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingList.map((emp, index) => (
                <div key={emp.id} className="card-elevated p-4 animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-warning-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{emp.department} • {emp.role}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Submitted: {new Date(emp.submittedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => { setSelectedEmployee(emp); setShowDetail(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleApprove(emp.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-success text-success-foreground rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => { setRejectTarget(emp.id); setShowRejectDialog(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Sheet */}
        {showDetail && selectedEmployee && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={() => setShowDetail(false)}>
            <div className="w-full max-w-[430px] bg-card rounded-t-3xl p-6 space-y-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-2" />
              <h2 className="text-heading">Registration Details</h2>
              <div className="space-y-3">
                {[
                  { icon: User, label: "Full Name", value: selectedEmployee.name },
                  { icon: Mail, label: "Email", value: selectedEmployee.email },
                  { icon: Building2, label: "Department", value: selectedEmployee.department },
                  { icon: Building2, label: "Role", value: selectedEmployee.role },
                  { icon: Building2, label: "Office", value: selectedEmployee.officeLocation },
                  { icon: Calendar, label: "Submitted", value: new Date(selectedEmployee.submittedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { handleApprove(selectedEmployee.id); setShowDetail(false); }} className="flex-1 py-3 bg-success text-success-foreground rounded-xl font-medium">
                  Approve
                </button>
                <button onClick={() => { setRejectTarget(selectedEmployee.id); setShowRejectDialog(true); setShowDetail(false); }} className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium">
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent className="max-w-[340px] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Registration</AlertDialogTitle>
              <AlertDialogDescription>
                Please provide a reason for rejecting this registration.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="input-field min-h-[80px] resize-none"
            />
            <AlertDialogFooter className="flex-row gap-3">
              <AlertDialogCancel className="flex-1 mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReject} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MobileContainer>
  );
};

export default AdminPendingApprovalsScreen;
