import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/hooks/use-toast";

const departments = ["Engineering", "Design", "Marketing", "HR", "Finance", "Operations"];
const offices = ["Nexon Pvt Ltd – Head Office", "Nexon Pvt Ltd – Branch Office"];
const roles = ["Employee", "Admin"];

const AdminAddEmployeeScreen = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", department: "",
    designation: "", officeLocation: "", role: "Employee", password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!form.fullName || !form.email || !form.department || !form.designation || !form.officeLocation || !form.password) {
      setError("Please fill in all required fields."); return;
    }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    toast({ title: "Employee Added", description: `${form.fullName} has been added and activated.` });
    navigate("/admin/employees");
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                  <input type="text" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Enter full name" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="employee@nexon.com" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+91 XXXXX XXXXX" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Department *</label>
                  <select value={form.department} onChange={(e) => updateField("department", e.target.value)} className="input-field">
                    <option value="">Select department</option>
                    {departments.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Designation *</label>
                  <input type="text" value={form.designation} onChange={(e) => updateField("designation", e.target.value)} placeholder="e.g. Software Developer" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Office Location *</label>
                  <select value={form.officeLocation} onChange={(e) => updateField("officeLocation", e.target.value)} className="input-field">
                    <option value="">Select office</option>
                    {offices.map((o) => (<option key={o} value={o}>{o}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Role *</label>
                  <select value={form.role} onChange={(e) => updateField("role", e.target.value)} className="input-field">
                    {roles.map((r) => (<option key={r} value={r}>{r}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Initial Password *</label>
                  <input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Set initial password" className="input-field" />
                </div>
              </div>

              <div className="pt-2 pb-4 max-w-sm">
                <button type="submit" disabled={isLoading} className="btn-primary-large">
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Adding...
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
