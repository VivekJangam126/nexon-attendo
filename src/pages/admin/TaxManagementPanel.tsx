import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const TaxManagementPanel = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [formData, setFormData] = useState({
    country: 'India',
    min_income: 0,
    max_income: 0,
    tax_rate: 0,
  });

  const { data: taxSlabs, isLoading } = useQuery({
    queryKey: ['tax-slabs', selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/payroll/tax-slabs?country=India&year=${selectedYear}`);
      if (!response.ok) throw new Error('Failed to fetch tax slabs');
      return response.json();
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
  });

  const createTaxSlabMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/payroll/tax-slabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, financial_year: selectedYear }),
      });
      if (!response.ok) throw new Error('Failed to create tax slab');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-slabs', selectedYear] });
      setFormData({ country: 'India', min_income: 0, max_income: 0, tax_rate: 0 });
      setOpenDialog(false);
      toast.success('Tax slab created');
    },
    onError: () => toast.error('Failed to create tax slab'),
  });

  const deleteTaxSlabMutation = useMutation({
    mutationFn: async (slabId: string) => {
      const response = await fetch(`/api/payroll/tax-slabs/${slabId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete tax slab');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-slabs', selectedYear] });
      toast.success('Tax slab deleted');
    },
    onError: () => toast.error('Failed to delete tax slab'),
  });

  const handleCreateTaxSlab = () => {
    if (!formData.min_income || !formData.tax_rate) {
      toast.error('Please fill all required fields');
      return;
    }
    createTaxSlabMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tax Management</h2>
      </div>

      {/* Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Financial Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}-{parseInt(y) + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Tax Slab
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Tax Slab</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Min Income</Label>
                    <Input
                      type="number"
                      value={formData.min_income}
                      onChange={(e) => setFormData({ ...formData, min_income: parseFloat(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Max Income</Label>
                    <Input
                      type="number"
                      value={formData.max_income}
                      onChange={(e) => setFormData({ ...formData, max_income: parseFloat(e.target.value) })}
                      placeholder="Leave empty for no limit"
                    />
                  </div>
                  <div>
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <Button onClick={handleCreateTaxSlab} className="w-full">
                    Add Tax Slab
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Tax Slabs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tax Slabs - {selectedYear}-{parseInt(selectedYear) + 1}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Min Income</th>
                  <th className="px-4 py-2 text-left font-medium">Max Income</th>
                  <th className="px-4 py-2 text-left font-medium">Tax Rate</th>
                  <th className="px-4 py-2 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {taxSlabs?.data?.map((slab: any) => (
                  <tr key={slab.id} className="border-t">
                    <td className="px-4 py-2">₹{slab.min_income.toLocaleString()}</td>
                    <td className="px-4 py-2">{slab.max_income ? `₹${slab.max_income.toLocaleString()}` : 'No limit'}</td>
                    <td className="px-4 py-2">{slab.tax_rate}%</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => deleteTaxSlabMutation.mutate(slab.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tax Declarations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Employee Tax Declarations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees?.data?.map((emp: any) => (
              <div key={emp.id} className="p-4 border rounded-lg">
                <p className="font-medium">{emp.full_name}</p>
                <p className="text-sm text-gray-600">{emp.email}</p>
                <Button variant="outline" size="sm" className="mt-2">
                  View Declarations
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxManagementPanel;
