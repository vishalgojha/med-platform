import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, Heart, Users, User, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  {
    id: "patient",
    title: "Patient",
    description: "Track my own health data, sugar levels, BP, and medications",
    icon: User,
    color: "from-[#5b9a8b] to-[#4a8a7b]",
    bgColor: "bg-[#5b9a8b]/10",
    borderColor: "border-[#5b9a8b]"
  },
  {
    id: "doctor",
    title: "Doctor",
    description: "Monitor my patients' health data and provide feedback",
    icon: Stethoscope,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500"
  },
  {
    id: "coach",
    title: "Health Coach",
    description: "Guide clients on their health journey with personalized coaching",
    icon: Heart,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500"
  },
  {
    id: "caregiver",
    title: "Caregiver",
    description: "Monitor and support a family member's health management",
    icon: Users,
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500"
  }
];

export default function RoleSelection({ onComplete }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;
    
    setSaving(true);
    try {
      await appClient.auth.updateMe({ user_type: selectedRole });
      onComplete(selectedRole);
    } catch (error) {
      console.error("Failed to save role:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7f4] via-[#f8faf9] to-[#faf8f5] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5b9a8b] to-[#4a8a7b] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Welcome to Gluco Vital</h1>
          <p className="text-slate-600">How will you be using the app?</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {roles.map((role) => (
            <Card
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg border-2",
                selectedRole === role.id ? role.borderColor : "border-transparent"
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", role.bgColor)}>
                    <role.icon className={cn("w-6 h-6", selectedRole === role.id ? "text-current" : "text-slate-600")} 
                      style={{ color: selectedRole === role.id ? role.borderColor.replace('border-', '').replace('-500', '') : undefined }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{role.title}</h3>
                      {selectedRole === role.id && (
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br", role.color)}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{role.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedRole || saving}
          className="w-full h-12 text-base bg-gradient-to-r from-[#5b9a8b] to-[#4a8a7b] hover:from-[#4a8a7b] hover:to-[#3d6b5f] shadow-lg"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : null}
          Continue
        </Button>

        <p className="text-center text-xs text-slate-400 mt-4">
          You can change this later in your profile settings
        </p>
      </div>
    </div>
  );
}