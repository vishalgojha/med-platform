import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pill, Loader2, CheckCircle, Plus } from "lucide-react";
import { toast } from "sonner";

const COMMON_MEDICATIONS = [
  { name: "Metformin", dosage: "500mg" },
  { name: "Glimepiride", dosage: "2mg" },
  { name: "Insulin", dosage: "10 units" },
  { name: "Amlodipine", dosage: "5mg" },
  { name: "Losartan", dosage: "50mg" },
];

export default function QuickMedicationModal({ isOpen, onClose, user }) {
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [timingType, setTimingType] = useState("with_meal");
  const [frequency, setFrequency] = useState("once_daily");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const handleQuickAdd = (med) => {
    setMedicationName(med.name);
    setDosage(med.dosage);
    setShowCustom(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await appClient.entities.MedicationReminder.create({
        user_email: user?.email,
        medication_name: medicationName,
        dosage: dosage,
        timing_type: timingType,
        frequency: frequency,
        is_active: true
      });

      setIsSuccess(true);
      toast.success("Medication reminder added! 💊");

      setTimeout(() => {
        setIsSuccess(false);
        setMedicationName("");
        setDosage("");
        setShowCustom(false);
        onClose();
      }, 1500);
    } catch (error) {
      toast.error("Failed to add medication. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Add Medication Reminder 💊
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-violet-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Reminder Set!</h3>
            <p className="text-slate-500 mt-1">We'll remind you to take your medicine.</p>
          </div>
        ) : !showCustom ? (
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-500 text-center">
              Select a common medication or add your own
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {COMMON_MEDICATIONS.map((med) => (
                <button
                  key={med.name}
                  onClick={() => handleQuickAdd(med)}
                  className="p-3 text-left rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-violet-500" />
                    <span className="font-medium text-sm text-slate-700">{med.name}</span>
                  </div>
                  <span className="text-xs text-slate-500 ml-6">{med.dosage}</span>
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setShowCustom(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Medication
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Medication Name</Label>
              <Input
                placeholder="e.g., Metformin"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Dosage</Label>
              <Input
                placeholder="e.g., 500mg"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>When to take?</Label>
              <Select value={timingType} onValueChange={setTimingType}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before_meal">Before Meal</SelectItem>
                  <SelectItem value="with_meal">With Meal</SelectItem>
                  <SelectItem value="after_meal">After Meal</SelectItem>
                  <SelectItem value="bedtime">Bedtime</SelectItem>
                  <SelectItem value="wakeup">Wake Up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>How often?</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once_daily">Once Daily</SelectItem>
                  <SelectItem value="twice_daily">Twice Daily</SelectItem>
                  <SelectItem value="thrice_daily">Three Times Daily</SelectItem>
                  <SelectItem value="as_needed">As Needed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustom(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !medicationName}
                className="flex-1 bg-violet-600 hover:bg-violet-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Reminder"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}