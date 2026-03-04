import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, Bell, Pill, Droplet, Calendar, Loader2, Play, Check } from "lucide-react";
import { appClient } from "@/api/appClient";
import { toast } from "sonner";

export default function VoiceReminderSettings({ user, profile, onUpdate }) {
  const [settings, setSettings] = useState({
    voice_reminders_enabled: false,
    voice_medication_reminders: true,
    voice_glucose_reminders: true,
    voice_appointment_reminders: true,
    preferred_voice_language: 'english'
  });
  const [testing, setTesting] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load settings from profile when it changes
  React.useEffect(() => {
    if (profile) {
      console.log('Loading profile settings:', profile);
      setSettings({
        voice_reminders_enabled: profile.voice_reminders_enabled === true,
        voice_medication_reminders: profile.voice_medication_reminders !== false,
        voice_glucose_reminders: profile.voice_glucose_reminders !== false,
        voice_appointment_reminders: profile.voice_appointment_reminders !== false,
        preferred_voice_language: profile.language_preference || 'english'
      });
    }
  }, [profile]);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    console.log('Saving voice settings...', settings);
    console.log('User:', user?.email);
    console.log('Profile ID:', profile?.id);
    
    try {
      const updateData = {
        voice_reminders_enabled: settings.voice_reminders_enabled,
        voice_medication_reminders: settings.voice_medication_reminders,
        voice_glucose_reminders: settings.voice_glucose_reminders,
        voice_appointment_reminders: settings.voice_appointment_reminders,
        language_preference: settings.preferred_voice_language
      };
      
      if (!user?.email) {
        toast.error("Please log in to save settings");
        setSaving(false);
        return;
      }

      // Try to update existing profile or create new one
      if (profile?.id) {
        console.log('Updating existing profile:', profile.id);
        await appClient.entities.PatientProfile.update(profile.id, updateData);
        console.log('Profile updated successfully');
      } else {
        // Check if profile exists
        console.log('Looking for existing profile...');
        const existingProfiles = await appClient.entities.PatientProfile.filter({ user_email: user.email });
        console.log('Found profiles:', existingProfiles?.length);
        
        if (existingProfiles && existingProfiles.length > 0) {
          console.log('Updating found profile:', existingProfiles[0].id);
          await appClient.entities.PatientProfile.update(existingProfiles[0].id, updateData);
        } else {
          console.log('Creating new profile...');
          await appClient.entities.PatientProfile.create({
            user_email: user.email,
            name: user.full_name || '',
            ...updateData
          });
        }
        console.log('Save completed');
      }

      toast.success("Settings saved!");
      if (onUpdate) onUpdate(settings);
    } catch (error) {
      console.error("Save error details:", error);
      toast.error("Failed to save: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const testVoiceReminder = async (type) => {
    setTesting(type);
    try {
      console.log('Testing voice reminder:', type, settings.preferred_voice_language);
      
      const response = await appClient.functions.invoke('sendVoiceReminder', {
        reminder_type: type,
        medication_name: type === 'medication' ? 'Metformin' : undefined,
        language: settings.preferred_voice_language
      });

      console.log('Voice reminder response:', response);

      if (response.data?.error) {
        toast.error(`Error: ${response.data.error}`);
        console.error('Voice reminder error:', response.data);
        return;
      }

      // Prefer base64 for reliable playback
      const audioData = response.data?.audio_base64 || response.data?.audio_url;
      if (!audioData) {
        toast.error("No audio returned");
        console.error('No audio in response:', response.data);
        return;
      }

      const audioSrc = response.data?.audio_base64 
        ? `data:audio/mpeg;base64,${response.data.audio_base64}`
        : response.data.audio_url;
      
      const audio = new Audio(audioSrc);
      audio.oncanplaythrough = () => {
        audio.play().then(() => {
          toast.success("Playing voice reminder!");
        }).catch(e => {
          console.error('Audio play failed:', e);
          toast.error("Couldn't play audio. Click play again.");
        });
      };
      audio.onerror = (e) => {
        console.error('Audio load error:', e);
        toast.error("Audio couldn't be loaded");
      };
      audio.load();
    } catch (error) {
      console.error('Voice reminder error:', error);
      toast.error(`Failed: ${error.message || 'Unknown error'}`);
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <Volume2 className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Voice Reminders</h3>
          <p className="text-xs text-slate-500">AI-powered spoken reminders</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-slate-600" />
            <Label className="font-medium">Enable Voice Reminders</Label>
          </div>
          <Switch
            checked={settings.voice_reminders_enabled}
            onCheckedChange={() => handleToggle('voice_reminders_enabled')}
          />
        </div>

        {settings.voice_reminders_enabled && (
          <>
            {/* Language Selection */}
            <div className="p-3 border border-slate-200 rounded-xl">
              <Label className="text-sm text-slate-600 mb-2 block">Voice Language</Label>
              <Select
                value={settings.preferred_voice_language}
                onValueChange={(val) => setSettings(prev => ({ ...prev, preferred_voice_language: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">Hindi</SelectItem>
                  <SelectItem value="hinglish">Hinglish</SelectItem>
                  <SelectItem value="tamil">Tamil</SelectItem>
                  <SelectItem value="telugu">Telugu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reminder Types */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Reminder Types</p>
              
              {/* Medication */}
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Pill className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Medication Reminders</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => testVoiceReminder('medication')}
                    disabled={testing === 'medication'}
                    className="h-8 px-2"
                  >
                    {testing === 'medication' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Switch
                    checked={settings.voice_medication_reminders}
                    onCheckedChange={() => handleToggle('voice_medication_reminders')}
                  />
                </div>
              </div>

              {/* Glucose */}
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Droplet className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Glucose Reading Reminders</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => testVoiceReminder('glucose')}
                    disabled={testing === 'glucose'}
                    className="h-8 px-2"
                  >
                    {testing === 'glucose' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Switch
                    checked={settings.voice_glucose_reminders}
                    onCheckedChange={() => handleToggle('voice_glucose_reminders')}
                  />
                </div>
              </div>

              {/* Appointments */}
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Appointment Reminders</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => testVoiceReminder('appointment')}
                    disabled={testing === 'appointment'}
                    className="h-8 px-2"
                  >
                    {testing === 'appointment' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Switch
                    checked={settings.voice_appointment_reminders}
                    onCheckedChange={() => handleToggle('voice_appointment_reminders')}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#5b9a8b] hover:bg-[#4a8a7b]"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}