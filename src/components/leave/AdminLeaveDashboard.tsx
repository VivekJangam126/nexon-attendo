import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/components/AdminLayout';
import {
  useLeaveAnalytics,
  useAllLeaveRequests,
  useEmployeesOnLeaveToday,
} from '@/hooks/useLeave';
import { LeaveAnalyticsCards } from './LeaveAnalyticsCards';
import { AdminLeaveRequestsTable } from './AdminLeaveRequestsTable';
import { WhosOutToday } from './WhosOutToday';
import { Calendar, Users } from 'lucide-react';

export function AdminLeaveDashboard({ isEmbedded = false }: { isEmbedded?: boolean } = {}) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: analytics = {} as any } = useLeaveAnalytics();
  const { data: requests = [], isLoading: requestsLoading } = useAllLeaveRequests({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const { data: employeesOnLeave = [] } = useEmployeesOnLeaveToday();

  const pendingRequests = requests.filter(r => r.status === 'pending');

  const mainContent = (
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 md:px-8 pt-4 md:pt-6 pb-4 border-b border-border bg-gradient-to-r from-background to-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Manage</p>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-1">Leave Requests</h1>
            </div>
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 md:px-8 py-6 space-y-6 overflow-y-auto">
          {/* Analytics Cards */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-4">Overview</h2>
            <LeaveAnalyticsCards analytics={analytics} />
          </div>

          {/* Main Content */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                All Requests
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full mr-1.5">
                  {pendingRequests.length}
                </span>
                <span className="hidden sm:inline">Pending</span>
                <span className="sm:hidden">P</span>
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-xs sm:text-sm">
                Approved
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs sm:text-sm">
                Rejected
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Requests Table */}
                <div className="lg:col-span-2">
                  <div className="card-elevated rounded-xl p-6 border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground">All Leave Requests</h3>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 h-9 text-xs">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="overflow-hidden">
                      <AdminLeaveRequestsTable
                        requests={requests}
                        isLoading={requestsLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* On Leave Today */}
                  <div className="card-elevated rounded-xl p-6 border border-border/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">On Leave Today</h3>
                    </div>
                    <WhosOutToday employees={employeesOnLeave} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 mt-0">
              <div className="card-elevated rounded-xl p-6 border border-border/50">
                <h3 className="text-sm font-semibold text-foreground mb-4">Pending Approvals</h3>
                <AdminLeaveRequestsTable
                  requests={pendingRequests}
                  isLoading={requestsLoading}
                />
              </div>
            </TabsContent>

            <TabsContent value="approved" className="space-y-4 mt-0">
              <div className="card-elevated rounded-xl p-6 border border-border/50">
                <h3 className="text-sm font-semibold text-foreground mb-4">Approved Leaves</h3>
                <AdminLeaveRequestsTable
                  requests={requests.filter(r => r.status === 'approved')}
                  isLoading={requestsLoading}
                />
              </div>
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4 mt-0">
              <div className="card-elevated rounded-xl p-6 border border-border/50">
                <h3 className="text-sm font-semibold text-foreground mb-4">Rejected Leaves</h3>
                <AdminLeaveRequestsTable
                  requests={requests.filter(r => r.status === 'rejected')}
                  isLoading={requestsLoading}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );

  if (isEmbedded) {
    return mainContent;
  }

  return (
    <AdminLayout>
      {mainContent}
    </AdminLayout>
  );
}
