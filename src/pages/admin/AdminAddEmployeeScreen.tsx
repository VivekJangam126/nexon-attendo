import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, Eye, EyeOff } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/hooks/use-toast";
import { registrationService, officeService, employeeService } from "@server";
import type { Office } from "@server";

const AdminAddEmployeeScreen = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    officeId: "",
    password: "",
    confirmPassword: "",
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
    fetchOffices();
  }, []);

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!form.fullName || !form.email || !form.officeId || !form.password || !form.confirmPassword) {
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
      // Register the employee
      const { success, userId, error: regError } = await registrationService.registerEmployee({
        email: form.email,
        password: form.password,
        full_name: form.fullName,
        office_id: form.officeId,
      });

      if (regError || !success || !userId) {
        setError(regError?.message || "Failed to add employee. Please try again.");
        setIsLoading(false);
        return;
      }

      // Since admin is adding, automatically approve the employee
      // Update status from 'pending' to 'active'
      const { success: activateSuccess, error: activateError } = await employeeService.activateEmployee(userId);

      if (activateError || !activateSuccess) {
        // Employee created but not activated - admin can activate manually
        toast({
          title: "Employee Created",
          description: `${form.fullName} has been created but needs manual activation.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Employee Added Successfully",
          description: `${form.fullName} has been added and activated.`,
        });
      }

      navigate("/admin/employees");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-4 border-b border-border flex items-center gap-3">
          <button onClick={() => navigate("/admin/employees")} className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors lg:hidden">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-title">Add Employee</h1>
            <p className="text-caption">Create new employee account</p>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
          <div className="max-w-2xl">
            {error && (
              <div className="bg-destructive-muted border border-destructive/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                <input 
                  type="text" 
                  value={form.fullName} 
                  onChange={(e) => updateField("fullName", e.target.value)} 
                  placeholder="Enter employee's full name" 
                  className="input-field" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address *</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => updateField("email", e.target.value)} 
                  placeholder="employee@company.com" 
                  className="input-field" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Office Location *</label>
                <select 
                  value={form.officeId} 
                  onChange={(e) => updateField("officeId", e.target.value)} 
                  className="input-field"
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Initial Password *</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={form.password} 
                    onChange={(e) => updateField("password", e.target.value)} 
                    placeholder="Min. 8 characters" 
                    className="input-field pr-12" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Employee can change this password after first login
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm Password *</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={form.confirmPassword} 
                    onChange={(e) => updateField("confirmPassword", e.target.value)} 
                    placeholder="Re-enter password" 
                    className="input-field pr-12" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 pb-4">
                <button type="submit" disabled={isLoading || loadingOffices} className="btn-primary-large">
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Adding Employee...
                    </span>
                  ) : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAddEmployeeScreen;
