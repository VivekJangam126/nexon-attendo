import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users } from 'lucide-react';

interface Employee {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface LeaveData {
  id: string;
  employee?: Employee;
  leave_type?: { name: string };
  end_date: string;
}

interface WhosOutTodayProps {
  employees: LeaveData[];
}

export function WhosOutToday({ employees }: WhosOutTodayProps) {
  // Filter out items without employee data
  const validEmployees = employees.filter(item => item.employee);

  return (
    <div className="card-elevated p-4 rounded-xl animate-fade-in-up">
      <h3 className="text-sm font-semibold mb-3">Who's Out Today</h3>
      {validEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground text-center">No one is on leave today</p>
        </div>
      ) : (
        <div className="space-y-2">
          {validEmployees.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={item.employee?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {item.employee?.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {item.employee?.full_name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {item.leave_type?.name || 'Leave'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                  Returns {new Date(item.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
