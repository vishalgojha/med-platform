import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pill, Clock, Bell, BellRing, BellOff, Plus, Pencil, Trash2, Check, X, Shield, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import MedicationReminderForm from "./MedicationReminderForm";
import CalendarExportButton, { ExportAllRemindersButton } from "./CalendarExport";
import RefillReminder, { RefillSummaryCard, needsRefill } from "./RefillReminder";
import DrugInteractionChecker from "./DrugInteractionChecker";
import { QuickMedicationLog } from "./MedicationIntakeLog";

const TIMING_LABELS = {
  specific_time: "At set times",
  before_meal: "Before meal",
  after_meal: "After meal",
  with_meal: "With meal",
  bedtime: "At bedtime",
  wakeup: "After waking",
  interval: "Every X hours"
};

const NOTIFICATION_ICONS = {
  gentle: Bell,
  urgent: BellRing,
  silent: BellOff
};

export default function MedicationRemindersList({ reminders = [], profile, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [showInteractionChecker, setShowInteractionChecker] = useState(false);

  const handleSave = async (formData) => {
    if (!formData.medication_name || formData.medication_name === "__custom__") {
      toast.error("Please enter a medication name");
      return;
    }
    
    try {
      const payload = {
        ...formData,
        user_email: profile?.user_email
      };
      
      if (editingReminder) {
        await appClient.entities.MedicationReminder.update(editingReminder.id, payload);
        toast.success("Reminder updated!");
      } else {
        await appClient.entities.MedicationReminder.create(payload);
        toast.success("Reminder created!");
      }
      setShowForm(false);
      setEditingReminder(null);
      onUpdate?.();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save reminder");
    }
  };

  const handleDelete = async (id) => {
    try {
      await appClient.entities.MedicationReminder.delete(id);
      toast.success("Reminder deleted");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const toggleActive = async (reminder) => {
    try {
      await appClient.entities.MedicationReminder.update(reminder.id, {
        is_active: !reminder.is_active
      });
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleRefill = async (reminder) => {
    try {
      const newPillCount = reminder.pills_per_strip || 30;
      await appClient.entities.MedicationReminder.update(reminder.id, {
        pills_remaining: (reminder.pills_remaining || 0) + newPillCount,
        last_refill_date: format(new Date(), "yyyy-MM-dd")
      });
      toast.success(`${reminder.medication_name} refilled!`);
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to update refill");
    }
  };

  const getTimingDisplay = (reminder) => {
    if (reminder.timing_type === "specific_time" && reminder.specific_times?.length) {
      return reminder.specific_times.map(t => format(new Date(`2000-01-01T${t}`), "h:mm a")).join(", ");
    }
    if (reminder.timing_type === "interval") {
      return `Every ${reminder.interval_hours} hours`;
    }
    if (["before_meal", "after_meal", "with_meal"].includes(reminder.timing_type)) {
      const offset = reminder.meal_offset_minutes || 0;
      if (offset < 0) return `${Math.abs(offset)} mins before meal`;
      if (offset > 0) return `${offset} mins after meal`;
      return "With meal";
    }
    return TIMING_LABELS[reminder.timing_type] || reminder.timing_type;
  };

  const NotifIcon = (style) => NOTIFICATION_ICONS[style] || Bell;

  return (
    <div className="space-y-4">
      {/* Refill Alerts */}
      {reminders.some(needsRefill) && (
        <RefillReminder 
          reminders={reminders} 
          onRefill={handleRefill}
          onDismiss={() => {}}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Pill className="w-5 h-5 text-violet-500" />
          Medication Reminders
        </h3>
        <div className="flex items-center gap-2">
          {reminders.length >= 2 && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowInteractionChecker(true)}
              className="text-violet-600"
            >
              <Shield className="w-4 h-4 mr-1" /> Check Interactions
            </Button>
          )}
          <ExportAllRemindersButton reminders={reminders} />
          <Button size="sm" onClick={() => { setEditingReminder(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl">
          <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No medication reminders set</p>
          <Button variant="link" onClick={() => setShowForm(true)} className="mt-2">
            Add your first reminder
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => {
            const Icon = NotifIcon(reminder.notification_style);
            return (
              <div
                key={reminder.id}
                className={`p-4 rounded-xl border transition-all ${
                  reminder.is_active 
                    ? "bg-white border-slate-200" 
                    : "bg-slate-50 border-slate-100 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-800">{reminder.medication_name}</h4>
                      <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">
                        {reminder.dosage}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {getTimingDisplay(reminder)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon className="w-3.5 h-3.5" />
                        {reminder.notification_style}
                      </span>
                    </div>
                    {reminder.notes && (
                      <p className="text-xs text-slate-400 mt-1">📝 {reminder.notes}</p>
                    )}
                    {reminder.last_taken && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Last taken: {format(new Date(reminder.last_taken), "MMM d, h:mm a")}
                      </p>
                    )}
                    {reminder.pills_remaining > 0 && (
                      <p className={`text-xs mt-1 ${needsRefill(reminder) ? "text-amber-600" : "text-slate-400"}`}>
                        {needsRefill(reminder) && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                        {reminder.pills_remaining} {reminder.dosage_unit || "pills"} remaining
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={reminder.is_active}
                    onCheckedChange={() => toggleActive(reminder)}
                  />
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                  <div className="flex-1">
                    <QuickMedicationLog 
                      reminder={reminder} 
                      profile={profile} 
                      onComplete={onUpdate} 
                    />
                  </div>
                  <CalendarExportButton reminder={reminder} />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => { setEditingReminder(reminder); setShowForm(true); }}
                  >
                    <Pencil className="w-4 h-4 text-slate-400" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(reminder.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReminder ? "Edit Reminder" : "Add Medication Reminder"}
            </DialogTitle>
          </DialogHeader>
          <MedicationReminderForm
            reminder={editingReminder}
            existingMedications={profile?.medications || []}
            allReminders={reminders}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingReminder(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Drug Interaction Checker Dialog */}
      <Dialog open={showInteractionChecker} onOpenChange={setShowInteractionChecker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Drug Interaction Check</DialogTitle>
          </DialogHeader>
          <DrugInteractionChecker medications={reminders} />
        </DialogContent>
      </Dialog>
    </div>
  );
}