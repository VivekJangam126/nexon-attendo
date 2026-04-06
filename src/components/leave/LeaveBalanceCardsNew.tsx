import { AlertCircle, TrendingDown, FileText } from 'lucide-react';
import { useEffect, useState, memo } from 'react';
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
  { id: 'sick', name: 'Sick Leave', color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-gray-900', max: 6 },
  { id: 'casual', name: 'Casual Leave', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-gray-900', max: 19 },
  { id: 'my', name: 'My Leave', color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-50', textColor: 'text-gray-900', max: 12, genderRestricted: 'female' },
];

export function LeaveBalanceCards({ balances, isLoading }: LeaveBalanceCardsProps) {
  const { profile } = useAuth();
  const [leaveTypeMap, setLeaveTypeMap] = useState<Record<string, string>>({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      // Disabled sessionStorage cache to ensure fresh data
      // const cached = sessionStorage.getItem('leaveTypeMap');
      // if (cached) {
      //   setLeaveTypeMap(JSON.parse(cached));
      //   setIsInitialLoad(false);
      //   return;
      // }

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
        // Cache for session
        sessionStorage.setItem('leaveTypeMap', JSON.stringify(map));
      }
      setIsInitialLoad(false);
    };

    fetchLeaveTypes();
  }, []);

  // Show skeleton only on initial load
  if (isLoading && isInitialLoad) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {LEAVE_TYPES.map((type, index) => {
        // Skip if gender-restricted and user doesn't have the required gender
        if (type.genderRestricted && profile?.gender !== type.genderRestricted) {
          return null;
        }

        const typeId = leaveTypeMap[type.id];
        const balance = balances.find(b => b.leave_type_id === typeId);
        const total = balance?.total_leaves || type.max;
        const used = balance?.used_leaves || 0;
        const remaining = balance?.remaining_leaves || total;
        const percentage = Math.round((remaining / total) * 100);

        return (
          <div
            key={type.id}
            className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all duration-300 group animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Header with Icon and Title */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{type.name}</h3>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-gray-600 mb-1">Remaining</p>
                <p className={`text-2xl font-bold ${type.textColor}`}>{remaining}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    percentage >= 50 ? 'bg-green-500' : percentage >= 25 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
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

// Memoize to prevent unnecessary re-renders
export default memo(LeaveBalanceCards);
