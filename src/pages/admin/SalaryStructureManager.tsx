import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const SalaryStructureManager = () => {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', employment_type: '', currency: 'INR' });
  const [componentForm, setComponentForm] = useState({
    component_name: '',
    component_type: 'earning',
    calculation_type: 'fixed',
    amount: 0,
  });

  const { data: structures, isLoading } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: async () => {
      const response = await fetch('/api/payroll/salary-structures');
      if (!response.ok) throw new Error('Failed to fetch structures');
      return response.json();
    },
  });

  const { data: structureDetail } = useQuery({
    queryKey: ['salary-structure', selectedStructure?.id],
    queryFn: async () => {
      if (!selectedStructure?.id) return null;
      const response = await fetch(`/api/payroll/salary-structures/${selectedStructure.id}`);
      if (!response.ok) throw new Error('Failed to fetch structure');
      return response.json();
    },
    enabled: !!selectedStructure?.id,
  });

  const createStructureMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/payroll/salary-structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create structure');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      setFormData({ name: '', employment_type: '', currency: 'INR' });
      setOpenDialog(false);
      toast.success('Salary structure created');
    },
    onError: () => toast.error('Failed to create structure'),
  });

  const addComponentMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/payroll/salary-components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add component');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structure', selectedStructure?.id] });
      setComponentForm({
        component_name: '',
        component_type: 'earning',
        calculation_type: 'fixed',
        amount: 0,
      });
      toast.success('Component added');
    },
    onError: () => toast.error('Failed to add component'),
  });

  const deleteComponentMutation = useMutation({
    mutationFn: async (componentId: string) => {
      const response = await fetch(`/api/payroll/salary-components/${componentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete component');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structure', selectedStructure?.id] });
      toast.success('Component deleted');
    },
    onError: () => toast.error('Failed to delete component'),
  });

  const handleCreateStructure = () => {
    if (!formData.name || !formData.employment_type) {
      toast.error('Please fill all fields');
      return;
    }
    createStructureMutation.mutate(formData);
  };

  const handleAddComponent = () => {
    if (!componentForm.component_name || !componentForm.amount) {
      toast.error('Please fill all fields');
      return;
    }
    addComponentMutation.mutate({
      structure_id: selectedStructure.id,
      ...componentForm,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Salary Structures</h2>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Structure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Salary Structure</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Structure Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Senior Developer"
                />
              </div>
              <div>
                <Label>Employment Type</Label>
                <Select value={formData.employment_type} onValueChange={(value) => setFormData({ ...formData, employment_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateStructure} className="w-full">
                Create Structure
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Structures List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Structures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {structures?.data?.map((structure: any) => (
                <button
                  key={structure.id}
                  onClick={() => setSelectedStructure(structure)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedStructure?.id === structure.id
                      ? 'bg-amber-100 border border-amber-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium text-sm">{structure.name}</p>
                  <p className="text-xs text-gray-600">{structure.employment_type}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Structure Details */}
        {selectedStructure && structureDetail?.data && (
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{selectedStructure.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Employment Type</p>
                    <p className="font-medium">{selectedStructure.employment_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Currency</p>
                    <p className="font-medium">{selectedStructure.currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Components */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Salary Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {structureDetail?.data?.components?.map((component: any) => (
                    <div key={component.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{component.component_name}</p>
                        <p className="text-xs text-gray-600">
                          {component.component_type === 'earning' ? '📈' : '📉'} {component.calculation_type === 'fixed' ? `₹${component.amount}` : `${component.amount}%`}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteComponentMutation.mutate(component.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Component Form */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium text-sm">Add Component</h4>
                  <Input
                    placeholder="Component name"
                    value={componentForm.component_name}
                    onChange={(e) => setComponentForm({ ...componentForm, component_name: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={componentForm.component_type} onValueChange={(value) => setComponentForm({ ...componentForm, component_type: value as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="earning">Earning</SelectItem>
                        <SelectItem value="deduction">Deduction</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={componentForm.calculation_type} onValueChange={(value) => setComponentForm({ ...componentForm, calculation_type: value as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={componentForm.amount}
                    onChange={(e) => setComponentForm({ ...componentForm, amount: parseFloat(e.target.value) })}
                  />
                  <Button onClick={handleAddComponent} className="w-full">
                    Add Component
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryStructureManager;
