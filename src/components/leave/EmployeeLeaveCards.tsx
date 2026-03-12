import { useEmployeeLeaveBalance } from '@/hooks/useLeave';
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { LeaveRequest } from '@/server/types/leave';

interface EmployeeLeaveCardsProps {
  employeeId: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { label: string; icon: any; className: string }> = {
    pending: { label: 'Pending', icon: Clock, className: 'bg-warning-muted text-warning' },
    approved: { label: 'Approved', icon: CheckCircle2, className: 'bg-success-muted text-success' },
    rejected: { label: 'Rejected', icon: XCircle, className: 'bg-destructive-muted text-destructive' },
  };
  
  const config = configs[status] || configs.pending;
  const Icon = config.icon;
  
  return (
    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

export function EmployeeLeaveCards({ employeeId }: EmployeeLeaveCardsProps) {
  const { data: leaveRequests = [], isLoading } = useEmployeeLeaveBalance(employeeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter((r: LeaveRequest) => r.status === 'pending').length,
    approved: leaveRequests.filter((r: LeaveRequest) => r.status === 'approved').length,
    rejected: leaveRequests.filter((r: LeaveRequest) => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <h2 className="text-overline">Leave Requests</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { value: stats.total, label: 'Total', color: 'text-primary' },
          { value: stats.pending, label: 'Pending', color: 'text-warning' },
          { value: stats.approved, label: 'Approved', color: 'text-success' },
          { value: stats.rejected, label: 'Rejected', color: 'text-destructive' },
        ].map((s, i) => (
          <div key={i} className="card-elevated p-3 text-center">
            <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Leave Requests List */}
      <div className="card-elevated divide-y divide-border">
        {leaveRequests.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No leave requests found
          </div>
        ) : (
          leaveRequests.slice(0, 5).map((request: LeaveRequest) => (
            <div key={request.id} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {new Date(request.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(request.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-muted-foreground">{request.reason || 'No reason provided'}</p>
              </div>
              <StatusBadge status={request.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
