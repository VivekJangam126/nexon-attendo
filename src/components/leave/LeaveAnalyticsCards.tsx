import { LeaveAnalytics } from '@/server/types/leave';
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up">
      {cards.map((card) => (
        <div key={card.title} className="card-elevated p-4 rounded-xl">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <span className="text-xs text-muted-foreground font-medium">{card.title}</span>
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
