import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeavePolicy } from '@/server/types/leave';
import { AlertCircle } from 'lucide-react';

interface PolicyGuideCardProps {
  policies: LeavePolicy[];
}

export function PolicyGuideCard({ policies }: PolicyGuideCardProps) {
  return (
    <div className="card-elevated p-4 rounded-xl animate-fade-in-up">
      <h3 className="text-sm font-semibold mb-3">Policy Guide</h3>
      <div className="space-y-3">
        {policies.map((policy) => (
          <div key={policy.id} className="flex gap-2.5">
            <div className="w-1 bg-primary rounded-full flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-foreground mb-0.5">
                {policy.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {policy.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
