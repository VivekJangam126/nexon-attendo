import { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { getShiftDisplayMessage, getShiftDisplayShort, getShiftBadgeColorShort } from "@/utils/shiftFormatter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  shift_type?: string;
  shift_mode?: string;
  shift_config?: Record<string, any>;
}

interface ShiftManagementPageProps {
  isEmbedded?: boolean;
}

const ShiftManagementPage = ({ isEmbedded = false }: ShiftManagementPageProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      // Try to fetch with shift_mode and shift_config columns
      // If they don't exist, fall back to just basic columns
      let { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, shift_type, shift_mode, shift_config')
        .eq('role', 'employee')
        .order('full_name');

      // If columns don't exist, fetch without them
      if (error && error.code === '42703') {
        console.log('Shift columns not yet created in database. Creating with defaults...');
        const { data: basicData } = await supabase
          .from('profiles')
          .select('id, full_name, email, shift_type')
          .eq('role', 'employee')
          .order('full_name');
        
        // Add default shift_mode and shift_config
        data = (basicData || []).map(emp => ({
          ...emp,
          shift_mode: 'fixed',
          shift_config: null,
        }));
      } else if (error) {
        throw error;
      }

      setEmployees(data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleEditStart = (employee: Employee) => {
    setEditingId(employee.id);
    
    // Initialize shift_config with defaults for custom shifts
    let shiftConfig = employee.shift_config || {};
    if ((employee.shift_mode === 'custom' || !employee.shift_mode) && !shiftConfig.startTime) {
      shiftConfig = {
        ...shiftConfig,
        startTime: '09:00',
        endTime: '17:00',
      };
    }
    
    setEditFormData({
      shift_mode: employee.shift_mode || 'fixed',
      shift_type: employee.shift_type || 'morning',
      shift_config: shiftConfig,
    });
  };

  const handleSaveShift = async () => {
    if (!editingId) return;

    setUpdatingId(editingId);
    try {
      const updateData: any = {
        shift_mode: editFormData.shift_mode || 'fixed',
        shift_type: editFormData.shift_type || 'morning',
      };

      if (editFormData.shift_mode === 'rotating' || editFormData.shift_mode === 'custom') {
        // For custom shifts, ensure startTime and endTime are always present
        if (editFormData.shift_mode === 'custom') {
          updateData.shift_config = {
            ...editFormData.shift_config,
            startTime: editFormData.shift_config?.startTime || '09:00',
            endTime: editFormData.shift_config?.endTime || '17:00',
          };
        } else {
          updateData.shift_config = editFormData.shift_config;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', editingId);

      // If columns don't exist, show helpful message
      if (error && error.code === '42703') {
        toast({
          title: "Database Setup Required",
          description: "Please run the migration SQL first:\n\nALTER TABLE profiles ADD COLUMN IF NOT EXISTS shift_mode TEXT DEFAULT 'fixed', ADD COLUMN IF NOT EXISTS shift_config JSONB DEFAULT NULL;",
          variant: "destructive",
        });
        console.error('Column migration required:', error.message);
        setUpdatingId(null);
        return;
      }

      if (error) throw error;

      // Update local state
      setEmployees(prev =>
        prev.map(emp =>
          emp.id === editingId
            ? {
              ...emp,
              shift_mode: updateData.shift_mode,
              shift_type: updateData.shift_type,
              shift_config: updateData.shift_config,
            }
            : emp
        )
      );

      toast({
        title: "Success",
        description: "Shift updated successfully",
      });

      setEditingId(null);
      setEditFormData({});
    } catch (err) {
      console.error('Error saving shift:', err);
      toast({
        title: "Error",
        description: "Failed to update shift",
        variant: "destructive",
      });
    }
    setUpdatingId(null);
  };

  const getShiftDisplay = (employee: Employee): string => {
    return getShiftDisplayShort(employee);
  };

  const getShiftDisplayColor = (employee: Employee): string => {
    return getShiftBadgeColorShort(employee);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    const loadingContent = (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );

    if (isEmbedded) return loadingContent;

    return (
      <AdminLayout title="Shift Management">
        {loadingContent}
      </AdminLayout>
    );
  }

  const editingEmployee = employees.find(emp => emp.id === editingId);

  const mainContent = (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4 border-b border-gray-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Shift Management
              </h2>
              <p className="text-sm text-gray-600 mt-1">Manage employee shifts - Fixed, Rotating, or Custom</p>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Shift Types:</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li><strong>Fixed:</strong> Morning (6 AM - 3 PM) or Evening (10 AM - 7 PM)</li>
                <li><strong>Rotating:</strong> Follows a weekly rotation pattern</li>
                <li><strong>Custom:</strong> Admin-defined start and end times</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Table & Card View */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No employees found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Shift</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-medium text-gray-900 text-sm">{employee.full_name}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-gray-600 text-sm">{employee.email}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1.5 rounded border text-xs font-medium ${getShiftDisplayColor(employee)}`}>
                          {getShiftDisplay(employee)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleEditStart(employee)}
                          disabled={updatingId !== null}
                          className="px-4 py-2 bg-amber-100 text-amber-700 text-xs font-medium rounded hover:bg-amber-200 disabled:opacity-50 transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Card View */}
            <div className="lg:hidden space-y-3">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-3">
                    {/* Name & Email */}
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{employee.full_name}</p>
                      <p className="text-gray-600 text-xs mt-1">{employee.email}</p>
                    </div>

                    {/* Shift Badge & Edit Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className={`px-3 py-1.5 rounded border text-xs font-medium ${getShiftDisplayColor(employee)}`}>
                        {getShiftDisplay(employee)}
                      </span>
                      <button
                        onClick={() => handleEditStart(employee)}
                        disabled={updatingId !== null}
                        className="px-4 py-2 bg-amber-100 text-amber-700 text-xs font-medium rounded hover:bg-amber-200 disabled:opacity-50 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Showing {filteredEmployees.length} of {employees.length} employees
          </p>
        </div>
        </div>
      </div>

      {/* Edit Shift Modal Dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
            {editingEmployee && (
              <DialogDescription>
                {editingEmployee.full_name} ({editingEmployee.email})
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Shift Mode Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Shift Type</label>
              <select
                value={editFormData.shift_mode || 'fixed'}
                onChange={(e) => {
                  const newMode = e.target.value;
                  let newConfig = editFormData.shift_config || {};
                  
                  if (newMode === 'custom' && !newConfig.startTime) {
                    newConfig = {
                      ...newConfig,
                      startTime: editFormData.shift_config?.startTime || '09:00',
                      endTime: editFormData.shift_config?.endTime || '17:00',
                    };
                  }
                  
                  setEditFormData({ 
                    ...editFormData, 
                    shift_mode: newMode,
                    shift_config: newConfig,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="fixed">Fixed</option>
                <option value="rotating">Rotating</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Fixed Shift Options */}
            {editFormData.shift_mode === 'fixed' && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Select Shift</label>
                <select
                  value={editFormData.shift_type || 'morning'}
                  onChange={(e) => setEditFormData({ ...editFormData, shift_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="morning">Morning (6 AM - 3 PM)</option>
                  <option value="evening">Evening (10 AM - 7 PM)</option>
                </select>
              </div>
            )}

            {/* Rotating Shift Options */}
            {editFormData.shift_mode === 'rotating' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Start Date</label>
                  <input
                    type="date"
                    value={editFormData.shift_config?.startDate || ''}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        shift_config: { ...editFormData.shift_config, startDate: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Rotation Pattern</label>
                  <div className="space-y-2">
                    {['morning', 'evening'].map((shift) => (
                      <label key={shift} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(editFormData.shift_config?.pattern || []).includes(shift)}
                          onChange={(e) => {
                            const pattern = editFormData.shift_config?.pattern || [];
                            if (e.target.checked) {
                              pattern.push(shift);
                            } else {
                              pattern.splice(pattern.indexOf(shift), 1);
                            }
                            setEditFormData({
                              ...editFormData,
                              shift_config: { ...editFormData.shift_config, pattern },
                            });
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {shift === 'morning' ? 'Morning (6 AM - 3 PM)' : 'Evening (10 AM - 7 PM)'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Shift Options */}
            {editFormData.shift_mode === 'custom' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Start Time</label>
                  <input
                    type="time"
                    value={editFormData.shift_config?.startTime || '09:00'}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        shift_config: { ...editFormData.shift_config, startTime: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">End Time</label>
                  <input
                    type="time"
                    value={editFormData.shift_config?.endTime || '17:00'}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        shift_config: { ...editFormData.shift_config, endTime: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dialog Footer with Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSaveShift}
              disabled={updatingId === editingId}
              className="flex-1 px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setEditingId(null)}
              disabled={updatingId === editingId}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (isEmbedded) {
    return mainContent;
  }

  return (
    <AdminLayout title="Shift Management">
      {mainContent}
    </AdminLayout>
  );
};

export default ShiftManagementPage;
