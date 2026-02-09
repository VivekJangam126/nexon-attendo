import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import MobileContainer from "@/components/MobileContainer";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AttendanceWindowScreen = () => {
  const navigate = useNavigate();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [activeDays, setActiveDays] = useState({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: false,
    sun: false,
  });

  const timeOptions = [
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00",
  ];

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const toggleDay = (day: keyof typeof activeDays) => {
    setActiveDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const handleSave = () => {
    const activeDayNames = Object.entries(activeDays)
      .filter(([_, active]) => active)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1))
      .join(", ");

    toast({
      title: "Settings Saved",
      description: `Attendance window: ${formatTime(startTime)} - ${formatTime(endTime)} on ${activeDayNames}`,
    });
  };

  const days = [
    { key: "mon", label: "Mon" },
    { key: "tue", label: "Tue" },
    { key: "wed", label: "Wed" },
    { key: "thu", label: "Thu" },
    { key: "fri", label: "Fri" },
    { key: "sat", label: "Sat" },
    { key: "sun", label: "Sun" },
  ];

  return (
    <MobileContainer>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 border-b border-border">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate("/admin/settings")}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-display">Attendance Window</h1>
              <p className="text-caption">Configure timing rules</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
          {/* Time Selection */}
          <div className="animate-fade-in-up">
            <h2 className="text-overline mb-3">Working Hours</h2>
            <div className="card-elevated p-4 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Start Time</label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        {formatTime(startTime)}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {formatTime(time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">End Time</label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        {formatTime(endTime)}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {formatTime(time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Working Days */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-overline mb-3">Working Days</h2>
            <div className="card-elevated p-4">
              <div className="grid grid-cols-7 gap-2">
                {days.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleDay(key as keyof typeof activeDays)}
                    className={`py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeDays[key as keyof typeof activeDays]
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Tap to toggle working days
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <h2 className="text-overline mb-3">Preview</h2>
            <div className="card-elevated p-4 bg-accent/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium">{formatTime(startTime)} - {formatTime(endTime)}</p>
                  <p className="text-sm text-muted-foreground">
                    {Object.entries(activeDays)
                      .filter(([_, active]) => active)
                      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3))
                      .join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <button
              onClick={handleSave}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
};

export default AttendanceWindowScreen;
