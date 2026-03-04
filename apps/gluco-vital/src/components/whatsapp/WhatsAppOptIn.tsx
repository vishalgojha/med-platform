import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Check, Loader2, Phone, Bell, Pill, Droplet, Calendar } from "lucide-react";
import { appClient } from "@/api/appClient";
import { toast } from "sonner";

export default function WhatsAppOptIn({ user, profile, onUpdate }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [settings, setSettings] = useState({
    whatsapp_reminders_enabled: false,
    whatsapp_medication_reminders: true,
    whatsapp_glucose_reminders: true,
    whatsapp_appointment_reminders: true
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (profile) {
      setPhoneNumber(profile.whatsapp_number || '');
      setSettings({
        whatsapp_reminders_enabled: profile.whatsapp_reminders_enabled === true,
        whatsapp_medication_reminders: profile.whatsapp_medication_reminders !== false,
        whatsapp_glucose_reminders: profile.whatsapp_glucose_reminders !== false,
        whatsapp_appointment_reminders: profile.whatsapp_appointment_reminders !== false
      });
    }
  }, [profile]);

  const formatPhoneNumber = (number) => {
    // Remove all non-digits
    let cleaned = number.replace(/\D/g, '');
    // Add country code if missing (default to India +91)
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    return cleaned;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      if (settings.whatsapp_reminders_enabled && formattedPhone.length < 10) {
        toast.error("Please enter a valid phone number");
        setSaving(false);
        return;
      }

      const updateData = {
        whatsapp_number: formattedPhone,
        whatsapp_reminders_enabled: settings.whatsapp_reminders_enabled,
        whatsapp_medication_reminders: settings.whatsapp_medication_reminders,
        whatsapp_glucose_reminders: settings.whatsapp_glucose_reminders,
        whatsapp_appointment_reminders: settings.whatsapp_appointment_reminders
      };

      if (profile?.id) {
        await appClient.entities.PatientProfile.update(profile.id, updateData);
      } else {
        const existingProfiles = await appClient.entities.PatientProfile.filter({ user_email: user.email });
        if (existingProfiles?.length > 0) {
          await appClient.entities.PatientProfile.update(existingProfiles[0].id, updateData);
        } else {
          await appClient.entities.PatientProfile.create({
            user_email: user.email,
            name: user.full_name || '',
            ...updateData
          });
        }
      }

      toast.success("WhatsApp settings saved!");
      if (onUpdate) onUpdate(updateData);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const sendTestMessage = async () => {
    setTesting(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const response = await appClient.functions.invoke('sendWhatsAppReminder', {
        phone_number: formattedPhone,
        reminder_type: 'general',
        language: profile?.language_preference || 'english'
      });

      if (response.data?.error) {
        toast.error(`Error: ${response.data.error}`);
      } else {
        toast.success("Test message sent! Check your WhatsApp.");
      }
    } catch (error) {
      console.error("Test error:", error);
      toast.error("Failed to send test message");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="border-green-100">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-lg">WhatsApp Reminders</CardTitle>
            <CardDescription>Get reminders directly on WhatsApp</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-green-600" />
            <Label className="font-medium">Enable WhatsApp Reminders</Label>
          </div>
          <Switch
            checked={settings.whatsapp_reminders_enabled}
            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, whatsapp_reminders_enabled: checked }))}
          />
        </div>

        {settings.whatsapp_reminders_enabled && (
          <>
            {/* Phone Number Input */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">WhatsApp Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-slate-100 rounded-l-lg border border-r-0 border-slate-200">
                  <Phone className="w-4 h-4 text-slate-500 mr-1" />
                  <span className="text-sm text-slate-600">+91</span>
                </div>
                <Input
                  type="tel"
                  placeholder="9876543210"
                  value={phoneNumber.replace(/^91/, '')}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="rounded-l-none"
                  maxLength={10}
                />
              </div>
              <p className="text-xs text-slate-500">Enter your 10-digit mobile number</p>
            </div>

            {/* Reminder Types */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Reminder Types</Label>
              
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Pill className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Medication Reminders</span>
                </div>
                <Switch
                  checked={settings.whatsapp_medication_reminders}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, whatsapp_medication_reminders: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Droplet className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Glucose Check Reminders</span>
                </div>
                <Switch
                  checked={settings.whatsapp_glucose_reminders}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, whatsapp_glucose_reminders: checked }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Appointment Reminders</span>
                </div>
                <Switch
                  checked={settings.whatsapp_appointment_reminders}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, whatsapp_appointment_reminders: checked }))}
                />
              </div>
            </div>

            {/* Test Button */}
            {phoneNumber.length >= 10 && (
              <Button
                variant="outline"
                onClick={sendTestMessage}
                disabled={testing}
                className="w-full"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <MessageCircle className="w-4 h-4 mr-2" />
                )}
                Send Test Message
              </Button>
            )}
          </>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          Save WhatsApp Settings
        </Button>

        {/* Info */}
        <p className="text-xs text-slate-500 text-center">
          You can log readings by replying to reminders. Just send your sugar level like "120 fasting".
        </p>
      </CardContent>
    </Card>
  );
}