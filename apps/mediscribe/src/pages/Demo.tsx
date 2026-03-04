import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  MessageSquare,
  Users,
  FileText,
  Calendar,
  Heart,
  Brain,
  Activity,
  CheckCircle,
  ArrowRight,
  Play,
  Smartphone,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Demo() {
  const [userRole, setUserRole] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appClient.auth.me().then(user => {
      setUserRole(user?.role);
      setLoading(false);
    }).catch(() => {
      setUserRole('user');
      setLoading(false);
    });
  }, []);

  const doctorSteps = [
    {
      title: "Dashboard Overview",
      icon: Activity,
      description: "Monitor your practice at a glance - patient count, consultations, prescriptions, and critical alerts.",
      page: "Dashboard",
      features: [
        "Real-time statistics",
        "Recent patient activity",
        "Analytics and trends",
        "Quick action buttons"
      ]
    },
    {
      title: "Patient Management",
      icon: Users,
      description: "Comprehensive patient records with complete medical history, medications, and allergies.",
      page: "Patients",
      features: [
        "Register new patients",
        "Search and filter patients",
        "View detailed medical history",
        "Track vitals and medications"
      ]
    },
    {
      title: "Clinical Notes AI",
      icon: FileText,
      description: "AI-powered clinical note assistant that structures your raw notes automatically.",
      page: "Notes",
      features: [
        "Voice dictation support",
        "AI structuring of notes",
        "ICD-10 & CPT code suggestions",
        "Quick note templates"
      ]
    },
    {
      title: "WhatsApp Medical Scribe",
      icon: MessageSquare,
      description: "Let AI take patient history via WhatsApp while you focus on care.",
      whatsapp: "medical_scribe",
      features: [
        "Automated history taking",
        "Multi-language support",
        "Structured output",
        "Direct integration to EHR"
      ]
    },
    {
      title: "AI Triage System",
      icon: Heart,
      description: "Intelligent symptom screening and patient routing before they reach your clinic.",
      whatsapp: "general_triage",
      features: [
        "GP-level initial assessment",
        "Specialist routing (Cardiac, Neuro, Oncology)",
        "Severity classification",
        "Automated PDF reports"
      ]
    },
    {
      title: "Smart Scheduling",
      icon: Calendar,
      description: "Manage appointments efficiently with automated reminders.",
      page: "Appointments",
      features: [
        "Easy appointment booking",
        "Automated SMS/WhatsApp reminders",
        "Calendar view",
        "No-show tracking"
      ]
    }
  ];

  const patientSteps = [
    {
      title: "Patient Portal",
      icon: Activity,
      description: "Your personal health dashboard with all your medical information in one place.",
      page: "PatientPortal",
      features: [
        "View your medical history",
        "Check upcoming appointments",
        "Access prescriptions",
        "Track your health vitals"
      ]
    },
    {
      title: "AI Symptom Checker",
      icon: Heart,
      description: "Get instant AI-powered health assessment via WhatsApp or web chat.",
      page: "PatientTriageChat",
      whatsapp: "general_triage",
      features: [
        "24/7 available GP-level triage",
        "Multi-language support (Hindi, English, etc.)",
        "Smart specialist routing",
        "Instant severity assessment"
      ]
    },
    {
      title: "Specialist Triage",
      icon: Brain,
      description: "Connect directly with specialized AI assistants for focused assessments.",
      features: [
        "Cardiac Triage - Heart-related symptoms",
        "Neuro Triage - Neurological & stroke screening",
        "Oncology Triage - Cancer suspicion screening",
        "Direct WhatsApp consultation"
      ],
      specialists: true
    },
    {
      title: "Book Appointments",
      icon: Calendar,
      description: "Schedule appointments with your healthcare provider easily.",
      page: "PatientBooking",
      features: [
        "View available slots",
        "Book appointments online",
        "Receive automatic reminders",
        "Manage your appointments"
      ]
    },
    {
      title: "Triage History",
      icon: FileText,
      description: "Access all your previous AI triage conversations and reports.",
      page: "MyTriageHistory",
      features: [
        "View all past consultations",
        "Download PDF reports",
        "Track symptom progression",
        "Share with your doctor"
      ]
    }
  ];

  const steps = userRole === 'admin' ? doctorSteps : patientSteps;

  const whatsappUrls = {
    medical_scribe: appClient.agents.getWhatsAppConnectURL('medical_scribe'),
    general_triage: appClient.agents.getWhatsAppConnectURL('general_triage'),
    patient_triage: appClient.agents.getWhatsAppConnectURL('patient_triage'),
    neuro_triage: appClient.agents.getWhatsAppConnectURL('neuro_triage'),
    oncology_triage: appClient.agents.getWhatsAppConnectURL('oncology_triage')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData?.icon || Activity;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
          <Play className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            Interactive Demo
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          {userRole === 'admin' ? 'Doctor Workflow Demo' : 'Patient Guide'}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          {userRole === 'admin' 
            ? 'Learn how to leverage AI-powered tools to streamline your practice'
            : 'Discover how to use MediScribe for your healthcare needs'
          }
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-blue-600 h-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Current Step */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center">
                <StepIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <Badge variant="outline" className="mb-2">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
                <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <p className="text-lg text-slate-700">{currentStepData.description}</p>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-3">
            {currentStepData.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-600">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Specialist Links */}
          {currentStepData.specialists && (
            <div className="grid md:grid-cols-2 gap-3 pt-4 border-t">
              <a
                href={whatsappUrls.patient_triage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:shadow-md transition-all"
              >
                <Heart className="w-6 h-6 text-red-600" />
                <div className="flex-1 text-left">
                  <div className="font-semibold text-red-900">Cardiac Triage</div>
                  <div className="text-xs text-red-600">WhatsApp</div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400" />
              </a>
              <a
                href={whatsappUrls.neuro_triage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:shadow-md transition-all"
              >
                <Brain className="w-6 h-6 text-purple-600" />
                <div className="flex-1 text-left">
                  <div className="font-semibold text-purple-900">Neuro Triage</div>
                  <div className="text-xs text-purple-600">WhatsApp</div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400" />
              </a>
              <a
                href={whatsappUrls.oncology_triage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg hover:shadow-md transition-all"
              >
                <Activity className="w-6 h-6 text-orange-600" />
                <div className="flex-1 text-left">
                  <div className="font-semibold text-orange-900">Oncology Triage</div>
                  <div className="text-xs text-orange-600">WhatsApp</div>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-400" />
              </a>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {currentStepData.page && (
              <Link to={createPageUrl(currentStepData.page)}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Activity className="w-4 h-4 mr-2" />
                  Try It Now
                </Button>
              </Link>
            )}
            {currentStepData.whatsapp && (
              <a
                href={whatsappUrls[currentStepData.whatsapp]}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-green-600 hover:bg-green-700">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Open WhatsApp
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        <div className="text-sm text-slate-500">
          {currentStep + 1} / {steps.length}
        </div>
        {currentStep < steps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Next Step
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Link to={createPageUrl(userRole === 'admin' ? 'Dashboard' : 'PatientPortal')}>
            <Button className="bg-green-600 hover:bg-green-700">
              Get Started
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        )}
      </div>

      {/* All Steps Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    idx === currentStep
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      idx === currentStep ? 'bg-blue-600' : 'bg-slate-200'
                    }`}>
                      <Icon className={`w-5 h-5 ${idx === currentStep ? 'text-white' : 'text-slate-600'}`} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500">Step {idx + 1}</span>
                  </div>
                  <div className="font-semibold text-sm text-slate-900">{step.title}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}