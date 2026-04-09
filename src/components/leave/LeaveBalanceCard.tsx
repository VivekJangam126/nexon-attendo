import { EmployeeLeaveBalance } from '@server/types/leave';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface LeaveBalanceCardProps {
  balance: EmployeeLeaveBalance;
  leaveTypeName: string;
}

export function LeaveBalanceCard({ balance, leaveTypeName }: LeaveBalanceCardProps) {
  const percentage = (balance.used_leaves / balance.total_leaves) * 100;
  
  const getStatusColor = () => {
    if (percentage >= 80) return { bg: 'bg-destructive-muted', text: 'text-destructive', bar: 'bg-destructive' };
    if (percentage >= 50) return { bg: 'bg-warning-muted', text: 'text-warning', bar: 'bg-warning' };
    return { bg: 'bg-success-muted', text: 'text-success', bar: 'bg-success' };
  };

  const colors = getStatusColor();

  return (
    <div className="card-elevated p-4 rounded-xl animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1">{leaveTypeName}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{balance.remaining_leaves}</span>
            <span className="text-xs text-muted-foreground">of {balance.total_leaves} available</span>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${colors.bg} ${colors.text}`}>
          {Math.round(percentage)}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${colors.bar}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 p-2.5 bg-muted/50 rounded-lg mb-3">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Total</p>
          <p className="text-sm font-bold text-foreground">{balance.total_leaves}</p>
        </div>
        <div className="text-center border-l border-r border-border">
          <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Used</p>
          <div className="flex items-center justify-center gap-1">
            <TrendingDown className="w-3 h-3 text-warning" />
            <p className="text-sm font-bold text-warning">{balance.used_leaves}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Remaining</p>
          <div className="flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3 text-success" />
            <p className="text-sm font-bold text-success">{balance.remaining_leaves}</p>
          </div>
        </div>
      </div>

      {/* Policy Info */}
      <div className="pt-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground font-medium mb-1.5">Policy Details</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Annual Allocation</span>
            <span className="font-semibold text-foreground">{balance.total_leaves} days</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Year</span>
            <span className="font-semibold text-foreground">{balance.year}</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Utilization Rate</span>
            <span className={`font-semibold ${colors.text}`}>{Math.round(percentage)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
