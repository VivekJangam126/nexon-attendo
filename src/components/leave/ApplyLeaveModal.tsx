import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useLeaveBalance, useLeaveTypes } from '@/hooks/useLeave';

interface ApplyLeaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const LEAVE_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  'Sick Leave': { icon: '🏥', color: 'text-red-600' },
  'Annual Leave': { icon: '📅', color: 'text-blue-600' },
  'Paid Leave': { icon: '💵', color: 'text-green-600' },
  'Unpaid Leave': { icon: '📄', color: 'text-orange-600' },
};

export function ApplyLeaveModal({ open, onOpenChange, onSuccess }: ApplyLeaveModalProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { data: balances = [] } = useLeaveBalance();
  const { data: leaveTypes = [] } = useLeaveTypes();
  const queryClient = useQueryClient();

  const selectedLeaveType = leaveTypes.find(t => t.id === leaveTypeId);
  const leaveBalance = balances.find(b => b.leave_type_id === leaveTypeId);
  const remaining = leaveBalance?.remaining_leaves || 0;
  const used = leaveBalance?.used_leaves || 0;
  const total = leaveBalance?.total_leaves || 0;

  const getLeaveTypeInfo = (name: string) => {
    return LEAVE_TYPE_ICONS[name] || { icon: '📋', color: 'text-gray-600' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!startDate || !endDate || !leaveTypeId || !description) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user) {
      setError('You must be logged in');
      return;
    }

    const requestedDays = calculateDays();
    if (requestedDays > remaining) {
      setError(`Insufficient leave balance. You have ${remaining} days remaining.`);
      return;
    }

    setLoading(true);

    try {
      const { data, error: insertError } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: user.id,
          leave_type_id: leaveTypeId,
          start_date: startDate,
          end_date: endDate,
          reason: description,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Failed to submit leave request. Please try again.');
        setLoading(false);
        return;
      }

      console.log('Leave request submitted:', data);
      setSuccess('✓ Leave request submitted successfully!');
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['employeeLeaveRequests'] });
      await queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
      
      setTimeout(() => {
        setStartDate('');
        setEndDate('');
        setLeaveTypeId('');
        setDescription('');
        setSuccess('');
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('Error:', err);
      setError('Failed to submit leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const requestedDays = calculateDays();
  const typeInfo = selectedLeaveType ? getLeaveTypeInfo(selectedLeaveType.name) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-[500px] rounded-xl max-h-[90vh] overflow-y-auto p-5">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Apply for Leave</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Submit your leave request for admin approval
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Leave Type Selection */}
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
              Leave Type *
            </label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => {
                  const info = getLeaveTypeInfo(type.name);
                  return (
                    <SelectItem key={type.id} value={type.id}>
                      <span className="flex items-center gap-2">
                        <span>{info.icon}</span>
                        <span>{type.name}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Leave Balance Info */}
          {leaveTypeId && typeInfo && (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                    {selectedLeaveType?.name}
                  </p>
                  <p className="text-xs font-semibold text-foreground">{total} days available</p>
                </div>
                <div className={`text-2xl font-bold ${typeInfo.color}`}>
                  {remaining}
                </div>
              </div>
              
              <div className="border-t border-primary/10 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] text-muted-foreground font-medium mb-0.5">Used</p>
                    <p className="text-xs font-bold text-foreground">{used} days</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground font-medium mb-0.5">Remaining</p>
                    <p className={`text-xs font-bold ${remaining > 5 ? 'text-emerald-600' : remaining > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                      {remaining} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${typeInfo.color === 'text-red-600' ? 'from-red-500 to-red-600' : typeInfo.color === 'text-blue-600' ? 'from-blue-500 to-blue-600' : typeInfo.color === 'text-green-600' ? 'from-green-500 to-green-600' : 'from-orange-500 to-orange-600'} transition-all duration-500`}
                  style={{ width: `${total > 0 ? (used / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                Start Date *
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                End Date *
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Days Summary */}
          {requestedDays > 0 && (
            <div className={`p-2.5 rounded-lg flex items-center gap-2 ${requestedDays <= remaining ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <Calendar className={`w-3.5 h-3.5 flex-shrink-0 ${requestedDays <= remaining ? 'text-emerald-600' : 'text-red-600'}`} />
              <div className="text-[10px]">
                <p className={`font-medium ${requestedDays <= remaining ? 'text-emerald-700' : 'text-red-700'}`}>
                  {requestedDays} day{requestedDays > 1 ? 's' : ''} requested
                </p>
                {requestedDays > remaining && (
                  <p className="text-red-600">Exceeds available balance</p>
                )}
              </div>
            </div>
          )}

          {/* Description/Reason */}
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
              Description *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about your leave request..."
              rows={2}
              className="text-xs resize-none"
            />
            <p className="text-[9px] text-muted-foreground mt-1">
              Brief description of your leave request
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-emerald-700">{success}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
            <p className="text-[10px] text-blue-900">
              <span className="font-semibold">ℹ️ Note:</span> Your request will be sent to admin for approval.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !leaveTypeId}
              className="h-9 text-xs bg-primary hover:bg-primary/90 text-white"
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
