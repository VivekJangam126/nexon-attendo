import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, X, Eye, MessageSquare } from "lucide-react";
import { performanceAnalyticsService } from "@server";
import type { PerformanceAlert } from "@server";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface AlertManagementProps {
  employeeId?: string;
  showAllAlerts?: boolean;
}

export const AlertManagement = ({ employeeId, showAllAlerts = false }: AlertManagementProps) => {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<PerformanceAlert | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [employeeId]);

  const fetchAlerts = async () => {
    setLoading(true);
    if (employeeId) {
      const { alerts: empAlerts, error } = await performanceAnalyticsService.getEmployeeAlerts(employeeId);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch alerts",
          variant: "destructive",
        });
      } else {
        setAlerts(empAlerts);
      }
    }
    setLoading(false);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!profile) return;
    
    const result = await performanceAnalyticsService.acknowledgeAlert(alertId, profile.id);
    if (result.success) {
      toast({
        title: "Alert Acknowledged",
        description: "Alert has been acknowledged",
      });
      fetchAlerts();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to acknowledge alert",
        variant: "destructive",
      });
    }
  };

  const handleResolveAlert = async (alertId: string, notes?: string) => {
    const result = await performanceAnalyticsService.resolveAlert(alertId, notes);
    if (result.success) {
      toast({
        title: "Alert Resolved",
        description: "Alert has been resolved",
      });
      fetchAlerts();
      setShowDetails(false);
      setSelectedAlert(null);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to resolve alert",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return "bg-red-100 text-red-800 border-red-200";
      case 'red': return "bg-red-50 text-red-700 border-red-100";
      case 'yellow': return "bg-amber-50 text-amber-700 border-amber-100";
      default: return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'red': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'yellow': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-sm text-gray-600">No active alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border rounded-lg p-3 ${getSeverityColor(alert.severity)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {getSeverityIcon(alert.severity)}
              <div className="flex-1">
                <h4 className="font-medium text-sm">{alert.title}</h4>
                <p className="text-xs mt-1 opacity-90">{alert.message}</p>
                {alert.metric_value && alert.threshold_value && (
                  <p className="text-xs mt-1 font-medium">
                    Value: {alert.metric_value} (Threshold: {alert.threshold_value})
                  </p>
                )}
                <p className="text-xs mt-1 opacity-75">
                  {new Date(alert.created_at).toLocaleDateString()} at{' '}
                  {new Date(alert.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setSelectedAlert(alert);
                  setShowDetails(true);
                }}
                className="p-1 hover:bg-white/50 rounded transition-colors"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </button>
              
              {alert.status === 'active' && (
                <>
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="p-1 hover:bg-white/50 rounded transition-colors"
                    title="Acknowledge"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="p-1 hover:bg-white/50 rounded transition-colors"
                    title="Resolve"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Alert Details Modal */}
      {showDetails && selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Alert Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <p className="text-sm text-gray-900">{selectedAlert.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <p className="text-sm text-gray-900">{selectedAlert.message}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Severity</label>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getSeverityColor(selectedAlert.severity)}`}>
                  {selectedAlert.severity.toUpperCase()}
                </span>
              </div>
              
              {selectedAlert.metric_value && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Metric Value</label>
                  <p className="text-sm text-gray-900">{selectedAlert.metric_value}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-900">
                  {new Date(selectedAlert.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {selectedAlert.status === 'active' && (
                <button
                  onClick={() => handleResolveAlert(selectedAlert.id, "Resolved from details view")}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Resolve Alert
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};