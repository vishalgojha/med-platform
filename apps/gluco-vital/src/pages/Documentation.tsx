import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Book, Server, Code, Wrench, Shield, ChevronDown, ChevronRight,
  CheckCircle, XCircle, AlertCircle, Clock, Layers, Database,
  Users, MessageCircle, Activity, FileText, Trophy, Heart,
  Pill, Calendar, Stethoscope, Bell, Globe, Loader2, ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Documentation() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    appClient.auth.me().then(setUser).catch(() => {});
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
            <p className="text-slate-500 mt-2">Admin access required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={createPageUrl("AdminDashboard")}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Book className="w-6 h-6 text-[#5b9a8b]" />
              GlucoVital.fit Documentation
            </h1>
            <p className="text-sm text-slate-500">Single Source of Truth • Version 1.0</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[250px_1fr] gap-6">
          {/* Sidebar Navigation */}
          <Card className="h-fit lg:sticky lg:top-6">
            <CardContent className="p-4">
              <nav className="space-y-1">
                <NavItem 
                  icon={Layers} 
                  label="System Overview" 
                  active={activeSection === "overview"}
                  onClick={() => setActiveSection("overview")}
                />
                <NavItem 
                  icon={Activity} 
                  label="Features & Workflows" 
                  active={activeSection === "features"}
                  onClick={() => setActiveSection("features")}
                />
                <NavItem 
                  icon={CheckCircle} 
                  label="Feature Status" 
                  active={activeSection === "status"}
                  onClick={() => setActiveSection("status")}
                />
                <NavItem 
                  icon={Code} 
                  label="Technical Implementation" 
                  active={activeSection === "technical"}
                  onClick={() => setActiveSection("technical")}
                />
                <NavItem 
                  icon={Wrench} 
                  label="Operations & Maintenance" 
                  active={activeSection === "operations"}
                  onClick={() => setActiveSection("operations")}
                />
              </nav>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="space-y-6">
            {activeSection === "overview" && <SystemOverview />}
            {activeSection === "features" && <FeaturesWorkflows />}
            {activeSection === "status" && <FeatureStatus />}
            {activeSection === "technical" && <TechnicalImplementation />}
            {activeSection === "operations" && <OperationsMaintenance />}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? "bg-[#5b9a8b]/10 text-[#5b9a8b]" 
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="w-5 h-5 text-[#5b9a8b]" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-lg">
      <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-slate-50">
        <span className="font-medium text-slate-700">{title}</span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function StatusBadge({ status }) {
  const config = {
    implemented: { icon: CheckCircle, color: "bg-green-100 text-green-700", label: "Implemented" },
    partial: { icon: AlertCircle, color: "bg-amber-100 text-amber-700", label: "Partial" },
    planned: { icon: Clock, color: "bg-blue-100 text-blue-700", label: "Planned" },
    not_implemented: { icon: XCircle, color: "bg-red-100 text-red-700", label: "Not Implemented" }
  };
  const { icon: Icon, color, label } = config[status] || config.not_implemented;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ==================== SECTION COMPONENTS ====================

function SystemOverview() {
  return (
    <div className="space-y-6">
      <SectionCard title="System & Architecture Overview" icon={Layers}>
        <div className="prose prose-sm max-w-none">
          <h4 className="text-slate-800 font-semibold mb-2">What is GlucoVital.fit?</h4>
          <p className="text-slate-600 mb-4">
            GlucoVital.fit is an AI-powered diabetes management platform that helps users track, 
            understand, and manage their health through WhatsApp integration and a web dashboard. 
            Built for accessibility across 14 languages.
          </p>
          
          <h4 className="text-slate-800 font-semibold mb-2">Architecture Principles</h4>
          <ul className="text-slate-600 space-y-1 mb-4">
            <li>• <strong>Doctor-First:</strong> Everything builds toward doctor-consumable summaries</li>
            <li>• <strong>Logging Is The Product:</strong> Patients generate signal, not manage diabetes</li>
            <li>• <strong>Decision Scaffolding:</strong> OBSERVE / STABILIZE / ESCALATE states, not advice</li>
            <li>• <strong>WhatsApp-First:</strong> Primary data entry via conversational AI agent</li>
            <li>• <strong>Draft-Sync Model:</strong> Health logs start as drafts, confirmed before becoming official records</li>
            <li>• <strong>User-Centric Security:</strong> Row-level security ensures users only access their own data</li>
            <li>• <strong>Multilingual:</strong> 14 language support with cultural context awareness</li>
          </ul>

          <h4 className="text-slate-800 font-semibold mb-2">Patient → Doctor Flow (The Spine)</h4>
          <ul className="text-slate-600 space-y-1 mb-4">
            <li>• <strong>Phase 1 - Patient (Continuous):</strong> Conversational logging, zero advice, fatigue detection</li>
            <li>• <strong>Phase 2 - Compression (Automatic):</strong> DoctorSummary generation, no prose</li>
            <li>• <strong>Phase 3 - Doctor (Episodic):</strong> Pattern view, risk flags, 30-second glance</li>
            <li>• <strong>Phase 4 - Feedback Loop (Optional):</strong> Doctor actions as events, not instructions</li>
          </ul>
        </div>
      </SectionCard>

      <SectionCard title="Core Architecture Diagram" icon={Server}>
        <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <pre className="text-slate-700">{`
┌─────────────────────────────────────────────────────────────────┐
│                        GlucoVital.fit                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   WhatsApp   │    │  Web App     │    │  Admin       │      │
│  │   (Priya)    │    │  Dashboard   │    │  Dashboard   │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                   │
│                    ┌────────▼────────┐                          │
│                    │   appClient SDK    │                          │
│                    │   (Frontend)    │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │               │
│  ┌──────▼──────┐    ┌───────▼───────┐   ┌──────▼──────┐        │
│  │  Entities   │    │   Functions   │   │   Agents    │        │
│  │  (Database) │    │   (Backend)   │   │  (AI/LLM)   │        │
│  └─────────────┘    └───────────────┘   └─────────────┘        │
│                                                                 │
│  Entities: HealthLog, PatientProfile, User, MedicationReminder, │
│            UserAchievements, LabResult, DoctorConnection, etc.  │
│                                                                 │
│  Functions: syncAchievements, razorpayWebhook, sendNotificationEmail │
│                                                                 │
│  Agents: health_buddy - Clinical decision scaffolding agent     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
          `}</pre>
        </div>
      </SectionCard>

      <SectionCard title="Core Modules" icon={Database}>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: "Health Logging", icon: Heart, desc: "Sugar, BP, meals, symptoms, medications" },
            { name: "AI Agent", icon: MessageCircle, desc: "Clinical-grade decision scaffolding, not advice" },
            { name: "Doctor Summaries", icon: Stethoscope, desc: "Signal-based clinical views, 30-sec glance" },
            { name: "Medication Management", icon: Pill, desc: "Reminders, adherence tracking, refills" },
            { name: "Reports & Analytics", icon: FileText, desc: "Weekly reports, doctor summaries" },
            { name: "Gamification", icon: Trophy, desc: "Points, streaks, badges, leaderboard" },
            { name: "Doctor Integration", icon: Stethoscope, desc: "Share reports, receive feedback" },
            { name: "Lab Results", icon: Activity, desc: "Upload, extract, track lab values" },
            { name: "Caregiver Access", icon: Users, desc: "Family monitoring and alerts" },
          ].map((module, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <module.icon className="w-5 h-5 text-[#5b9a8b] mt-0.5" />
              <div>
                <p className="font-medium text-slate-700">{module.name}</p>
                <p className="text-xs text-slate-500">{module.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function FeaturesWorkflows() {
  return (
    <div className="space-y-6">
      <SectionCard title="Features & Workflows" icon={Activity}>
        <p className="text-slate-600 mb-4">
          Detailed breakdown of all core features, user flows, and role-based access.
        </p>
      </SectionCard>

      <div className="space-y-4">
        <CollapsibleSection title="🩸 Health Logging" defaultOpen={true}>
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">
              Users can log health data via WhatsApp or the web app. All entries follow a draft-sync model.
            </p>
            <div className="bg-slate-50 p-3 rounded">
              <p className="font-medium text-slate-700 mb-2">Supported Log Types:</p>
              <ul className="text-slate-600 space-y-1">
                <li>• <strong>Sugar:</strong> Fasting, pre/post meal readings with numeric value</li>
                <li>• <strong>Blood Pressure:</strong> Systolic/diastolic with time context</li>
                <li>• <strong>Meals:</strong> Food consumed with portion details</li>
                <li>• <strong>Medication:</strong> Medication taken with timestamp</li>
                <li>• <strong>Symptoms:</strong> Health symptoms for pattern tracking</li>
                <li>• <strong>Exercise:</strong> Physical activity logs</li>
                <li>• <strong>Weight:</strong> Weight tracking over time</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="font-medium text-blue-800 mb-1">Draft-Sync Flow:</p>
              <p className="text-blue-700 text-xs">
                WhatsApp logs → Draft status → User confirms "sync" → Active status → Official record
              </p>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="🤖 AI Agent (Health Buddy)">
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">
              Clinical-grade diabetes support companion for decision scaffolding, logging, and doctor-aligned signal generation. 
              <strong> Not a coach or advisor.</strong>
            </p>
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="font-medium text-blue-800 mb-2">Core Principles (Non-Negotiable):</p>
              <ul className="text-blue-700 space-y-1 text-xs">
                <li>• <strong>No Medical Advice:</strong> Never prescribe, diagnose, or optimize behavior</li>
                <li>• <strong>Decision States:</strong> Route all situations to OBSERVE / STABILIZE / ESCALATE</li>
                <li>• <strong>Logging Is The Product:</strong> Every response ends with a logging prompt</li>
                <li>• <strong>Fatigue Detection:</strong> Track diabetes fatigue as clinical signal, not failure</li>
                <li>• <strong>Doctor-Aligned:</strong> Write as if output will be read by clinician</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-3 rounded">
              <p className="font-medium text-slate-700 mb-2">Decision States:</p>
              <ul className="text-slate-600 space-y-1">
                <li>• <strong>OBSERVE:</strong> Gather data, monitor patterns</li>
                <li>• <strong>STABILIZE:</strong> Reduce uncertainty, lower cognitive load (fatigue detected)</li>
                <li>• <strong>ESCALATE:</strong> Recommend contacting healthcare professional</li>
              </ul>
            </div>
            <div className="bg-violet-50 p-3 rounded border border-violet-200">
              <p className="font-medium text-violet-800 mb-2">Fatigue Detection Triggers:</p>
              <ul className="text-violet-700 text-xs space-y-1">
                <li>• Language markers: "I don't care", "tired of this", "what's the point"</li>
                <li>• Missed logs / logging gaps</li>
                <li>• High readings without context</li>
                <li>• Medication non-adherence patterns</li>
              </ul>
            </div>
            <div className="bg-amber-50 p-3 rounded border border-amber-200">
              <p className="font-medium text-amber-800">Safety Escalation:</p>
              <ul className="text-amber-700 text-xs mt-1">
                <li>• Sugar &lt; 70 mg/dL → Immediate hypo alert, ESCALATE state</li>
                <li>• Sugar &gt; 350 mg/dL → Urgent warning, ESCALATE state</li>
                <li>• BP &gt; 180/120 → Hypertensive crisis, ESCALATE state</li>
                <li>• Never delay escalation with logging loops</li>
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="💊 Medication Management">
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">
              Comprehensive medication tracking with reminders and adherence monitoring.
            </p>
            <div className="bg-slate-50 p-3 rounded">
              <p className="font-medium text-slate-700 mb-2">Features:</p>
              <ul className="text-slate-600 space-y-1">
                <li>• Create medication reminders with flexible timing</li>
                <li>• Mark medications as taken/skipped</li>
                <li>• Track adherence over time</li>
                <li>• Refill tracking with pill count</li>
                <li>• Export reminders to calendar (.ics)</li>
                <li>• Browser push notifications</li>
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="📊 Reports & Analytics">
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">
              Generate comprehensive health reports for personal tracking and doctor visits.
            </p>
            <div className="bg-slate-50 p-3 rounded">
              <p className="font-medium text-slate-700 mb-2">Report Types:</p>
              <ul className="text-slate-600 space-y-1">
                <li>• Weekly health summaries</li>
                <li>• Doctor-ready clinical reports</li>
                <li>• Sugar trend analysis</li>
                <li>• BP trend analysis</li>
                <li>• Medication adherence reports</li>
                <li>• AI-generated insights</li>
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="🩺 Doctor Clinical Summaries">
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">
              Signal-based summaries designed for 30-second doctor review. No prose, no recommendations — just actionable signals.
            </p>
            <div className="bg-emerald-50 p-3 rounded border border-emerald-200">
              <p className="font-medium text-emerald-800 mb-2">Summary Components:</p>
              <ul className="text-emerald-700 space-y-1 text-xs">
                <li>• <strong>Decision State Distribution:</strong> % of interactions in OBSERVE / STABILIZE / ESCALATE</li>
                <li>• <strong>Fatigue Signal:</strong> none / mild / detected / severe + trend</li>
                <li>• <strong>Logging Consistency:</strong> strong / moderate / declining / poor</li>
                <li>• <strong>Glucose Volatility:</strong> low / moderate / high / critical</li>
                <li>• <strong>Risk Flags:</strong> adherence_risk, burnout_risk, hypo_risk, hyper_risk</li>
                <li>• <strong>Patient Voice:</strong> Single verbatim quote for context</li>
                <li>• <strong>System Recommendation:</strong> ignore / monitor / review / contact</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-3 rounded">
              <p className="font-medium text-slate-700 mb-2">Validation Test:</p>
              <p className="text-slate-600 text-xs">
                "Could a doctor glance at this for 30 seconds and know what to do next?"<br />
                If yes → valid. If no → iterate on compression, not conversation.
              </p>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="🏆 Gamification">
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">
              Points, streaks, and badges to encourage consistent health tracking.
            </p>
            <div className="bg-slate-50 p-3 rounded">
              <p className="font-medium text-slate-700 mb-2">System:</p>
              <ul className="text-slate-600 space-y-1">
                <li>• 10 points per health log</li>
                <li>• 50 bonus points per 7-day streak</li>
                <li>• 5 bonus points per target hit</li>
                <li>• Badges: first_log, week_warrior, month_master, streak_starter, etc.</li>
                <li>• Global leaderboard (opt-in)</li>
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="👨‍⚕️ Doctor Integration">
          <div className="space-y-3 text-sm">
            <p className="text-slate-600">
              Share health data with healthcare providers and receive feedback.
            </p>
            <div className="bg-slate-50 p-3 rounded">
              <p className="font-medium text-slate-700 mb-2">Features:</p>
              <ul className="text-slate-600 space-y-1">
                <li>• Invite doctor via email</li>
                <li>• Time-bound or permanent access</li>
                <li>• Doctor can view logs, reports, insights</li>
                <li>• Doctor feedback system</li>
                <li>• Secure messaging</li>
              </ul>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="🔐 Role-Based Access">
          <div className="space-y-3 text-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Role</th>
                  <th className="text-left py-2">Access</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-medium">User (Patient)</td>
                  <td className="py-2">Own health data, reports, settings</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Doctor</td>
                  <td className="py-2">Connected patients' data (read-only), feedback</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Caregiver</td>
                  <td className="py-2">Assigned patient's data (configurable)</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Admin</td>
                  <td className="py-2">Full system access, user management, analytics</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

function FeatureStatus() {
  const features = [
    // Core Logging
    { category: "Health Logging", feature: "Sugar logging (manual)", status: "implemented" },
    { category: "Health Logging", feature: "BP logging (manual)", status: "implemented" },
    { category: "Health Logging", feature: "Meal logging", status: "implemented" },
    { category: "Health Logging", feature: "Medication logging", status: "implemented" },
    { category: "Health Logging", feature: "Symptom logging", status: "implemented" },
    { category: "Health Logging", feature: "Exercise/Activity logging", status: "implemented" },
    { category: "Health Logging", feature: "Weight logging", status: "implemented" },
    { category: "Health Logging", feature: "Draft-Sync model", status: "implemented" },
    
    // AI Agent
    { category: "AI Agent", feature: "WhatsApp integration", status: "implemented" },
    { category: "AI Agent", feature: "Natural language parsing", status: "implemented" },
    { category: "AI Agent", feature: "Decision state routing (OBSERVE/STABILIZE/ESCALATE)", status: "implemented" },
    { category: "AI Agent", feature: "Fatigue detection", status: "implemented" },
    { category: "AI Agent", feature: "Context logging", status: "implemented" },
    { category: "AI Agent", feature: "Safety escalation alerts", status: "implemented" },
    { category: "AI Agent", feature: "Doctor-aligned language", status: "implemented" },
    { category: "AI Agent", feature: "No medical advice policy", status: "implemented" },
    { category: "AI Agent", feature: "Proactive medication reminders via WhatsApp", status: "not_implemented", note: "WhatsApp is for queries only, not scheduled pushes" },
    
    // Doctor Summaries
    { category: "Doctor Summaries", feature: "Clinical summary generation", status: "implemented" },
    { category: "Doctor Summaries", feature: "Decision state distribution", status: "implemented" },
    { category: "Doctor Summaries", feature: "Fatigue signal tracking", status: "implemented" },
    { category: "Doctor Summaries", feature: "Risk flag detection", status: "implemented" },
    { category: "Doctor Summaries", feature: "Patient voice (verbatim)", status: "implemented" },
    { category: "Doctor Summaries", feature: "System recommendation routing", status: "implemented" },
    
    // Medications
    { category: "Medication Management", feature: "Medication reminders", status: "implemented" },
    { category: "Medication Management", feature: "Adherence tracking", status: "implemented" },
    { category: "Medication Management", feature: "Refill tracking", status: "implemented" },
    { category: "Medication Management", feature: "Calendar export (.ics)", status: "implemented" },
    { category: "Medication Management", feature: "Browser push notifications", status: "implemented" },
    { category: "Medication Management", feature: "Smart refill alerts", status: "partial", note: "Basic tracking, no pharmacy integration" },
    
    // Reports
    { category: "Reports & Analytics", feature: "Weekly health reports", status: "implemented" },
    { category: "Reports & Analytics", feature: "Doctor clinical reports", status: "implemented" },
    { category: "Reports & Analytics", feature: "Sugar trend charts", status: "implemented" },
    { category: "Reports & Analytics", feature: "BP trend charts", status: "implemented" },
    { category: "Reports & Analytics", feature: "AI-generated insights", status: "implemented" },
    { category: "Reports & Analytics", feature: "PDF export", status: "partial", note: "Basic implementation" },
    { category: "Reports & Analytics", feature: "Email reports to doctor", status: "implemented" },
    
    // Gamification
    { category: "Gamification", feature: "Points system", status: "implemented" },
    { category: "Gamification", feature: "Streak tracking", status: "implemented" },
    { category: "Gamification", feature: "Badges", status: "implemented" },
    { category: "Gamification", feature: "Leaderboard", status: "implemented" },
    { category: "Gamification", feature: "Weekly challenges", status: "partial", note: "UI exists, challenge generation basic" },
    
    // Doctor Integration
    { category: "Doctor Integration", feature: "Doctor invitation", status: "implemented" },
    { category: "Doctor Integration", feature: "Time-bound access", status: "implemented" },
    { category: "Doctor Integration", feature: "Doctor dashboard", status: "implemented" },
    { category: "Doctor Integration", feature: "Doctor feedback", status: "implemented" },
    { category: "Doctor Integration", feature: "Secure messaging", status: "implemented" },
    
    // Lab Results
    { category: "Lab Results", feature: "Manual lab entry", status: "implemented" },
    { category: "Lab Results", feature: "Lab report upload", status: "implemented" },
    { category: "Lab Results", feature: "AI extraction from images", status: "implemented" },
    { category: "Lab Results", feature: "HbA1c trend tracking", status: "implemented" },
    
    // Caregiver
    { category: "Caregiver", feature: "Caregiver access setup", status: "implemented" },
    { category: "Caregiver", feature: "Caregiver dashboard", status: "implemented" },
    { category: "Caregiver", feature: "Alert notifications", status: "partial", note: "In-app only, no SMS/email" },
    
    // Habits
    { category: "Habits & Lifestyle", feature: "Daily habit tracking", status: "implemented" },
    { category: "Habits & Lifestyle", feature: "Water intake", status: "implemented" },
    { category: "Habits & Lifestyle", feature: "Exercise tracking", status: "implemented" },
    { category: "Habits & Lifestyle", feature: "Habit streaks", status: "implemented" },
    
    // Wearables
    { category: "Wearables", feature: "Fitbit integration", status: "not_implemented", note: "UI placeholder exists" },
    { category: "Wearables", feature: "Apple Health", status: "not_implemented", note: "UI placeholder exists" },
    { category: "Wearables", feature: "Google Fit", status: "not_implemented", note: "UI placeholder exists" },
    { category: "Wearables", feature: "CGM integration", status: "not_implemented", note: "Not in scope currently" },
    
    // Payments
    { category: "Payments", feature: "Razorpay subscription", status: "implemented" },
    { category: "Payments", feature: "Free/Premium/Family tiers", status: "implemented" },
    { category: "Payments", feature: "Webhook handling", status: "implemented" },
    { category: "Payments", feature: "Subscription management", status: "partial", note: "Basic create/cancel" },
    
    // Admin
    { category: "Admin", feature: "User management", status: "implemented" },
    { category: "Admin", feature: "Data health dashboard", status: "implemented" },
    { category: "Admin", feature: "Prescription management", status: "implemented" },
    { category: "Admin", feature: "Agent control panel", status: "implemented" },
    { category: "Admin", feature: "Marketing content editor", status: "implemented" },
    
    // Other
    { category: "Other", feature: "14 language support", status: "implemented" },
    { category: "Other", feature: "PWA / Add to Home Screen", status: "implemented" },
    { category: "Other", feature: "Demo mode", status: "implemented" },
    { category: "Other", feature: "Prescription upload & extraction", status: "implemented" },
  ];

  const categories = [...new Set(features.map(f => f.category))];
  
  const stats = {
    implemented: features.filter(f => f.status === "implemented").length,
    partial: features.filter(f => f.status === "partial").length,
    planned: features.filter(f => f.status === "planned").length,
    not_implemented: features.filter(f => f.status === "not_implemented").length,
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Feature Status Matrix" icon={CheckCircle}>
        <p className="text-slate-600 mb-4">
          Current implementation status of all features. This is the source of truth for what is built vs planned.
        </p>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-700">{stats.implemented}</p>
            <p className="text-xs text-green-600">Implemented</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.partial}</p>
            <p className="text-xs text-amber-600">Partial</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.planned}</p>
            <p className="text-xs text-blue-600">Planned</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-700">{stats.not_implemented}</p>
            <p className="text-xs text-red-600">Not Implemented</p>
          </div>
        </div>
      </SectionCard>

      {categories.map(category => (
        <Card key={category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {features.filter(f => f.category === category).map((f, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{f.feature}</p>
                    {f.note && <p className="text-xs text-slate-400">{f.note}</p>}
                  </div>
                  <StatusBadge status={f.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Known Gaps & Constraints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-amber-900">
            <li>• <strong>WhatsApp:</strong> Agent is for interactive queries only; no scheduled push notifications</li>
            <li>• <strong>Wearables:</strong> UI placeholders exist but no actual integrations yet</li>
            <li>• <strong>CGM:</strong> Not in current scope; app works with finger-stick readings</li>
            <li>• <strong>SMS/Email Alerts:</strong> Not implemented for caregiver alerts</li>
            <li>• <strong>Offline Sync:</strong> PWA install supported but no true offline data sync</li>
            <li>• <strong>PDF Export:</strong> Basic implementation, not all report types supported</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function TechnicalImplementation() {
  return (
    <div className="space-y-6">
      <SectionCard title="Technical Implementation" icon={Code}>
        <p className="text-slate-600 mb-4">
          Technical details for developers working on the platform.
        </p>
      </SectionCard>

      <SectionCard title="Technology Stack" icon={Server}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-700 mb-2">Frontend</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• React 18</li>
              <li>• Tailwind CSS</li>
              <li>• shadcn/ui components</li>
              <li>• React Query (TanStack)</li>
              <li>• React Router DOM</li>
              <li>• Recharts (charts)</li>
              <li>• Framer Motion (animations)</li>
              <li>• Lucide React (icons)</li>
            </ul>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-700 mb-2">Backend (appClient Platform)</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• appClient SDK (@appClient/sdk)</li>
              <li>• Entities (JSON schema database)</li>
              <li>• Backend Functions (Deno)</li>
              <li>• AI Agents (LLM-powered)</li>
              <li>• Built-in Authentication</li>
              <li>• Row-Level Security (RLS)</li>
            </ul>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-700 mb-2">Integrations</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• WhatsApp (via appClient Agents)</li>
              <li>• Razorpay (payments)</li>
              <li>• Core.InvokeLLM (AI insights)</li>
              <li>• Core.SendEmail (notifications)</li>
              <li>• Core.UploadFile (file storage)</li>
              <li>• Core.GenerateImage (AI images)</li>
            </ul>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-700 mb-2">Key Libraries</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• date-fns (date handling)</li>
              <li>• jsPDF (PDF generation)</li>
              <li>• html2canvas (screenshots)</li>
              <li>• react-markdown (rendering)</li>
              <li>• sonner (toast notifications)</li>
              <li>• react-hook-form (forms)</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Data Models (Entities)" icon={Database}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-2">Entity</th>
                <th className="text-left p-2">Purpose</th>
                <th className="text-left p-2">Key Fields</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "HealthLog", purpose: "All health data entries", fields: "log_type, value, numeric_value, status, measured_at" },
                { name: "PatientProfile", purpose: "User health profile", fields: "conditions, medications, targets, doctor info" },
                { name: "User", purpose: "Authentication (built-in)", fields: "email, full_name, role" },
                { name: "MedicationReminder", purpose: "Medication schedules", fields: "medication_name, timing_type, specific_times" },
                { name: "MedicationAdherence", purpose: "Adherence tracking", fields: "status, taken_at, skip_reason" },
                { name: "UserAchievements", purpose: "Gamification data", fields: "total_points, current_streak, badges" },
                { name: "HealthReport", purpose: "Generated reports", fields: "report_type, summary, sugar_stats, bp_stats" },
                { name: "LabResult", purpose: "Lab test results", fields: "test_type, value, reference_range, status" },
                { name: "LabReport", purpose: "Uploaded lab documents", fields: "document_url, extraction_status" },
                { name: "DoctorSummary", purpose: "Clinical summaries for doctors", fields: "decision_state_distribution, diabetes_fatigue, risk_flags, patient_voice" },
                { name: "ConversationMemory", purpose: "Agent context memory", fields: "memory_type, key, value, confidence" },
                { name: "DoctorConnection", purpose: "Patient-doctor links", fields: "status, permissions, access_type" },
                { name: "DoctorFeedback", purpose: "Doctor recommendations", fields: "feedback_type, content, priority" },
                { name: "CaregiverAccess", purpose: "Family access control", fields: "relation, permissions, status" },
                { name: "DailyHabit", purpose: "Habit definitions", fields: "habit_type, target_value, frequency" },
                { name: "HabitLog", purpose: "Daily habit entries", fields: "habit_id, log_date, completed" },
                { name: "Subscription", purpose: "Payment subscriptions", fields: "plan, status, razorpay_subscription_id" },
              ].map((entity, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 font-mono text-xs text-[#5b9a8b]">{entity.name}</td>
                  <td className="p-2 text-slate-600">{entity.purpose}</td>
                  <td className="p-2 text-slate-500 text-xs">{entity.fields}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Backend Functions" icon={Server}>
        <div className="space-y-3">
          {[
            { name: "syncAchievements", purpose: "Calculate and update user gamification stats", trigger: "User action / periodic" },
            { name: "createRazorpaySubscription", purpose: "Create new payment subscription", trigger: "User upgrade" },
            { name: "razorpayWebhook", purpose: "Handle payment events from Razorpay", trigger: "Razorpay webhook" },
            { name: "sendNotificationEmail", purpose: "Send email notifications", trigger: "Various events" },
            { name: "invitePatient", purpose: "Send patient invitation emails", trigger: "Doctor action" },
            { name: "agentHealthLog", purpose: "Agent helper for health logging", trigger: "Agent tool" },
            { name: "agentProfile", purpose: "Agent helper for profile updates", trigger: "Agent tool" },
          ].map((fn, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded">
              <Code className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="font-mono text-sm text-slate-700">{fn.name}</p>
                <p className="text-xs text-slate-500">{fn.purpose}</p>
                <p className="text-xs text-slate-400">Trigger: {fn.trigger}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Authentication & Security" icon={Shield}>
        <div className="space-y-4 text-sm">
          <div className="bg-slate-50 p-4 rounded">
            <h4 className="font-semibold text-slate-700 mb-2">Authentication</h4>
            <ul className="text-slate-600 space-y-1">
              <li>• Built-in appClient authentication (email/password)</li>
              <li>• No custom login page needed</li>
              <li>• <code className="bg-slate-200 px-1 rounded">appClient.auth.me()</code> - Get current user</li>
              <li>• <code className="bg-slate-200 px-1 rounded">appClient.auth.logout()</code> - Logout</li>
              <li>• <code className="bg-slate-200 px-1 rounded">appClient.auth.redirectToLogin()</code> - Redirect to login</li>
            </ul>
          </div>
          <div className="bg-slate-50 p-4 rounded">
            <h4 className="font-semibold text-slate-700 mb-2">Row-Level Security (RLS)</h4>
            <p className="text-slate-600 mb-2">All entities have RLS policies to ensure users can only access their own data.</p>
            <pre className="bg-slate-800 text-slate-100 p-2 rounded text-xs overflow-x-auto">{`"rls": {
  "read": {
    "$or": [
      { "data.user_email": "{{user.email}}" },
      { "created_by": "{{user.email}}" }
    ]
  }
}`}</pre>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function OperationsMaintenance() {
  return (
    <div className="space-y-6">
      <SectionCard title="Operations & Maintenance" icon={Wrench}>
        <p className="text-slate-600 mb-4">
          Deployment, configuration, and maintenance guidelines.
        </p>
      </SectionCard>

      <SectionCard title="Environment & Configuration" icon={Server}>
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded">
            <h4 className="font-semibold text-slate-700 mb-2">Required Secrets</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Secret</th>
                  <th className="text-left py-2">Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">RAZORPAY_KEY_ID</td>
                  <td className="py-2 text-slate-600">Razorpay public key</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono text-xs">RAZORPAY_KEY_SECRET</td>
                  <td className="py-2 text-slate-600">Razorpay secret key</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono text-xs">RAZORPAY_WEBHOOK_SECRET</td>
                  <td className="py-2 text-slate-600">Webhook signature verification</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Auto-Configured</h4>
            <p className="text-blue-700 text-sm">
              APP_APP_ID is automatically set by the platform. Do not manually configure.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Key File Structure" icon={FileText}>
        <div className="bg-slate-50 p-4 rounded font-mono text-xs overflow-x-auto">
          <pre className="text-slate-700">{`├── pages/                    # Page components (FLAT, no subfolders)
│   ├── Home.jsx              # Main dashboard
│   ├── Profile.jsx           # User profile
│   ├── Progress.jsx          # Health trends
│   ├── Reports.jsx           # Report generation
│   ├── History.jsx           # Log history
│   ├── Achievements.jsx      # Gamification
│   ├── CareHub.jsx           # Care management
│   ├── AdminDashboard.jsx    # Admin panel
│   ├── DoctorDashboard.jsx   # Doctor portal
│   ├── Documentation.jsx     # This documentation
│   └── Landing.jsx           # Public landing page
├── components/               # Reusable components (can have subfolders)
│   ├── dashboard/            # Dashboard widgets
│   ├── medications/          # Medication components
│   ├── reports/              # Report components
│   ├── gamification/         # Points, badges, etc.
│   └── ...
├── entities/                 # JSON schema definitions
│   ├── HealthLog.json
│   ├── PatientProfile.json
│   └── ...
├── functions/                # Backend functions (Deno)
│   ├── syncAchievements.js
│   ├── razorpayWebhook.js
│   └── ...
├── agents/                   # AI agent configurations
│   └── health_buddy.json     # Clinical decision scaffolding agent
├── components/fatigue/       # Fatigue detection system
│   └── FatigueDetector.jsx   # Derived fatigue scoring
├── components/flow/          # Patient-Doctor flow
│   └── PatientDoctorFlow.jsx # Compression & lifecycle
└── Layout.jsx                # App shell/navigation`}</pre>
        </div>
      </SectionCard>

      <SectionCard title="Extension Points" icon={Layers}>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-slate-50 rounded">
            <p className="font-medium text-slate-700">Adding New Health Log Types</p>
            <p className="text-slate-500 text-xs mt-1">
              1. Update HealthLog.json entity schema enum<br />
              2. Add icon/color mapping in LogCard.jsx<br />
              3. Update agent instructions in health_buddy.json
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <p className="font-medium text-slate-700">Modifying Fatigue Detection</p>
            <p className="text-slate-500 text-xs mt-1">
              1. Update FATIGUE_MARKERS in FatigueDetector.jsx<br />
              2. Adjust scoring weights in calculateFatigue()<br />
              3. Document what CANNOT influence fatigue (important)
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <p className="font-medium text-slate-700">Adding Doctor Summary Fields</p>
            <p className="text-slate-500 text-xs mt-1">
              1. Update DoctorSummary.json entity schema<br />
              2. Modify compressForDoctor() in PatientDoctorFlow.jsx<br />
              3. Update DoctorSummaryCard.jsx display<br />
              4. Validate: "Can doctor glance in 30 seconds?"
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <p className="font-medium text-slate-700">Adding New Languages</p>
            <p className="text-slate-500 text-xs mt-1">
              1. Add to PatientProfile.language_preference enum<br />
              2. Update Landing page language list<br />
              3. Agent automatically supports (LLM-based)
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded">
            <p className="font-medium text-slate-700">Adding Wearable Integrations</p>
            <p className="text-slate-500 text-xs mt-1">
              1. Create OAuth connector (if supported)<br />
              2. Build sync function in /functions<br />
              3. Update WearableImport component<br />
              4. Map data to HealthLog format
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Known Limitations" icon={AlertCircle}>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <span><strong>No offline sync:</strong> PWA install supported but requires network for data operations</span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <span><strong>WhatsApp limitations:</strong> Agent cannot send scheduled push notifications</span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <span><strong>File size limits:</strong> Lab report uploads limited by platform constraints</span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <span><strong>No SMS alerts:</strong> Critical alerts are in-app/WhatsApp only</span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <span><strong>Single timezone:</strong> Currently hardcoded to IST (Asia/Kolkata)</span>
          </li>
        </ul>
      </SectionCard>

      <Card className="border-[#5b9a8b] bg-[#5b9a8b]/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#5b9a8b] flex items-center gap-2">
            <Book className="w-4 h-4" />
            Documentation Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            This documentation is located at <code className="bg-slate-200 px-1 rounded text-xs">pages/Documentation.jsx</code>.
            Update this file when adding new features or changing system behavior.
            The Feature Status section should be updated as features move from planned → partial → implemented.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}