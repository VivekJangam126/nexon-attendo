import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit2, AlertCircle } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import type { ShiftConfig } from "@server/utils/shift-resolver";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  shift_type: string | null;
  shift_mode: string | null;
  shift_config: ShiftConfig | null;
}

interface EditingEmployee {
  id: string;
  shiftMode: 'fixed' | 'rotating' | 'custom';
  fixed: { type: 'fixed'; value: string };
  rotating: { type: 'rotating'; startDate: string; pattern: string[] };
  custom: { type: 'custom'; startTime: string; endTime: string };
}

const ShiftManagementScreen = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditingEmployee | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, shift_type, shift_mode, shift_config')
        .eq('role', 'employee')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (employee: Employee) => {
    const mode = (employee.shift_mode || 'fixed') as 'fixed' | 'rotating' | 'custom';
    const config = employee.shift_config as ShiftConfig | null;

    setEditForm({
      id: employee.id,
      shiftMode: mode,
      fixed: { type: 'fixed', value: employee.shift_type || 'morning' },
      rotating: {
        type: 'rotating',
        startDate: (config as any)?.startDate || new Date().toISOString().split('T')[0],
        pattern: (config as any)?.pattern || ['morning', 'evening'],
      },
      custom: {
        type: 'custom',
        startTime: (config as any)?.startTime || '09:00',
        endTime: (config as any)?.endTime || '17:00',
      },
    });
    setEditingId(employee.id);
  };

  const saveShift = async () => {
    if (!editForm) return;

    setSaving(true);
    try {
      const updateData: any = { shift_mode: editForm.shiftMode };

      if (editForm.shiftMode === 'fixed') {
        updateData.shift_type = editForm.fixed.value;
        updateData.shift_config = { type: 'fixed', value: editForm.fixed.value };
      } else if (editForm.shiftMode === 'rotating') {
        updateData.shift_config = {
          type: 'rotating',
          startDate: editForm.rotating.startDate,
          pattern: editForm.rotating.pattern,
        };
      } else if (editForm.shiftMode === 'custom') {
        updateData.shift_config = {
          type: 'custom',
          startTime: editForm.custom.startTime,
          endTime: editForm.custom.endTime,
        };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', editForm.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shift updated successfully",
      });

      setEditingId(null);
      setEditForm(null);
      await fetchEmployees();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update shift",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getShiftBadgeColor = (mode: string | null) => {
    switch (mode) {
      case 'rotating':
        return 'bg-blue-100 text-blue-800';
      case 'custom':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getShiftLabel = (mode: string | null) => {
    switch (mode) {
      case 'rotating':
        return 'Rotating';
      case 'custom':
        return 'Custom';
      default:
        return 'Fixed';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-full">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0 bg-gray-50/30">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-6 bg-gradient-to-r from-white to-gray-50/50 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/settings")}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
              <p className="text-sm text-gray-600">Manage employee shifts and schedules</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {/* Info Alert */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">Shift Types Available</p>
                <p className="text-xs mt-1">
                  <strong>Fixed:</strong> Morning (6 AM - 3 PM) or Evening (10 AM - 7 PM) • 
                  <strong> Rotating:</strong> Weekly pattern • 
                  <strong> Custom:</strong> Admin-defined times
                </p>
              </div>
            </div>

            {/* Employees Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Shift Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Current Shift</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{emp.full_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{emp.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getShiftBadgeColor(emp.shift_mode)}`}>
                          {getShiftLabel(emp.shift_mode)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {emp.shift_type ? (
                          <span className="capitalize">{emp.shift_type} Shift</span>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => startEdit(emp)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          disabled={editingId !== null}
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {employees.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-500 text-sm">No employees found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {editingId && editForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-xl animate-slide-up">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Assign Shift</h2>

              {/* Shift Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Shift Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['fixed', 'rotating', 'custom'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setEditForm({ ...editForm, shiftMode: mode as any })}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        editForm.shiftMode === mode
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fixed Shift Options */}
              {editForm.shiftMode === 'fixed' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Shift</label>
                  <select
                    value={editForm.fixed.value}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        fixed: { type: 'fixed', value: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="morning">Morning (6:00 AM - 3:00 PM)</option>
                    <option value="evening">Evening (10:00 AM - 7:00 PM)</option>
                  </select>
                </div>
              )}

              {/* Rotating Shift Options */}
              {editForm.shiftMode === 'rotating' && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={editForm.rotating.startDate}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          rotating: { ...editForm.rotating, startDate: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rotation Pattern</label>
                    <div className="space-y-2">
                      {['morning', 'evening'].map((shift) => (
                        <label key={shift} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editForm.rotating.pattern.includes(shift)}
                            onChange={(e) => {
                              const newPattern = e.target.checked
                                ? [...editForm.rotating.pattern, shift]
                                : editForm.rotating.pattern.filter((s) => s !== shift);
                              setEditForm({
                                ...editForm,
                                rotating: { ...editForm.rotating, pattern: newPattern },
                              });
                            }}
                            className="rounded"
                          />
                          <span className="text-sm capitalize">{shift} Shift</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Shift Options */}
              {editForm.shiftMode === 'custom' && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={editForm.custom.startTime}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          custom: { ...editForm.custom, startTime: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={editForm.custom.endTime}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          custom: { ...editForm.custom, endTime: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditForm(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={saveShift}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Shift'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ShiftManagementScreen;
