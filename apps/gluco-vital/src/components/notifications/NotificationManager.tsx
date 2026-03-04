import React, { useEffect, useState, useCallback, useRef } from "react";
import { appClient } from "@/api/appClient";
import { Bell, BellRing, Volume2, VolumeX, Vibrate, Check, X, Pill, Droplet, Heart, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format, isAfter, isBefore, addMinutes, parseISO } from "date-fns";

// Notification sound configurations (using Web Audio API for reliability)
// Louder, longer, more attention-grabbing sounds
const NOTIFICATION_SOUNDS = {
  gentle: { frequency: 520, duration: 400, pattern: [1, 1.25, 1.5], gap: 0.15, volume: 0.6 },
  urgent: { frequency: 700, duration: 350, pattern: [1, 0.8, 1, 0.8, 1.2], gap: 0.12, volume: 0.8 },
  success: { frequency: 600, duration: 300, pattern: [1, 1.33, 1.5], gap: 0.1, volume: 0.5 }
};

// Create audio context for notifications
let audioContext = null;

const playNotificationSound = (type = "gentle") => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Resume audio context if suspended (required for mobile)
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    
    const sound = NOTIFICATION_SOUNDS[type] || NOTIFICATION_SOUNDS.gentle;
    const now = audioContext.currentTime;
    const gap = sound.gap || 0.15;
    const volume = sound.volume || 0.5;
    
    sound.pattern.forEach((multiplier, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = sound.frequency * multiplier;
      oscillator.type = "sine";
      
      const startTime = now + (index * gap);
      const duration = sound.duration / 1000;
      
      // Envelope: attack -> sustain -> release for fuller sound
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02); // Quick attack
      gainNode.gain.setValueAtTime(volume, startTime + duration * 0.7); // Sustain
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration); // Release
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  } catch (e) {
    console.log("Audio not supported:", e);
  }
};

const triggerVibration = (type = "gentle") => {
  if (!navigator.vibrate) return;
  
  // Longer, more noticeable vibration patterns
  const patterns = {
    gentle: [300, 100, 300],
    urgent: [400, 150, 400, 150, 400, 150, 400],
    success: [200, 100, 200]
  };
  
  navigator.vibrate(patterns[type] || patterns.gentle);
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  
  if (Notification.permission === "granted") {
    return "granted";
  }
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return Notification.permission;
};

export const showBrowserNotification = (title, options = {}) => {
  if (Notification.permission !== "granted") return null;
  
  const notification = new Notification(title, {
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: options.urgent ? [200, 100, 200] : [100],
    requireInteraction: options.urgent || false,
    tag: options.tag || "glucovital",
    renotify: true,
    ...options
  });
  
  notification.onclick = () => {
    window.focus();
    notification.close();
    if (options.onClick) options.onClick();
  };
  
  return notification;
};

export const sendMedicationReminder = (reminder, settings = {}) => {
  const title = `💊 Time for ${reminder.medication_name}`;
  const body = `${reminder.dosage || ""} - ${reminder.notes || "Take your medication"}`;
  
  if (settings.sound !== false) {
    playNotificationSound(reminder.notification_style || "gentle");
  }
  
  if (settings.vibration !== false) {
    triggerVibration(reminder.notification_style || "gentle");
  }
  
  showBrowserNotification(title, {
    body,
    tag: `med-${reminder.id}`,
    urgent: reminder.notification_style === "urgent",
    onClick: () => {
      window.location.href = "/#/CareHub";
    }
  });
  
  // Also show in-app toast
  toast(title, {
    description: body,
    duration: reminder.notification_style === "urgent" ? 10000 : 5000,
    action: {
      label: "Mark Taken",
      onClick: () => {
        // This will be handled by the parent component
        window.dispatchEvent(new CustomEvent("medication-taken", { detail: reminder }));
      }
    }
  });
};

export const sendHealthAlert = (type, value, message) => {
  const titles = {
    high_sugar: "⚠️ High Blood Sugar Alert",
    low_sugar: "🚨 Low Blood Sugar Warning",
    high_bp: "⚠️ High Blood Pressure Alert",
    missed_medication: "💊 Missed Medication"
  };
  
  playNotificationSound("urgent");
  triggerVibration("urgent");
  
  showBrowserNotification(titles[type] || "Health Alert", {
    body: message,
    tag: `alert-${type}`,
    urgent: true
  });
  
  toast.error(titles[type] || "Health Alert", {
    description: message,
    duration: 15000
  });
};

export const sendLoggingReminder = (timeOfDay) => {
  const messages = {
    morning_fasting: "Good morning! Time to log your fasting sugar reading 🌅",
    after_breakfast: "How was breakfast? Don't forget to log your post-meal reading",
    after_lunch: "Post-lunch check time! Log your reading when ready",
    after_dinner: "Evening check! Log your post-dinner reading",
    bedtime: "Before bed, take a moment to log your reading 🌙"
  };
  
  playNotificationSound("gentle");
  triggerVibration("gentle");
  
  showBrowserNotification("🩸 Sugar Logging Reminder", {
    body: messages[timeOfDay] || "Time to log your health data",
    tag: `log-${timeOfDay}`
  });
};

// Notification Settings Component
export function NotificationSettings({ user }) {
  const [permission, setPermission] = useState(Notification?.permission || "default");
  const [settings, setSettings] = useState({
    enabled: true,
    sound: true,
    vibration: true,
    medicationReminders: true,
    loggingReminders: true,
    healthAlerts: true
  });

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem("glucovital_notification_settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    setPermission(Notification?.permission || "unsupported");
  }, []);

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem("glucovital_notification_settings", JSON.stringify(newSettings));
  };

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      toast.success("Notifications enabled!");
      playNotificationSound("success");
    } else if (result === "denied") {
      toast.error("Notifications blocked. Please enable in browser settings.");
    }
  };

  const testNotification = () => {
    playNotificationSound("gentle");
    triggerVibration("gentle");
    showBrowserNotification("🔔 Test Notification", {
      body: "Notifications are working! You'll receive medication and health reminders here."
    });
    toast.success("Test notification sent!");
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#5b9a8b]" />
          Notification Settings
        </h3>
        {permission === "granted" && (
          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Enabled</span>
        )}
      </div>

      {permission !== "granted" && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-start gap-3">
            <BellRing className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">Enable Browser Notifications</p>
              <p className="text-xs text-amber-700 mt-1">
                Get medication reminders and health alerts even when the tab is in background.
              </p>
              <Button 
                size="sm" 
                onClick={handleEnableNotifications}
                className="mt-3 bg-amber-600 hover:bg-amber-700"
              >
                Enable Notifications
              </Button>
            </div>
          </div>
        </div>
      )}

      {permission === "granted" && (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">Sound</span>
              </div>
              <Switch
                checked={settings.sound}
                onCheckedChange={(checked) => saveSettings({ ...settings, sound: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Vibrate className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">Vibration</span>
              </div>
              <Switch
                checked={settings.vibration}
                onCheckedChange={(checked) => saveSettings({ ...settings, vibration: checked })}
              />
            </div>

            <div className="border-t border-slate-100 pt-3 mt-3">
              <p className="text-xs text-slate-500 mb-3">Notification Types</p>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-violet-500" />
                  <span className="text-sm text-slate-700">Medication Reminders</span>
                </div>
                <Switch
                  checked={settings.medicationReminders}
                  onCheckedChange={(checked) => saveSettings({ ...settings, medicationReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-slate-700">Logging Reminders</span>
                </div>
                <Switch
                  checked={settings.loggingReminders}
                  onCheckedChange={(checked) => saveSettings({ ...settings, loggingReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-slate-700">Health Alerts</span>
                </div>
                <Switch
                  checked={settings.healthAlerts}
                  onCheckedChange={(checked) => saveSettings({ ...settings, healthAlerts: checked })}
                />
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={testNotification} className="w-full">
            <Bell className="w-4 h-4 mr-2" />
            Test Notification
          </Button>
        </>
      )}

      <div className="p-3 bg-[#5b9a8b]/5 rounded-lg border border-[#5b9a8b]/20">
        <p className="text-xs text-[#5b9a8b]">
          💡 <strong>Tip:</strong> WhatsApp reminders work even when you're away from the app. Connect WhatsApp for the most reliable medication reminders.
        </p>
      </div>
    </div>
  );
}

// Hook to use notification manager
export function useNotifications() {
  const [settings, setSettings] = useState({
    enabled: true,
    sound: true,
    vibration: true,
    medicationReminders: true,
    loggingReminders: true,
    healthAlerts: true
  });

  useEffect(() => {
    const saved = localStorage.getItem("glucovital_notification_settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const notify = useCallback((type, data) => {
    if (!settings.enabled) return;

    switch (type) {
      case "medication":
        if (settings.medicationReminders) {
          sendMedicationReminder(data, { sound: settings.sound, vibration: settings.vibration });
        }
        break;
      case "logging":
        if (settings.loggingReminders) {
          sendLoggingReminder(data);
        }
        break;
      case "alert":
        if (settings.healthAlerts) {
          sendHealthAlert(data.type, data.value, data.message);
        }
        break;
      default:
        break;
    }
  }, [settings]);

  return { notify, settings, requestPermission: requestNotificationPermission };
}

export default NotificationSettings;