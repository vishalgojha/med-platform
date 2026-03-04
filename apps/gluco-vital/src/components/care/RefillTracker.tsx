import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Package, RefreshCw, Pill, Phone } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, differenceInDays } from "date-fns";

export default function RefillTracker({ reminders = [], onUpdate }) {
  const [editingRefill, setEditingRefill] = useState(null);
  const [pillsRemaining, setPillsRemaining] = useState("");

  const getDaysRemaining = (reminder) => {
    if (!reminder.pills_remaining) return null;
    const dosesPerDay = {
      once_daily: 1,
      twice_daily: 2,
      thrice_daily: 3,
      four_times: 4,
      every_x_hours: reminder.interval_hours ? Math.ceil(24 / reminder.interval_hours) : 1,
      weekly: 1/7,
      as_needed: 1
    };
    const daily = dosesPerDay[reminder.frequency] || 1;
    return Math.floor(reminder.pills_remaining / daily);
  };

  const needsRefill = (reminder) => {
    const days = getDaysRemaining(reminder);
    if (days === null) return false;
    return days <= (reminder.refill_threshold || 7);
  };

  const handleUpdatePills = async () => {
    if (!editingRefill || !pillsRemaining) return;
    try {
      await appClient.entities.MedicationReminder.update(editingRefill.id, {
        pills_remaining: parseInt(pillsRemaining),
        last_refill_date: format(new Date(), 'yyyy-MM-dd')
      });
      toast.success("Pill count updated!");
      setEditingRefill(null);
      setPillsRemaining("");
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const lowStockReminders = reminders.filter(needsRefill);
  const trackedReminders = reminders.filter(r => r.pills_remaining !== undefined);

  if (reminders.length === 0) return null;

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="w-4 h-4 text-orange-500" />
          Refill Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Low Stock Alert */}
        {lowStockReminders.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium text-sm">Refill Needed</span>
            </div>
            <div className="space-y-2">
              {lowStockReminders.map(reminder => (
                <div key={reminder.id} className="flex items-center justify-between text-sm">
                  <span className="text-amber-900">{reminder.medication_name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-amber-700 border-amber-300">
                      {getDaysRemaining(reminder)} days left
                    </Badge>
                    {reminder.pharmacy_phone && (
                      <a href={`tel:${reminder.pharmacy_phone}`} className="text-amber-600 hover:text-amber-800">
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracked Medications */}
        <div className="space-y-2">
          {reminders.map(reminder => {
            const days = getDaysRemaining(reminder);
            const isLow = needsRefill(reminder);
            return (
              <div 
                key={reminder.id} 
                className={`flex items-center justify-between p-2 rounded-lg ${
                  isLow ? 'bg-amber-50' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Pill className={`w-4 h-4 ${isLow ? 'text-amber-600' : 'text-slate-500'}`} />
                  <div>
                    <p className="text-sm font-medium">{reminder.medication_name}</p>
                    {reminder.pills_remaining !== undefined ? (
                      <p className="text-xs text-slate-500">
                        {reminder.pills_remaining} pills • ~{days} days
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">Not tracking pills</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingRefill(reminder);
                    setPillsRemaining(reminder.pills_remaining?.toString() || "");
                  }}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Update
                </Button>
              </div>
            );
          })}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingRefill} onOpenChange={() => setEditingRefill(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Update {editingRefill?.medication_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-600">Pills/Doses Remaining</label>
                <Input
                  type="number"
                  value={pillsRemaining}
                  onChange={(e) => setPillsRemaining(e.target.value)}
                  placeholder="e.g., 30"
                  className="mt-1"
                />
              </div>
              <Button onClick={handleUpdatePills} className="w-full">
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}