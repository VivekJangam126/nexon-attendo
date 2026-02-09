import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, ChevronRight, UserCheck, Clock, UserX, MoreVertical, Plus } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import AdminBottomNavigation from "@/components/AdminBottomNavigation";

type EmployeeStatus = "present" | "late" | "absent" | "not_marked";

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  role: string;
  todayStatus: EmployeeStatus;
  checkInTime: string | null;
}

const mockEmployees: Employee[] = [
  { id: "1", name: "Rahul Kumar", employeeId: "NXN-2024-0142", department: "Engineering", role: "Software Developer", todayStatus: "present", checkInTime: "09:15 AM" },
  { id: "2", name: "Priya Sharma", employeeId: "NXN-2024-0089", department: "Design", role: "UI Designer", todayStatus: "late", checkInTime: "10:32 AM" },
  { id: "3", name: "Amit Singh", employeeId: "NXN-2024-0056", department: "Engineering", role: "Senior Developer", todayStatus: "present", checkInTime: "09:28 AM" },
  { id: "4", name: "Neha Patel", employeeId: "NXN-2024-0201", department: "HR", role: "HR Manager", todayStatus: "present", checkInTime: "09:05 AM" },
  { id: "5", name: "Vikram Rao", employeeId: "NXN-2024-0178", department: "Finance", role: "Accountant", todayStatus: "absent", checkInTime: null },
  { id: "6", name: "Anita Desai", employeeId: "NXN-2024-0134", department: "Marketing", role: "Marketing Lead", todayStatus: "not_marked", checkInTime: null },
  { id: "7", name: "Suresh Menon", employeeId: "NXN-2024-0098", department: "Engineering", role: "QA Engineer", todayStatus: "present", checkInTime: "09:42 AM" },
  { id: "8", name: "Kavita Joshi", employeeId: "NXN-2024-0167", department: "Operations", role: "Operations Manager", todayStatus: "present", checkInTime: "08:55 AM" },
];

const StatusBadge = ({ status }: { status: EmployeeStatus }) => {
  const configs = {
    present: { label: "Present", icon: UserCheck, className: "bg-success-muted text-success" },
    late: { label: "Late", icon: Clock, className: "bg-warning-muted text-warning" },
    absent: { label: "Absent", icon: UserX, className: "bg-destructive-muted text-destructive" },
    not_marked: { label: "Pending", icon: Clock, className: "bg-muted text-muted-foreground" },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const AdminEmployeesScreen = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);

  const departments = [...new Set(mockEmployees.map(e => e.department))];

  const filteredEmployees = mockEmployees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !filterDepartment || employee.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <MobileContainer>
      <div className="flex flex-col h-full min-h-[800px] pb-20">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display mb-1">Employees</h1>
              <p className="text-caption">{mockEmployees.length} total employees</p>
            </div>
            <button 
              onClick={() => {/* Add employee modal */}}
              className="p-2 bg-primary text-primary-foreground rounded-lg"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="px-6 py-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or ID..."
              className="input-field pl-12"
            />
          </div>

          {/* Department Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFilterDepartment(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !filterDepartment
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              All
            </button>
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setFilterDepartment(dept)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filterDepartment === dept
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Employee List */}
        <div className="flex-1 px-6 overflow-y-auto">
          <div className="space-y-3">
            {filteredEmployees.map((employee, index) => (
              <div
                key={employee.id}
                onClick={() => navigate(`/admin/employee/${employee.id}`)}
                className="card-elevated p-4 animate-fade-in-up cursor-pointer hover:bg-muted/50 transition-colors"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {employee.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{employee.name}</p>
                      <StatusBadge status={employee.todayStatus} />
                    </div>
                    <p className="text-xs text-muted-foreground">{employee.role}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{employee.employeeId}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{employee.department}</span>
                    </div>
                    {employee.checkInTime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Check-in: {employee.checkInTime}
                      </p>
                    )}
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open options menu
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No employees found</p>
            </div>
          )}
        </div>

        <AdminBottomNavigation />
      </div>
    </MobileContainer>
  );
};

export default AdminEmployeesScreen;
