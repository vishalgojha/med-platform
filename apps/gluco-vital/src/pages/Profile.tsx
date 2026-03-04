import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Heart, Target, Globe, Plus, X, Save, Loader2, Pill, FileImage, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import MedicationRemindersList from "@/components/medications/MedicationRemindersList";
import AdherenceTracker from "@/components/medications/AdherenceTracker";
import MedicationCalendar from "@/components/medications/MedicationCalendar";

import PrescriptionUpload from "@/components/profile/PrescriptionUpload";
import MyDataSection from "@/components/profile/MyDataSection";
import DataAccessAuditLog from "@/components/sharing/DataAccessAuditLog";
import LabResultsList from "@/components/labs/LabResultsList";
import LabReportUpload from "@/components/labs/LabReportUpload";
import HbA1cTrendChart from "@/components/labs/HbA1cTrendChart";
import CaregiverManager from "@/components/caregiver/CaregiverManager";
import { NotificationSettings } from "@/components/notifications/NotificationManager";
import CalendarExport from "@/components/medications/CalendarExport";
import SubscriptionManager from "@/components/subscription/SubscriptionManager";
import VoiceReminderSettings from "@/components/voice/VoiceReminderSettings";
import WhatsAppOptIn from "@/components/whatsapp/WhatsAppOptIn";
import RoleSelection from "@/components/onboarding/RoleSelection";

export default function Profile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [newCondition, setNewCondition] = useState("");
  const [newMedication, setNewMedication] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    timezone: "Asia/Kolkata",
    conditions: [],
    medications: [],
    is_on_insulin: false,
    disability_type: "",
    language_preference: "english",
    cultural_context: "",
    preferred_honorific: "",
    target_sugar_fasting: 100,
    target_sugar_post_meal: 140,
    target_bp_systolic: 120,
    target_bp_diastolic: 80,
    doctor_email: ""
  });

  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    appClient.auth.me()
      .then((userData) => {
        setUser(userData);
        // Show role selection if user hasn't selected a role yet
        if (!userData?.user_type) {
          setShowRoleSelection(true);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const handleRoleSelected = (role) => {
    setUser(prev => ({ ...prev, user_type: role }));
    setShowRoleSelection(false);
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: () => appClient.entities.PatientProfile.filter({ user_email: user?.email }),
    enabled: !!user?.email,
    select: data => data?.[0]
  });

  const { data: reminders = [], refetch: refetchReminders } = useQuery({
    queryKey: ['medication-reminders', user?.email],
    queryFn: () => appClient.entities.MedicationReminder.filter({ user_email: user?.email }),
    enabled: !!user?.email
  });

  const { data: labResults = [], refetch: refetchLabResults } = useQuery({
    queryKey: ['lab-results', user?.email],
    queryFn: async () => {
      const results = await appClient.entities.LabResult.list('-test_date', 100);
      return results.filter(r => r.user_email === user?.email || r.created_by === user?.email);
    },
    enabled: !!user?.email
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || user?.full_name || "",
        age: profile.age || "",
        gender: profile.gender || "",
        timezone: profile.timezone || "Asia/Kolkata",
        conditions: profile.conditions || [],
        medications: profile.medications || [], // Keep as objects with full data
        is_on_insulin: profile.is_on_insulin || false,
        disability_type: profile.disability_type || "",
        language_preference: profile.language_preference || "english",
        cultural_context: profile.cultural_context || "",
        preferred_honorific: profile.preferred_honorific || "",
        target_sugar_fasting: profile.target_sugar_fasting || 100,
        target_sugar_post_meal: profile.target_sugar_post_meal || 140,
        target_bp_systolic: profile.target_bp_systolic || 120,
        target_bp_diastolic: profile.target_bp_diastolic || 80,
        doctor_email: profile.doctor_email || ""
      });
    } else if (user) {
      setFormData(prev => ({ ...prev, name: user.full_name || "" }));
    }
  }, [profile, user]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { 
        ...data, 
        user_email: user.email,
        medications: data.medications || [] // medications are already objects
      };
      
      // Use backend function for reliable upsert
      const response = await appClient.functions.invoke('entityOperations', {
        operation: 'upsert',
        entity: 'PatientProfile',
        data: payload
      });
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile'] });
      toast.success("Profile saved successfully!", {
        description: `Name: ${formData.name}, Age: ${formData.age}, Gender: ${formData.gender || 'Not set'}`
      });
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Failed to save profile", {
        description: error?.message || "Please try again"
      });
    }
  });

  const addCondition = () => {
    if (newCondition.trim() && !formData.conditions.includes(newCondition.trim())) {
      setFormData(prev => ({
        ...prev,
        conditions: [...prev.conditions, newCondition.trim()]
      }));
      setNewCondition("");
    }
  };

  const removeCondition = (condition) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c !== condition)
    }));
  };

  const addMedication = () => {
    if (newMedication.trim() && !formData.medications.some(m => m.name === newMedication.trim())) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, { name: newMedication.trim() }]
      }));
      setNewMedication("");
    }
  };

  const removeMedication = (medicationName) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter(m => m.name !== medicationName)
    }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Please log in to view your profile</p>
          <Button onClick={() => appClient.auth.redirectToLogin()}>Log In</Button>
        </div>
      </div>
    );
  }

  // Show role selection for new users
  if (showRoleSelection) {
    return <RoleSelection onComplete={handleRoleSelected} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your health profile and targets</p>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-blue-500" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (e.target.value === "") {
                        setFormData(prev => ({ ...prev, age: "" }));
                      } else if (val >= 1 && val <= 120) {
                        setFormData(prev => ({ ...prev, age: val }));
                      }
                    }}
                    placeholder="Your age"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Language Preference</Label>
                  <Select
                    value={formData.language_preference}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, language_preference: value }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
                      <SelectItem value="hinglish">Hinglish</SelectItem>
                      <SelectItem value="chinese">中文 (Chinese) - 🇨🇳 141M diabetics</SelectItem>
                      <SelectItem value="spanish">Español (Spanish)</SelectItem>
                      <SelectItem value="portuguese">Português (Portuguese)</SelectItem>
                      <SelectItem value="urdu">اردو (Urdu) - 🇵🇰 33M diabetics</SelectItem>
                      <SelectItem value="indonesian">Bahasa (Indonesian) - 🇮🇩 19M diabetics</SelectItem>
                      <SelectItem value="german">Deutsch (German) - 🇩🇪 8M diabetics</SelectItem>
                      <SelectItem value="arabic">العربية (Arabic)</SelectItem>
                      <SelectItem value="bengali">বাংলা (Bengali) - 🇧🇩 13M diabetics</SelectItem>
                      <SelectItem value="russian">Русский (Russian) - 🇷🇺 9M diabetics</SelectItem>
                      <SelectItem value="japanese">日本語 (Japanese) - 🇯🇵 11M diabetics</SelectItem>
                      <SelectItem value="turkish">Türkçe (Turkish) - 🇹🇷 9M diabetics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">🇮🇳 India (IST)</SelectItem>
                      <SelectItem value="Asia/Dubai">🇦🇪 Dubai (GST)</SelectItem>
                      <SelectItem value="Asia/Singapore">🇸🇬 Singapore (SGT)</SelectItem>
                      <SelectItem value="Asia/Shanghai">🇨🇳 China (CST)</SelectItem>
                      <SelectItem value="Asia/Tokyo">🇯🇵 Japan (JST)</SelectItem>
                      <SelectItem value="Asia/Jakarta">🇮🇩 Indonesia (WIB)</SelectItem>
                      <SelectItem value="Asia/Karachi">🇵🇰 Pakistan (PKT)</SelectItem>
                      <SelectItem value="Asia/Dhaka">🇧🇩 Bangladesh (BST)</SelectItem>
                      <SelectItem value="Europe/London">🇬🇧 UK (GMT/BST)</SelectItem>
                      <SelectItem value="Europe/Berlin">🇩🇪 Germany (CET)</SelectItem>
                      <SelectItem value="America/New_York">🇺🇸 US East (EST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">🇺🇸 US West (PST)</SelectItem>
                      <SelectItem value="America/Sao_Paulo">🇧🇷 Brazil (BRT)</SelectItem>
                      <SelectItem value="Australia/Sydney">🇦🇺 Australia (AEST)</SelectItem>
                      <SelectItem value="Africa/Cairo">🇪🇬 Egypt (EET)</SelectItem>
                      <SelectItem value="Europe/Moscow">🇷🇺 Russia (MSK)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Accessibility Needs</Label>
                  <Input
                    value={formData.disability_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, disability_type: e.target.value }))}
                    placeholder="e.g., Visual impairment, Motor disability"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Cultural Context</Label>
                  <Select
                    value={formData.cultural_context}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, cultural_context: value }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select cultural context" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indian">Indian</SelectItem>
                      <SelectItem value="south_asian">South Asian</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="arabic">Arabic</SelectItem>
                      <SelectItem value="latin">Latin</SelectItem>
                      <SelectItem value="western">Western</SelectItem>
                      <SelectItem value="southeast_asian">Southeast Asian</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preferred Honorific</Label>
                  <Input
                    value={formData.preferred_honorific}
                    onChange={(e) => setFormData(prev => ({ ...prev, preferred_honorific: e.target.value }))}
                    placeholder="e.g., Beta, Bhaiya, Uncle, Auntie"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Conditions */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="w-5 h-5 text-red-500" />
                Health Conditions & Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Health Conditions</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    placeholder="e.g., Diabetes, Hypertension"
                    onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                  />
                  <Button onClick={addCondition} size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.conditions.map(condition => (
                    <Badge key={condition} variant="secondary" className="pl-3 pr-1 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100">
                      {condition}
                      <button onClick={() => removeCondition(condition)} className="ml-1.5 hover:bg-blue-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Current Medications</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    placeholder="e.g., Metformin 500mg"
                    onKeyPress={(e) => e.key === 'Enter' && addMedication()}
                  />
                  <Button onClick={addMedication} size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.medications.map((medication, index) => (
                    <Badge key={medication.name || index} variant="secondary" className="pl-3 pr-1 py-1.5 bg-green-50 text-green-700 hover:bg-green-100">
                      <span className="font-medium">{medication.name}</span>
                      {medication.dosage && <span className="ml-1 text-green-600">{medication.dosage}</span>}
                      {medication.timing && <span className="ml-1 text-green-500 text-xs">• {medication.timing}</span>}
                      <button onClick={() => removeMedication(medication.name)} className="ml-1.5 hover:bg-green-200 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div>
                  <Label className="text-amber-800">On Insulin Therapy?</Label>
                  <p className="text-xs text-amber-600 mt-1">Important for monitoring schedule recommendations</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_on_insulin}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_on_insulin: e.target.checked }))}
                  className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Medication Reminders */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Pill className="w-5 h-5 text-violet-500" />
                Medication Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MedicationRemindersList 
                reminders={reminders} 
                profile={{ ...profile, user_email: user?.email }} 
                onUpdate={refetchReminders}
              />
              
              {/* Calendar Export */}
              {reminders.length > 0 && (
                <CalendarExport reminders={reminders} />
              )}
            </CardContent>
          </Card>

          {/* Medication Calendar View */}
          <MedicationCalendar 
            userEmail={user?.email}
            reminders={reminders}
          />

          {/* Medication Adherence Tracking */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-[#5b9a8b]" />
                Medication Adherence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdherenceTracker 
                userEmail={user?.email}
                reminders={reminders}
              />
            </CardContent>
          </Card>

          {/* Targets */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-violet-500" />
                Health Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-700">Sugar Targets (mg/dL)</h4>
                  <div>
                    <Label className="text-slate-500">Fasting Target</Label>
                    <Input
                      type="number"
                      value={formData.target_sugar_fasting}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_sugar_fasting: parseInt(e.target.value) }))}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-500">Post-Meal Target</Label>
                    <Input
                      type="number"
                      value={formData.target_sugar_post_meal}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_sugar_post_meal: parseInt(e.target.value) }))}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-700">Blood Pressure Target (mmHg)</h4>
                  <div>
                    <Label className="text-slate-500">Systolic (upper)</Label>
                    <Input
                      type="number"
                      value={formData.target_bp_systolic}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_bp_systolic: parseInt(e.target.value) }))}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-500">Diastolic (lower)</Label>
                    <Input
                      type="number"
                      value={formData.target_bp_diastolic}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_bp_diastolic: parseInt(e.target.value) }))}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lab Results & Reports Section */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FlaskConical className="w-5 h-5 text-purple-500" />
                Lab Results & Blood Work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* HbA1c Trend Chart */}
              <HbA1cTrendChart labResults={labResults} targetHbA1c={7} />

              {/* Lab Report Upload */}
              <LabReportUpload 
                userEmail={user?.email}
                onReportUploaded={() => refetchLabResults()}
                onResultsExtracted={() => refetchLabResults()}
              />

              {/* Lab Results List */}
              <LabResultsList 
                results={labResults}
                userEmail={user?.email}
                onAddResult={async (data) => {
                  await appClient.entities.LabResult.create(data);
                  refetchLabResults();
                }}
                onUpdateResult={async (id, data) => {
                  await appClient.entities.LabResult.update(id, data);
                  refetchLabResults();
                }}
              />
            </CardContent>
          </Card>

          {/* Prescription Upload */}
          <PrescriptionUpload 
            profile={profile}
            onUpdate={async (data) => {
              await saveMutation.mutateAsync({ ...formData, ...data });
            }}
          />

          {/* Voice Reminders */}
          <VoiceReminderSettings 
            user={user} 
            profile={profile}
            onUpdate={() => queryClient.invalidateQueries({ queryKey: ['patient-profile'] })}
          />

          {/* WhatsApp Reminders */}
          <WhatsAppOptIn
            user={user}
            profile={profile}
            onUpdate={() => queryClient.invalidateQueries({ queryKey: ['patient-profile'] })}
          />

          {/* Notification Settings */}
          <NotificationSettings user={user} />

          {/* Family & Caregivers */}
          <CaregiverManager 
            userEmail={user?.email} 
            userName={formData.name || user?.full_name} 
          />

          {/* Subscription Management */}
          <SubscriptionManager user={user} />

          {/* My Data - DPDP Compliance */}
          <MyDataSection user={user} profile={profile} />

          {/* Data Access Audit Log */}
          <DataAccessAuditLog userEmail={user?.email} />

          {/* Doctor */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5 text-emerald-500" />
                Doctor Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Doctor's Email (Optional)</Label>
                <Input
                  type="email"
                  value={formData.doctor_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, doctor_email: e.target.value }))}
                  placeholder="doctor@example.com"
                  className="mt-1.5"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Share your health data with your doctor for better care coordination.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending}
            className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-white rounded-xl"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : saveMutation.isSuccess ? (
              <>
                <span className="text-green-400 mr-2">✓</span>
                Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Profile
              </>
            )}
          </Button>

          {/* Last saved info */}
          {profile?.updated_date && (
            <p className="text-center text-xs text-slate-400 mt-2">
              Last saved: {new Date(profile.updated_date).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}