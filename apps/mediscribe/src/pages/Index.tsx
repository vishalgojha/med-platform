import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { appClient } from "@/api/appClient";
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      try {
        const user = await appClient.auth.me();
        
        if (user) {
          // Role-based redirect
          const userRole = user.user_role || (user.role === 'admin' ? 'doctor' : 'patient');
          
          if (userRole === 'doctor') {
            navigate(createPageUrl("Dashboard"));
          } else if (userRole === 'assistant') {
            navigate(createPageUrl("AssistantDashboard"));
          } else {
            navigate(createPageUrl("PatientPortal"));
          }
        } else {
          // Not logged in, go to home
          navigate(createPageUrl("Home"));
        }
      } catch (error) {
        // Error checking auth, go to home
        navigate(createPageUrl("Home"));
      }
    };

    checkUserAndRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}