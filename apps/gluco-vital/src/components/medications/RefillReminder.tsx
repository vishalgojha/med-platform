import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, Phone, MapPin, Calendar, Check, Bell } from "lucide-react";
import { format, addDays } from "date-fns";

export function calculateDaysRemaining(reminder) {
  if (!reminder.pills_remaining || !reminder.frequency) return null;
  
  // Calculate daily consumption based on frequency
  let dailyDoses = 1;
  switch (reminder.frequency) {
    case "twice_daily": dailyDoses = 2; break;
    case "thrice_daily": dailyDoses = 3; break;
    case "four_times": dailyDoses = 4; break;
    case "weekly": dailyDoses = 1/7; break;
    default: dailyDoses = 1;
  }
  
  return Math.floor(reminder.pills_remaining / dailyDoses);
}

export function needsRefill(reminder) {
  const daysRemaining = calculateDaysRemaining(reminder);
  if (daysRemaining === null) return false;
  return daysRemaining <= (reminder.refill_threshold || 7);
}

export default function RefillReminder({ reminders = [], onRefill, onDismiss }) {
  const needingRefill = reminders.filter(needsRefill);
  
  if (needingRefill.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-amber-700">
        <Package className="w-5 h-5" />
        <h4 className="font-medium">Refill Reminders</h4>
      </div>
      
      {needingRefill.map((reminder) => {
        const daysRemaining = calculateDaysRemaining(reminder);
        const runOutDate = addDays(new Date(), daysRemaining || 0);
        const isUrgent = daysRemaining !== null && daysRemaining <= 3;
        
        return (
          <Alert 
            key={reminder.id} 
            className={isUrgent ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}
          >
            <AlertTriangle className={`w-4 h-4 ${isUrgent ? "text-red-500" : "text-amber-500"}`} />
            <AlertTitle className={isUrgent ? "text-red-800" : "text-amber-800"}>
              {reminder.medication_name} - {isUrgent ? "Running out!" : "Low supply"}
            </AlertTitle>
            <AlertDescription className={isUrgent ? "text-red-700" : "text-amber-700"}>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">{reminder.pills_remaining}</span> {reminder.dosage_unit || "pills"} remaining
                  {daysRemaining !== null && (
                    <span> • ~{daysRemaining} days supply</span>
                  )}
                </p>
                {daysRemaining !== null && (
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Will run out around {format(runOutDate, "MMM d, yyyy")}
                  </p>
                )}
                
                {reminder.preferred_pharmacy && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <MapPin className="w-3 h-3" />
                    <span>{reminder.preferred_pharmacy}</span>
                    {reminder.pharmacy_phone && (
                      <a href={`tel:${reminder.pharmacy_phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Phone className="w-3 h-3" />
                        Call
                      </a>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    onClick={() => onRefill?.(reminder)}
                    className={isUrgent ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark Refilled
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onDismiss?.(reminder)}
                  >
                    Remind Later
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}

// Summary card for dashboard
export function RefillSummaryCard({ reminders = [] }) {
  const needingRefill = reminders.filter(needsRefill);
  const urgent = needingRefill.filter(r => {
    const days = calculateDaysRemaining(r);
    return days !== null && days <= 3;
  });
  
  if (needingRefill.length === 0) return null;

  return (
    <Card className={urgent.length > 0 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              urgent.length > 0 ? "bg-red-100" : "bg-amber-100"
            }`}>
              <Package className={`w-5 h-5 ${urgent.length > 0 ? "text-red-600" : "text-amber-600"}`} />
            </div>
            <div>
              <p className={`font-medium ${urgent.length > 0 ? "text-red-800" : "text-amber-800"}`}>
                {needingRefill.length} medication{needingRefill.length > 1 ? "s" : ""} need refill
              </p>
              <p className={`text-sm ${urgent.length > 0 ? "text-red-600" : "text-amber-600"}`}>
                {urgent.length > 0 
                  ? `${urgent.length} running out soon!` 
                  : "Plan your refills"
                }
              </p>
            </div>
          </div>
          <Bell className={`w-5 h-5 ${urgent.length > 0 ? "text-red-400" : "text-amber-400"}`} />
        </div>
      </CardContent>
    </Card>
  );
}