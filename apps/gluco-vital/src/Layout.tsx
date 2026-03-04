import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { appClient } from "@/api/appClient";
import { Home, History, User, Menu, X, MessageCircle, LogOut, Trophy, FileText, Activity, Stethoscope, Share2, Heart, Shield, Megaphone, Users, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AddToHomeScreen from "@/components/AddToHomeScreen";
import { Toaster } from "@/components/ui/sonner";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (currentPageName !== "Landing") {
      // Check for demo mode from URL
      const urlParams = new URLSearchParams(window.location.search);
      const demoMode = urlParams.get('demo') === 'true';
      
      if (demoMode) {
        // In demo mode, always show demo user regardless of actual auth
        setUser({ full_name: "Mr. Gluco", email: "demo@glucovital.fit", role: "user" });
      } else {
        // Only fetch real user if not in demo mode
        appClient.auth.me().then(setUser).catch(() => {});
      }
    }
  }, [currentPageName, window.location.search]);

  const isAdmin = user?.role === 'admin';
  
  const navItems = [
        { name: "Dashboard", icon: Home, page: "Dashboard" },
        { name: "Care Hub", icon: Heart, page: "CareHub" },
        { name: "Progress", icon: Activity, page: "Progress" },
        { name: "Reports", icon: FileText, page: "Reports" },
        { name: "Share with Doctor", icon: Share2, page: "DoctorShare" },
              { name: "Doctor's Feedback", icon: MessageCircle, page: "PatientFeedback" },
        { name: "Doctor Portal", icon: Stethoscope, page: "DoctorDashboard" },
        { name: "Client Portal", icon: Users, page: "ClientPortal" },
        { name: "Coach Portal", icon: Heart, page: "CoachDashboard" },
    { name: "Clinical Summaries", icon: ClipboardList, page: "DoctorSummary" },
    { name: "Achievements", icon: Trophy, page: "Achievements" },
    { name: "History", icon: History, page: "History" },
      { name: "Documents", icon: FileText, page: "Documents" },
        { name: "Caregiver View", icon: Users, page: "CaregiverDashboard" },
        { name: "Profile", icon: User, page: "Profile" },
    ...(isAdmin ? [
                { name: "Admin", icon: Shield, page: "AdminDashboard" },
                { name: "Marketing", icon: Megaphone, page: "MarketingContent" },
                { name: "Docs", icon: FileText, page: "Documentation" }
              ] : [])
  ];

  // Show these pages without the full layout (accessible without auth)
  const publicPages = ["Landing", "About", "PrivacyPolicy", "Terms"];
  if (publicPages.includes(currentPageName)) {
    return children;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --soothing-bg: #f0f7f4;
          --soothing-primary: #5b9a8b;
          --soothing-primary-light: #8fc0b7;
          --soothing-accent: #7eb8a8;
          --soothing-warm: #e8d5c4;
        }
        body {
          background: linear-gradient(135deg, #f0f7f4 0%, #e8f4f0 50%, #faf6f2 100%) !important;
        }
        .shadow-sm, .shadow, .shadow-md, .shadow-lg {
          box-shadow: 0 2px 15px rgba(91, 154, 139, 0.08) !important;
        }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f0f7f4; }
        ::-webkit-scrollbar-thumb { background: #8fc0b7; border-radius: 4px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
      <div className="min-h-screen bg-[#f0f7f4] flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#f8faf9]/90 backdrop-blur-lg border-b border-[#5b9a8b]/10">
          <div className="flex items-center justify-between px-4 h-16">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5b9a8b] to-[#7eb8a8] flex items-center justify-center shadow-sm">
                                  <MessageCircle className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold text-[#3d6b5f]">Gluco Vital</span>
                              </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="absolute top-16 left-0 right-0 bg-[#f8faf9] border-b border-[#5b9a8b]/10 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
                      currentPageName === item.page
                        ? "bg-[#5b9a8b]/10 text-[#3d6b5f]"
                        : "text-[#5a6b66] hover:bg-[#5b9a8b]/5"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                ))}
                <button
                  onClick={() => appClient.auth.logout()}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#c47c7c] hover:bg-[#c47c7c]/10 w-full"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </nav>
            </div>
          )}
        </header>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-[#f8faf9] border-r border-[#5b9a8b]/10 flex-col">
          <div className="p-6">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5b9a8b] to-[#7eb8a8] flex items-center justify-center shadow-md shadow-[#5b9a8b]/20">
                                  <MessageCircle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h1 className="font-bold text-[#3d6b5f]">Gluco Vital</h1>
                                  <p className="text-xs text-[#7a9990]">Glucovital.fit</p>
                                </div>
                              </Link>
          </div>

          <nav className="flex-1 px-4 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
                    currentPageName === item.page
                      ? "bg-gradient-to-r from-[#5b9a8b]/15 to-[#7eb8a8]/10 text-[#3d6b5f] shadow-sm"
                      : "text-[#5a6b66] hover:bg-[#5b9a8b]/5"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 flex-shrink-0",
                    currentPageName === item.page ? "text-[#5b9a8b]" : ""
                  )} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* User Section */}
          {user && (
            <div className="p-4 border-t border-[#5b9a8b]/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5b9a8b]/20 to-[#7eb8a8]/20 flex items-center justify-center">
                  <span className="text-sm font-semibold text-[#5b9a8b]">
                    {user.full_name?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#3d6b5f] truncate">{user.full_name}</p>
                  <p className="text-xs text-[#7a9990] truncate">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => appClient.auth.logout()}
                className="w-full justify-start text-[#7a9990] hover:text-[#c47c7c] hover:bg-[#c47c7c]/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </aside>

        {/* Main Content */}
                  <main className="lg:ml-64 pt-16 lg:pt-0 flex-1 overflow-y-auto">
                    {children}
                  </main>

                  {/* Footer - Fixed at bottom */}
                  <footer className="lg:ml-64 bg-white/80 backdrop-blur border-t border-[#5b9a8b]/10 py-4 px-4 flex-shrink-0">
                    <div className="max-w-4xl mx-auto">
                      {/* Contextual Footer Tips */}
                      <div className="mb-3 p-3 bg-[#5b9a8b]/5 rounded-lg border border-[#5b9a8b]/10">
                        <p className="text-center text-xs text-[#5b9a8b]">
                          {currentPageName === "Home" && "💡 Tip: Log your sugar readings consistently at the same times daily for better insights."}
                          {currentPageName === "Profile" && "💡 Tip: Keep your profile updated for personalized health recommendations."}
                          {currentPageName === "Progress" && "💡 Tip: Review your weekly trends to identify patterns in your readings."}
                          {currentPageName === "Reports" && "💡 Tip: Share reports with your doctor during checkups for better care."}
                          {currentPageName === "Achievements" && "🏆 Tip: Log daily to maintain your streak and earn more badges!"}
                          {currentPageName === "History" && "📊 Tip: Use filters to find specific readings and track patterns."}
                          {!["Home", "Profile", "Progress", "Reports", "Achievements", "History"].includes(currentPageName) && "💚 Your health journey starts with small daily habits."}
                        </p>
                      </div>

                      {/* Footer Links */}
                      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#7a9990] mb-3">
                        <Link to={createPageUrl("About")} className="hover:text-[#5b9a8b] transition-colors">About</Link>
                        <span>•</span>
                        <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-[#5b9a8b] transition-colors">Privacy Policy</Link>
                        <span>•</span>
                        <Link to={createPageUrl("Terms")} className="hover:text-[#5b9a8b] transition-colors">Terms of Service</Link>
                        <span>•</span>
                        <a href="mailto:support@glucovital.fit" className="hover:text-[#5b9a8b] transition-colors">Contact</a>
                      </div>

                      {/* Copyright & Made in India */}
                      <div className="flex flex-col items-center gap-2 text-xs text-[#7a9990] mb-3">
                        <p className="text-center text-[10px] text-[#7a9990] leading-relaxed">
                          GlucoVital.fit is an experimental health project by <a href="https://www.chaoscraftlabs.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#5b9a8b]">Chaos Craft Labs LLP</a>,<br/>
                          built to explore frictionless diabetes logging and care.
                        </p>
                        <div className="flex items-center gap-1">
                          Made with <span className="text-red-500">❤️</span> in India 🇮🇳
                        </div>
                        <span>© 2025 GlucoVital.fit • All rights reserved</span>
                      </div>

                      {/* Data Security Note */}
                      <div className="text-center text-[10px] text-[#7a9990] mb-3">
                        🔒 We follow industry-standard practices to protect your health data.
                      </div>

                      {/* Medical Disclaimer */}
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-center text-[11px] text-amber-800 font-medium">
                          ⚠️ GlucoVital.fit is for informational and educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for any health concerns.
                        </p>
                      </div>
                    </div>
                  </footer>

                  {/* Add to Home Screen Prompt */}
                                          <AddToHomeScreen />

                                          {/* Toast Notifications */}
                                          <Toaster />
                                        </div>
                                      </>
                                    );
                                  }