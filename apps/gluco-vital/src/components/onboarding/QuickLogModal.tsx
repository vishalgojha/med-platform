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
import { Droplet, Heart, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function QuickLogModal({ isOpen, onClose, user }) {
  const [logType, setLogType] = useState("sugar");
  const [value, setValue] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("other");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const logData = {
        user_email: user?.email,
        log_type: logType,
        time_of_day: timeOfDay,
        source: "manual"
      };

      if (logType === "sugar") {
        logData.value = `${value} mg/dL`;
        logData.numeric_value = parseFloat(value);
      } else if (logType === "blood_pressure") {
        logData.value = `${systolic}/${diastolic}`;
      }

      await appClient.entities.HealthLog.create(logData);
      
      setIsSuccess(true);
      toast.success("Health data logged successfully! 🎉");
      
      setTimeout(() => {
        setIsSuccess(false);
        setValue("");
        setSystolic("");
        setDiastolic("");
        onClose();
      }, 1500);
    } catch (error) {
      toast.error("Failed to log data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Log Your First Reading 📊
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Great job!</h3>
            <p className="text-slate-500 mt-1">Your first reading is logged.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Log Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLogType("sugar")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  logType === "sugar"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Droplet className={`w-6 h-6 mx-auto mb-2 ${logType === "sugar" ? "text-blue-600" : "text-slate-400"}`} />
                <p className={`text-sm font-medium ${logType === "sugar" ? "text-blue-700" : "text-slate-600"}`}>
                  Blood Sugar
                </p>
              </button>
              <button
                type="button"
                onClick={() => setLogType("blood_pressure")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  logType === "blood_pressure"
                    ? "border-red-500 bg-red-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Heart className={`w-6 h-6 mx-auto mb-2 ${logType === "blood_pressure" ? "text-red-600" : "text-slate-400"}`} />
                <p className={`text-sm font-medium ${logType === "blood_pressure" ? "text-red-700" : "text-slate-600"}`}>
                  Blood Pressure
                </p>
              </button>
            </div>

            {/* Value Input */}
            {logType === "sugar" ? (
              <div className="space-y-2">
                <Label>Sugar Level (mg/dL)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 120"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="h-12 text-lg"
                  required
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Systolic (top)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 120"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="h-12 text-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Diastolic (bottom)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 80"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="h-12 text-lg"
                    required
                  />
                </div>
              </div>
            )}

            {/* Time of Day */}
            <div className="space-y-2">
              <Label>When was this taken?</Label>
              <Select value={timeOfDay} onValueChange={setTimeOfDay}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning_fasting">Morning (Fasting)</SelectItem>
                  <SelectItem value="before_breakfast">Before Breakfast</SelectItem>
                  <SelectItem value="after_breakfast">After Breakfast</SelectItem>
                  <SelectItem value="before_lunch">Before Lunch</SelectItem>
                  <SelectItem value="after_lunch">After Lunch</SelectItem>
                  <SelectItem value="before_dinner">Before Dinner</SelectItem>
                  <SelectItem value="after_dinner">After Dinner</SelectItem>
                  <SelectItem value="bedtime">Bedtime</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#5b9a8b] hover:bg-[#4a8a7b] text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Reading"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}