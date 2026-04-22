import { useState } from "react";
import { Users, Clock, FileText } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminEmployeesScreen from "./AdminEmployeesScreen";
import ShiftManagementPage from "./ShiftManagementPage";
import { AdminLeaveDashboard } from "@/components/leave/AdminLeaveDashboard";

const UserManagementPage = () => {
  const [activeTab, setActiveTab] = useState("employees");

  const tabConfig = [
    {
      value: "employees",
      icon: Users,
      label: "Employees",
    },
    {
      value: "shifts",
      icon: Clock,
      label: "Shifts",
    },
    {
      value: "leave",
      icon: FileText,
      label: "Leave",
    },
  ];

  return (
    <AdminLayout title="User Management">
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Clean Tab Navigation */}
          <TabsList className="grid w-full grid-cols-3 gap-0 bg-muted p-1 rounded-lg h-auto border border-border/50">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-3 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-md"
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs font-medium">{tab.label.charAt(0)}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Contents - Clean layout */}
          <div className="mt-0">
            {/* Employees Tab */}
            <TabsContent value="employees" className="focus-visible:outline-none">
              <div className="w-full overflow-hidden">
                <AdminEmployeesScreen isEmbedded={true} />
              </div>
            </TabsContent>

            {/* Shift Management Tab */}
            <TabsContent value="shifts" className="focus-visible:outline-none">
              <div className="w-full overflow-hidden">
                <ShiftManagementPage isEmbedded={true} />
              </div>
            </TabsContent>

            {/* Leave Management Tab */}
            <TabsContent value="leave" className="focus-visible:outline-none">
              <div className="w-full overflow-hidden">
                <AdminLeaveDashboard isEmbedded={true} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default UserManagementPage;
