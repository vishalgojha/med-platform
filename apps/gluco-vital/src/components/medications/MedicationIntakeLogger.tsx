import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Pill, CheckCircle, X, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { appClient } from "@/api/appClient";
import { toast } from "sonner";

export default function MedicationIntakeLogger({ 
  reminder, 
  profile, 
  open, 
  onOpenChange,
  onLogged 
}) {
  const [logging, setLogging] = useState(false);
  const [intakeData, setIntakeData] = useState({
    status: "taken",
    taken_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    skip_reason: "",
    notes: "",
    dosage_taken: reminder?.dosage || ""
  });

  const handleLog = async () => {
    setLogging(true);

    try {
      const now = new Date();
      const takenTime = intakeData.status === "taken" 
        ? new Date(intakeData.taken_at).toISOString() 
        : now.toISOString();

      // Create adherence record
      await appClient.entities.MedicationAdherence.create({
        user_email: profile?.user_email,
        reminder_id: reminder?.id,
        medication_name: reminder?.medication_name,
        scheduled_time: now.toISOString(),
        status: intakeData.status,
        taken_at: intakeData.status === "taken" ? takenTime : null,
        confirmed_via: "app",
        skip_reason: intakeData.status === "skipped" ? intakeData.skip_reason : null,
        notes: intakeData.notes
      });

      // Create health log for taken medications
      if (intakeData.status === "taken") {
        await appClient.entities.HealthLog.create({
          user_email: profile?.user_email,
          log_type: "medication",
          value: `${reminder?.medication_name} ${intakeData.dosage_taken}`,
          notes: intakeData.notes,
          measured_at: takenTime,
          status: "active"
        });

        // Update reminder's last_taken and decrease pills
        if (reminder?.id) {
          const updates = { last_taken: takenTime };
          if (reminder.pills_remaining != null && reminder.pills_remaining > 0) {
            updates.pills_remaining = reminder.pills_remaining - 1;
          }
          await appClient.entities.MedicationReminder.update(reminder.id, updates);
        }
      }

      toast.success(
        intakeData.status === "taken" 
          ? `${reminder?.medication_name} logged as taken!` 
          : `${reminder?.medication_name} marked as ${intakeData.status}`
      );

      onLogged?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Log error:", error);
      toast.error("Failed to log medication");
    } finally {
      setLogging(false);
    }
  };

  const SKIP_REASONS = [
    { value: "forgot", label: "Forgot to take" },
    { value: "side_effects", label: "Side effects" },
    { value: "ran_out", label: "Ran out of medication" },
    { value: "felt_better", label: "Feeling better" },
    { value: "doctor_advised", label: "Doctor advised to skip" },
    { value: "other", label: "Other reason" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-violet-500" />
            Log Medication Intake
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Medication Info */}
          <div className="p-3 bg-violet-50 rounded-lg border border-violet-200">
            <h4 className="font-medium text-violet-800">{reminder?.medication_name}</h4>
            <p className="text-sm text-violet-600">{reminder?.dosage}</p>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label>Did you take this medication?</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "taken", label: "Taken", icon: CheckCircle, color: "green" },
                { value: "skipped", label: "Skipped", icon: X, color: "amber" },
                { value: "late", label: "Taken Late", icon: Clock, color: "blue" }
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setIntakeData({ ...intakeData, status: opt.value })}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                    intakeData.status === opt.value
                      ? `border-${opt.color}-500 bg-${opt.color}-50`
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <opt.icon className={`w-5 h-5 ${
                    intakeData.status === opt.value ? `text-${opt.color}-600` : "text-slate-400"
                  }`} />
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Taken */}
          {(intakeData.status === "taken" || intakeData.status === "late") && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                When did you take it?
              </Label>
              <Input
                type="datetime-local"
                value={intakeData.taken_at}
                onChange={(e) => setIntakeData({ ...intakeData, taken_at: e.target.value })}
              />
            </div>
          )}

          {/* Dosage Confirmation */}
          {(intakeData.status === "taken" || intakeData.status === "late") && (
            <div className="space-y-2">
              <Label>Dosage taken (if different)</Label>
              <Input
                value={intakeData.dosage_taken}
                onChange={(e) => setIntakeData({ ...intakeData, dosage_taken: e.target.value })}
                placeholder={reminder?.dosage}
              />
            </div>
          )}

          {/* Skip Reason */}
          {intakeData.status === "skipped" && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Why did you skip?
              </Label>
              <Select
                value={intakeData.skip_reason}
                onValueChange={(v) => setIntakeData({ ...intakeData, skip_reason: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {SKIP_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={intakeData.notes}
              onChange={(e) => setIntakeData({ ...intakeData, notes: e.target.value })}
              placeholder="Any side effects, how you felt, etc."
              rows={2}
            />
          </div>

          {/* Pills Remaining Info */}
          {reminder?.pills_remaining != null && (
            <div className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-sm">
              <span className="text-slate-600">Pills remaining after this:</span>
              <span className="font-medium">
                {intakeData.status === "taken" 
                  ? Math.max(0, reminder.pills_remaining - 1) 
                  : reminder.pills_remaining
                }
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleLog} 
              disabled={logging}
              className={`flex-1 ${
                intakeData.status === "taken" ? "bg-green-600 hover:bg-green-700" :
                intakeData.status === "skipped" ? "bg-amber-600 hover:bg-amber-700" :
                "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {logging ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Log {intakeData.status === "taken" ? "Intake" : intakeData.status === "skipped" ? "Skip" : "Late Intake"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}