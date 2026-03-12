import { useEmployeeLeaveBalanceCards } from '@/hooks/useLeave';
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface EmployeeLeaveBalanceCardsProps {
  employeeId: string;
}

export function EmployeeLeaveBalanceCards({ employeeId }: EmployeeLeaveBalanceCardsProps) {
  const { data: balances = [], isLoading, refetch } = useEmployeeLeaveBalanceCards(employeeId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    console.log('[EmployeeLeaveBalanceCards] employeeId:', employeeId);
    console.log('[EmployeeLeaveBalanceCards] balances:', balances);
  }, [employeeId, balances]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-overline">Leave Balance</h2>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Filter to only show Sick, Paid, and Unpaid leave
  const filteredBalances = balances.filter((balance: any) => {
    const name = balance.leave_type?.name || '';
    return name.includes('Sick') || name.includes('Paid') || name.includes('Unpaid');
  });

  return (
    <div className="space-y-3 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-overline">Leave Balance</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
          title="Refresh leave balance"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {filteredBalances.map((balance: any) => {
          const leaveTypeName = balance.leave_type?.name || 'Leave';
          const total = balance.total_leaves || 0;
          const remaining = balance.remaining_leaves || 0;
          const used = balance.used_leaves || 0;

          // Determine color and status based on remaining leaves
          let color = 'text-primary';
          let statusText = 'Healthy balance';
          
          if (remaining === 0) {
            color = 'text-destructive';
            statusText = 'No leaves left';
          } else if (remaining <= 2) {
            color = 'text-warning';
            statusText = 'Running low';
          } else if (leaveTypeName.toLowerCase().includes('sick')) {
            color = 'text-red-600';
          } else if (leaveTypeName.toLowerCase().includes('paid')) {
            color = 'text-green-600';
          } else if (leaveTypeName.toLowerCase().includes('unpaid')) {
            color = 'text-gray-600';
          }

          return (
            <div key={balance.id} className="card-elevated p-3 text-center">
              <p className="text-xs text-muted-foreground font-medium mb-2">{leaveTypeName}</p>
              <p className={`text-lg font-semibold ${color} mb-1`}>{remaining}</p>
              <p className="text-xs text-muted-foreground mb-2">of {total}</p>
              <p className="text-xs font-medium text-muted-foreground">{statusText}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
