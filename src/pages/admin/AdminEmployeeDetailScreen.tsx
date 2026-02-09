import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  UserCheck, 
  Clock, 
  UserX,
  Calendar,
  Edit,
  MoreVertical
} from "lucide-react";
import MobileContainer from "@/components/MobileContainer";

type AttendanceStatus = "present" | "late" | "absent";

interface AttendanceRecord {
  date: string;
  checkInTime: string | null;
  status: AttendanceStatus;
}

const mockEmployeeData = {
  "1": { 
    name: "Rahul Kumar", 
    employeeId: "NXN-2024-0142", 
    department: "Engineering", 
    role: "Software Developer",
    email: "rahul.kumar@nexon.com",
    phone: "+91 98765 43210",
    joinDate: "2024-01-15",
    todayStatus: "present" as AttendanceStatus,
  },
  "2": { 
    name: "Priya Sharma", 
    employeeId: "NXN-2024-0089", 
    department: "Design", 
    role: "UI Designer",
    email: "priya.sharma@nexon.com",
    phone: "+91 98765 43211",
    joinDate: "2023-08-20",
    todayStatus: "late" as AttendanceStatus,
  },
  "3": { 
    name: "Amit Singh", 
    employeeId: "NXN-2024-0056", 
    department: "Engineering", 
    role: "Senior Developer",
    email: "amit.singh@nexon.com",
    phone: "+91 98765 43212",
    joinDate: "2022-03-10",
    todayStatus: "present" as AttendanceStatus,
  },
  "4": { 
    name: "Neha Patel", 
    employeeId: "NXN-2024-0201", 
    department: "HR", 
    role: "HR Manager",
    email: "neha.patel@nexon.com",
    phone: "+91 98765 43213",
    joinDate: "2023-05-01",
    todayStatus: "present" as AttendanceStatus,
  },
  "5": { 
    name: "Vikram Rao", 
    employeeId: "NXN-2024-0178", 
    department: "Finance", 
    role: "Accountant",
    email: "vikram.rao@nexon.com",
    phone: "+91 98765 43214",
    joinDate: "2024-02-12",
    todayStatus: "absent" as AttendanceStatus,
  },
};

const mockAttendanceHistory: AttendanceRecord[] = [
  { date: "2024-01-15", checkInTime: "09:12 AM", status: "present" },
  { date: "2024-01-14", checkInTime: "09:45 AM", status: "late" },
  { date: "2024-01-13", checkInTime: "09:05 AM", status: "present" },
  { date: "2024-01-12", checkInTime: null, status: "absent" },
  { date: "2024-01-11", checkInTime: "09:30 AM", status: "present" },
  { date: "2024-01-10", checkInTime: "09:08 AM", status: "present" },
  { date: "2024-01-09", checkInTime: "10:15 AM", status: "late" },
  { date: "2024-01-08", checkInTime: "09:02 AM", status: "present" },
];

const StatusBadge = ({ status }: { status: AttendanceStatus }) => {
  const configs = {
    present: { label: "Present", icon: UserCheck, className: "bg-success-muted text-success" },
    late: { label: "Late", icon: Clock, className: "bg-warning-muted text-warning" },
    absent: { label: "Absent", icon: UserX, className: "bg-destructive-muted text-destructive" },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const AdminEmployeeDetailScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const employee = mockEmployeeData[id as keyof typeof mockEmployeeData];

  if (!employee) {
    return (
      <MobileContainer>
        <div className="flex flex-col items-center justify-center h-full p-6">
          <p className="text-muted-foreground">Employee not found</p>
          <button 
            onClick={() => navigate("/admin/employees")}
            className="mt-4 text-primary font-medium"
          >
            Back to Employees
          </button>
        </div>
      </MobileContainer>
    );
  }

  // Calculate stats
  const presentCount = mockAttendanceHistory.filter(r => r.status === "present").length;
  const lateCount = mockAttendanceHistory.filter(r => r.status === "late").length;
  const absentCount = mockAttendanceHistory.filter(r => r.status === "absent").length;
  const attendanceRate = Math.round((presentCount / mockAttendanceHistory.length) * 100);

  return (
    <MobileContainer>
      <div className="flex flex-col h-full min-h-[800px]">
        {/* Header */}
        <div className="px-6 pt-8 pb-6 bg-primary text-primary-foreground rounded-b-3xl">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate("/admin/employees")}
              className="p-2 -ml-2 hover:bg-primary-foreground/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors">
                <Edit className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <span className="text-xl font-semibold">
                {employee.name.split(" ").map(n => n[0]).join("")}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold mb-1">{employee.name}</h1>
              <p className="text-primary-foreground/80 text-sm">{employee.employeeId}</p>
              <div className="mt-2">
                <StatusBadge status={employee.todayStatus} />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-5 overflow-y-auto">
          {/* Contact Info */}
          <div className="animate-fade-in-up">
            <h2 className="text-overline mb-3">Contact Information</h2>
            <div className="card-elevated divide-y divide-border">
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{employee.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{employee.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="text-sm font-medium">{employee.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="text-sm font-medium">{employee.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Stats */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-overline mb-3">Monthly Statistics</h2>
            <div className="grid grid-cols-4 gap-3">
              <div className="card-elevated p-3 text-center">
                <p className="text-xl font-semibold text-primary">{attendanceRate}%</p>
                <p className="text-xs text-muted-foreground">Rate</p>
              </div>
              <div className="card-elevated p-3 text-center">
                <p className="text-xl font-semibold text-success">{presentCount}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="card-elevated p-3 text-center">
                <p className="text-xl font-semibold text-warning">{lateCount}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
              <div className="card-elevated p-3 text-center">
                <p className="text-xl font-semibold text-destructive">{absentCount}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-overline">Recent Attendance</h2>
              <button className="text-xs text-primary font-medium">View All</button>
            </div>
            <div className="card-elevated divide-y divide-border">
              {mockAttendanceHistory.slice(0, 5).map((record, index) => (
                <div key={index} className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {new Date(record.date).toLocaleDateString("en-US", { 
                        weekday: "short", 
                        month: "short", 
                        day: "numeric" 
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {record.checkInTime || "No check-in"}
                    </p>
                  </div>
                  <StatusBadge status={record.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-overline mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="card-elevated p-4 text-center hover:bg-muted/50 transition-colors">
                <UserCheck className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Mark Attendance</p>
              </button>
              <button className="card-elevated p-4 text-center hover:bg-muted/50 transition-colors">
                <Edit className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Edit Profile</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
};

export default AdminEmployeeDetailScreen;
