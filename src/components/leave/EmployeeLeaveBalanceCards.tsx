import { useEmployeeLeaveBalanceCards } from '@/hooks/useLeave';
import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface EmployeeLeaveBalanceCardsProps {
  employeeId: string;
}

// Hardcoded leave type IDs from database
const LEAVE_TYPE_IDS = {
  SICK: '33333333-3333-3333-3333-333333333333',
  CASUAL: '44444444-4444-4444-4444-444444444444',
  MY_LEAVE: '55555555-5555-5555-5555-555555555555',
};

export function EmployeeLeaveBalanceCards({ employeeId }: EmployeeLeaveBalanceCardsProps) {
  const { data: balances = [], isLoading, refetch } = useEmployeeLeaveBalanceCards(employeeId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gender, setGender] = useState<string | null>(null);
  const [genderLoading, setGenderLoading] = useState(true);

  // Fetch employee gender
  useEffect(() => {
    const fetchGender = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', employeeId)
        .single();
      
      setGender(profile?.gender || null);
      setGenderLoading(false);
    };

    fetchGender();
  }, [employeeId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading || genderLoading) {
    return (
      <div className="space-y-2">
        <h2 className="text-overline">Leave Balance</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Find specific leave types by ID
  const sickLeave = balances.find((b: any) => b.leave_type_id === LEAVE_TYPE_IDS.SICK) || {
    total_leaves: 6,
    used_leaves: 0,
    remaining_leaves: 6,
  };
  
  const casualLeave = balances.find((b: any) => b.leave_type_id === LEAVE_TYPE_IDS.CASUAL) || {
    total_leaves: 12,
    used_leaves: 0,
    remaining_leaves: 12,
  };

  const myLeave = balances.find((b: any) => b.leave_type_id === LEAVE_TYPE_IDS.MY_LEAVE) || {
    total_leaves: 12,
    used_leaves: 0,
    remaining_leaves: 12,
  };

  const leaveCards = [
    { name: 'Sick Leave', ...sickLeave },
    { name: 'Casual Leave', ...casualLeave },
    { name: 'My Leave', ...myLeave },
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
      <div className={`grid ${leaveCards.length > 2 ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5`}>
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
