import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Mail, Phone, Trash2, Edit2, Bell, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { notificationSettingsService } from "@server";
import type { NotificationSlot, NotificationContact } from "@server";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const NotificationSettingsScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<NotificationSlot[]>([]);
  const [contacts, setContacts] = useState<NotificationContact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState<NotificationContact | null>(null);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);

  // Form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [slotsResult, contactsResult] = await Promise.all([
      notificationSettingsService.getSlots(),
      notificationSettingsService.getContacts(),
    ]);

    if (!slotsResult.error) setSlots(slotsResult.slots);
    if (!contactsResult.error) setContacts(contactsResult.contacts);
    setLoading(false);
  };

  const handleSlotToggle = async (slotNumber: 1 | 2 | 3, currentEnabled: boolean) => {
    if (!user) return;

    const slot = slots.find(s => s.slot_number === slotNumber);
    if (!slot) return;

    const { success, error } = await notificationSettingsService.updateSlot(
      slotNumber,
      slot.slot_time,
      !currentEnabled,
      user.id
    );

    if (success) {
      toast({ title: "Slot updated", description: `Notification slot ${slotNumber} ${!currentEnabled ? 'enabled' : 'disabled'}` });
      fetchData();
    } else {
      toast({ title: "Error", description: error?.message || "Failed to update slot", variant: "destructive" });
    }
  };

  const handleSlotTimeChange = async (slotNumber: 1 | 2 | 3, newTime: string) => {
    if (!user) return;

    const slot = slots.find(s => s.slot_number === slotNumber);
    if (!slot) return;

    const { success, error } = await notificationSettingsService.updateSlot(
      slotNumber,
      newTime + ":00",
      slot.is_enabled,
      user.id
    );

    if (success) {
      toast({ title: "Time updated", description: `Slot ${slotNumber} time updated to ${newTime}` });
      fetchData();
    } else {
      toast({ title: "Error", description: error?.message || "Failed to update time", variant: "destructive" });
    }
  };

  const handleAddContact = async () => {
    if (!user) return;
    if (!contactName.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    if (!contactEmail.trim() && !contactPhone.trim()) {
      toast({ title: "Error", description: "Either email or phone is required", variant: "destructive" });
      return;
    }

    const { success, error } = await notificationSettingsService.addContact(
      contactName,
      contactEmail.trim() || null,
      contactPhone.trim() || null,
      user.id
    );

    if (success) {
      toast({ title: "Contact added", description: `${contactName} added successfully` });
      setShowAddContact(false);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      fetchData();
    } else {
      toast({ title: "Error", description: error?.message || "Failed to add contact", variant: "destructive" });
    }
  };

  const handleUpdateContact = async () => {
    if (!editingContact) return;
    if (!contactName.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    if (!contactEmail.trim() && !contactPhone.trim()) {
      toast({ title: "Error", description: "Either email or phone is required", variant: "destructive" });
      return;
    }

    const { success, error } = await notificationSettingsService.updateContact(
      editingContact.id,
      contactName,
      contactEmail.trim() || null,
      contactPhone.trim() || null,
      editingContact.is_enabled
    );

    if (success) {
      toast({ title: "Contact updated", description: `${contactName} updated successfully` });
      setEditingContact(null);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      fetchData();
    } else {
      toast({ title: "Error", description: error?.message || "Failed to update contact", variant: "destructive" });
    }
  };

  const handleDeleteContact = async () => {
    if (!deleteContactId) return;

    const { success, error} = await notificationSettingsService.deleteContact(deleteContactId);

    if (success) {
      toast({ title: "Contact deleted", description: "Contact removed successfully" });
      setDeleteContactId(null);
      fetchData();
    } else {
      toast({ title: "Error", description: error?.message || "Failed to delete contact", variant: "destructive" });
    }
  };

  const handleEditContact = (contact: NotificationContact) => {
    setEditingContact(contact);
    setContactName(contact.name);
    setContactEmail(contact.email || "");
    setContactPhone(contact.phone || "");
    setShowAddContact(true);
  };

  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':');
    const h = parseInt(hour);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minute} ${period}`;
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
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate("/admin/settings")} className="p-2 hover:bg-accent rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-display">Notification Settings</h1>
              <p className="text-caption">Configure SMS & Email notifications</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto space-y-6">
          {/* Notification Slots */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Notification Time Slots</h2>
            </div>
            <div className="card-elevated divide-y divide-border">
              {slots.map((slot) => (
                <div key={slot.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">Slot {slot.slot_number}</span>
                      <input
                        type="time"
                        value={slot.slot_time.substring(0, 5)}
                        onChange={(e) => handleSlotTimeChange(slot.slot_number as 1 | 2 | 3, e.target.value)}
                        className="px-3 py-1.5 border border-border rounded-lg text-sm"
                      />
                      <span className="text-xs text-muted-foreground">
                        {formatTime(slot.slot_time)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSlotToggle(slot.slot_number as 1 | 2 | 3, slot.is_enabled)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      slot.is_enabled
                        ? "bg-success text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {slot.is_enabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* HR Contacts */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">HR Contacts</h2>
              </div>
              <button
                onClick={() => {
                  setShowAddContact(true);
                  setEditingContact(null);
                  setContactName("");
                  setContactEmail("");
                  setContactPhone("");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>

            {contacts.length === 0 ? (
              <div className="card-elevated p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No HR contacts added yet</p>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                >
                  Add First Contact
                </button>
              </div>
            ) : (
              <div className="card-elevated divide-y divide-border">
                {contacts.map((contact) => (
                  <div key={contact.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{contact.name}</p>
                        <div className="flex flex-col gap-1 mt-2">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              {contact.email}
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                        <span
                          className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                            contact.is_enabled
                              ? "bg-success-muted text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {contact.is_enabled ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditContact(contact)}
                          className="p-2 hover:bg-accent rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteContactId(contact.id)}
                          className="p-2 hover:bg-destructive-muted text-destructive rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Contact Modal */}
        {showAddContact && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingContact ? "Edit Contact" : "Add Contact"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg"
                    placeholder="HR Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg"
                    placeholder="hr@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg"
                    placeholder="+919876543210"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  * At least one of email or phone is required
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddContact(false);
                    setEditingContact(null);
                    setContactName("");
                    setContactEmail("");
                    setContactPhone("");
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={editingContact ? handleUpdateContact : handleAddContact}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                  {editingContact ? "Update" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteContactId} onOpenChange={() => setDeleteContactId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
              <AlertDialogDescription>
                This contact will be permanently removed and will no longer receive notifications.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteContact} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default NotificationSettingsScreen;
