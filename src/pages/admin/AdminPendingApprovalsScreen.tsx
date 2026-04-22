import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle2, XCircle, Eye, User, Mail, Building2, Calendar } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { adminApprovalService } from "@server";
import type { EmployeeRequestWithOffice } from "@server";

const AdminPendingApprovalsScreen = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [requests, setRequests] = useState<EmployeeRequestWithOffice[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EmployeeRequestWithOffice | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending requests on mount
  useEffect(() => {
    const fetchRequests = async () => {
      if (!profile) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      if (profile.role !== 'admin') {
        setError("Unauthorized: Admin access required");
        setLoading(false);
        return;
      }

      const { requests: pendingRequests, error: fetchError } = await adminApprovalService.getPendingRequests(profile);
      
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setRequests(pendingRequests);
      }
      setLoading(false);
    };

    fetchRequests();
  }, [profile]);

  const handleApprove = async (requestId: string) => {
    if (!profile) return;

    const { success, error: approveError } = await adminApprovalService.approveRequest(requestId, profile);
    
    if (approveError || !success) {
      toast({ 
        title: "Approval Failed", 
        description: approveError?.message || "Failed to approve request",
        variant: "destructive"
      });
      return;
    }

    // Remove from list
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    toast({ title: "Employee Approved", description: "The employee has been approved and can now log in." });
  };

  const handleReject = async () => {
    if (!rejectTarget || !profile) return;

    if (!rejectReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive"
      });
      return;
    }

    const { success, error: rejectError } = await adminApprovalService.rejectRequest(
      rejectTarget,
      profile,
      rejectReason
    );

    if (rejectError || !success) {
      toast({
        title: "Rejection Failed",
        description: rejectError?.message || "Failed to reject request",
        variant: "destructive"
      });
      return;
    }

    // Remove from list
    setRequests((prev) => prev.filter((r) => r.id !== rejectTarget));
    toast({ title: "Registration Rejected", description: "The employee registration has been rejected." });
    
    setShowRejectDialog(false);
    setRejectReason("");
    setRejectTarget(null);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-4 border-b border-border flex items-center gap-3">
          <button onClick={() => navigate("/admin/user-management")} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors lg:hidden">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-title">Pending Approvals</h1>
            <p className="text-caption">{requests.length} registration requests</p>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-destructive-muted rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <p className="text-heading mb-1">Error Loading Requests</p>
              <p className="text-caption">{error}</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-success-muted rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <p className="text-heading mb-1">All caught up!</p>
              <p className="text-caption">No pending registrations to review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {requests.map((req, index) => (
                <div key={req.id} className="card-elevated p-4 animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-warning-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{req.full_name}</p>
                      <p className="text-xs text-muted-foreground">{req.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{req.office_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Submitted: {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <button 
                      onClick={() => { setSelectedRequest(req); setShowDetail(true); }} 
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                    >
                      <Eye className="w-4 h-4" />View
                    </button>
                    <button 
                      onClick={() => handleApprove(req.id)} 
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-success text-success-foreground rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />Approve
                    </button>
                    <button 
                      onClick={() => { setRejectTarget(req.id); setShowRejectDialog(true); }} 
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Sheet */}
        {showDetail && selectedRequest && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center" onClick={() => setShowDetail(false)}>
            <div className="w-full max-w-lg bg-card rounded-t-3xl lg:rounded-2xl p-6 space-y-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-2 lg:hidden" />
              <h2 className="text-heading">Registration Details</h2>
              <div className="space-y-3">
                {[
                  { icon: User, label: "Full Name", value: selectedRequest.full_name },
                  { icon: Mail, label: "Email", value: selectedRequest.email },
                  { icon: Building2, label: "Office", value: selectedRequest.office_name },
                  { icon: Calendar, label: "Submitted", value: new Date(selectedRequest.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
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
                <button 
                  onClick={() => { handleApprove(selectedRequest.id); setShowDetail(false); }} 
                  className="flex-1 py-3 bg-success text-success-foreground rounded-xl font-medium"
                >
                  Approve
                </button>
                <button 
                  onClick={() => { setRejectTarget(selectedRequest.id); setShowRejectDialog(true); setShowDetail(false); }} 
                  className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium"
                >
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
              <AlertDialogDescription>Please provide a reason for rejecting this registration.</AlertDialogDescription>
            </AlertDialogHeader>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Enter rejection reason..." className="input-field min-h-[80px] resize-none" />
            <AlertDialogFooter className="flex-row gap-3">
              <AlertDialogCancel className="flex-1 mt-0">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReject} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">Reject</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPendingApprovalsScreen;
