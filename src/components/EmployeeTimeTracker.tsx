import { useState, useEffect } from "react";
import { Clock, Coffee, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { breakLogsService } from "@server";
import type { BreakLog } from "@server";

interface TimelineEvent {
  id: string;
  time: string;
  type: 'shift_start' | 'shift_end' | 'break_start' | 'break_end';
  label: string;
}

interface EmployeeTimeTrackerProps {
  employeeId: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  isAdmin?: boolean;
  employeeName?: string;
  currentUserId?: string; // For tracking who creates the break
  onBreakUpdate?: () => void; // Callback to trigger refresh in parent components
}

export const EmployeeTimeTracker = ({
  employeeId,
  checkInTime,
  checkOutTime,
  isAdmin = false,
  employeeName = "Employee",
  currentUserId,
  onBreakUpdate,
}: EmployeeTimeTrackerProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [breakLogs, setBreakLogs] = useState<BreakLog[]>([]);
  const [currentBreak, setCurrentBreak] = useState<BreakLog | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load break logs from database (only today's logs)
  useEffect(() => {
    const fetchBreakLogs = async () => {
      // Always fetch only today's break logs for the timeline
      const today = new Date().toISOString().split('T')[0];
      const { breakLogs: logs, error } = await breakLogsService.getBreakLogsForDateRange(
        employeeId, 
        today, 
        today
      );
      
      if (error) {
        console.error('Failed to fetch break logs:', error);
        return;
      }
      
      setBreakLogs(logs);
      
      // Find active break
      const activeBreak = logs.find(log => !log.end_time);
      setCurrentBreak(activeBreak || null);
    };

    fetchBreakLogs();
  }, [employeeId]);

  // Build timeline from check-in, check-out, and breaks
  useEffect(() => {
    const events: TimelineEvent[] = [];

    if (checkInTime) {
      events.push({
        id: 'check-in',
        time: checkInTime,
        type: 'shift_start',
        label: 'Shift Started',
      });
    }

    breakLogs.forEach((log) => {
      events.push({
        id: `break-start-${log.id}`,
        time: log.start_time,
        type: 'break_start',
        label: 'Tea Break Started',
      });
      if (log.end_time) {
        events.push({
          id: `break-end-${log.id}`,
          time: log.end_time,
          type: 'break_end',
          label: 'Break Ended',
        });
      }
    });

    if (checkOutTime) {
      events.push({
        id: 'check-out',
        time: checkOutTime,
        type: 'shift_end',
        label: 'Shift Ended',
      });
    }

    events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    setTimeline(events);
  }, [checkInTime, checkOutTime, breakLogs]);

  const formatCurrentTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatTimelineTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleStartBreak = async () => {
    if (currentBreak) {
      toast({
        title: "Break Already Active",
        description: "Please end the current break first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const createdBy = currentUserId || employeeId;
    const result = await breakLogsService.startBreak(employeeId, createdBy);
    
    if (result.success && result.breakLog) {
      setCurrentBreak(result.breakLog);
      setBreakLogs([...breakLogs, result.breakLog]);
      toast({ 
        title: "Break Started", 
        description: isAdmin ? `Tea break started for ${employeeName}` : "Tea break has started" 
      });
      
      // Trigger refresh in parent components
      if (onBreakUpdate) {
        onBreakUpdate();
      }
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to start break",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleEndBreak = async () => {
    if (!currentBreak) return;

    setLoading(true);
    const result = await breakLogsService.endBreak(employeeId);
    
    if (result.success && result.breakLog) {
      setCurrentBreak(null);
      setBreakLogs(breakLogs.map(log => 
        log.id === result.breakLog!.id ? result.breakLog! : log
      ));
      toast({ 
        title: "Break Ended", 
        description: isAdmin ? `Break ended for ${employeeName}` : "Break has been completed" 
      });
      
      // Trigger refresh in parent components
      if (onBreakUpdate) {
        onBreakUpdate();
      }
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to end break",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Real-Time Clock */}
      <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center mb-4 pt-12">
          <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2 font-mono">
            {formatCurrentTime(currentTime)}
          </div>
          <div className="text-sm text-gray-600">
            {formattedDate}
          </div>
        </div>

        {/* Break Controls */}
        {checkInTime && !checkOutTime && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Coffee className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                {isAdmin ? `${employeeName} Break Management` : 'Break Management'}
              </span>
            </div>
            
            {!currentBreak ? (
              <div className="flex justify-center">
                <button
                  onClick={handleStartBreak}
                  disabled={loading}
                  className="py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Coffee className="w-4 h-4" />
                  )}
                  {loading ? 'Starting...' : 'Start Tea Break'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-amber-900">Break in Progress</p>
                  <p className="text-xs text-amber-700 mt-1">TEA BREAK</p>
                </div>
                <button
                  onClick={handleEndBreak}
                  disabled={loading}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {loading ? 'Ending...' : 'End Break'}
                </button>
              </div>
            )}
          </div>
        )}

        {!checkInTime && (
          <div className="text-center text-sm text-gray-500 mt-4">
            {isAdmin ? `${employeeName} needs to clock in first` : 'Clock in to start managing breaks'}
          </div>
        )}

        {checkInTime && checkOutTime && (
          <div className="text-center text-sm text-gray-500 mt-4">
            Shift completed for today
          </div>
        )}
      </div>

      {/* Today's Activity Log */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Today's Log
        </h3>
        {timeline.length === 0 ? (
          <div className="text-center py-6">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {timeline.map((event, index) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full ${
                    event.type === 'shift_start' ? 'bg-blue-500' :
                    event.type === 'shift_end' ? 'bg-red-500' :
                    event.type === 'break_start' ? 'bg-amber-500' :
                    'bg-green-500'
                  }`} />
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-xs font-medium text-gray-900">{event.label}</p>
                  <p className="text-xs text-gray-500">
                    {formatTimelineTime(event.time)}
                  </p>
                </div>
              </div>
            ))}
            {checkInTime && !checkOutTime && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-green-600">Session active...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};