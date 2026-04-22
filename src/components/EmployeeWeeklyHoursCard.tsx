import { useMemo } from "react";
import { Calendar } from "lucide-react";

interface AttendanceRecord {
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: "present" | "late" | "absent" | "holiday" | "not_marked";
}

interface EmployeeWeeklyHoursCardProps {
  attendanceHistory: AttendanceRecord[];
}

const getStatusLabel = (status: string, hoursWorked: string | null): string => {
  if (!hoursWorked || hoursWorked === "-") {
    if (status === "absent") return "Absent";
    if (status === "holiday") return "Holiday";
    return "No Data";
  }
  if (status === "present") return "Present";
  if (status === "late") return "Late";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getStatusColor = (status: string, hoursWorked: string | null): string => {
  if (!hoursWorked || hoursWorked === "-") {
    if (status === "holiday") return "bg-blue-50 border-blue-200";
    if (status === "absent") return "bg-red-50 border-red-200";
    return "bg-gray-50 border-gray-200";
  }
  if (status === "late") return "bg-amber-50 border-amber-200";
  return "bg-green-50 border-green-200";
};

const getStatusBadgeColor = (status: string, hoursWorked: string | null): string => {
  if (!hoursWorked || hoursWorked === "-") {
    if (status === "holiday") return "bg-blue-100 text-blue-700";
    if (status === "absent") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  }
  if (status === "late") return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
};

export const EmployeeWeeklyHoursCard = ({ attendanceHistory }: EmployeeWeeklyHoursCardProps) => {
  const weeklyData = useMemo(() => {
    const today = new Date();
    const weekData: Array<{
      date: string;
      dayName: string;
      dayNum: string;
      month: string;
      checkInTime: string;
      hours: string;
      status: string;
    }> = [];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let totalMinutes = 0;

    // Get Monday of current week
    const monday = new Date(today);
    const day = monday.getDay();
    const daysBack = day === 0 ? 1 : day - 1; // If Sunday, go back 1; else go back to Monday
    monday.setDate(monday.getDate() - daysBack);

    // Show Monday to today (only days that have passed, up to Saturday)
    const daysToShow = Math.min(today.getDay() === 0 ? 0 : today.getDay() - 1, 5); // Max 5 (Sat is index 5)
    
    for (let i = 0; i <= daysToShow; i++) {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const dayNum = date.getDate();
      const monthStr = date.toLocaleString("en-US", { month: "short" });

      const record = attendanceHistory.find(r => r.date === dateStr);

      let hours = "-";
      let checkInTime = "No check-in";
      let status = "absent";

      if (record) {
        status = record.status;

        // Format check-in time
        if (record.check_in_time) {
          const checkInDate = new Date(record.check_in_time);
          checkInTime = checkInDate.toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
          });
        } else if (record.status === "holiday") {
          checkInTime = "Holiday";
        } else if (record.status === "absent") {
          checkInTime = "Absent";
        } else {
          checkInTime = "No check-in";
        }

        if (record.check_in_time && record.check_out_time && record.status !== "holiday") {
          // Calculate hours worked
          const checkIn = new Date(record.check_in_time);
          const checkOut = new Date(record.check_out_time);
          const diffMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60));

          const hoursWorked = Math.floor(diffMinutes / 60);
          const minutesWorked = diffMinutes % 60;

          totalMinutes += diffMinutes;

          hours = minutesWorked > 0 ? `${hoursWorked}h ${minutesWorked}m` : `${hoursWorked}h`;
        }
      }

      weekData.push({
        date: dateStr,
        dayName: dayNames[date.getDay()],
        dayNum: dayNum.toString().padStart(2, "0"),
        month: monthStr,
        checkInTime,
        hours,
        status,
      });
    }

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return { weekData, totalHours, totalMinutes: remainingMinutes };
  }, [attendanceHistory]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg flex-shrink-0">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-gray-900">Weekly Working Hours</h3>
          <p className="text-xs sm:text-sm text-gray-500">Monday to Saturday</p>
        </div>
      </div>

      {/* Weekly Data */}
      <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
        {weeklyData.weekData.map((day, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-colors ${getStatusColor(
              day.status,
              day.hours
            )}`}
          >
            {/* Left: Date and Check-in Time */}
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                {day.dayName}, {day.month} {day.dayNum}
              </div>
              <span className="text-xs text-gray-500 truncate block">{day.checkInTime}</span>
            </div>

            {/* Center: Hours */}
            <div className="text-right flex-shrink-0">
              <span className="font-semibold text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                {day.hours}
              </span>
            </div>

            {/* Right: Status Badge */}
            <div className="flex-shrink-0">
              <span
                className={`inline-flex items-center justify-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadgeColor(
                  day.status,
                  day.hours
                )}`}
              >
                {getStatusLabel(day.status, day.hours)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Total Hours */}
      <div className="border-t pt-3 sm:pt-4">
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm font-medium text-gray-600">Total This Week</span>
          <span className="text-base sm:text-lg font-bold text-gray-900">
            {weeklyData.totalHours}h{weeklyData.totalMinutes > 0 ? ` ${weeklyData.totalMinutes}m` : ""}
          </span>
        </div>
      </div>
    </div>
  );
};
