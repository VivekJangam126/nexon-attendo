import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Mail, Printer } from 'lucide-react';
import { toast } from 'sonner';

const PayslipViewer = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
  });

  const { data: payslips } = useQuery({
    queryKey: ['payslips', selectedEmployee],
    queryFn: async () => {
      if (!selectedEmployee) return null;
      const response = await fetch(`/api/payroll/payslips/${selectedEmployee}`);
      if (!response.ok) throw new Error('Failed to fetch payslips');
      return response.json();
    },
    enabled: !!selectedEmployee,
  });

  const handleDownloadPDF = async (payslipId: string) => {
    try {
      const response = await fetch(`/api/payroll/payslips/${payslipId}/pdf`);
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payslipId}.pdf`;
      a.click();
      toast.success('Payslip downloaded');
    } catch (error) {
      toast.error('Failed to download payslip');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailPayslip = async (payslipId: string) => {
    try {
      const response = await fetch(`/api/payroll/payslips/${payslipId}/email`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to email payslip');
      toast.success('Payslip sent via email');
    } catch (error) {
      toast.error('Failed to send payslip');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Payslips</h2>

      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an employee" />
            </SelectTrigger>
            <SelectContent>
              {employees?.data?.map((emp: any) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Payslips List */}
      {selectedEmployee && payslips?.data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payslips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {payslips.data.map((payslip: any) => (
                  <button
                    key={payslip.id}
                    onClick={() => setSelectedPayslip(payslip)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedPayslip?.id === payslip.id ? 'bg-amber-100 border border-amber-300' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-medium text-sm">
                      {new Date(2024, payslip.month - 1).toLocaleString('default', { month: 'short' })} {payslip.year}
                    </p>
                    <p className="text-xs text-gray-600">₹{payslip.net_salary.toLocaleString()}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Payslip Details */}
          {selectedPayslip && (
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Payslip - {new Date(2024, selectedPayslip.month - 1).toLocaleString('default', { month: 'long' })} {selectedPayslip.year}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(selectedPayslip.id)}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEmailPayslip(selectedPayslip.id)}
                        className="gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Earnings */}
                  <div>
                    <h3 className="font-semibold mb-3">Earnings</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gross Salary</span>
                        <span className="font-medium">₹{selectedPayslip.gross_salary.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div>
                    <h3 className="font-semibold mb-3">Deductions</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deductions</span>
                        <span className="font-medium">₹{selectedPayslip.deductions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium">₹{selectedPayslip.tax.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Salary */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">Net Salary</span>
                      <span className="text-2xl font-bold text-green-600">₹{selectedPayslip.net_salary.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PayslipViewer;
