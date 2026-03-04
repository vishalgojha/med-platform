import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Users, Settings, Stethoscope, CalendarCheck, Activity, Menu, X, Home, FileText } from "lucide-react";
import { appClient } from "@/api/appClient";
import InstallPrompt from "@/components/InstallPrompt";

export default function Layout({ children, currentPageName }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [userRole, setUserRole] = React.useState(null);

  React.useEffect(() => {
    appClient.auth.me().then(user => {
      const role = user?.user_role || (user?.role === 'admin' ? 'doctor' : 'patient');
      setUserRole(role);
    }).catch(() => {
      setUserRole('patient');
    });
  }, []);

  const doctorNavItems = [
    { name: "Home", icon: Home, path: "Home" },
    { name: "Dashboard", icon: LayoutDashboard, path: "Dashboard" },
    { name: "Patients", icon: Users, path: "Patients" },
    { name: "Appointments", icon: CalendarCheck, path: "Appointments" },
    { name: "Notes", icon: FileText, path: "Notes" },
    { name: "Triage", icon: Activity, path: "PatientTriage" },
    { name: "Settings", icon: Settings, path: "Settings" },
  ];

  const assistantNavItems = [
    { name: "Home", icon: Home, path: "Home" },
    { name: "Dashboard", icon: LayoutDashboard, path: "AssistantDashboard" },
    { name: "Appointments", icon: CalendarCheck, path: "Appointments" },
    { name: "Triage Reports", icon: Activity, path: "PatientTriage" },
    { name: "Patients", icon: Users, path: "Patients" },
    { name: "Settings", icon: Settings, path: "Settings" },
  ];

  const patientNavItems = [
    { name: "Home", icon: Home, path: "Home" },
    { name: "My Portal", icon: LayoutDashboard, path: "PatientPortal" },
    { name: "Book Appointment", icon: CalendarCheck, path: "PatientBooking" },
    { name: "Symptom Checker", icon: Activity, path: "PatientTriageChat" },
    { name: "Triage History", icon: FileText, path: "MyTriageHistory" },
    { name: "Settings", icon: Settings, path: "Settings" },
  ];

  const navItems = userRole === 'doctor' ? doctorNavItems : 
                   userRole === 'assistant' ? assistantNavItems : 
                   patientNavItems;

  const whatsappUrl = appClient.agents.getWhatsAppConnectURL('medical_scribe');
  const generalTriageUrl = appClient.agents.getWhatsAppConnectURL('general_triage');
  const cardiacTriageUrl = appClient.agents.getWhatsAppConnectURL('patient_triage');
  const neuroTriageUrl = appClient.agents.getWhatsAppConnectURL('neuro_triage');
  const oncologyTriageUrl = appClient.agents.getWhatsAppConnectURL('oncology_triage');



  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <InstallPrompt />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50">
        <Link to={createPageUrl("Home")} className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-800">MediScribe</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-lg" onClick={e => e.stopPropagation()}>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={createPageUrl(item.path)}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentPageName === item.path
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-100 space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                WhatsApp Agents
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm shadow-sm"
              >
                <span>Medical Scribe</span>
              </a>
              <a
                href={generalTriageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm shadow-sm"
              >
                <span>GP Triage (Main)</span>
              </a>
              <div className="text-xs text-slate-400 px-2 mt-3 mb-1">Specialist Triage:</div>
              <a
                href={cardiacTriageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors text-sm shadow-sm"
              >
                <span>Cardiac</span>
              </a>
              <a
                href={neuroTriageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors text-sm shadow-sm"
              >
                <span>Neuro</span>
              </a>
              <a
                href={oncologyTriageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg transition-colors text-sm shadow-sm"
              >
                <span>Oncology</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-800">MediScribe</span>
            </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={createPageUrl(item.path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPageName === item.path
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            WhatsApp Agents
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm shadow-sm"
          >
            <span>Medical Scribe</span>
          </a>
          <a
            href={generalTriageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm shadow-sm"
          >
            <span>GP Triage (Main)</span>
          </a>
          <div className="text-xs text-slate-400 px-2 mt-3 mb-1">Specialist Triage:</div>
          <a
            href={cardiacTriageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors text-sm shadow-sm"
          >
            <span>Cardiac</span>
          </a>
          <a
            href={neuroTriageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors text-sm shadow-sm"
          >
            <span>Neuro</span>
          </a>
          <a
            href={oncologyTriageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg transition-colors text-sm shadow-sm"
          >
            <span>Oncology</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-16 md:pt-0">
        <header className="h-14 md:h-16 bg-white border-b border-slate-200 items-center justify-between px-4 md:px-6 lg:px-8 sticky top-0 z-10 hidden md:flex">
             <h1 className="text-lg md:text-xl font-semibold text-slate-800 truncate">
              {currentPageName === 'PatientHistory' ? 'Patient History' : currentPageName}
             </h1>
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium text-sm">
                    DR
                </div>
            </div>
        </header>
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}