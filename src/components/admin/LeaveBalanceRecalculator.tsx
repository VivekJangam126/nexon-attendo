import { useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export function LeaveBalanceRecalculator() {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; results?: any[] } | null>(null);

  const handleRecalculateAll = async () => {
    setIsRecalculating(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/leave/recalculate-all-balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        console.log('Bulk recalculation completed:', data.message);
      } else {
        console.error('Bulk recalculation failed:', data.error);
      }
    } catch (error) {
      console.error('Error during bulk recalculation:', error);
      setResult({
        success: false,
        message: 'Network error occurred during recalculation'
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Leave Balance Recalculation
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Recalculate leave balances for all employees based on their approved leave requests. 
            Use this when leave requests have been deleted or modified outside the normal workflow.
          </p>
          
          <button
            onClick={handleRecalculateAll}
            disabled={isRecalculating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Recalculating...' : 'Recalculate All Balances'}
          </button>

          {result && (
            <div className={`mt-4 p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? 'Success' : 'Error'}
                  </p>
                  <p className={`text-sm ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.message}
                  </p>
                  {result.results && result.results.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">Details:</p>
                      <div className="max-h-32 overflow-y-auto">
                        {result.results.map((emp, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                            {emp.success ? (
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span>{emp.employeeName}: {emp.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}