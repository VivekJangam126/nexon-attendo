import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useApproveLeave, useRejectLeave } from '@/hooks/useLeave';
import { Calendar, CheckCircle, XCircle, Clock, Paperclip, ExternalLink, FileText } from 'lucide-react';

interface AdminLeaveRequestsTableProps {
  requests: any[];
  isLoading?: boolean;
}

export function AdminLeaveRequestsTable({
  requests,
  isLoading,
}: AdminLeaveRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      await approveMutation.mutateAsync({
        leaveRequestId: selectedRequest.id,
        adminComment: comment,
      });
      setSelectedRequest(null);
      setActionType(null);
      setComment('');
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      await rejectMutation.mutateAsync({
        leaveRequestId: selectedRequest.id,
        adminComment: comment,
      });
      setSelectedRequest(null);
      setActionType(null);
      setComment('');
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading leave requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-primary/40" />
        </div>
        <p className="text-sm font-semibold text-foreground">No leave requests</p>
        <p className="text-xs text-muted-foreground mt-1">All leave requests will appear here</p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-primary/5 to-primary/2 hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/2 border-b border-border/50">
                <TableHead className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Employee</TableHead>
                <TableHead className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Reason</TableHead>
                <TableHead className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Duration</TableHead>
                <TableHead className="text-xs font-bold text-foreground/70 uppercase tracking-wider text-center">Days</TableHead>
                <TableHead className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-bold text-foreground/70 uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} className="hover:bg-primary/3 transition-colors border-b border-border/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 ring-2 ring-primary/10">
                        <AvatarImage src={request.employee?.avatar_url} />
                        <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
                          {request.employee?.full_name
                            ?.split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {request.employee?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {request.employee?.email || 'No email'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm max-w-xs">
                    <div className="space-y-1">
                      <div className="truncate text-foreground/80" title={request.reason}>
                        {request.reason || 'No reason provided'}
                      </div>
                      {request.attachment_url && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Paperclip className="w-3 h-3" />
                          <span className="text-xs">Has attachment</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">
                        {new Date(request.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        to {new Date(request.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {request.days || calculateDays(request.start_date, request.end_date)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Badge className={`text-xs font-semibold gap-1.5 border ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                      {request.is_backdated && (
                        <Badge className="text-xs font-semibold gap-1.5 border bg-amber-50 text-amber-700 border-amber-200 w-fit">
                          ⏳ Backdated
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-medium border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('approve');
                          }}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-medium border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionType('reject');
                          }}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {actionType === 'approve' ? '✓ Approve' : '✕ Reject'} Leave Request
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selectedRequest?.employee?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Backdated Warning */}
            {selectedRequest?.is_backdated && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
                <div className="text-amber-600 text-lg">⏳</div>
                <div className="text-xs text-amber-700">
                  <p className="font-semibold">Backdated Leave Request</p>
                  <p className="text-amber-600 text-[11px] mt-0.5">This leave was applied for a past date and requires verification.</p>
                </div>
              </div>
            )}
            <div className="bg-gradient-to-br from-primary/5 to-primary/2 p-4 rounded-lg border border-primary/10 space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Reason</p>
                <p className="text-sm font-medium text-foreground">{selectedRequest?.reason || 'No reason provided'}</p>
              </div>
              <div className="border-t border-primary/10 pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Leave Period</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(selectedRequest?.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} to{' '}
                  {new Date(selectedRequest?.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="border-t border-primary/10 pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Total Days</p>
                <p className="text-sm font-bold text-primary">
                  {selectedRequest?.days || calculateDays(selectedRequest?.start_date, selectedRequest?.end_date)} days
                </p>
              </div>
              
              {/* Attachment Section */}
              {selectedRequest?.attachment_url && (
                <div className="border-t border-primary/10 pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Attachment</p>
                  <div className="bg-white rounded-lg border border-primary/20 p-3">
                    <div className="space-y-2">
                      <img 
                        src={selectedRequest.attachment_url} 
                        alt="Leave attachment" 
                        className="w-full h-48 object-contain rounded border border-gray-200 bg-gray-50"
                      />
                      <a
                        href={selectedRequest.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View full size
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wide block mb-2">
                {actionType === 'approve' ? 'Approval' : 'Rejection'} Comment
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={actionType === 'approve' ? 'Add approval comment (optional)' : 'Reason for rejection (required)'}
                rows={3}
                className="text-sm resize-none border-primary/20 focus:border-primary/50"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(null)}
                className="h-10 text-sm font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={actionType === 'approve' ? handleApprove : handleReject}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className={`h-10 text-sm font-medium gap-2 ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {approveMutation.isPending || rejectMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : actionType === 'approve' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Reject
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
