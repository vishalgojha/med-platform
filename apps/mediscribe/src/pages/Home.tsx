import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, MessageSquare, Shield, Zap, Heart, Brain, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { appClient } from "@/api/appClient";

export default function Home() {
  const generalTriageUrl = appClient.agents.getWhatsAppConnectURL('general_triage');
  const cardiacTriageUrl = appClient.agents.getWhatsAppConnectURL('patient_triage');
  const neuroTriageUrl = appClient.agents.getWhatsAppConnectURL('neuro_triage');
  const oncologyTriageUrl = appClient.agents.getWhatsAppConnectURL('oncology_triage');

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-32 md:pb-48">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-50 rounded-full blur-3xl opacity-60 -z-10" />
        
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              <span>Now with WhatsApp Integration</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-4 md:mb-6 leading-tight">
              Your Medical Scribe,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Powered by AI
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed px-4">
              MediScribe automates patient history taking via WhatsApp. 
              Doctors dictate, AI logs it. Secure, scalable, and ready for your clinic.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4">
              <Link to={createPageUrl("Dashboard")}>
                <Button size="lg" className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-xl transition-all w-full sm:w-auto">
                  Launch Dashboard <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl("Demo")}>
                <Button variant="outline" size="lg" className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg rounded-full border-slate-300 hover:bg-slate-50 w-full sm:w-auto">
                  View Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Abstract UI Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-12 md:mt-20 mx-auto max-w-4xl relative px-4"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
              alt="Dashboard Preview" 
              className="rounded-xl shadow-2xl border border-slate-200 opacity-90 w-full h-auto"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 md:mb-4">Why Clinics Choose MediScribe</h2>
            <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto px-4">
              Built for speed and reliability. We handle the infrastructure so you can focus on patient care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {[
              {
                icon: MessageSquare,
                title: "WhatsApp Integrated",
                desc: "Log vitals, prescriptions, and notes directly from WhatsApp. No new apps to learn."
              },
              {
                icon: Shield,
                title: "Secure & Scalable",
                desc: "Enterprise-grade security with multi-tenant architecture. Ready for 1 or 1000 clinics."
              },
              {
                icon: CheckCircle2,
                title: "Automated History",
                desc: "AI instantly organizes unstructured notes into a clean, timeline-based medical history."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4 md:mb-6 text-blue-600">
                  <feature.icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-sm md:text-base text-slate-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Triage Agents Section */}
      <section className="py-12 md:py-24 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200 text-green-700 text-sm font-medium mb-4">
              <MessageSquare className="w-4 h-4" />
              <span>Available 24/7 on WhatsApp</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 md:mb-4">
              Instant AI Triage via WhatsApp
            </h2>
            <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto px-4">
              Get immediate symptom assessment and care guidance from specialized AI assistants
            </p>
          </div>

          {/* Main GP Triage - Featured */}
          <div className="max-w-3xl mx-auto mb-8">
            <a
              href={generalTriageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gradient-to-r from-blue-600 to-cyan-500 p-6 md:p-10 rounded-3xl shadow-2xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.5)] transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-start gap-4 md:gap-6 relative z-10">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:rotate-6 transition-all flex-shrink-0 shadow-lg">
                  <Activity className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div className="flex-1 text-white">
                  <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs px-3 py-1.5 rounded-full mb-3 backdrop-blur-sm">
                    <CheckCircle2 className="w-3 h-3" />
                    START HERE - RECOMMENDED
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">GP Triage Assistant</h3>
                  <p className="text-blue-50 mb-5 text-sm md:text-base leading-relaxed">
                    Start here for any health concern. Our AI General Practitioner will assess your symptoms and guide you to the right care level or specialist.
                  </p>
                  <div className="inline-flex items-center gap-3 bg-white text-blue-600 px-6 py-3 rounded-full font-semibold group-hover:bg-blue-50 transition-colors shadow-lg">
                    <MessageSquare className="w-5 h-5" />
                    Connect via WhatsApp
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </a>
          </div>

          {/* Specialist Triage Agents */}
          <div className="text-center mb-8">
            <p className="text-base text-slate-700 font-medium">Or connect directly with a specialist triage assistant:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            <a
              href={cardiacTriageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white p-6 md:p-8 rounded-2xl shadow-lg border-2 border-red-100 hover:border-red-400 hover:shadow-2xl hover:scale-105 transition-all group"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-5 md:mb-6 text-white group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                <Heart className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">Cardiac Triage</h3>
              <p className="text-sm md:text-base text-slate-600 mb-5 leading-relaxed">
                Chest pain, breathing difficulty, and heart-related symptom screening
              </p>
              <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-full font-semibold text-sm group-hover:bg-red-600 group-hover:text-white transition-colors">
                <MessageSquare className="w-4 h-4" />
                Connect Now
              </div>
            </a>

            <a
              href={neuroTriageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white p-6 md:p-8 rounded-2xl shadow-lg border-2 border-purple-100 hover:border-purple-400 hover:shadow-2xl hover:scale-105 transition-all group"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5 md:mb-6 text-white group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                <Brain className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">Neuro Triage</h3>
              <p className="text-sm md:text-base text-slate-600 mb-5 leading-relaxed">
                Stroke detection with FAST protocol, headaches, and neurological symptoms
              </p>
              <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2.5 rounded-full font-semibold text-sm group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <MessageSquare className="w-4 h-4" />
                Connect Now
              </div>
            </a>

            <a
              href={oncologyTriageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white p-6 md:p-8 rounded-2xl shadow-lg border-2 border-orange-100 hover:border-orange-400 hover:shadow-2xl hover:scale-105 transition-all group"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-5 md:mb-6 text-white group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg">
                <Activity className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">Oncology Triage</h3>
              <p className="text-sm md:text-base text-slate-600 mb-5 leading-relaxed">
                Cancer warning sign screening and specialist referral guidance
              </p>
              <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-2.5 rounded-full font-semibold text-sm group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <MessageSquare className="w-4 h-4" />
                Connect Now
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="bg-blue-600 rounded-2xl md:rounded-3xl p-8 md:p-20 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 md:w-96 md:h-96 bg-white opacity-10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 md:w-96 md:h-96 bg-white opacity-10 rounded-full blur-3xl" />
            
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 relative z-10">Ready to modernize your practice?</h2>
            <p className="text-sm md:text-base lg:text-lg text-blue-100 mb-6 md:mb-10 max-w-2xl mx-auto relative z-10 px-4">
              Join thousands of practitioners using MediScribe to save 2 hours a day on documentation.
            </p>
            <Link to={createPageUrl("Dashboard")}>
              <Button size="lg" className="h-12 md:h-14 px-6 md:px-8 text-blue-600 bg-white hover:bg-blue-50 rounded-full shadow-lg text-base md:text-lg relative z-10">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">MediScribe</h4>
              <p className="text-slate-500 text-sm">AI-powered medical documentation for modern clinics.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Our Products</h4>
              <div className="space-y-2">
                <a href="https://medipal.fit" target="_blank" rel="noopener noreferrer" className="block text-slate-500 text-sm hover:text-slate-800 transition-colors">
                  MediPal.fit
                </a>
                <a href="https://dietpal.fit" target="_blank" rel="noopener noreferrer" className="block text-slate-500 text-sm hover:text-slate-800 transition-colors">
                  Dietpal.fit
                </a>
                <a href="https://glucovital.fit" target="_blank" rel="noopener noreferrer" className="block text-slate-500 text-sm hover:text-slate-800 transition-colors">
                  Glucovital.fit
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-slate-500 text-sm hover:text-slate-800 transition-colors">Privacy</a>
                <a href="#" className="block text-slate-500 text-sm hover:text-slate-800 transition-colors">Terms</a>
                <a href="#" className="block text-slate-500 text-sm hover:text-slate-800 transition-colors">Contact</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 text-center text-slate-400 text-sm">
            <p>© 2024 MediScribe Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}