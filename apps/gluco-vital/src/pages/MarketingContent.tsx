import React, { useState, useRef } from "react";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share2, Image, FileText, Smartphone, Loader2, Copy, Check, Eye } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

const FLYER_TEMPLATES = [
  {
    id: "awareness",
    name: "Diabetes Awareness",
    description: "General awareness about diabetes management",
    gradient: "from-blue-500 to-cyan-400",
    icon: "💙"
  },
  {
    id: "whatsapp",
    name: "WhatsApp Feature",
    description: "Promote WhatsApp logging feature",
    gradient: "from-green-500 to-emerald-400",
    icon: "📱"
  },
  {
    id: "free",
    name: "Free to Use",
    description: "Highlight free features",
    gradient: "from-purple-500 to-pink-400",
    icon: "🎁"
  },
  {
    id: "doctor",
    name: "Doctor Sharing",
    description: "Share reports with doctor feature",
    gradient: "from-orange-500 to-amber-400",
    icon: "👨‍⚕️"
  },
  {
    id: "reminder",
    name: "Medication Reminders",
    description: "Medication reminder feature",
    gradient: "from-red-500 to-rose-400",
    icon: "💊"
  }
];

const DEFAULT_CONTENT = {
  awareness: {
    headline: "Take Control of Your Diabetes",
    subheadline: "Track. Understand. Improve.",
    body: "Log your sugar levels effortlessly via WhatsApp. Get AI-powered insights. Share reports with your doctor.",
    cta: "Start Free Today",
    stats: ["77M+ diabetics in India", "Free forever", "14 languages supported"]
  },
  whatsapp: {
    headline: "Log Sugar via WhatsApp",
    subheadline: "No app needed. Just message.",
    body: "Simply send 'Sugar 120' or 'BP 130/80' on WhatsApp. Priya, your AI health buddy, logs everything automatically.",
    cta: "Connect WhatsApp Now",
    stats: ["Works in Hindi & English", "AI-powered insights", "24/7 available"]
  },
  free: {
    headline: "100% Free Diabetes Tracking",
    subheadline: "No hidden charges. Ever.",
    body: "Track sugar, BP, meals, medications. Get weekly reports. Share with your doctor. All completely free.",
    cta: "Join Free",
    stats: ["Unlimited logs", "AI insights included", "Doctor sharing free"]
  },
  doctor: {
    headline: "Share Reports with Your Doctor",
    subheadline: "Better visits. Better care.",
    body: "Generate detailed health reports and share them with your doctor. Arrive prepared for every appointment.",
    cta: "Try Now",
    stats: ["PDF reports", "Trend charts", "One-click sharing"]
  },
  reminder: {
    headline: "Never Miss Your Medicine",
    subheadline: "Smart reminders via WhatsApp",
    body: "Set up medication reminders. Get gentle nudges on WhatsApp. Track your adherence automatically.",
    cta: "Set Reminders",
    stats: ["WhatsApp reminders", "Adherence tracking", "Refill alerts"]
  }
};

export default function MarketingContent() {
  const [selectedTemplate, setSelectedTemplate] = useState("awareness");
  const [content, setContent] = useState(DEFAULT_CONTENT.awareness);
  const [customLogo, setCustomLogo] = useState("");
  const [flyerSize, setFlyerSize] = useState("instagram");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const flyerRef = useRef(null);

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    setContent(DEFAULT_CONTENT[templateId]);
  };

  const downloadFlyer = async () => {
    if (!flyerRef.current) return;
    
    setGenerating(true);
    try {
      const canvas = await html2canvas(flyerRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true
      });
      
      const link = document.createElement("a");
      link.download = `glucovital-${selectedTemplate}-flyer.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("Flyer downloaded!");
    } catch (error) {
      toast.error("Failed to download flyer");
    } finally {
      setGenerating(false);
    }
  };

  const copyShareText = () => {
    const shareText = `${content.headline}\n\n${content.body}\n\n${content.cta} 👉 https://glucovital.fit\n\n#DiabetesCare #GlucoVital #HealthTech`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success("Share text copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const template = FLYER_TEMPLATES.find(t => t.id === selectedTemplate);

  const sizeClasses = {
    instagram: "w-[280px] sm:w-[400px] h-[280px] sm:h-[400px]",
    story: "w-[200px] sm:w-[270px] h-[355px] sm:h-[480px]",
    landscape: "w-[300px] sm:w-[500px] h-[170px] sm:h-[280px]",
    whatsapp: "w-[240px] sm:w-[300px] h-[240px] sm:h-[300px]"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Marketing Content Creator</h1>
          <p className="text-slate-500 mt-1">Create flyers and shareable content for GlucoVital</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className="space-y-6">
            {/* Template Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="w-5 h-5 text-blue-500" />
                  Choose Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {FLYER_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTemplateChange(t.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        selectedTemplate === t.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-2xl">{t.icon}</span>
                      <p className="font-medium text-sm mt-1">{t.name}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Size Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
                  Flyer Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={flyerSize} onValueChange={setFlyerSize}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram (1:1)</SelectItem>
                    <SelectItem value="story">Story (9:16)</SelectItem>
                    <SelectItem value="landscape">Landscape (16:9)</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp (1:1)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  Edit Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Headline</Label>
                  <Input
                    value={content.headline}
                    onChange={(e) => setContent({ ...content, headline: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Subheadline</Label>
                  <Input
                    value={content.subheadline}
                    onChange={(e) => setContent({ ...content, subheadline: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Body Text</Label>
                  <Textarea
                    value={content.body}
                    onChange={(e) => setContent({ ...content, body: e.target.value })}
                    className="mt-1 h-20"
                  />
                </div>
                <div>
                  <Label>Call to Action</Label>
                  <Input
                    value={content.cta}
                    onChange={(e) => setContent({ ...content, cta: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Stats (comma separated)</Label>
                  <Input
                    value={content.stats?.join(", ")}
                    onChange={(e) => setContent({ ...content, stats: e.target.value.split(", ") })}
                    className="mt-1"
                    placeholder="Stat 1, Stat 2, Stat 3"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={downloadFlyer}
                disabled={generating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download PNG
              </Button>
              <Button
                onClick={copyShareText}
                variant="outline"
                className="flex-1 text-sm"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copy Text
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Eye className="w-5 h-5" />
              <span className="font-medium">Preview</span>
            </div>
            
            <div className="flex justify-center p-6 bg-slate-100 rounded-2xl min-h-[500px] items-center overflow-auto">
              {/* Flyer Preview */}
              <div
                ref={flyerRef}
                className={`${sizeClasses[flyerSize]} bg-gradient-to-br ${template?.gradient} rounded-2xl p-6 flex flex-col justify-between text-white shadow-2xl relative overflow-hidden`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Logo */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <span className="text-lg">💚</span>
                    </div>
                    <span className="font-bold text-sm opacity-90">GlucoVital.fit</span>
                  </div>

                  {/* Headline */}
                  <h2 className={`font-bold leading-tight mb-2 ${
                    flyerSize === "story" ? "text-2xl" : "text-xl md:text-2xl"
                  }`}>
                    {content.headline}
                  </h2>
                  <p className="text-white/80 text-sm mb-3">{content.subheadline}</p>
                </div>

                {/* Body */}
                <div className="relative z-10 flex-1 flex flex-col justify-center">
                  <p className={`text-white/90 leading-relaxed ${
                    flyerSize === "story" ? "text-sm" : "text-xs md:text-sm"
                  }`}>
                    {content.body}
                  </p>

                  {/* Stats */}
                  {content.stats && content.stats.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {content.stats.map((stat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm"
                        >
                          {stat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="relative z-10">
                  <div className="bg-white text-slate-800 rounded-xl py-2.5 px-4 text-center font-bold text-sm shadow-lg">
                    {content.cta} →
                  </div>
                  <p className="text-center text-white/60 text-xs mt-2">glucovital.fit</p>
                </div>
              </div>
            </div>

            {/* Share Text Preview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share Text Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 whitespace-pre-line">
                  {content.headline}
                  {"\n\n"}
                  {content.body}
                  {"\n\n"}
                  {content.cta} 👉 https://glucovital.fit
                  {"\n\n"}
                  #DiabetesCare #GlucoVital #HealthTech
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}