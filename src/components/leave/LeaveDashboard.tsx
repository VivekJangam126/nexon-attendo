import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEmployeeLeaveRequests, useLeaveBalance } from '@/hooks/useLeave';
import { LeaveHistoryTable } from './LeaveHistoryTable';
import { LeaveBalanceCards } from './LeaveBalanceCardsNew';
import { ApplyLeaveModal } from './ApplyLeaveModal';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export function LeaveDashboard() {
  const { profile, user } = useAuth();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const { data: requests = [], isLoading: requestsLoading, error: requestsError } = useEmployeeLeaveRequests();
  const { data: balances = [], isLoading: balancesLoading } = useLeaveBalance();

  // Debug logging
  useEffect(() => {
    console.log('=== LeaveDashboard Debug ===');
    console.log('User:', user?.id);
    console.log('Profile:', profile);
    console.log('Leave requests:', requests);
    console.log('Requests loading:', requestsLoading);
    console.log('Requests error:', requestsError);
    console.log('Requests length:', requests.length);
  }, [requests, requestsLoading, requestsError, user, profile]);

  // Calculate statistics
  const totalLeaves = balances.reduce((sum, b) => sum + b.total_leaves, 0);
  const usedLeaves = balances.reduce((sum, b) => sum + b.used_leaves, 0);
  const remainingLeaves = balances.reduce((sum, b) => sum + b.remaining_leaves, 0);
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;

  const handleApplySuccess = () => {
    // Refetch requests after successful submission
    window.location.reload();
  };

  return (
    <DashboardLayout title="Leave Management">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Hero Section with Quick Stats */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-4 sm:p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1">Leave Management</h2>
              <p className="text-xs sm:text-base text-amber-700">Track and manage your leave balance</p>
            </div>
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-amber-600 text-white rounded-lg font-semibold text-sm sm:text-base hover:bg-amber-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-amber-200">
              <p className="text-xs font-medium text-gray-600 mb-1">Total Leaves</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalLeaves}</p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-amber-200">
              <p className="text-xs font-medium text-gray-600 mb-1">Used</p>
              <p className="text-lg sm:text-2xl font-bold text-amber-600">{usedLeaves}</p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-amber-200">
              <p className="text-xs font-medium text-gray-600 mb-1">Remaining</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{remainingLeaves}</p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-amber-200">
              <p className="text-xs font-medium text-gray-600 mb-1">Pending</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{pendingRequests}</p>
            </div>
          </div>
        </div>

        {/* Leave Balance Section */}
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 sm:w-6 h-4 sm:h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Your Leave Balance</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Overview of all leave types and remaining balance</p>
            </div>
          </div>
          <LeaveBalanceCards balances={balances} isLoading={balancesLoading} />
        </div>

        {/* Leave Requests Section */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-4 sm:p-6 lg:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 sm:w-10 h-8 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 sm:w-6 h-4 sm:h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Leave Requests</h2>
                <p className="text-xs sm:text-sm text-amber-700 mt-0.5">History of all your leave applications</p>
              </div>
            </div>
            {approvedRequests > 0 && (
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs font-medium text-green-700">
                  {approvedRequests} approved
                </p>
              </div>
            )}
          </div>
          <LeaveHistoryTable requests={requests} isLoading={requestsLoading} />
        </div>

        {/* Information Banner */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 sm:p-6">
          <div className="flex gap-3 sm:gap-4">
            <AlertCircle className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">Leave Policy Reminder</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Submit leave requests at least 5 days in advance for approval</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Leaves are subject to manager approval and company policies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Unused leaves may be carried forward as per company policy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Contact HR for any leave-related queries or exceptions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <ApplyLeaveModal open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen} onSuccess={handleApplySuccess} />
    </DashboardLayout>
  );
}
