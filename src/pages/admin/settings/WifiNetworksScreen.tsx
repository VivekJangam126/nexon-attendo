import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wifi, Plus, Trash2, Signal, Check } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface WifiNetwork {
  id: string;
  ssid: string;
  macAddress: string;
  location: string;
}

const WifiNetworksScreen = () => {
  const navigate = useNavigate();
  const [networks, setNetworks] = useState<WifiNetwork[]>([
    { id: "1", ssid: "Nexon-Office-5G", macAddress: "AA:BB:CC:DD:EE:FF", location: "Head Office" },
    { id: "2", ssid: "Nexon-Office-2.4G", macAddress: "11:22:33:44:55:66", location: "Head Office" },
    { id: "3", ssid: "Nexon-Branch-WiFi", macAddress: "77:88:99:AA:BB:CC", location: "Branch Office" },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSsid, setNewSsid] = useState("");
  const [newMac, setNewMac] = useState("");

  const addNetwork = () => {
    if (!newSsid.trim()) {
      toast({
        title: "Error",
        description: "Please enter a network SSID.",
        variant: "destructive",
      });
      return;
    }

    const newNetwork: WifiNetwork = {
      id: Date.now().toString(),
      ssid: newSsid,
      macAddress: newMac || "Auto-detect",
      location: "Head Office",
    };

    setNetworks(prev => [...prev, newNetwork]);
    setNewSsid("");
    setNewMac("");
    setShowAddForm(false);
    toast({
      title: "Network Added",
      description: `${newSsid} has been added to allowed networks.`,
    });
  };

  const deleteNetwork = (id: string) => {
    setNetworks(prev => prev.filter(n => n.id !== id));
    toast({
      title: "Network Removed",
      description: "Wi-Fi network has been removed.",
    });
  };

  const testConnectivity = () => {
    toast({
      title: "Testing Connectivity",
      description: "Checking network availability...",
    });
    setTimeout(() => {
      toast({
        title: "Connection Successful",
        description: "All configured networks are reachable.",
      });
    }, 1500);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full pb-20 md:pb-0">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 pb-4 border-b border-border">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate("/admin/settings")}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-display">Wi-Fi Networks</h1>
              <p className="text-caption">Configure allowed networks</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-4 overflow-y-auto max-w-3xl">
          {/* Test Connectivity */}
          <button 
            onClick={testConnectivity}
            className="w-full card-elevated p-4 flex items-center justify-center gap-2 text-primary font-medium hover:bg-muted/50 transition-colors"
          >
            <Signal className="w-5 h-5" />
            Test Connectivity
          </button>

          {/* Add Network Form */}
          {showAddForm ? (
            <div className="card-elevated p-4 space-y-4 animate-fade-in-up">
              <h3 className="font-medium">Add New Network</h3>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Network SSID *</label>
                <Input
                  value={newSsid}
                  onChange={(e) => setNewSsid(e.target.value)}
                  placeholder="Enter Wi-Fi name"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">MAC Address (Optional)</label>
                <Input
                  value={newMac}
                  onChange={(e) => setNewMac(e.target.value)}
                  placeholder="AA:BB:CC:DD:EE:FF"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 bg-muted text-foreground rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={addNetwork}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAddForm(true)}
              className="w-full card-elevated p-4 flex items-center justify-center gap-2 text-primary font-medium hover:bg-muted/50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add New Network
            </button>
          )}

          {/* Network List */}
          <div className="space-y-3">
            {networks.map((network, index) => (
              <div 
                key={network.id}
                className="card-elevated p-4 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wifi className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{network.ssid}</p>
                    <p className="text-xs text-muted-foreground">{network.macAddress}</p>
                    <p className="text-xs text-muted-foreground">{network.location}</p>
                  </div>
                  <button 
                    onClick={() => deleteNetwork(network.id)}
                    className="p-2 hover:bg-destructive-muted rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {networks.length === 0 && (
            <div className="text-center py-12">
              <Wifi className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No Wi-Fi networks configured</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default WifiNetworksScreen;
