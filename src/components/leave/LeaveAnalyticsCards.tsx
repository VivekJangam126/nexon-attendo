import { LeaveAnalytics } from '@server/types/leave';
import { Users, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface LeaveAnalyticsCardsProps {
  analytics: LeaveAnalytics;
}

export function LeaveAnalyticsCards({ analytics }: LeaveAnalyticsCardsProps) {
  const cards = [
    {
      title: 'Total Requests',
      value: analytics.total_requests,
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-accent',
    },
    {
      title: 'Pending',
      value: analytics.pending_requests,
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning-muted',
    },
    {
      title: 'On Leave Today',
      value: analytics.employees_on_leave_today,
      icon: Users,
      color: 'text-success',
      bg: 'bg-success-muted',
    },
    {
      title: 'This Month',
      value: analytics.leaves_this_month,
      icon: AlertCircle,
      color: 'text-info',
      bg: 'bg-accent',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 animate-fade-in-up">
      {cards.map((card) => (
        <div key={card.title} className="card-elevated p-2 sm:p-3 md:p-4 rounded-lg md:rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 sm:mb-3">
            <div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${card.bg} rounded-md md:rounded-lg flex items-center justify-center mb-1 sm:mb-0`}>
              <card.icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ${card.color}`} />
            </div>
            <span className="text-xs sm:text-xs md:text-xs text-muted-foreground font-medium leading-tight">{card.title}</span>
          </div>
          <p className={`text-lg sm:text-xl md:text-2xl font-bold ${card.color} leading-none`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
