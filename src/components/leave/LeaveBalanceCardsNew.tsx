import { AlertCircle, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface LeaveBalance {
  id: string;
  leave_type_id: string;
  total_leaves: number;
  used_leaves: number;
  remaining_leaves: number;
}

interface LeaveBalanceCardsProps {
  balances: LeaveBalance[];
  isLoading?: boolean;
}

const LEAVE_TYPES = [
  { id: 'sick', name: 'Sick Leave', icon: '🏥', color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-700', max: 5 },
  { id: 'paid', name: 'Paid Leave', icon: '💵', color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-700', max: 10 },
  { id: 'unpaid', name: 'Unpaid Leave', icon: '📄', color: 'from-gray-500 to-gray-600', bgColor: 'bg-gray-50', textColor: 'text-gray-700', max: 10 },
];

export function LeaveBalanceCards({ balances, isLoading }: LeaveBalanceCardsProps) {
  const { user } = useAuth();
  const [leaveTypeMap, setLeaveTypeMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      const { data: leaveTypes } = await supabase
        .from('leave_types')
        .select('id, name');

      if (leaveTypes) {
        const map: Record<string, string> = {};
        leaveTypes.forEach(type => {
          const key = type.name.toLowerCase().replace(' leave', '');
          map[key] = type.id;
        });
        setLeaveTypeMap(map);
      }
    };

    fetchLeaveTypes();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {LEAVE_TYPES.map((type) => {
        const typeId = leaveTypeMap[type.id];
        const balance = balances.find(b => b.leave_type_id === typeId);
        const total = balance?.total_leaves || type.max;
        const used = balance?.used_leaves || 0;
        const remaining = balance?.remaining_leaves || total;
        const percentage = Math.round((remaining / total) * 100);

        return (
          <div
            key={type.id}
            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            {/* Header with Icon and Title */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-3xl mb-2">{type.icon}</p>
                <h3 className="text-sm font-semibold text-gray-900">{type.name}</h3>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Used</span>
                <span className="text-xs font-semibold text-gray-900">{used} / {total}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${type.color} transition-all duration-500`}
                  style={{ width: `${(used / total) * 100}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Remaining</p>
                <p className={`text-lg font-bold ${type.textColor}`}>{remaining}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Usage</p>
                <p className="text-lg font-bold text-gray-900">{percentage}%</p>
              </div>
            </div>

            {/* Status Indicator */}
            {remaining <= 2 && remaining > 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs font-medium text-amber-700">Running low</span>
              </div>
            )}
            {remaining === 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-xs font-medium text-red-700">No leaves left</span>
              </div>
            )}
            {remaining > 2 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <TrendingDown className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-xs font-medium text-green-700">Healthy balance</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
