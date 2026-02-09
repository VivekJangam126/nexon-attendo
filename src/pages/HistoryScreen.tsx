import { Calendar, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import BottomNavigation from "@/components/BottomNavigation";

type AttendanceRecord = {
  id: string;
  date: Date;
  time: string | null;
  status: "present" | "late" | "absent";
};

// Demo data for the past week
const generateDemoData = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();

  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Generate realistic demo data
    const statuses: ("present" | "late" | "absent")[] = ["present", "present", "present", "late", "present"];
    const status = i === 0 ? "present" : statuses[Math.floor(Math.random() * statuses.length)];

    const times = ["09:15 AM", "09:45 AM", "10:02 AM", "09:30 AM", "09:58 AM"];
    const time = status === "absent" ? null : times[Math.floor(Math.random() * times.length)];

    records.push({
      id: `record-${i}`,
      date,
      time,
      status,
    });
  }

  return records;
};

const StatusIcon = ({ status }: { status: "present" | "late" | "absent" }) => {
  switch (status) {
    case "present":
      return (
        <div className="w-8 h-8 bg-success-muted rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-success" />
        </div>
      );
    case "late":
      return (
        <div className="w-8 h-8 bg-warning-muted rounded-full flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-warning" />
        </div>
      );
    case "absent":
      return (
        <div className="w-8 h-8 bg-destructive-muted rounded-full flex items-center justify-center">
          <XCircle className="w-4 h-4 text-destructive" />
        </div>
      );
  }
};

const StatusBadge = ({ status }: { status: "present" | "late" | "absent" }) => {
  const configs = {
    present: { label: "Present", className: "bg-success-muted text-success" },
    late: { label: "Late", className: "bg-warning-muted text-warning" },
    absent: { label: "Absent", className: "bg-destructive-muted text-destructive" },
  };

  const config = configs[status];

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const HistoryScreen = () => {
  const records = generateDemoData();

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <MobileContainer>
      <div className="flex flex-col min-h-full pb-20">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 border-b border-border">
          <h1 className="text-display mb-1">Attendance History</h1>
          <p className="text-caption">View your past attendance records</p>
        </div>

        {/* Stats Summary */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="card-elevated p-3 text-center">
              <p className="text-2xl font-semibold text-success">8</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
            <div className="card-elevated p-3 text-center">
              <p className="text-2xl font-semibold text-warning">1</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
            <div className="card-elevated p-3 text-center">
              <p className="text-2xl font-semibold text-destructive">0</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </div>
        </div>

        {/* Records List */}
        <div className="flex-1 px-6 py-2 overflow-y-auto">
          <div className="space-y-3">
            {records.map((record, index) => (
              <div
                key={record.id}
                className="card-elevated p-4 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <StatusIcon status={record.status} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="font-medium text-sm">{formatDate(record.date)}</p>
                    </div>
                    {record.time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{record.time}</p>
                      </div>
                    )}
                  </div>

                  <StatusBadge status={record.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <BottomNavigation />
      </div>
    </MobileContainer>
  );
};

export default HistoryScreen;
