import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Sun, Moon } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { RecurringHoliday, SpecificHoliday } from "@server";

const HolidayCalendarScreen = () => {
  const { user } = useAuth();
  const [recurringHolidays, setRecurringHolidays] = useState<RecurringHoliday[]>([]);
  const [specificHolidays, setSpecificHolidays] = useState<SpecificHoliday[]>([]);
  const [loading, setLoading] = useState(true);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    fetchHolidays();
  }, [user]);

  const fetchHolidays = async () => {
    if (!user) {
      console.log('[Employee Calendar] No user found');
      return;
    }

    console.log('[Employee Calendar] Fetching holidays for user:', user.id);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[Employee Calendar] No session found');
        return;
      }

      // Get holidays from 30 days ago to 6 months in future
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      console.log('[Employee Calendar] Fetching holidays from', startDate, 'to', endDate);

      const response = await fetch(`/api/holidays?start_date=${startDate}&end_date=${endDate}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('[Employee Calendar] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Employee Calendar] Received data:', data);
        console.log('[Employee Calendar] Recurring holidays:', data.recurring_holidays?.length || 0);
        console.log('[Employee Calendar] Specific holidays:', data.specific_holidays?.length || 0);
        
        setRecurringHolidays(data.recurring_holidays || []);
        setSpecificHolidays(data.specific_holidays || []);
      } else {
        const error = await response.json();
        console.error('[Employee Calendar] Error response:', error);
      }
    } catch (error) {
      console.error("[Employee Calendar] Error fetching holidays:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getHolidayTypeColor = (type: string) => {
    switch (type) {
      case "public_holiday":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "festival":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "company_event":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getHolidayTypeLabel = (type: string) => {
    switch (type) {
      case "public_holiday":
        return "Public Holiday";
      case "festival":
        return "Festival";
      case "company_event":
        return "Company Event";
      default:
        return "Other";
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Holidays">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Holidays">
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-amber-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">My Holiday Schedule</h2>
              <p className="text-sm text-gray-600">View your recurring and upcoming holidays</p>
            </div>
          </div>
        </div>

        {/* Recurring Holidays */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recurring Holidays</h3>
          </div>

          {recurringHolidays.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recurringHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="p-4 rounded-lg bg-amber-50 border border-amber-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-amber-600">
                        {dayNames[holiday.day_of_week].substring(0, 1)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{dayNames[holiday.day_of_week]}</p>
                      <p className="text-xs text-gray-600">Weekly holiday</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sun className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">No recurring holidays</p>
              <p className="text-xs text-gray-500">You work all days of the week</p>
            </div>
          )}
        </div>

        {/* Specific Holidays */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Holidays</h3>
          </div>

          {specificHolidays.length > 0 ? (
            <div className="space-y-3">
              {specificHolidays.map((holiday) => {
                const holidayDate = new Date(holiday.holiday_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                holidayDate.setHours(0, 0, 0, 0);
                
                const isToday = holidayDate.getTime() === today.getTime();
                const isPast = holidayDate < today;
                const isFuture = holidayDate > today;

                return (
                  <div
                    key={holiday.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      isToday
                        ? "bg-green-50 border-green-300 ring-2 ring-green-400"
                        : isPast
                        ? "bg-gray-100 border-gray-300 opacity-60"
                        : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-gray-900">{holiday.reason}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getHolidayTypeColor(
                              holiday.holiday_type
                            )}`}
                          >
                            {getHolidayTypeLabel(holiday.holiday_type)}
                          </span>
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                              Today
                            </span>
                          )}
                          {isPast && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600 border border-gray-300">
                              Past
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{formatDate(holiday.holiday_date)}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          isToday ? "text-green-600" : isPast ? "text-gray-400" : "text-blue-600"
                        }`}>
                          {new Date(holiday.holiday_date).getDate()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(holiday.holiday_date).toLocaleDateString("en-US", { month: "short" })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Moon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">No holidays</p>
              <p className="text-xs text-gray-500">No holidays scheduled</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Holidays are managed by your administrator. You will not be marked absent on your
            designated holiday days. Contact your admin if you have questions about your holiday schedule.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HolidayCalendarScreen;
