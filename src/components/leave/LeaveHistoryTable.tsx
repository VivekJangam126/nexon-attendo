import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const { data: leaveTypes, error } = await supabase
          .from('leave_types')
          .select('id, name');

        if (error) {
          console.error('Error fetching leave types:', error);
          setDebugInfo(`Error fetching leave types: ${error.message}`);
          return;
        }

        if (leaveTypes) {
          const map: Record<string, string> = {};
          leaveTypes.forEach(type => {
            map[type.id] = type.name;
          });
          setLeaveTypeMap(map);
        }
      } catch (err) {
        console.error('Exception fetching leave types:', err);
      }
    };

    fetchLeaveTypes();
  }, []);

  // Debug: Log requests and user info
  useEffect(() => {
    console.log('=== LeaveHistoryTable Debug ===');
    console.log('User ID:', user?.id);
    console.log('Requests count:', requests.length);
    console.log('Requests data:', requests);
    console.log('Is loading:', isLoading);
    console.log('Leave type map:', leaveTypeMap);
  }, [requests, user, isLoading, leaveTypeMap]);

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

  if (isLoading) {
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
          <Calendar className="w-8 h-8 text-gray-400" />
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
      {/* Desktop View - Card Layout */}
      <div className="hidden md:block space-y-3 sm:space-y-4">
        {requests.map((request, index) => {
          const config = getStatusConfig(request.status);
          const StatusIcon = config.icon;
          const days = calculateDays(request.start_date, request.end_date);
          const leaveTypeName = getLeaveTypeName(request.leave_type_id);

          return (
            <div
              key={request.id}
              className={`rounded-lg border ${config.border} ${config.bg} p-3 sm:p-4 lg:p-6 hover:shadow-md transition-all duration-300`}
            >
              <div className="flex items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                {/* Left Section - Details */}
                <div className="flex-1">
                  <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${config.badge} flex items-center justify-center flex-shrink-0 font-bold text-xs sm:text-sm`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{request.reason || 'Leave Request'}</h3>
                      <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </p>
                    </div>
                  </div>

                  {/* Leave Type and Duration */}
                  <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3 flex-wrap">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-600">
                        {leaveTypeName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 bg-white rounded-full border border-gray-200">
                      <span className="text-xs font-bold text-gray-900">{days}</span>
                      <span className="text-xs text-gray-600">days</span>
                    </div>
                  </div>

                  {/* Admin Comment */}
                  {request.admin_comment && (
                    <div className="p-2 sm:p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-0.5 sm:mb-1">Manager's Note</p>
                      <p className="text-xs sm:text-sm text-gray-700">{request.admin_comment}</p>
                    </div>
                  )}
                </div>

                {/* Right Section - Status Badge */}
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${config.badge}`}>
                    <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{config.label}</span>
                    <span className="sm:hidden">{config.label.substring(0, 3)}</span>
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-600 pt-2 sm:pt-3 border-t border-gray-200">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>
                  Submitted on {new Date(request.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          );
        })}
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
                <div className="px-2 py-1.5 bg-blue-50 border border-blue-200 rounded-lg mt-1">
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
