import { useState, useEffect } from "react";
import { Download, Send } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { notificationTriggerService, reportsService } from "@server";
import { OverviewTab } from "@/components/reports/OverviewTab";
import { AttendanceHistoryTab } from "@/components/reports/AttendanceHistoryTab";
import { ReportsExportTab } from "@/components/reports/ReportsExportTab";

type ViewMode = "overview" | "history" | "reports";

const AdminHistoryReportsScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ViewMode>("overview");
  const [loading, setLoading] = useState(true);
  const [showNotificationSheet, setShowNotificationSheet] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSendNotification = async () => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
      return;
    }

    setIsSendingNotification(true);

    try {
      const attendanceData = await notificationTriggerService.getCurrentAttendanceData();
      
      if (attendanceData.error) {
        toast({ title: "Error", description: attendanceData.error.message, variant: "destructive" });
        setIsSendingNotification(false);
        return;
      }

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const currentTime = `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;

      const result = await notificationTriggerService.triggerNotification({
        slotNumber: 1,
        slotTime: currentTime,
        presentCount: attendanceData.presentCount,
        lateCount: attendanceData.lateCount,
        totalCount: attendanceData.totalCount,
        attendanceRate: attendanceData.attendanceRate,
        triggeredBy: user.id,
      });

      setIsSendingNotification(false);
      setShowNotificationSheet(false);

      if (result.success) {
        const totalSent = result.emailsSent + result.smsSent;
        toast({
          title: "Notifications Sent!",
          description: `Successfully sent ${totalSent} notification(s).`,
        });
      } else {
        toast({
          title: "Failed to Send",
          description: result.message || "Failed to send notifications",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsSendingNotification(false);
      setShowNotificationSheet(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-full">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display mb-1">History & Reports</h1>
              <p className="text-caption">Attendance analytics and detailed history</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowNotificationSheet(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                <Send className="w-4 h-4" />Send Alert
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewMode)} className="flex-1 flex flex-col">
          <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-border">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Attendance History</TabsTrigger>
              <TabsTrigger value="reports">Reports & Export</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 px-4 sm:px-6 lg:px-8 py-4 overflow-y-auto">
            <OverviewTab />
          </TabsContent>

          {/* Attendance History Tab */}
          <TabsContent value="history" className="flex-1 px-4 sm:px-6 lg:px-8 py-4 overflow-y-auto">
            <AttendanceHistoryTab />
          </TabsContent>

          {/* Reports & Export Tab */}
          <TabsContent value="reports" className="flex-1 px-4 sm:px-6 lg:px-8 py-4 overflow-y-auto">
            <ReportsExportTab />
          </TabsContent>
        </Tabs>

        {/* Notification Sheet */}
        <Sheet open={showNotificationSheet} onOpenChange={setShowNotificationSheet}>
          <SheetContent side="bottom" className="rounded-t-3xl">
            <SheetHeader className="text-left">
              <SheetTitle>Send Attendance Alert</SheetTitle>
              <SheetDescription>Send SMS & Email notification to HR contacts</SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-4">
              <button 
                onClick={handleSendNotification} 
                disabled={isSendingNotification} 
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSendingNotification ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Now
                  </>
                )}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                SMS & Email will be sent to all enabled HR contacts immediately
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
};

export default AdminHistoryReportsScreen;
