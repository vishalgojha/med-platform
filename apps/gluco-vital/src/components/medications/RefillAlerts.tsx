import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, Phone, ShoppingCart, Calendar } from "lucide-react";
import { format, addDays } from "date-fns";

export default function RefillAlerts({ reminders = [], onUpdateReminder }) {
  // Calculate days remaining for each medication
  const getMedicationsNeedingRefill = () => {
    return reminders
      .filter(r => r.is_active && r.pills_remaining != null)
      .map(reminder => {
        // Calculate daily consumption based on frequency
        let dailyDoses = 1;
        switch (reminder.frequency) {
          case "twice_daily": dailyDoses = 2; break;
          case "thrice_daily": dailyDoses = 3; break;
          case "four_times": dailyDoses = 4; break;
          case "every_x_hours": dailyDoses = Math.ceil(24 / (reminder.interval_hours || 6)); break;
          case "weekly": dailyDoses = 1 / 7; break;
          default: dailyDoses = 1;
        }

        const daysRemaining = Math.floor(reminder.pills_remaining / dailyDoses);
        const refillThreshold = reminder.refill_threshold || 7;
        const needsRefill = daysRemaining <= refillThreshold;
        const runOutDate = addDays(new Date(), daysRemaining);

        return {
          ...reminder,
          daysRemaining,
          dailyDoses,
          needsRefill,
          runOutDate,
          urgency: daysRemaining <= 3 ? "critical" : daysRemaining <= 7 ? "warning" : "ok"
        };
      })
      .filter(m => m.needsRefill)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  };

  const medsNeedingRefill = getMedicationsNeedingRefill();

  if (medsNeedingRefill.length === 0) {
    return null;
  }

  const getUrgencyStyles = (urgency) => {
    switch (urgency) {
      case "critical": return "bg-red-50 border-red-200 text-red-800";
      case "warning": return "bg-amber-50 border-amber-200 text-amber-800";
      default: return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const handleMarkRefilled = async (reminder) => {
    const newQuantity = (reminder.pills_per_strip || 10) * 3; // Assume 3 strips purchased
    onUpdateReminder?.(reminder.id, {
      pills_remaining: (reminder.pills_remaining || 0) + newQuantity,
      last_refill_date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-slate-800">Refill Alerts</h3>
        <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
          {medsNeedingRefill.length} medication{medsNeedingRefill.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {medsNeedingRefill.map((med) => (
          <div
            key={med.id}
            className={`p-4 rounded-xl border ${getUrgencyStyles(med.urgency)}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {med.urgency === "critical" && (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <h4 className="font-medium">{med.medication_name}</h4>
                </div>
                <div className="mt-1 space-y-1">
                  <p className="text-sm flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" />
                    {med.pills_remaining} {med.dosage_unit || 'pills'} remaining
                  </p>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {med.daysRemaining <= 0 
                      ? "Out of stock!" 
                      : `~${med.daysRemaining} day${med.daysRemaining !== 1 ? 's' : ''} left`
                    }
                  </p>
                  <p className="text-xs opacity-75">
                    Will run out by {format(med.runOutDate, "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-current/10">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMarkRefilled(med)}
                className="flex-1"
              >
                <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                Mark Refilled
              </Button>
              {med.pharmacy_phone && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`tel:${med.pharmacy_phone}`)}
                >
                  <Phone className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {med.preferred_pharmacy && (
              <p className="text-xs mt-2 opacity-75">
                📍 {med.preferred_pharmacy}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
        <p><strong>💡 Tip:</strong> Set up auto-refill with your pharmacy to never run out of essential medications.</p>
      </div>
    </div>
  );
}