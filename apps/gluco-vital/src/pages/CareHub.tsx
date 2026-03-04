import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Heart, MapPin, Calendar, Flame, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RefillTracker from "@/components/care/RefillTracker";
import SupportPoints from "@/components/care/SupportPoints";
import DoctorVisitTracker from "@/components/care/DoctorVisitTracker";
import HabitTracker from "@/components/care/HabitTracker";
import { generateDemoData } from "@/components/demo/DemoDataGenerator";
import DemoBanner from "@/components/demo/DemoBanner";

export default function CareHub() {
  const [user, setUser] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [demoData, setDemoData] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const demoMode = urlParams.get('demo') === 'true';
    
    if (demoMode) {
      setIsDemo(true);
      const data = generateDemoData();
      setDemoData(data);
      setUser(data.user);
    } else {
      setIsDemo(false);
      setDemoData(null);
      appClient.auth.me().then(setUser).catch(() => {});
    }
  }, [window.location.search]);

  const { data: reminders = [], refetch: refetchReminders } = useQuery({
    queryKey: ['medication-reminders', user?.email, isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        return demoData.medications;
      }
      return appClient.entities.MedicationReminder.filter({ user_email: user?.email });
    },
    enabled: !!user?.email || isDemo
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {isDemo && <DemoBanner />}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Heart className="w-8 h-8 text-[#5b9a8b]" />
            Care Hub
          </h1>
          <p className="text-slate-500 mt-1">Your complete diabetes care management center</p>
        </div>

        <Tabs defaultValue="habits" className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto gap-2 bg-transparent h-auto p-0 no-scrollbar">
            <TabsTrigger 
              value="habits" 
              className="flex-1 min-w-[70px] flex flex-col items-center gap-1 p-2 sm:p-3 data-[state=active]:bg-[#5b9a8b]/10 data-[state=active]:text-[#5b9a8b] rounded-xl border border-slate-200 data-[state=active]:border-[#5b9a8b]/30"
            >
              <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-xs">Habits</span>
            </TabsTrigger>
            <TabsTrigger 
              value="refills"
              className="flex-1 min-w-[70px] flex flex-col items-center gap-1 p-2 sm:p-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 rounded-xl border border-slate-200 data-[state=active]:border-orange-200"
            >
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-xs">Refills</span>
            </TabsTrigger>
            <TabsTrigger 
              value="visits"
              className="flex-1 min-w-[70px] flex flex-col items-center gap-1 p-2 sm:p-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 rounded-xl border border-slate-200 data-[state=active]:border-blue-200"
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-xs">Visits</span>
            </TabsTrigger>
            <TabsTrigger 
              value="support"
              className="flex-1 min-w-[70px] flex flex-col items-center gap-1 p-2 sm:p-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600 rounded-xl border border-slate-200 data-[state=active]:border-purple-200"
            >
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-xs">Support</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="habits" className="space-y-6 mt-6">
            <HabitTracker userEmail={user.email} />
            
            {/* Quick Tips for Habits */}
            <div className="bg-gradient-to-r from-[#5b9a8b]/10 to-[#7eb8a8]/10 rounded-xl p-4 border border-[#5b9a8b]/20">
              <h3 className="font-medium text-[#3d6b5f] mb-2">💡 Habit Tips</h3>
              <ul className="text-sm text-[#5a6b66] space-y-1">
                <li>• <strong>Water:</strong> Staying hydrated helps control blood sugar</li>
                <li>• <strong>Walking:</strong> Even 10-15 min after meals helps reduce sugar spikes</li>
                <li>• <strong>Foot Check:</strong> Daily checks prevent diabetic foot complications</li>
                <li>• <strong>Sleep:</strong> 7-8 hours helps insulin sensitivity</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="refills" className="space-y-6 mt-6">
            <RefillTracker reminders={reminders} onUpdate={refetchReminders} />
            
            {/* Refill Tips */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <h3 className="font-medium text-orange-800 mb-2">📦 Refill Tips</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Update pill count when you take medication</li>
                <li>• Set refill threshold to get alerts before running out</li>
                <li>• Keep pharmacy contact handy for quick reorders</li>
                <li>• Many pharmacies offer auto-refill - ask yours!</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="visits" className="space-y-6 mt-6">
            <DoctorVisitTracker userEmail={user.email} />
            
            {/* Recommended Checkups */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">🏥 Recommended Checkups for Diabetics</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-2 rounded-lg">
                  <p className="font-medium text-blue-700">Every 3 months</p>
                  <p className="text-blue-600 text-xs">HbA1c test, Doctor review</p>
                </div>
                <div className="bg-white p-2 rounded-lg">
                  <p className="font-medium text-blue-700">Every 6 months</p>
                  <p className="text-blue-600 text-xs">Kidney function, Lipid profile</p>
                </div>
                <div className="bg-white p-2 rounded-lg">
                  <p className="font-medium text-blue-700">Yearly</p>
                  <p className="text-blue-600 text-xs">Eye exam, Foot exam</p>
                </div>
                <div className="bg-white p-2 rounded-lg">
                  <p className="font-medium text-blue-700">As needed</p>
                  <p className="text-blue-600 text-xs">Cardiologist, Nutritionist</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="support" className="space-y-6 mt-6">
            <SupportPoints userEmail={user.email} />
            
            {/* Support Network Tips */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h3 className="font-medium text-purple-800 mb-2">🤝 Build Your Support Network</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• <strong>Pharmacy:</strong> Your go-to for medications and glucose supplies</li>
                <li>• <strong>Family/Caregiver:</strong> Someone who can help in emergencies</li>
                <li>• <strong>Lab:</strong> For regular blood tests (HbA1c, kidney, etc.)</li>
                <li>• <strong>CHW:</strong> Community health workers can provide local support</li>
                <li>• <strong>Diabetes Educator:</strong> Learn self-management skills</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}