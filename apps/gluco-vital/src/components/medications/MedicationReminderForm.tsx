import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Clock, Plus, X, Bell, BellRing, BellOff, Camera } from "lucide-react";
import MedicationScanner from "./MedicationScanner";

const TIMING_OPTIONS = [
  { value: "specific_time", label: "At specific times", icon: "⏰" },
  { value: "before_meal", label: "Before meal", icon: "🍽️" },
  { value: "after_meal", label: "After meal", icon: "🍴" },
  { value: "with_meal", label: "With meal", icon: "🥗" },
  { value: "bedtime", label: "At bedtime", icon: "🌙" },
  { value: "wakeup", label: "After waking up", icon: "🌅" },
  { value: "interval", label: "Every X hours", icon: "🔄" },
];

const FREQUENCY_OPTIONS = [
  { value: "once_daily", label: "Once daily" },
  { value: "twice_daily", label: "Twice daily" },
  { value: "thrice_daily", label: "Three times daily" },
  { value: "four_times", label: "Four times daily" },
  { value: "every_x_hours", label: "Every X hours" },
  { value: "weekly", label: "Weekly" },
  { value: "as_needed", label: "As needed" },
];

const MEAL_OFFSETS = [
  { value: -60, label: "1 hour before" },
  { value: -30, label: "30 mins before" },
  { value: -15, label: "15 mins before" },
  { value: 0, label: "With meal" },
  { value: 15, label: "15 mins after" },
  { value: 30, label: "30 mins after" },
  { value: 60, label: "1 hour after" },
  { value: 120, label: "2 hours after" },
];

export default function MedicationReminderForm({ reminder, onSave, onCancel, existingMedications = [] }) {
  const [showScanner, setShowScanner] = useState(false);
  const [form, setForm] = useState(reminder || {
    medication_name: "",
    dosage: "",
    timing_type: "specific_time",
    specific_times: ["08:00"],
    meal_offset_minutes: -30,
    interval_hours: 6,
    frequency: "once_daily",
    days_of_week: [],
    notification_style: "gentle",
    custom_message: "",
    notes: "",
    is_active: true
  });

  const handleScannedMedication = (medData) => {
    setForm(prev => ({
      ...prev,
      medication_name: medData.medication_name || prev.medication_name,
      dosage: medData.dosage || prev.dosage,
      strength: medData.strength || prev.strength,
      notes: medData.notes || prev.notes,
      pills_per_strip: medData.pills_per_strip || prev.pills_per_strip
    }));
  };

  const addTime = () => {
    setForm({ ...form, specific_times: [...form.specific_times, "12:00"] });
  };

  const removeTime = (idx) => {
    setForm({ ...form, specific_times: form.specific_times.filter((_, i) => i !== idx) });
  };

  const updateTime = (idx, value) => {
    const times = [...form.specific_times];
    times[idx] = value;
    setForm({ ...form, specific_times: times });
  };

  const toggleDay = (day) => {
    const days = form.days_of_week.includes(day)
      ? form.days_of_week.filter(d => d !== day)
      : [...form.days_of_week, day];
    setForm({ ...form, days_of_week: days });
  };

  return (
    <div className="space-y-5">
      {/* Scan Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowScanner(true)}
        className="w-full border-dashed border-violet-300 text-violet-600 hover:bg-violet-50"
      >
        <Camera className="w-4 h-4 mr-2" />
        Scan Medication Packaging
      </Button>

      {/* Medication Selection or Input */}
      <div className="space-y-2">
        <Label>Medication Name</Label>
        {existingMedications.length > 0 ? (
          <Select value={form.medication_name} onValueChange={(v) => setForm({ ...form, medication_name: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select medication" />
            </SelectTrigger>
            <SelectContent>
              {existingMedications.map((med, idx) => (
                <SelectItem key={idx} value={med.name}>{med.name} - {med.dosage}</SelectItem>
              ))}
              <SelectItem value="__custom__">+ Add new medication</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={form.medication_name}
            onChange={(e) => setForm({ ...form, medication_name: e.target.value })}
            placeholder="e.g., Metformin, Insulin Glargine"
          />
        )}
        {form.medication_name === "__custom__" && (
          <Input
            className="mt-2"
            onChange={(e) => setForm({ ...form, medication_name: e.target.value })}
            placeholder="Enter medication name"
          />
        )}
      </div>

      <MedicationScanner
        open={showScanner}
        onOpenChange={setShowScanner}
        onMedicationFound={handleScannedMedication}
      />

      {/* Dosage with Unit Selection */}
      <div className="space-y-2">
        <Label>Dosage</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            value={form.dosage_amount || ""}
            onChange={(e) => setForm({ ...form, dosage_amount: e.target.value, dosage: `${e.target.value}${form.dosage_unit || 'mg'}` })}
            placeholder="Amount"
            className="w-24"
          />
          <Select 
            value={form.dosage_unit || "mg"} 
            onValueChange={(v) => setForm({ ...form, dosage_unit: v, dosage: `${form.dosage_amount || ''}${v}` })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mg">mg</SelectItem>
              <SelectItem value="mcg">mcg</SelectItem>
              <SelectItem value="g">g</SelectItem>
              <SelectItem value="ml">ml</SelectItem>
              <SelectItem value="units">units</SelectItem>
              <SelectItem value="IU">IU</SelectItem>
              <SelectItem value="tablets">tablets</SelectItem>
              <SelectItem value="capsules">capsules</SelectItem>
              <SelectItem value="drops">drops</SelectItem>
              <SelectItem value="puffs">puffs</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={form.dosage || ""}
            onChange={(e) => setForm({ ...form, dosage: e.target.value })}
            placeholder="Or type custom"
            className="flex-1"
          />
        </div>
      </div>

      {/* Strength/Concentration */}
      <div className="space-y-2">
        <Label>Strength/Concentration (optional)</Label>
        <Input
          value={form.strength || ""}
          onChange={(e) => setForm({ ...form, strength: e.target.value })}
          placeholder="e.g., 500mg/5ml, 100 units/ml"
        />
      </div>

      {/* Timing Type */}
      <div className="space-y-2">
        <Label>When to take</Label>
        <div className="grid grid-cols-2 gap-2">
          {TIMING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setForm({ ...form, timing_type: opt.value })}
              className={`p-3 rounded-lg border text-left text-sm transition-all ${
                form.timing_type === opt.value
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="mr-2">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Specific Times */}
      {form.timing_type === "specific_time" && (
        <div className="space-y-2">
          <Label>Set times</Label>
          <div className="space-y-2">
            {form.specific_times.map((time, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => updateTime(idx, e.target.value)}
                  className="flex-1"
                />
                {form.specific_times.length > 1 && (
                  <Button size="icon" variant="ghost" onClick={() => removeTime(idx)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addTime} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Add another time
            </Button>
          </div>
        </div>
      )}

      {/* Meal Offset */}
      {["before_meal", "after_meal", "with_meal"].includes(form.timing_type) && (
        <div className="space-y-2">
          <Label>Timing relative to meal</Label>
          <Select 
            value={String(form.meal_offset_minutes)} 
            onValueChange={(v) => setForm({ ...form, meal_offset_minutes: parseInt(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEAL_OFFSETS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Interval Hours */}
      {form.timing_type === "interval" && (
        <div className="space-y-2">
          <Label>Every how many hours?</Label>
          <Select 
            value={String(form.interval_hours)} 
            onValueChange={(v) => setForm({ ...form, interval_hours: parseInt(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[4, 6, 8, 12].map((h) => (
                <SelectItem key={h} value={String(h)}>Every {h} hours</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Frequency */}
      <div className="space-y-2">
        <Label>Frequency</Label>
        <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Weekly Days */}
      {form.frequency === "weekly" && (
        <div className="space-y-2">
          <Label>Which days?</Label>
          <div className="flex flex-wrap gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  form.days_of_week.includes(day)
                    ? "bg-violet-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notification Style */}
      <div className="space-y-2">
        <Label>Notification style</Label>
        <div className="flex gap-2">
          {[
            { value: "gentle", icon: Bell, label: "Gentle" },
            { value: "urgent", icon: BellRing, label: "Urgent" },
            { value: "silent", icon: BellOff, label: "Silent" },
          ].map((style) => (
            <button
              key={style.value}
              onClick={() => setForm({ ...form, notification_style: style.value })}
              className={`flex-1 p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                form.notification_style === style.value
                  ? "border-violet-500 bg-violet-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <style.icon className={`w-5 h-5 ${form.notification_style === style.value ? "text-violet-600" : "text-slate-400"}`} />
              <span className="text-xs">{style.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Message */}
      <div className="space-y-2">
        <Label>Custom reminder message (optional)</Label>
        <Textarea
          value={form.custom_message}
          onChange={(e) => setForm({ ...form, custom_message: e.target.value })}
          placeholder="e.g., Take with a full glass of water"
          rows={2}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Special instructions</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="e.g., Avoid dairy products, take on empty stomach"
          rows={2}
        />
      </div>

      {/* Food Requirements */}
      <div className="space-y-2">
        <Label>Food Requirements</Label>
        <Select 
          value={form.food_requirement || "none"} 
          onValueChange={(v) => setForm({ ...form, food_requirement: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No specific requirement</SelectItem>
            <SelectItem value="empty_stomach">Take on empty stomach</SelectItem>
            <SelectItem value="with_food">Take with food</SelectItem>
            <SelectItem value="with_water">Take with full glass of water</SelectItem>
            <SelectItem value="avoid_dairy">Avoid dairy products</SelectItem>
            <SelectItem value="avoid_antacids">Avoid antacids</SelectItem>
            <SelectItem value="avoid_caffeine">Avoid caffeine</SelectItem>
            <SelectItem value="avoid_alcohol">Avoid alcohol</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Refill Tracking */}
      <div className="space-y-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <Label className="text-amber-800">Refill Tracking (optional)</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-600">Pills remaining</Label>
            <Input
              type="number"
              value={form.pills_remaining || ""}
              onChange={(e) => setForm({ ...form, pills_remaining: parseInt(e.target.value) || 0 })}
              placeholder="e.g., 30"
              min="0"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-600">Pills per strip/pack</Label>
            <Input
              type="number"
              value={form.pills_per_strip || 10}
              onChange={(e) => setForm({ ...form, pills_per_strip: parseInt(e.target.value) || 10 })}
              placeholder="e.g., 10"
              min="1"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-slate-600">Alert when days remaining</Label>
          <Select 
            value={String(form.refill_threshold || 7)} 
            onValueChange={(v) => setForm({ ...form, refill_threshold: parseInt(v) })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 days</SelectItem>
              <SelectItem value="5">5 days</SelectItem>
              <SelectItem value="7">7 days (1 week)</SelectItem>
              <SelectItem value="14">14 days (2 weeks)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
        <Label>Reminder active</Label>
        <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button onClick={() => onSave(form)} className="flex-1 bg-violet-600 hover:bg-violet-700">
          Save Reminder
        </Button>
      </div>
    </div>
  );
}