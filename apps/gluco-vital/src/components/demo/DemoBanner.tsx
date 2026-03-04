import React from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appClient } from "@/api/appClient";
import { createPageUrl } from "@/utils";

export default function DemoBanner({ compact = false }) {
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-amber-800">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Demo Mode</span>
        </div>
        <p className="text-xs text-amber-700 mt-1">
          Viewing sample data for Mr. Gluco
        </p>
        <Button
          size="sm"
          onClick={() => appClient.auth.redirectToLogin(createPageUrl("Home"))}
          className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          Create Your Account
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Demo Mode</span>
          <span className="text-amber-100 text-sm hidden sm:inline">
            — Viewing 30 days of sample data for Mr. Gluco
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-100 text-xs hidden md:inline">
            This is preview data only. No real health information.
          </span>
          <Button
            size="sm"
            onClick={() => appClient.auth.redirectToLogin(createPageUrl("Home"))}
            className="bg-white text-amber-600 hover:bg-amber-50"
          >
            Create Your Account
          </Button>
        </div>
      </div>
    </div>
  );
}