import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

const PayrollReports = () => {
  const [selectedReport, setSelectedReport] = useState('summary');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['payroll-report', selectedReport, selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await fetch(
        `/api/payroll/reports/${selectedReport}?month=${selectedMonth}&year=${selectedYear}`
      );
      if (!response.ok) throw new Error('Failed to fetch report');
      return response.json();
    },
  });

  const handleDownloadReport = async (format: string) => {
    try {
      const response = await fetch(
        `/api/payroll/reports/${selectedReport}/download?month=${selectedMonth}&year=${selectedYear}&format=${format}`
      );
      if (!response.ok) throw new Error('Failed to download report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${selectedReport}-${selectedMonth}-${selectedYear}.${format}`;
      a.click();
      toast.success('Report downloaded');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleString('default', { month: 'long' }),
  }));

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const reports = [
    { value: 'summary', label: 'Payroll Summary' },
    { value: 'department', label: 'Department Payroll' },
    { value: 'ctc', label: 'CTC Report' },
    { value: 'register', label: 'Payroll Register' },
    { value: 'statutory', label: 'Statutory Report' },
    { value: 'tax', label: 'Tax Report' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Payroll Reports</h2>

      {/* Report Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generate Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Report Type</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
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
            <div>
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
            <div className="flex items-end gap-2">
              <Button onClick={() => handleDownloadReport('pdf')} className="gap-2">
                <Download className="w-4 h-4" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => handleDownloadReport('xlsx')} className="gap-2">
                <FileText className="w-4 h-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {reportData?.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {reports.find((r) => r.value === selectedReport)?.label} - {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedReport === 'summary' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Employees</p>
                    <p className="text-2xl font-bold">{reportData.data.totalEmployees}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Payroll</p>
                    <p className="text-2xl font-bold">₹{reportData.data.totalPayroll?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Deductions</p>
                    <p className="text-2xl font-bold">₹{reportData.data.totalDeductions?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Tax</p>
                    <p className="text-2xl font-bold">₹{reportData.data.totalTax?.toLocaleString()}</p>
                  </div>
                </div>

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
                      {reportData.data.entries?.map((entry: any) => (
                        <tr key={entry.id} className="border-t">
                          <td className="px-4 py-2">{entry.employee_name}</td>
                          <td className="px-4 py-2 text-right">₹{entry.basic_salary?.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">₹{entry.allowances?.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">₹{entry.deductions?.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">₹{entry.tax?.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right font-bold">₹{entry.net_salary?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedReport === 'department' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Department</th>
                      <th className="px-4 py-2 text-right font-medium">Employees</th>
                      <th className="px-4 py-2 text-right font-medium">Total Payroll</th>
                      <th className="px-4 py-2 text-right font-medium">Avg Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.departments?.map((dept: any) => (
                      <tr key={dept.id} className="border-t">
                        <td className="px-4 py-2">{dept.name}</td>
                        <td className="px-4 py-2 text-right">{dept.employeeCount}</td>
                        <td className="px-4 py-2 text-right">₹{dept.totalPayroll?.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">₹{dept.avgSalary?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedReport === 'tax' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Taxable Income</p>
                    <p className="text-2xl font-bold">₹{reportData.data.totalTaxableIncome?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Tax Deducted</p>
                    <p className="text-2xl font-bold">₹{reportData.data.totalTaxDeducted?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Effective Tax Rate</p>
                    <p className="text-2xl font-bold">{reportData.data.effectiveTaxRate?.toFixed(2)}%</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Employee</th>
                        <th className="px-4 py-2 text-right font-medium">Gross Income</th>
                        <th className="px-4 py-2 text-right font-medium">Tax Deducted</th>
                        <th className="px-4 py-2 text-right font-medium">Tax Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data.taxDetails?.map((detail: any) => (
                        <tr key={detail.id} className="border-t">
                          <td className="px-4 py-2">{detail.employee_name}</td>
                          <td className="px-4 py-2 text-right">₹{detail.grossIncome?.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">₹{detail.taxDeducted?.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">{detail.taxRate?.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PayrollReports;
