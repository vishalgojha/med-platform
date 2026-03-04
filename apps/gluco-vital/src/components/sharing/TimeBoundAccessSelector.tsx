import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Infinity } from "lucide-react";
import { addDays, addWeeks, addMonths, format } from "date-fns";

const DURATION_OPTIONS = [
  { value: "permanent", label: "Permanent Access", icon: Infinity, description: "Until you revoke" },
  { value: "7_days", label: "7 Days", icon: Clock, description: "Good for a quick review" },
  { value: "30_days", label: "30 Days", icon: Calendar, description: "One month of data" },
  { value: "90_days", label: "90 Days", icon: Calendar, description: "Quarterly review" },
  { value: "custom", label: "Custom Date", icon: Calendar, description: "Set your own expiry" }
];

export default function TimeBoundAccessSelector({ value, onChange, customDate, onCustomDateChange }) {
  const getExpiryDate = (duration) => {
    const now = new Date();
    switch (duration) {
      case "7_days": return addDays(now, 7);
      case "30_days": return addDays(now, 30);
      case "90_days": return addDays(now, 90);
      default: return null;
    }
  };

  const expiryDate = value === "custom" ? (customDate ? new Date(customDate) : null) : getExpiryDate(value);

  return (
    <div className="space-y-3">
      <Label>Access Duration</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1.5">
          <SelectValue placeholder="Select access duration" />
        </SelectTrigger>
        <SelectContent>
          {DURATION_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                <opt.icon className="w-4 h-4 text-slate-500" />
                <span>{opt.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === "custom" && (
        <div>
          <Label className="text-sm text-slate-600">Expiry Date</Label>
          <Input
            type="date"
            value={customDate || ""}
            onChange={(e) => onCustomDateChange(e.target.value)}
            min={format(new Date(), "yyyy-MM-dd")}
            className="mt-1"
          />
        </div>
      )}

      {expiryDate && value !== "permanent" && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Access will expire on {format(expiryDate, "MMMM d, yyyy")}
        </p>
      )}

      {value === "permanent" && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Infinity className="w-3 h-3" />
          Access will remain until you manually revoke it
        </p>
      )}
    </div>
  );
}

export function calculateExpiryDate(duration, customDate) {
  const now = new Date();
  switch (duration) {
    case "7_days": return addDays(now, 7).toISOString();
    case "30_days": return addDays(now, 30).toISOString();
    case "90_days": return addDays(now, 90).toISOString();
    case "custom": return customDate ? new Date(customDate).toISOString() : null;
    default: return null;
  }
}