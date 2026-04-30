import { useState, useEffect } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from "@/hooks/use-toast";
import { registrationService, officeService, employeeService } from "@server";
import type { Office } from "@server";

interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddEmployeeModal({ open, onOpenChange, onSuccess }: AddEmployeeModalProps) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    officeId: "",
    designation: "",
    roleType: "Employee" as 'Employee' | 'Intern' | 'Unpaid Intern' | 'Paid Intern',
    password: "",
    confirmPassword: "",
    gender: "" as 'male' | 'female' | '',
  });
  const [offices, setOffices] = useState<Office[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(true);

  // Fetch offices on mount
  useEffect(() => {
    const fetchOffices = async () => {
      const { offices: officeList, error: officeError } = await officeService.getActiveOffices();
      if (officeError) {
        setError("Failed to load offices. Please refresh the page.");
      } else {
        setOffices(officeList);
      }
      setLoadingOffices(false);
    };
    if (open) {
      fetchOffices();
    }
  }, [open]);

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () => {
    setForm({
      fullName: "",
      email: "",
      officeId: "",
      designation: "",
      roleType: "Employee",
      password: "",
      confirmPassword: "",
      gender: "",
    });
    setError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!form.fullName || !form.email || !form.officeId || !form.designation || !form.roleType || !form.password || !form.confirmPassword || !form.gender) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // Register the employee with adminCreated flag — skips pending request, sets active directly
      const { success, userId, error: regError } = await registrationService.registerEmployee({
        email: form.email,
        password: form.password,
        full_name: form.fullName,
        office_id: form.officeId,
        designation: form.designation,
        role_type: form.roleType,
        gender: form.gender,
        adminCreated: true,
      });

      if (regError || !success || !userId) {
        setError(regError?.message || "Failed to add employee. Please try again.");
        setIsLoading(false);
        return;
      }

      // Initialize leave balances, holidays and recurring holidays
      const { success: activateSuccess, error: activateError } = await employeeService.activateNewEmployee(userId);

      if (activateError || !activateSuccess) {
        toast({
          title: "Employee Created",
          description: `${form.fullName} has been created but data initialization failed. Run the backfill SQL.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Employee Added Successfully",
          description: `${form.fullName} has been added and activated.`,
        });
      }

      resetForm();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-[90vw] sm:max-w-[600px] rounded-xl max-h-[90vh] overflow-y-auto p-5">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add Employee</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Create new employee account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-700">{error}</p>
            </div>
          )}

          {/* Personal Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Personal Information</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                  Full Name *
                </label>
                <input 
                  type="text" 
                  value={form.fullName} 
                  onChange={(e) => updateField("fullName", e.target.value)} 
                  placeholder="Enter employee's full name" 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                  Email Address *
                </label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => updateField("email", e.target.value)} 
                  placeholder="employee@company.com" 
                  autoComplete="off"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                  Gender *
                </label>
                <select 
                  value={form.gender} 
                  onChange={(e) => updateField("gender", e.target.value)} 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </div>

          {/* Work Information Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Work Information</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                  Office Location *
                </label>
                <select 
                  value={form.officeId} 
                  onChange={(e) => updateField("officeId", e.target.value)} 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  disabled={loadingOffices}
                >
                  <option value="">
                    {loadingOffices ? "Loading offices..." : "Select office location"}
                  </option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.name} - {office.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                    Role *
                  </label>
                  <select 
                    value={form.roleType} 
                    onChange={(e) => updateField("roleType", e.target.value)} 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Intern">Intern</option>
                    <option value="Unpaid Intern">Unpaid Intern</option>
                    <option value="Paid Intern">Paid Intern</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                    Designation *
                  </label>
                  <select 
                    value={form.designation} 
                    onChange={(e) => updateField("designation", e.target.value)} 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="">Select designation</option>
                    <option value="Software Developer">Software Developer</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="HR Executive">HR Executive</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Security</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                  Initial Password *
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={form.password} 
                    onChange={(e) => updateField("password", e.target.value)} 
                    placeholder="Min. 8 characters" 
                    autoComplete="new-password"
                    className="w-full px-3 py-2 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">
                  Employee can change this password after first login
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={form.confirmPassword} 
                    onChange={(e) => updateField("confirmPassword", e.target.value)} 
                    placeholder="Re-enter password" 
                    autoComplete="new-password"
                    className="w-full px-3 py-2 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
            <p className="text-[10px] text-blue-900">
              <span className="font-semibold">ℹ️ Note:</span> The employee will be automatically activated and can log in immediately with the provided credentials.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || loadingOffices}
              className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
              ) : "Add Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
