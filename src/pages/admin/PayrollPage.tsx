import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/DashboardLayout';
import PayrollOverview from './PayrollOverview';

const SalaryStructureManager = lazy(() => import('./SalaryStructureManager'));
const PayrollRunManager = lazy(() => import('./PayrollRunManager'));
const PayslipViewer = lazy(() => import('./PayslipViewer'));
const TaxManagementPanel = lazy(() => import('./TaxManagementPanel'));
const BankDisbursementPanel = lazy(() => import('./BankDisbursementPanel'));
const PayrollReports = lazy(() => import('./PayrollReports'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

const PayrollPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardLayout title="Payroll & Compensation" isAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll & Compensation</h1>
          <p className="text-gray-600 mt-2">Manage salary structures, process payroll, and generate payslips</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="structures">Structures</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
            <TabsTrigger value="tax">Tax</TabsTrigger>
            <TabsTrigger value="disbursement">Disbursement</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <PayrollOverview />
          </TabsContent>

          <TabsContent value="structures" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <SalaryStructureManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <PayrollRunManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="payslips" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <PayslipViewer />
            </Suspense>
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <TaxManagementPanel />
            </Suspense>
          </TabsContent>

          <TabsContent value="disbursement" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <BankDisbursementPanel />
            </Suspense>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <PayrollReports />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PayrollPage;
