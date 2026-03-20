import { FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useEffect, useState, memo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface LeaveHistoryTableProps {
  requests: any[];
  isLoading?: boolean;
}

export function LeaveHistoryTable({ requests, isLoading }: LeaveHistoryTableProps) {
  const [leaveTypeMap, setLeaveTypeMap] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        // Check cache first
        const cached = sessionStorage.getItem('leaveTypeMapById');
        if (cached) {
          setLeaveTypeMap(JSON.parse(cached));
          setIsInitialLoad(false);
          return;
        }

        const { data: leaveTypes, error } = await supabase
          .from('leave_types')
          .select('id, name');

        if (error) {
          console.error('Error fetching leave types:', error);
          setDebugInfo(`Error fetching leave types: ${error.message}`);
          setIsInitialLoad(false);
          return;
        }

        if (leaveTypes) {
          const map: Record<string, string> = {};
          leaveTypes.forEach(type => {
            map[type.id] = type.name;
          });
          setLeaveTypeMap(map);
          // Cache for session
          sessionStorage.setItem('leaveTypeMapById', JSON.stringify(map));
        }
        setIsInitialLoad(false);
      } catch (err) {
        console.error('Exception fetching leave types:', err);
        setIsInitialLoad(false);
      }
    };

    fetchLeaveTypes();
  }, []);

  // Debug: Log requests and user info
  useEffect(() => {
    if (requests.length === 0 && !isLoading) {
      console.log('[LeaveHistoryTable] No requests found for user:', user?.id);
    }
  }, [requests, user, isLoading]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          badge: 'bg-green-100 text-green-700',
          icon: CheckCircle,
          label: 'Approved',
          color: 'text-green-600'
        };
      case 'rejected':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          badge: 'bg-red-100 text-red-700',
          icon: XCircle,
          label: 'Rejected',
          color: 'text-red-600'
        };
      case 'pending':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          badge: 'bg-amber-100 text-amber-700',
          icon: Clock,
          label: 'Pending',
          color: 'text-amber-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          badge: 'bg-gray-100 text-gray-700',
          icon: AlertCircle,
          label: 'Unknown',
          color: 'text-gray-600'
        };
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getLeaveTypeName = (leaveTypeId: string) => {
    return leaveTypeMap[leaveTypeId] || 'Leave';
  };

  if (isLoading && isInitialLoad) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-3" />
        <p className="text-xs sm:text-sm text-gray-600">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-base sm:text-lg font-semibold text-gray-900 mb-1">No Leave Requests Yet</p>
        <p className="text-xs sm:text-sm text-gray-600">Click "Apply for Leave" to submit your first request</p>
        {debugInfo && (
          <p className="text-xs text-red-600 mt-4 text-center">{debugInfo}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Desktop View - Table Layout */}
      <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 w-12">#</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Leave Type</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">From - To</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 w-16">Days</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Reason</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request, index) => {
              const config = getStatusConfig(request.status);
              const StatusIcon = config.icon;
              const days = calculateDays(request.start_date, request.end_date);
              const leaveTypeName = getLeaveTypeName(request.leave_type_id);

              return [
                <tr key={request.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${config.badge} text-xs font-bold`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900 font-medium">{leaveTypeName}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(request.start_date)} - {formatDate(request.end_date)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-xs font-bold text-amber-700">
                      {days}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700 truncate max-w-xs">{request.reason || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.badge}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{config.label}</span>
                    </span>
                  </td>
                </tr>,
                
                // Manager's Note - Below this leave request
                request.admin_comment && (
                  <tr key={`comment-${request.id}`} className="border-b border-gray-200">
                    <td colSpan={6} className="py-2 px-4">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="font-semibold text-blue-700 mb-1">📝 Manager's Note:</p>
                        <p className="text-blue-800 text-xs">{request.admin_comment}</p>
                      </div>
                    </td>
                  </tr>
                )
              ].filter(Boolean);
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View - Compact Card Layout */}
      <div className="md:hidden space-y-2">
        {requests.map((request, index) => {
          const config = getStatusConfig(request.status);
          const StatusIcon = config.icon;
          const days = calculateDays(request.start_date, request.end_date);
          const leaveTypeName = getLeaveTypeName(request.leave_type_id);

          return (
            <div key={request.id}>
              <div className="bg-white rounded-lg border border-gray-200 p-2 hover:bg-gray-50 transition-colors">
                <div className="space-y-1.5">
                  {/* Row 1: Index and Leave Type */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 rounded text-xs font-bold text-amber-700">
                      {index + 1}
                    </span>
                    <p className="text-xs font-semibold text-gray-900 flex-1 truncate">{leaveTypeName}</p>
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${config.badge}`}>
                      <StatusIcon className="w-2 h-2" />
                      <span className="hidden">{config.label}</span>
                    </span>
                  </div>

                  {/* Row 2: Date Range and Days */}
                  <div className="flex items-center justify-between gap-1.5 text-xs">
                    <p className="text-gray-600">
                      {formatDateShort(request.start_date)} - {formatDateShort(request.end_date)}
                    </p>
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-amber-50 border border-amber-200 rounded text-xs font-semibold text-amber-700">
                      {days}d
                    </span>
                  </div>

                  {/* Row 3: Reason and Submitted */}
                  <div className="flex items-center justify-between gap-1.5 text-xs">
                    <p className="text-gray-600 truncate flex-1">{request.reason || '-'}</p>
                    <p className="text-gray-500 whitespace-nowrap text-xs">
                      {new Date(request.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Comment - Full Width Below */}
              {request.admin_comment && (
                <div key={`mobile-comment-${request.id}`} className="px-2 py-1.5 bg-blue-50 border border-blue-200 rounded-lg mt-1">
                  <p className="text-xs font-medium text-blue-700 mb-0.5">Manager's Note</p>
                  <p className="text-xs text-blue-800">{request.admin_comment}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(LeaveHistoryTable);
