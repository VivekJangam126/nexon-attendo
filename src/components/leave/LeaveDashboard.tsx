import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEmployeeLeaveRequests, useLeaveBalance } from '@/hooks/useLeave';
import LeaveHistoryTable from './LeaveHistoryTable';
import LeaveBalanceCards from './LeaveBalanceCardsNew';
import { ApplyLeaveModal } from './ApplyLeaveModal';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export function LeaveDashboard() {
  const { profile, user } = useAuth();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  
  // Fetch both in parallel for better performance
  const { data: requests = [], isLoading: requestsLoading, error: requestsError } = useEmployeeLeaveRequests();
  const { data: balances = [], isLoading: balancesLoading } = useLeaveBalance();

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
      <div className="space-y-4 sm:space-y-5">
        {/* Hero Section with Quick Stats */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-5 sm:p-6 shadow-sm animate-fade-in-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Leave Management</h2>
              <p className="text-sm text-amber-700">Track and manage your leave balance</p>
            </div>
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Leave</span>
            </button>
          </div>
        </div>

        {/* Leave Balance Section */}
        <div className="animate-fade-in-up delay-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Leave Balance</h2>
              <p className="text-sm text-gray-600">Overview of all leave types</p>
            </div>
          </div>
          <LeaveBalanceCards balances={balances} isLoading={balancesLoading} />
        </div>

        {/* Leave Requests Section */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-5 sm:p-6 shadow-sm animate-fade-in-up delay-200">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Leave Requests</h2>
                <p className="text-sm text-amber-700">Your leave applications</p>
              </div>
            </div>
            {approvedRequests > 0 && (
              <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-700">
                  {approvedRequests} approved
                </p>
              </div>
            )}
          </div>
          <LeaveHistoryTable requests={requests} isLoading={requestsLoading} />
        </div>

        {/* Information Banner */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 sm:p-5 animate-fade-in-up delay-300">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Leave Policy</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Submit requests 5+ days in advance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Subject to manager approval</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Contact HR for exceptions</span>
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
