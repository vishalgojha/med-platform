import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Sun, Sunrise, Sunset } from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

const timeSlots = [
  { id: '6AM-8AM', label: '6:00 - 8:00 AM', icon: Sunrise, recommended: true },
  { id: '8AM-10AM', label: '8:00 - 10:00 AM', icon: Sunrise, recommended: true },
  { id: '10AM-12PM', label: '10:00 AM - 12:00 PM', icon: Sun, recommended: false },
  { id: '12PM-2PM', label: '12:00 - 2:00 PM', icon: Sun, recommended: false },
  { id: '2PM-4PM', label: '2:00 - 4:00 PM', icon: Sunset, recommended: false },
  { id: '4PM-6PM', label: '4:00 - 6:00 PM', icon: Sunset, recommended: false },
];

export default function SlotPicker({ selectedDate, selectedSlot, onDateChange, onSlotChange }) {
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 7);

  return (
    <div className="space-y-6">
      {/* Date Picker */}
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <CalendarIcon className="w-4 h-4" /> Select Date *
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(new Date(selectedDate), 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate ? new Date(selectedDate) : undefined}
              onSelect={(date) => onDateChange(date ? format(date, 'yyyy-MM-dd') : '')}
              disabled={(date) => isBefore(date, today) || isBefore(maxDate, date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Slots */}
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4" /> Select Time Slot *
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {timeSlots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => onSlotChange(slot.id)}
              className={cn(
                "p-3 rounded-lg border-2 text-left transition-all",
                selectedSlot === slot.id
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-slate-200 hover:border-indigo-300",
              )}
            >
              <div className="flex items-center gap-2">
                <slot.icon className={cn(
                  "w-4 h-4",
                  selectedSlot === slot.id ? "text-indigo-600" : "text-slate-400"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  selectedSlot === slot.id ? "text-indigo-700" : "text-slate-700"
                )}>
                  {slot.label}
                </span>
              </div>
              {slot.recommended && (
                <span className="text-xs text-emerald-600 mt-1 block">
                  ✓ Best for fasting tests
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}