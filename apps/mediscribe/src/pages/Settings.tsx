import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Bell, Shield, Heart, Save, Loader2, LogOut, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Settings() {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => appClient.auth.me(),
  });

  const { data: patientProfile, isLoading: patientLoading } = useQuery({
    queryKey: ["patient_profile", user?.email],
    queryFn: async () => {
      const patients = await appClient.entities.Patient.filter({ created_by: user.email });
      return patients.length > 0 ? patients[0] : null;
    },
    enabled: !!user && user.role !== 'admin',
  });

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    notifications_enabled: true,
    email_reminders: true,
  });

  const [patientData, setPatientData] = useState({
    phone_number: "",
    date_of_birth: "",
    gender: "",
    blood_group: "",
    address: "",
    city: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    allergies: "",
    chronic_conditions: "",
    current_medications: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        notifications_enabled: user.notifications_enabled ?? true,
        email_reminders: user.email_reminders ?? true,
      });
    }
  }, [user]);

  useEffect(() => {
    if (patientProfile) {
      setPatientData({
        phone_number: patientProfile.phone_number || "",
        date_of_birth: patientProfile.date_of_birth || "",
        gender: patientProfile.gender || "",
        blood_group: patientProfile.blood_group || "",
        address: patientProfile.address || "",
        city: patientProfile.city || "",
        emergency_contact_name: patientProfile.emergency_contact_name || "",
        emergency_contact_phone: patientProfile.emergency_contact_phone || "",
        allergies: patientProfile.allergies || "",
        chronic_conditions: patientProfile.chronic_conditions || "",
        current_medications: patientProfile.current_medications || "",
      });
    }
  }, [patientProfile]);

  const savePatientProfile = async () => {
    setIsSaving(true);
    try {
      if (patientProfile) {
        await appClient.entities.Patient.update(patientProfile.id, patientData);
      } else {
        await appClient.entities.Patient.create({
          ...patientData,
          full_name: user.full_name,
          clinic_id: "default",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["patient_profile"] });
      toast.success("Profile updated successfully");
      setEditMode(false);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await appClient.auth.updateMe({
        notifications_enabled: formData.notifications_enabled,
        email_reminders: formData.email_reminders,
      });
      queryClient.invalidateQueries({ queryKey: ["current_user"] });
      toast.success("Settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    appClient.auth.logout();
  };

  if (userLoading || (user?.role !== 'admin' && patientLoading)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const isPatient = user?.role !== 'admin';

  return (
    <div className="space-y-6 max-w-4xl pb-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500 mt-1 text-sm md:text-base">Manage your account and preferences.</p>
      </div>

      {/* Profile Settings */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base md:text-lg">Profile</CardTitle>
                <CardDescription className="text-xs md:text-sm">Your personal information</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                disabled
                className="bg-slate-50 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-slate-50 text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Role</Label>
            <div>
              <Badge className={
                (user?.user_role === 'doctor' || user?.role === 'admin') ? 'bg-blue-600' :
                user?.user_role === 'assistant' ? 'bg-purple-600' :
                'bg-green-600'
              }>
                {user?.user_role === 'doctor' ? 'Doctor' :
                 user?.user_role === 'assistant' ? 'Assistant' :
                 user?.role === 'admin' ? 'Doctor' : 'Patient'}
              </Badge>
            </div>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Contact your administrator to update basic profile information.
          </p>
        </CardContent>
      </Card>

      {/* Patient Medical Profile */}
      {isPatient && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Heart className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">Medical Profile</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Your health information</CardDescription>
                </div>
              </div>
              {!editMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                  className="text-xs md:text-sm"
                >
                  <Edit className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Phone Number</Label>
                <Input
                  value={patientData.phone_number}
                  onChange={(e) => setPatientData({ ...patientData, phone_number: e.target.value })}
                  disabled={!editMode}
                  className={!editMode ? "bg-slate-50 text-sm" : "text-sm"}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Date of Birth</Label>
                <Input
                  type="date"
                  value={patientData.date_of_birth}
                  onChange={(e) => setPatientData({ ...patientData, date_of_birth: e.target.value })}
                  disabled={!editMode}
                  className={!editMode ? "bg-slate-50 text-sm" : "text-sm"}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Gender</Label>
                <Select
                  value={patientData.gender}
                  onValueChange={(val) => setPatientData({ ...patientData, gender: val })}
                  disabled={!editMode}
                >
                  <SelectTrigger className={!editMode ? "bg-slate-50 text-sm" : "text-sm"}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Blood Group</Label>
                <Select
                  value={patientData.blood_group}
                  onValueChange={(val) => setPatientData({ ...patientData, blood_group: val })}
                  disabled={!editMode}
                >
                  <SelectTrigger className={!editMode ? "bg-slate-50 text-sm" : "text-sm"}>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-sm">Address</Label>
                <Input
                  value={patientData.address}
                  onChange={(e) => setPatientData({ ...patientData, address: e.target.value })}
                  disabled={!editMode}
                  className={!editMode ? "bg-slate-50 text-sm" : "text-sm"}
                  placeholder="Street address"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">City</Label>
                <Input
                  value={patientData.city}
                  onChange={(e) => setPatientData({ ...patientData, city: e.target.value })}
                  disabled={!editMode}
                  className={!editMode ? "bg-slate-50 text-sm" : "text-sm"}
                  placeholder="Mumbai"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 text-sm md:text-base">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Contact Name</Label>
                  <Input
                    value={patientData.emergency_contact_name}
                    onChange={(e) => setPatientData({ ...patientData, emergency_contact_name: e.target.value })}
                    disabled={!editMode}
                    className={!editMode ? "bg-slate-50 text-sm" : "text-sm"}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Contact Phone</Label>
                  <Input
                    value={patientData.emergency_contact_phone}
                    onChange={(e) => setPatientData({ ...patientData, emergency_contact_phone: e.target.value })}
                    disabled={!editMode}
                    className={!editMode ? "bg-slate-50 text-sm" : "text-sm"}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 text-sm md:text-base">Medical Information</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Allergies</Label>
                  <Textarea
                    value={patientData.allergies}
                    onChange={(e) => setPatientData({ ...patientData, allergies: e.target.value })}
                    disabled={!editMode}
                    className={!editMode ? "bg-slate-50 text-sm" : "text-sm"}
                    placeholder="List any known allergies..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Chronic Conditions</Label>
                  <Textarea
                    value={patientData.chronic_conditions}
                    onChange={(e) => setPatientData({ ...patientData, chronic_conditions: e.target.value })}
                    disabled={!editMode}
                    className={!editMode ? "bg-slate-50 text-sm" : "text-sm"}
                    placeholder="Diabetes, Hypertension, etc..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Current Medications</Label>
                  <Textarea
                    value={patientData.current_medications}
                    onChange={(e) => setPatientData({ ...patientData, current_medications: e.target.value })}
                    disabled={!editMode}
                    className={!editMode ? "bg-slate-50 text-sm" : "text-sm"}
                    placeholder="List current medications..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {editMode && (
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={savePatientProfile}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Medical Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  disabled={isSaving}
                  className="text-sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base md:text-lg">Notifications</CardTitle>
              <CardDescription className="text-xs md:text-sm">Configure how you receive alerts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800 text-sm md:text-base">Push Notifications</p>
              <p className="text-xs md:text-sm text-slate-500">Receive in-app notifications</p>
            </div>
            <Switch
              checked={formData.notifications_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, notifications_enabled: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800 text-sm md:text-base">Email Reminders</p>
              <p className="text-xs md:text-sm text-slate-500">Get email alerts for appointments</p>
            </div>
            <Switch
              checked={formData.email_reminders}
              onCheckedChange={(checked) => setFormData({ ...formData, email_reminders: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-base md:text-lg">Security</CardTitle>
              <CardDescription className="text-xs md:text-sm">Account security options</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-sm w-full md:w-auto"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Save Notification Settings Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-sm w-full md:w-auto"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Notification Settings
        </Button>
      </div>
    </div>
  );
}