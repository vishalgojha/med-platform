import { useEffect, useRef, useCallback } from "react";
import { format, isAfter, isBefore, addMinutes, parseISO, setHours, setMinutes, isToday } from "date-fns";
import { sendMedicationReminder, sendLoggingReminder, sendHealthAlert } from "./NotificationManager";

// Check if a time string (HH:mm) should trigger now
const shouldTriggerNow = (timeStr, lastTriggered, windowMinutes = 5) => {
  const now = new Date();
  const [hours, minutes] = timeStr.split(":").map(Number);
  const targetTime = setMinutes(setHours(new Date(), hours), minutes);
  
  const windowStart = addMinutes(targetTime, -windowMinutes);
  const windowEnd = addMinutes(targetTime, windowMinutes);
  
  // Check if we're within the window
  if (isAfter(now, windowStart) && isBefore(now, windowEnd)) {
    // Check if we haven't already triggered today
    if (!lastTriggered || !isToday(new Date(lastTriggered))) {
      return true;
    }
    // Check if last trigger was before this window
    if (isBefore(new Date(lastTriggered), windowStart)) {
      return true;
    }
  }
  
  return false;
};

export function useReminderScheduler(reminders = [], profile, isDemo = false) {
  const triggeredRef = useRef({});
  const intervalRef = useRef(null);

  const checkReminders = useCallback(() => {
    if (isDemo) return;
    
    const settings = JSON.parse(localStorage.getItem("glucovital_notification_settings") || "{}");
    if (settings.enabled === false) return;

    const now = new Date();
    
    // Check medication reminders
    reminders.forEach((reminder) => {
      if (!reminder.is_active) return;
      
      const triggeredKey = `med-${reminder.id}`;
      const lastTriggered = triggeredRef.current[triggeredKey];
      
      // Check specific times
      if (reminder.timing_type === "specific_time" && reminder.specific_times?.length) {
        reminder.specific_times.forEach((timeStr) => {
          if (shouldTriggerNow(timeStr, lastTriggered)) {
            sendMedicationReminder(reminder, settings);
            triggeredRef.current[triggeredKey] = now.toISOString();
          }
        });
      }
      
      // Check interval-based reminders
      if (reminder.timing_type === "interval" && reminder.interval_hours) {
        const lastTaken = reminder.last_taken ? new Date(reminder.last_taken) : null;
        if (lastTaken) {
          const nextDue = addMinutes(lastTaken, reminder.interval_hours * 60);
          if (isAfter(now, nextDue) && (!lastTriggered || isBefore(new Date(lastTriggered), nextDue))) {
            sendMedicationReminder(reminder, settings);
            triggeredRef.current[triggeredKey] = now.toISOString();
          }
        }
      }
    });

    // Check logging reminders based on time of day
    if (settings.loggingReminders !== false && profile?.is_on_insulin) {
      const hour = now.getHours();
      const loggingTimes = {
        7: "morning_fasting",
        10: "after_breakfast",
        14: "after_lunch",
        20: "after_dinner",
        22: "bedtime"
      };
      
      Object.entries(loggingTimes).forEach(([targetHour, timeOfDay]) => {
        const triggeredKey = `log-${timeOfDay}`;
        const lastTriggered = triggeredRef.current[triggeredKey];
        
        if (hour === parseInt(targetHour) && (!lastTriggered || !isToday(new Date(lastTriggered)))) {
          sendLoggingReminder(timeOfDay);
          triggeredRef.current[triggeredKey] = now.toISOString();
        }
      });
    }
  }, [reminders, profile, isDemo]);

  useEffect(() => {
    // Delay first check to avoid sounds playing immediately on page load
    const initialTimeout = setTimeout(() => {
      checkReminders();
    }, 5000);
    
    // Check every minute
    intervalRef.current = setInterval(checkReminders, 60000);
    
    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkReminders]);

  // Return a function to manually trigger a reminder check
  return { checkReminders };
}

// Health value checker - call this when logging new values
export function checkHealthAlerts(logType, numericValue, profile) {
  const settings = JSON.parse(localStorage.getItem("glucovital_notification_settings") || "{}");
  if (settings.healthAlerts === false) return;

  if (logType === "sugar") {
    if (numericValue >= 350) {
      sendHealthAlert("high_sugar", numericValue, 
        `Your blood sugar is ${numericValue} mg/dL - this is very high. Please check with your doctor if this persists.`
      );
    } else if (numericValue < 70) {
      sendHealthAlert("low_sugar", numericValue,
        `Your blood sugar is ${numericValue} mg/dL - this is low. Please have something sweet immediately and monitor closely.`
      );
    }
  }

  if (logType === "blood_pressure") {
    // Parse BP value like "180/120"
    const match = String(numericValue).match(/(\d+)\/(\d+)/);
    if (match) {
      const systolic = parseInt(match[1]);
      const diastolic = parseInt(match[2]);
      
      if (systolic >= 180 || diastolic >= 120) {
        sendHealthAlert("high_bp", numericValue,
          `Your blood pressure is ${systolic}/${diastolic} - this is critically high. Please seek medical attention.`
        );
      }
    }
  }
}

export default useReminderScheduler;