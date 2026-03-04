import React, { useState, useEffect, lazy, Suspense } from "react";
import { appClient } from "@/api/appClient";
import { Loader2 } from "lucide-react";
import RoleSelection from "@/components/onboarding/RoleSelection";

// Lazy load to avoid circular dependencies
const Home = lazy(() => import("./Home"));
const DoctorDashboard = lazy(() => import("./DoctorDashboard"));
const CoachDashboard = lazy(() => import("./CoachDashboard"));
const CaregiverDashboard = lazy(() => import("./CaregiverDashboard"));

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-[#5b9a8b]" />
  </div>
);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const demoMode = urlParams.get('demo') === 'true';
    
    if (demoMode) {
      setUser({ user_type: 'patient' });
      setLoading(false);
      return;
    }

    appClient.auth.me()
      .then((userData) => {
        setUser(userData);
        if (!userData?.user_type) {
          setShowRoleSelection(true);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleSelected = (role) => {
    setUser(prev => ({ ...prev, user_type: role }));
    setShowRoleSelection(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (showRoleSelection) {
    return <RoleSelection onComplete={handleRoleSelected} />;
  }

  const userType = user?.user_type || 'patient';

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {userType === 'doctor' && <DoctorDashboard />}
      {userType === 'coach' && <CoachDashboard />}
      {userType === 'caregiver' && <CaregiverDashboard />}
      {(userType === 'patient' || !['doctor', 'coach', 'caregiver'].includes(userType)) && <Home />}
    </Suspense>
  );
}