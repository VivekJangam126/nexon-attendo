import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BankDisbursementPanel = () => {
  const queryClient = useQueryClient();
  const [selectedPayrollRun, setSelectedPayrollRun] = useState('');
  const [showBankFileDialog, setShowBankFileDialog] = useState(false);

  const { data: payrollRuns } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: async () => {
      const response = await fetch('/api/payroll/payroll-runs');
      if (!response.ok) throw new Error('Failed to fetch payroll runs');
      return response.json();
    },
  });

  const { data: disbursements } = useQuery({
    queryKey: ['disbursements', selectedPayrollRun],
    queryFn: async () => {
      if (!selectedPayrollRun) return null;
      const response = await fetch(`/api/payroll/disbursements/${selectedPayrollRun}`);
      if (!response.ok) throw new Error('Failed to fetch disbursements');
      return response.json();
    },
    enabled: !!selectedPayrollRun,
  });

  const generateBankFileMutation = useMutation({
    mutationFn: async (format: string) => {
      const response = await fetch(`/api/payroll/disbursements/${selectedPayrollRun}/bank-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });
      if (!response.ok) throw new Error('Failed to generate bank file');
      return response.blob();
    },
    onSuccess: (blob, format) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `disbursement-${selectedPayrollRun}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      a.click();
      toast.success('Bank file generated');
      setShowBankFileDialog(false);
    },
    onError: () => toast.error('Failed to generate bank file'),
  });

  const updateDisbursementStatusMutation = useMutation({
    mutationFn: async ({ disbursementId, status }: { disbursementId: string; status: string }) => {
      const response = await fetch(`/api/payroll/disbursements/${disbursementId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disbursements', selectedPayrollRun] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const finalizeDisbursementsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/payroll/disbursements/${selectedPayrollRun}/finalize`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to finalize disbursements');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disbursements', selectedPayrollRun] });
      toast.success('Disbursements finalized');
    },
    onError: () => toast.error('Failed to finalize disbursements'),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bank Disbursement</h2>
      </div>

      {/* Payroll Run Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Payroll Run</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Select value={selectedPayrollRun} onValueChange={setSelectedPayrollRun}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a payroll run" />
                </SelectTrigger>
                <SelectContent>
                  {payrollRuns?.data?.map((run: any) => (
                    <SelectItem key={run.id} value={run.id}>
                      {new Date(2024, run.month - 1).toLocaleString('default', { month: 'long' })} {run.year} - {run.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPayrollRun && (
              <Dialog open={showBankFileDialog} onOpenChange={setShowBankFileDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Download className="w-4 h-4" />
                    Bank File
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Bank File</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Button
                      onClick={() => generateBankFileMutation.mutate('csv')}
                      disabled={generateBankFileMutation.isPending}
                      className="w-full"
                    >
                      Download CSV
                    </Button>
                    <Button
                      onClick={() => generateBankFileMutation.mutate('xlsx')}
                      disabled={generateBankFileMutation.isPending}
                      className="w-full"
                    >
                      Download Excel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Disbursements Table */}
      {selectedPayrollRun && disbursements?.data && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Disbursement Details</CardTitle>
                <Button
                  onClick={() => finalizeDisbursementsMutation.mutate()}
                  disabled={finalizeDisbursementsMutation.isPending}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Finalize All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Employee</th>
                      <th className="px-4 py-2 text-left font-medium">Bank Account</th>
                      <th className="px-4 py-2 text-right font-medium">Amount</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                      <th className="px-4 py-2 text-left font-medium">Reference</th>
                      <th className="px-4 py-2 text-left font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disbursements.data.map((disburse: any) => (
                      <tr key={disburse.id} className="border-t">
                        <td className="px-4 py-2">{disburse.profiles?.full_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {disburse.bank_account?.account_number?.slice(-4) || 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-right font-medium">₹{disburse.amount.toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(disburse.status)}`}>
                            {getStatusIcon(disburse.status)}
                            {disburse.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">{disburse.transaction_reference || '-'}</td>
                        <td className="px-4 py-2">
                          {disburse.status === 'pending' && (
                            <Select
                              value={disburse.status}
                              onValueChange={(status) =>
                                updateDisbursementStatusMutation.mutate({
                                  disbursementId: disburse.id,
                                  status,
                                })
                              }
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processed">Processed</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ₹{disbursements.data.reduce((sum: number, d: any) => sum + d.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Processed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {disbursements.data.filter((d: any) => d.status === 'processed').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {disbursements.data.filter((d: any) => d.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BankDisbursementPanel;
