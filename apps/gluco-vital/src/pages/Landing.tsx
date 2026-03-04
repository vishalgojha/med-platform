import React, { useEffect, useState } from "react";
import { createPageUrl } from "@/utils";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  TrendingUp, 
  Shield, 
  Globe, 
  Heart,
  Bell,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Lock,
  FileText,
  Award,
  Mic,
  Smartphone,
  Play
} from "lucide-react";

export default function Landing() {
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  
  useEffect(() => {
    document.title = "Gluco Vital - AI Diabetes Management on WhatsApp";
    
    const metaTags = [
      { name: "description", content: "Manage diabetes with AI-powered WhatsApp assistant. Log sugar, BP & meals via simple messages. Get personalized insights in 21 languages. Free forever." },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { property: "og:title", content: "Gluco Vital - Your Health Companion on WhatsApp" },
      { property: "og:description", content: "Log sugar, BP & meals via WhatsApp. Get gentle insights and clear summaries in your language." },
      { name: "theme-color", content: "#5b9a8b" },
    ];

    metaTags.forEach(({ name, property, content }) => {
      let meta = document.querySelector(`meta[${name ? 'name' : 'property'}="${name || property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        if (name) meta.setAttribute('name', name);
        if (property) meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });

    return () => { document.title = "Gluco Vital"; };
  }, []);

  const handleGetStarted = async () => {
    const isAuth = await appClient.auth.isAuthenticated();
    if (isAuth) {
      window.location.href = createPageUrl("Home");
    } else {
      appClient.auth.redirectToLogin(createPageUrl("Home"));
    }
  };

  const handleDemo = () => {
    window.location.href = createPageUrl("Home") + "?demo=true";
  };

  return (
    <div className="min-h-screen bg-[#f8faf9]">


      {/* Hero */}
      <section className="relative overflow-hidden pb-20 md:pb-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8f5f1] via-[#f0f9f6] to-[#faf8f5]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5b9a8b]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#7eb8a8]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative px-4 py-4 max-w-6xl mx-auto">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-6 md:mb-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5b9a8b] to-[#4a8a7b] flex items-center justify-center shadow-lg shadow-[#5b9a8b]/25">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-[#3d6b5f]">Gluco Vital</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleDemo} className="hidden sm:block text-sm font-medium text-slate-600 hover:text-[#5b9a8b]">
                Try Demo
              </button>
              <Button onClick={handleGetStarted} className="bg-[#5b9a8b] hover:bg-[#4a8a7b] text-white rounded-xl px-5 h-10 text-sm shadow-md">
                Sign In
              </Button>
            </div>
          </nav>

          {/* Hero Content - Two Column */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-10 lg:gap-12 items-center py-6 md:py-12">
            {/* Left - Text */}
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full border border-[#5b9a8b]/20 shadow-sm mb-5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-[#5b9a8b]">AI-Powered Diabetes Management</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 leading-[1.1] mb-3 tracking-tight">
                Gluco<span className="text-[#5b9a8b]">Vital</span>
              </h1>
              
              <h2 className="text-xl md:text-2xl font-semibold text-slate-700 mb-4">
                Your AI Health Companion
              </h2>

              <p className="text-slate-600 text-base md:text-lg mb-6 max-w-md mx-auto md:mx-0 leading-relaxed">
                Speak or type your sugar, BP, or meals. Get instant AI insights and doctor-ready reports — in <strong>21 languages</strong>.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-3 mb-4">
                <Button 
                  size="lg"
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-[#5b9a8b] to-[#4a8a7b] hover:from-[#4a8a7b] hover:to-[#3d6b5f] h-12 md:h-14 px-6 md:px-8 text-sm md:text-base rounded-2xl shadow-xl shadow-[#5b9a8b]/25 w-full sm:w-auto"
                >
                  Get Started Free
                </Button>
                
                <button 
                  onClick={handleDemo}
                  className="text-sm font-medium text-slate-600 hover:text-[#5b9a8b] transition-colors flex items-center gap-1 py-2"
                >
                  <Play className="w-4 h-4" /> Try the demo
                </button>
              </div>

              {/* Trust line */}
              <p className="text-sm text-slate-500">Free. No credit card. Setup in 30 seconds.</p>
            </div>

            {/* Right - Product Mock */}
            <div className="relative max-w-[300px] md:max-w-[320px] mx-auto md:mx-0 md:ml-auto">
              {/* Phone Frame */}
              <div className="bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl shadow-slate-900/30">
                <div className="bg-[#e5ddd5] rounded-[2rem] overflow-hidden">
                  {/* WhatsApp Header */}
                  <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5b9a8b] to-[#4a8a7b] flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Asha • GlucoVital</p>
                      <p className="text-xs text-green-200">online</p>
                    </div>
                    <Mic className="w-5 h-5 text-white/70" />
                  </div>
                  
                  {/* Chat Messages */}
                  <div className="p-3 space-y-2.5 min-h-[280px]">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="bg-[#dcf8c6] rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%] shadow-sm">
                        <p className="text-sm text-slate-800">Sugar 120 fasting</p>
                        <p className="text-[10px] text-slate-500 text-right mt-0.5">9:15 AM ✓✓</p>
                      </div>
                    </div>
                    
                    {/* Bot response */}
                    <div className="flex justify-start">
                      <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%] shadow-sm">
                        <p className="text-sm text-slate-800 font-medium">✅ Logged: 120 mg/dL (Fasting)</p>
                        <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-100">
                          <p className="text-xs text-green-700 font-medium">🎯 In target range!</p>
                          <p className="text-[11px] text-green-600 mt-1">Your 7-day avg: 118 mg/dL ↓3%</p>
                        </div>
                        <p className="text-[10px] text-slate-500 text-right mt-1.5">9:15 AM</p>
                      </div>
                    </div>

                    {/* Report preview hint */}
                    <div className="flex justify-start">
                      <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%] shadow-sm">
                        <div className="flex items-center gap-2 text-xs text-[#5b9a8b]">
                          <FileText className="w-4 h-4" />
                          <span className="font-medium">Weekly report ready</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Tap to view doctor-ready PDF</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -left-2 md:-left-4 top-1/4 bg-white rounded-xl px-2.5 py-1.5 md:px-3 md:py-2 shadow-lg border border-slate-100 animate-pulse">
                <div className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#5b9a8b]" />
                  <span className="text-[10px] md:text-xs font-medium text-slate-700">Voice enabled</span>
                </div>
              </div>
              <div className="absolute -right-1 md:-right-2 bottom-1/3 bg-white rounded-xl px-2.5 py-1.5 md:px-3 md:py-2 shadow-lg border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />
                  <span className="text-[10px] md:text-xs font-medium text-slate-700">21 languages</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="bg-white border-y border-slate-100 py-4 md:py-5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { icon: Check, text: "Free forever", color: "text-green-500" },
              { icon: Mic, text: "Voice & text", color: "text-[#5b9a8b]" },
              { icon: Globe, text: "21 languages", color: "text-blue-500" },
              { icon: FileText, text: "Doctor reports", color: "text-violet-500" },
              { icon: Lock, text: "Encrypted", color: "text-amber-500" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - 3 Step Cards */}
      <section className="py-14 md:py-20 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">How it works</h2>
            <p className="text-slate-600">Simple as texting a friend</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { 
                icon: MessageCircle, 
                num: "1", 
                title: "Call or text", 
                desc: 'Say "Sugar 120" or type it — voice or text, your choice',
                example: '"Sugar 120 fasting"',
                color: "from-green-500 to-emerald-600"
              },
              { 
                icon: TrendingUp, 
                num: "2", 
                title: "See patterns", 
                desc: "AI analyzes your readings and spots trends you might miss",
                example: "7-day avg: 118 ↓3%",
                color: "from-[#5b9a8b] to-[#4a8a7b]"
              },
              { 
                icon: FileText, 
                num: "3", 
                title: "Share with doctor", 
                desc: "Generate clean PDF reports for better consultations",
                example: "Weekly report ready",
                color: "from-violet-500 to-purple-600"
              },
            ].map((step, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#5b9a8b]/20 transition-all duration-300 group">
                {/* Step number */}
                <div className={`absolute -top-3 -left-2 w-8 h-8 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                  {step.num}
                </div>
                
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-slate-200">
                  <step.icon className="w-7 h-7 text-[#5b9a8b]" />
                </div>
                
                <h3 className="font-bold text-lg text-slate-800 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm mb-4">{step.desc}</p>
                
                {/* Example chip */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs font-mono text-slate-600">{step.example}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - 2x3 Grid with micro-UI */}
      <section className="py-14 md:py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">What you get</h2>
            <p className="text-slate-600">Everything you need to manage diabetes better</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {[
              { 
                icon: MessageCircle, 
                title: "Voice & text logging", 
                desc: "Call or message — your choice",
                preview: <div className="flex gap-1 mt-2"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">Voice</span><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">Text</span></div>,
                color: "from-green-500/20 to-green-500/5"
              },
              { 
                icon: TrendingUp, 
                title: "Pattern insights", 
                desc: "AI spots what affects your sugar",
                preview: <div className="mt-2 text-xs text-slate-500">📊 "Readings drop 15% after walks"</div>,
                color: "from-[#5b9a8b]/20 to-[#5b9a8b]/5"
              },
              { 
                icon: Bell, 
                title: "Gentle reminders", 
                desc: "Helpful nudges, never shaming",
                preview: <div className="mt-2 text-xs text-amber-600">🔔 "Time for your evening check!"</div>,
                color: "from-amber-500/20 to-amber-500/5"
              },
              { 
                icon: FileText, 
                title: "Doctor reports", 
                desc: "Clean PDF summaries",
                preview: <div className="mt-2 flex items-center gap-1 text-[10px] text-violet-600"><FileText className="w-3 h-3" /> Weekly_Report.pdf</div>,
                color: "from-violet-500/20 to-violet-500/5"
              },
              { 
                icon: Globe, 
                title: "21 languages", 
                desc: "Hindi, Tamil, Chinese & more",
                preview: <div className="mt-2 flex gap-1 flex-wrap">{["हिंदी", "தமிழ்", "中文"].map((l,i) => <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px]">{l}</span>)}</div>,
                color: "from-blue-500/20 to-blue-500/5"
              },
              { 
                icon: Award, 
                title: "Streaks & badges", 
                desc: "Stay motivated daily",
                preview: <div className="mt-2 flex items-center gap-1"><span className="text-lg">🔥</span><span className="text-xs font-bold text-orange-600">7 day streak!</span></div>,
                color: "from-orange-500/20 to-orange-500/5"
              },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:border-[#5b9a8b]/20 transition-all duration-300 group">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-slate-100`}>
                  <f.icon className="w-5 h-5 text-[#5b9a8b]" />
                </div>
                <h3 className="font-bold text-sm md:text-base text-slate-800 mb-1">{f.title}</h3>
                <p className="text-xs md:text-sm text-slate-500">{f.desc}</p>
                {f.preview}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages Section - Expandable */}
      <section className="py-12 md:py-16 px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur mb-4">
              <Globe className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-2">Speaks your language</h3>
            <p className="text-slate-300">Log in the language you're comfortable with</p>
          </div>
          
          {/* Popular languages */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {["English", "हिंदी", "தமிழ்", "తెలుగు", "मराठी", "ગુજરાતી", "বাংলা"].map((lang, i) => (
              <span key={i} className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm font-medium hover:bg-white/20 transition-colors cursor-default">
                {lang}
              </span>
            ))}
          </div>
          
          {/* Expandable section */}
          <div className="text-center">
            <button 
              onClick={() => setShowAllLanguages(!showAllLanguages)}
              className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              {showAllLanguages ? "Show less" : "See all 21 languages"}
              {showAllLanguages ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showAllLanguages && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["Kannada", "Malayalam", "Punjabi", "Chinese", "Urdu", "Arabic", "Spanish", "Portuguese", "Japanese", "Russian", "Turkish", "German", "Indonesian", "Hinglish"].map((lang, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white/5 rounded-full text-xs text-slate-400">
                    {lang}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Simple, transparent pricing</h2>
            <p className="text-slate-600">Start free, upgrade when you're ready</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {/* Starter */}
            <div className="border-2 border-blue-300 rounded-2xl p-5 bg-gradient-to-b from-blue-50 to-white relative flex flex-col">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full shadow">1ST MONTH FREE</span>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mt-1">Starter</p>
              <p className="text-3xl font-black text-slate-800 mt-1">₹99<span className="text-sm font-normal text-slate-500">/mo</span></p>
              <p className="text-green-600 text-xs font-medium mb-4">First month free on signup</p>
              <ul className="space-y-2 text-sm text-slate-700 flex-1">
                {["Unlimited logging", "WhatsApp text & voice", "30-day history", "Weekly AI insights", "PDF reports", "Medication reminders"].map((f,i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500 flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <Button onClick={handleGetStarted} className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                Get Started
              </Button>
            </div>
            
            {/* Premium */}
            <div className="border-2 border-[#5b9a8b] rounded-2xl p-5 bg-gradient-to-b from-[#5b9a8b]/10 to-white relative shadow-xl shadow-[#5b9a8b]/10 md:scale-105 flex flex-col">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-[#5b9a8b] to-[#4a8a7b] text-white text-[10px] font-bold rounded-full shadow-lg">BEST FOR COACHES</span>
              <p className="text-xs text-[#5b9a8b] font-bold uppercase tracking-wide mt-1">Premium</p>
              <p className="text-3xl font-black text-slate-800 mt-1">₹499<span className="text-sm font-normal text-slate-500">/mo</span></p>
              <p className="text-slate-500 text-xs mb-4">For coaches & active users</p>
              <ul className="space-y-2 text-sm text-slate-700 flex-1">
                {["Everything in Starter", "Unlimited history", "Daily AI coaching", "Voice reminders", "Doctor sharing", "Lab analysis", "Client management"].map((f,i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-[#5b9a8b] flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <Button onClick={handleGetStarted} className="w-full mt-4 bg-gradient-to-r from-[#5b9a8b] to-[#4a8a7b] hover:from-[#4a8a7b] hover:to-[#3d6b5f] text-white rounded-xl">
                Get Started
              </Button>
            </div>
            
            {/* Family */}
            <div className="border-2 border-violet-200 rounded-2xl p-5 bg-white hover:border-violet-300 transition-colors flex flex-col">
              <p className="text-xs text-violet-600 font-bold uppercase tracking-wide">Family</p>
              <p className="text-3xl font-black text-slate-800 mt-1">₹799<span className="text-sm font-normal text-slate-500">/mo</span></p>
              <p className="text-slate-500 text-xs mb-4">For caregivers</p>
              <ul className="space-y-2 text-sm text-slate-700 flex-1">
                {["Everything in Premium", "Up to 5 members", "Caregiver dashboard", "Real-time alerts", "Emergency escalation"].map((f,i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-500 flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <Button onClick={handleGetStarted} className="w-full mt-4 bg-violet-500 hover:bg-violet-600 text-white rounded-xl">
                Get Started
              </Button>
            </div>
          </div>
          
          <p className="text-center text-xs text-slate-500 mt-6">
            All plans include 21 languages • Cancel anytime • Secure payments via Stripe
          </p>
        </div>
      </section>

      {/* Trust Panel + FAQ */}
      <section className="py-12 md:py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          {/* Trust Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Is my data secure?</h4>
                  <p className="text-sm text-slate-600">Yes. Encrypted and never shared. You control your health data.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Is it a replacement for my doctor?</h4>
                  <p className="text-sm text-slate-600">No. It helps you log and track, not diagnose. Always consult your doctor.</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 text-center mb-5">Frequently asked questions</h2>
          <div className="space-y-2 max-w-2xl mx-auto">
            {[
              { q: "Do I need a CGM?", a: "No. Works with finger-stick readings. Just tell Asha your reading via voice or text." },
              { q: "How do I log readings?", a: 'Text "Sugar 120" or say "BP 130/80" on WhatsApp. Asha understands natural language in 21 languages.' },
              { q: "What does Premium include?", a: "Unlimited history, daily AI coaching, voice reminders from Asha, doctor sharing, and lab report analysis." },
              { q: "Can I share data with my doctor?", a: "Yes! Generate clean PDF reports instantly and share via WhatsApp or email." },
            ].map((faq, i) => (
              <details key={i} className="group bg-white rounded-xl border border-slate-200 overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors">
                  {faq.q}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-xl">+</span>
                </summary>
                <p className="px-4 pb-4 text-sm text-slate-600 border-t border-slate-100 pt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-[#25D366]/10 via-[#128C7E]/5 to-white relative overflow-hidden mb-16 md:mb-0">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#25D366]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-[#128C7E]/10 rounded-full blur-3xl" />
        <div className="max-w-lg mx-auto text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Ready to take control?</h2>
          <p className="text-lg text-slate-600 mb-2">Free. No credit card. Setup in 30 seconds.</p>
          <p className="text-sm text-slate-500 mb-8">Join thousands managing diabetes smarter with Asha</p>
          <Button 
            size="lg"
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-[#5b9a8b] to-[#4a8a7b] hover:from-[#4a8a7b] hover:to-[#3d6b5f] h-14 px-10 text-lg rounded-2xl shadow-xl shadow-[#5b9a8b]/25"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-6 px-4 border-t border-slate-200 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <a href="https://elevenlabs.io/startup-grants" target="_blank" rel="noopener noreferrer" className="inline-block mb-3">
            <img src="https://eleven-public-cdn.elevenlabs.io/payloadcms/pwsc4vchsqt-ElevenLabsGrants.webp" alt="ElevenLabs Grants" className="h-6 mx-auto opacity-60 hover:opacity-100 transition-opacity" />
          </a>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <a href={createPageUrl("About")} className="hover:text-[#5b9a8b]">About</a>
            <a href={createPageUrl("PrivacyPolicy")} className="hover:text-[#5b9a8b]">Privacy</a>
            <a href={createPageUrl("Terms")} className="hover:text-[#5b9a8b]">Terms</a>
            <a href={createPageUrl("CancellationRefund")} className="hover:text-[#5b9a8b]">Refunds</a>
            <a href={createPageUrl("ContactUs")} className="hover:text-[#5b9a8b]">Contact</a>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            <a href="https://www.chaoscraftlabs.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#5b9a8b]">Chaos Craft Labs LLP</a> • Made in India 🇮🇳 • © 2025
          </p>
        </div>
      </footer>
    </div>
  );
}