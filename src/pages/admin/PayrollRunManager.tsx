import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, Play, CheckCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const PayrollRunManager = () => {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: payrollRuns, isLoading } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: async () => {
      const response = await fetch('/api/payroll/payroll-runs');
      if (!response.ok) throw new Error('Failed to fetch payroll runs');
      return response.json();
    },
  });

  const { data: payrollEntries } = useQuery({
    queryKey: ['payroll-entries', selectedRun?.id],
    queryFn: async () => {
      if (!selectedRun?.id) return null;
      const response = await fetch(`/api/payroll/payroll-entries/${selectedRun.id}`);
      if (!response.ok) throw new Error('Failed to fetch entries');
      return response.json();
    },
    enabled: !!selectedRun?.id,
  });

  const processPayrollMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/payroll/payroll-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });
      if (!response.ok) throw new Error('Failed to create payroll run');
      const run = await response.json();

      const processResponse = await fetch(`/api/payroll/payroll-runs/${run.data.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });
      if (!processResponse.ok) throw new Error('Failed to process payroll');
      return processResponse.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      setSelectedRun(data.data);
      toast.success('Payroll processed successfully');
    },
    onError: () => toast.error('Failed to process payroll'),
  });

  const finalizePayrollMutation = useMutation({
    mutationFn: async (runId: string) => {
      const response = await fetch(`/api/payroll/payroll-runs/${runId}/finalize`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to finalize payroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-entries', selectedRun?.id] });
      toast.success('Payroll finalized successfully');
    },
    onError: () => toast.error('Failed to finalize payroll'),
  });

  const reversePayrollMutation = useMutation({
    mutationFn: async (runId: string) => {
      const response = await fetch(`/api/payroll/payroll-runs/${runId}/reverse`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to reverse payroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      setSelectedRun(null);
      toast.success('Payroll reversed successfully');
    },
    onError: () => toast.error('Failed to reverse payroll'),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleString('default', { month: 'long' }),
  }));

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payroll Processing</h2>
      </div>

      {/* Month/Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Month</label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => processPayrollMutation.mutate()} disabled={processPayrollMutation.isPending} className="gap-2">
              <Play className="w-4 h-4" />
              Process Payroll
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Runs List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payroll Runs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {payrollRuns?.data?.map((run: any) => (
                <button
                  key={run.id}
                  onClick={() => setSelectedRun(run)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedRun?.id === run.id ? 'bg-amber-100 border border-amber-300' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium text-sm">
                    {new Date(2024, run.month - 1).toLocaleString('default', { month: 'long' })} {run.year}
                  </p>
                  <p className={`text-xs font-medium ${run.status === 'finalized' ? 'text-green-600' : run.status === 'draft' ? 'text-amber-600' : 'text-red-600'}`}>
                    {run.status.toUpperCase()}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Run Details */}
        {selectedRun && (
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {new Date(2024, selectedRun.month - 1).toLocaleString('default', { month: 'long' })} {selectedRun.year}
                    </CardTitle>
                    <p className={`text-sm font-medium mt-1 ${selectedRun.status === 'finalized' ? 'text-green-600' : selectedRun.status === 'draft' ? 'text-amber-600' : 'text-red-600'}`}>
                      {selectedRun.status.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedRun.status === 'draft' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPreview(!showPreview)}
                        >
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => finalizePayrollMutation.mutate(selectedRun.id)}
                          disabled={finalizePayrollMutation.isPending}
                          className="gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Finalize
                        </Button>
                      </>
                    )}
                    {selectedRun.status === 'finalized' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => reversePayrollMutation.mutate(selectedRun.id)}
                        disabled={reversePayrollMutation.isPending}
                        className="gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reverse
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Payroll</p>
                    <p className="text-2xl font-bold">₹{(selectedRun.total_payroll || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employees</p>
                    <p className="text-2xl font-bold">{selectedRun.employee_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Table */}
            {showPreview && payrollEntries?.data && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payroll Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Employee</th>
                          <th className="px-4 py-2 text-right font-medium">Basic</th>
                          <th className="px-4 py-2 text-right font-medium">Allowances</th>
                          <th className="px-4 py-2 text-right font-medium">Deductions</th>
                          <th className="px-4 py-2 text-right font-medium">Tax</th>
                          <th className="px-4 py-2 text-right font-medium">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payrollEntries.data.map((entry: any) => (
                          <tr key={entry.id} className="border-t">
                            <td className="px-4 py-2">{entry.profiles?.full_name}</td>
                            <td className="px-4 py-2 text-right">₹{entry.basic_salary.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">₹{entry.allowances.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">₹{entry.deductions.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">₹{entry.tax.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right font-bold">₹{entry.net_salary.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollRunManager;
