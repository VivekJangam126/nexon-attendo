import { useState, useEffect } from "react";
import { Coffee, Clock, Calendar, Filter, ChevronDown, RefreshCw } from "lucide-react";
import { breakLogsService } from "@server";
import type { BreakLog } from "@server";
import { toast } from "@/hooks/use-toast";

interface BreakLogsHistoryProps {
  employeeId: string;
  employeeName?: string;
  refreshTrigger?: number; // Add refresh trigger prop
}

type TimeFilter = 'today' | 'week' | 'month';

interface BreakLogWithDuration extends BreakLog {
  duration?: number; // in minutes
  durationText?: string;
}

export const BreakLogsHistory = ({ employeeId, employeeName, refreshTrigger }: BreakLogsHistoryProps) => {
  const [breakLogs, setBreakLogs] = useState<BreakLogWithDuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('today');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchBreakLogs();
  }, [employeeId, activeFilter, refreshTrigger]); // Add refreshTrigger to dependencies

  const getDateRange = (filter: TimeFilter) => {
    const now = new Date();
    let startDate: string;
    let endDate: string;

    switch (filter) {
      case 'today':
        // Always use today's date, not yesterday or future dates
        const today = new Date();
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        startDate = weekStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = monthStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      default:
        startDate = endDate = now.toISOString().split('T')[0];
    }

    return { startDate, endDate };
  };

  const fetchBreakLogs = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(activeFilter);
      const { breakLogs: logs, error } = await breakLogsService.getBreakLogsForDateRange(
        employeeId,
        startDate,
        endDate
      );

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch break logs",
          variant: "destructive",
        });
        setBreakLogs([]);
        return;
      }

      // Calculate duration for each break
      const logsWithDuration = logs.map(log => {
        let duration = 0;
        let durationText = "In Progress";

        if (log.end_time) {
          const start = new Date(log.start_time);
          const end = new Date(log.end_time);
          duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
          
          if (duration < 60) {
            durationText = `${duration}m`;
          } else {
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;
            durationText = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
          }
        }

        return {
          ...log,
          duration,
          durationText,
        };
      });

      setBreakLogs(logsWithDuration);
    } catch (error) {
      console.error('Error fetching break logs:', error);
      toast({
        title: "Error",
        description: "Failed to load break history",
        variant: "destructive",
      });
      setBreakLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFilterLabel = (filter: TimeFilter) => {
    switch (filter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'Today';
    }
  };

  const getTotalStats = () => {
    const completedBreaks = breakLogs.filter(log => log.end_time);
    const totalBreaks = completedBreaks.length;
    const totalTime = completedBreaks.reduce((sum, log) => sum + (log.duration || 0), 0);
    const avgTime = totalBreaks > 0 ? Math.round(totalTime / totalBreaks) : 0;

    return { totalBreaks, totalTime, avgTime };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Coffee className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-gray-900">Break History</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Coffee className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-gray-900">Break History</h3>
          {employeeName && (
            <span className="text-sm text-gray-500">- {employeeName}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Manual Refresh Button */}
          <button
            onClick={fetchBreakLogs}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {getFilterLabel(activeFilter)}
              <ChevronDown className="w-4 h-4" />
            </button>

            {showFilters && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                {(['today', 'week', 'month'] as TimeFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setActiveFilter(filter);
                      setShowFilters(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      activeFilter === filter ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {getFilterLabel(filter)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {breakLogs.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalBreaks}</div>
            <div className="text-xs text-gray-600">Total Breaks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalTime < 60 ? `${stats.totalTime}m` : 
               `${Math.floor(stats.totalTime / 60)}h ${stats.totalTime % 60}m`}
            </div>
            <div className="text-xs text-gray-600">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.avgTime < 60 ? `${stats.avgTime}m` : 
               `${Math.floor(stats.avgTime / 60)}h ${stats.avgTime % 60}m`}
            </div>
            <div className="text-xs text-gray-600">Avg Duration</div>
          </div>
        </div>
      )}

      {/* Break Logs List */}
      {breakLogs.length === 0 ? (
        <div className="text-center py-8">
          <Coffee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {activeFilter === 'today' 
              ? "No breaks taken today" 
              : `No break records found for ${getFilterLabel(activeFilter).toLowerCase()}`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {breakLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">Tea Break</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.end_time 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {log.end_time ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(log.start_time)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(log.start_time)}
                      {log.end_time && ` - ${formatTime(log.end_time)}`}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-gray-900 text-sm">
                  {log.durationText}
                </div>
                {log.end_time && (
                  <div className="text-xs text-gray-500">
                    Duration
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          {activeFilter === 'today' 
            ? "Today's break records • Auto-refreshes when breaks are taken"
            : "All break times are automatically recorded for transparency and accuracy"
          }
        </p>
      </div>
    </div>
  );
};