import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, Clock, Check, X, AlertTriangle, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { appClient } from "@/api/appClient";
import { toast } from "sonner";

const SKIP_REASONS = [
  { value: "forgot", label: "Forgot to take" },
  { value: "side_effects", label: "Side effects" },
  { value: "ran_out", label: "Ran out of medication" },
  { value: "felt_unnecessary", label: "Felt unnecessary" },
  { value: "too_busy", label: "Too busy" },
  { value: "not_feeling_well", label: "Not feeling well" },
  { value: "doctor_advised", label: "Doctor advised to skip" },
  { value: "other", label: "Other reason" }
];

export default function MedicationIntakeLog({ 
  reminder, 
  open, 
  onOpenChange, 
  profile, 
  onComplete,
  mode = "take" // "take" or "skip"
}) {
  const [loading, setLoading] = useState(false);
  const [intakeTime, setIntakeTime] = useState(format(new Date(), "HH:mm"));
  const [intakeDate, setIntakeDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [skipReason, setSkipReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [dosesTaken, setDosesTaken] = useState(1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const timestamp = new Date(`${intakeDate}T${intakeTime}`).toISOString();
      const userEmail = profile?.user_email;

      if (mode === "take") {
        // Create adherence record
        await appClient.entities.MedicationAdherence.create({
          user_email: userEmail,
          reminder_id: reminder.id,
          medication_name: reminder.medication_name,
          scheduled_time: timestamp,
          status: "taken",
          taken_at: timestamp,
          confirmed_via: "app",
          notes: notes
        });

        // Log to HealthLog
        await appClient.entities.HealthLog.create({
          user_email: userEmail,
          log_type: "medication",
          value: `${reminder.medication_name} ${reminder.dosage}`,
          notes: notes || `Taken at ${format(new Date(timestamp), "h:mm a")}`,
          measured_at: timestamp
        });

        // Update reminder last_taken and pills_remaining
        const updateData = { last_taken: timestamp };
        if (reminder.pills_remaining > 0) {
          updateData.pills_remaining = Math.max(0, reminder.pills_remaining - dosesTaken);
        }
        await appClient.entities.MedicationReminder.update(reminder.id, updateData);

        toast.success(`${reminder.medication_name} logged as taken!`);
      } else {
        // Skip mode
        const reason = skipReason === "other" ? customReason : skipReason;
        
        await appClient.entities.MedicationAdherence.create({
          user_email: userEmail,
          reminder_id: reminder.id,
          medication_name: reminder.medication_name,
          scheduled_time: timestamp,
          status: "skipped",
          confirmed_via: "app",
          skip_reason: reason,
          notes: notes
        });

        // Log to HealthLog
        await appClient.entities.HealthLog.create({
          user_email: userEmail,
          log_type: "medication",
          value: `Skipped: ${reminder.medication_name}`,
          notes: `Reason: ${reason}${notes ? `. ${notes}` : ""}`,
          measured_at: timestamp
        });

        toast.info(`${reminder.medication_name} logged as skipped`);
      }

      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Log error:", error);
      toast.error("Failed to log medication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "take" ? (
              <>
                <Check className="w-5 h-5 text-green-500" />
                Log Medication Intake
              </>
            ) : (
              <>
                <X className="w-5 h-5 text-amber-500" />
                Log Skipped Dose
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Medication Info */}
          <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                <Pill className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-violet-900">{reminder?.medication_name}</p>
                <p className="text-sm text-violet-600">{reminder?.dosage}</p>
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date
              </Label>
              <Input
                type="date"
                value={intakeDate}
                onChange={(e) => setIntakeDate(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Time
              </Label>
              <Input
                type="time"
                value={intakeTime}
                onChange={(e) => setIntakeTime(e.target.value)}
              />
            </div>
          </div>

          {mode === "take" ? (
            <>
              {/* Doses Taken */}
              {reminder?.pills_remaining > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Number of doses/pills taken</Label>
                  <Select value={String(dosesTaken)} onValueChange={(v) => setDosesTaken(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} {reminder.dosage_unit || "dose(s)"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {reminder.pills_remaining && (
                    <p className="text-xs text-slate-500">
                      {reminder.pills_remaining} remaining → {Math.max(0, reminder.pills_remaining - dosesTaken)} after this
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Skip Reason */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Reason for skipping
                </Label>
                <Select value={skipReason} onValueChange={setSkipReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason..." />
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

              {skipReason === "other" && (
                <Input
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter reason..."
                />
              )}

              {skipReason === "side_effects" && (
                <div className="p-2 bg-amber-50 rounded text-xs text-amber-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>If you're experiencing side effects, please consult your doctor before stopping any medication.</span>
                </div>
              )}
            </>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Additional notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={mode === "take" 
                ? "e.g., Took with breakfast, felt slight nausea..." 
                : "Any additional context..."
              }
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || (mode === "skip" && !skipReason)}
              className={`flex-1 ${mode === "take" ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {mode === "take" ? "Log as Taken" : "Log as Skipped"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick log buttons component
export function QuickMedicationLog({ reminder, profile, onComplete }) {
  const [showTakeDialog, setShowTakeDialog] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [quickLogging, setQuickLogging] = useState(false);

  const quickLogTaken = async () => {
    setQuickLogging(true);
    try {
      const now = new Date().toISOString();
      
      await appClient.entities.MedicationAdherence.create({
        user_email: profile?.user_email,
        reminder_id: reminder.id,
        medication_name: reminder.medication_name,
        scheduled_time: now,
        status: "taken",
        taken_at: now,
        confirmed_via: "app"
      });

      await appClient.entities.HealthLog.create({
        user_email: profile?.user_email,
        log_type: "medication",
        value: `${reminder.medication_name} ${reminder.dosage}`,
        measured_at: now
      });

      const updateData = { last_taken: now };
      if (reminder.pills_remaining > 0) {
        updateData.pills_remaining = reminder.pills_remaining - 1;
      }
      await appClient.entities.MedicationReminder.update(reminder.id, updateData);

      toast.success(`${reminder.medication_name} taken!`);
      onComplete?.();
    } catch (error) {
      toast.error("Failed to log");
    } finally {
      setQuickLogging(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={quickLogTaken}
          disabled={quickLogging}
          className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
        >
          {quickLogging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
          Taken
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowTakeDialog(true)}
          className="text-slate-500"
        >
          <Clock className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowSkipDialog(true)}
          className="text-amber-600 border-amber-200 hover:bg-amber-50"
        >
          <X className="w-4 h-4 mr-1" /> Skip
        </Button>
      </div>

      <MedicationIntakeLog
        reminder={reminder}
        open={showTakeDialog}
        onOpenChange={setShowTakeDialog}
        profile={profile}
        onComplete={onComplete}
        mode="take"
      />

      <MedicationIntakeLog
        reminder={reminder}
        open={showSkipDialog}
        onOpenChange={setShowSkipDialog}
        profile={profile}
        onComplete={onComplete}
        mode="skip"
      />
    </>
  );
}