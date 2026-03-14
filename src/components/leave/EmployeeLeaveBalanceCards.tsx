import { useEmployeeLeaveBalanceCards } from '@/hooks/useLeave';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface EmployeeLeaveBalanceCardsProps {
  employeeId: string;
}

// Hardcoded leave type IDs from database
const LEAVE_TYPE_IDS = {
  PAID: '11111111-1111-1111-1111-111111111111',
  UNPAID: '22222222-2222-2222-2222-222222222222',
  SICK: '33333333-3333-3333-3333-333333333333',
};

export function EmployeeLeaveBalanceCards({ employeeId }: EmployeeLeaveBalanceCardsProps) {
  const { data: balances = [], isLoading, refetch } = useEmployeeLeaveBalanceCards(employeeId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h2 className="text-overline">Leave Balance</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Find specific leave types by ID
  const paidLeave = balances.find((b: any) => b.leave_type_id === LEAVE_TYPE_IDS.PAID) || {
    total_leaves: 10,
    used_leaves: 0,
    remaining_leaves: 10,
  };
  
  const unpaidLeave = balances.find((b: any) => b.leave_type_id === LEAVE_TYPE_IDS.UNPAID) || {
    total_leaves: 10,
    used_leaves: 0,
    remaining_leaves: 10,
  };
  
  const sickLeave = balances.find((b: any) => b.leave_type_id === LEAVE_TYPE_IDS.SICK) || {
    total_leaves: 5,
    used_leaves: 0,
    remaining_leaves: 5,
  };

  const leaveCards = [
    { name: 'Paid Leave', ...paidLeave },
    { name: 'Unpaid Leave', ...unpaidLeave },
    { name: 'Sick Leave', ...sickLeave },
  ];

  return (
    <div className="space-y-2 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-overline">Leave Balance</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
          title="Refresh leave balance"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {leaveCards.map((leave, index) => {
          const total = leave.total_leaves || 0;
          const remaining = leave.remaining_leaves || 0;

          // Determine color and status based on remaining leaves
          let color = 'text-foreground';
          let statusText = 'Available';
          
          if (remaining === 0) {
            color = 'text-destructive';
            statusText = 'None left';
          } else if (remaining <= 2) {
            color = 'text-warning';
            statusText = 'Low';
          }

          return (
            <div key={index} className="card-elevated p-2.5 text-center">
              <p className="text-xs text-muted-foreground font-medium mb-1 truncate">{leave.name}</p>
              <p className={`text-lg font-semibold ${color} mb-0.5`}>{remaining}</p>
              <p className="text-xs text-muted-foreground mb-1">of {total}</p>
              <p className="text-[10px] font-medium text-muted-foreground">{statusText}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
