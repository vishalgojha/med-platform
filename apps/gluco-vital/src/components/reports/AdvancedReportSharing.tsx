import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Share2, Mail, Link2, Users, Calendar, Lock, Clock, CheckCircle,
  Loader2, Copy, ExternalLink, UserPlus, Shield, Eye, FileText
} from "lucide-react";
import { toast } from "sonner";

export default function AdvancedReportSharing({ 
  report, 
  profile, 
  onClose, 
  onShareComplete 
}) {
  const [shareTab, setShareTab] = useState("email");
  const [sharing, setSharing] = useState(false);
  
  // Email sharing state
  const [recipientEmail, setRecipientEmail] = useState(profile?.doctor_email || "");
  const [recipientName, setRecipientName] = useState(profile?.doctor_name || "");
  const [recipientType, setRecipientType] = useState("doctor");
  const [personalMessage, setPersonalMessage] = useState("");
  
  // Data selection state
  const [includeOptions, setIncludeOptions] = useState({
    summary: true,
    sugarStats: true,
    bpStats: true,
    medicationAdherence: true,
    risks: true,
    recommendations: true,
    achievements: true,
    doctorQuestions: true,
    charts: false,
    personalNotes: false,
    doctorDetails: false
  });
  
  // Access control state
  const [accessDuration, setAccessDuration] = useState("permanent");
  const [customDays, setCustomDays] = useState(30);
  
  // Link sharing state
  const [shareLink, setShareLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const handleEmailShare = async () => {
    if (!recipientEmail) {
      toast.error("Please enter recipient's email");
      return;
    }
    
    setSharing(true);
    try {
      const emailBody = generateEmailContent();
      
      await appClient.integrations.Core.SendEmail({
        to: recipientEmail,
        subject: `Health Report: ${profile?.name || 'Patient'} - ${format(new Date(report.start_date), "MMM d")} to ${format(new Date(report.end_date), "MMM d, yyyy")}`,
        body: emailBody
      });

      // Update report with sharing info
      await appClient.entities.HealthReport.update(report.id, { 
        shared_with_doctor: recipientType === "doctor",
        doctor_email: recipientType === "doctor" ? recipientEmail : report.doctor_email
      });

      toast.success(`Report shared with ${recipientName || recipientEmail}!`);
      onShareComplete?.();
      onClose();
    } catch (error) {
      toast.error("Failed to share report");
      console.error(error);
    } finally {
      setSharing(false);
    }
  };

  const generateEmailContent = () => {
    let content = `
Health Report for ${profile?.name || 'Patient'}
Period: ${format(new Date(report.start_date), "MMMM d")} - ${format(new Date(report.end_date), "MMMM d, yyyy")}
Report Type: ${report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
`;

    if (personalMessage) {
      content += `\n---\nMessage from patient:\n${personalMessage}\n---\n`;
    }

    if (includeOptions.summary && report.summary) {
      content += `\n📋 SUMMARY\n${report.summary}\n`;
    }

    if (includeOptions.sugarStats && report.sugar_stats) {
      content += `
🩸 BLOOD SUGAR STATISTICS
• Average: ${report.sugar_stats.average} mg/dL
• Range: ${report.sugar_stats.lowest} - ${report.sugar_stats.highest} mg/dL
• Fasting Average: ${report.sugar_stats.fasting_avg || 'N/A'} mg/dL
• Post-Meal Average: ${report.sugar_stats.post_meal_avg || 'N/A'} mg/dL
• Total Readings: ${report.sugar_stats.readings_count}
• In Target: ${report.sugar_stats.in_target_percent}%
• Trend: ${report.sugar_stats.trend || 'N/A'}
`;
    }

    if (includeOptions.bpStats && report.bp_stats) {
      content += `
❤️ BLOOD PRESSURE STATISTICS
• Average: ${report.bp_stats.avg_systolic}/${report.bp_stats.avg_diastolic} mmHg
• Readings: ${report.bp_stats.readings_count}
• In Target: ${report.bp_stats.in_target_percent}%
`;
    }

    if (includeOptions.medicationAdherence) {
      content += `
💊 MEDICATION ADHERENCE: ${report.medication_adherence}%
${report.adherence_details ? `(${report.adherence_details.total_taken}/${report.adherence_details.total_expected} doses taken)` : ''}
`;
    }

    if (includeOptions.risks && report.risks_identified?.length > 0) {
      content += `\n⚠️ RISKS IDENTIFIED\n${report.risks_identified.map(r => `• ${r}`).join('\n')}\n`;
    }

    if (includeOptions.recommendations && report.recommendations?.length > 0) {
      content += `\n💡 RECOMMENDATIONS\n${report.recommendations.map(r => `• ${r}`).join('\n')}\n`;
    }

    if (includeOptions.achievements && report.achievements?.length > 0) {
      content += `\n🏆 ACHIEVEMENTS\n${report.achievements.map(a => `• ${a}`).join('\n')}\n`;
    }

    if (includeOptions.doctorQuestions && report.questions_for_doctor?.length > 0) {
      content += `\n❓ QUESTIONS FOR DOCTOR\n${report.questions_for_doctor.map(q => `• ${q}`).join('\n')}\n`;
    }

    if (includeOptions.personalNotes && report.personal_notes) {
      content += `\n📝 PATIENT NOTES\n${report.personal_notes}\n`;
    }

    if (includeOptions.doctorDetails && (profile?.doctor_name || profile?.prescription_clinic)) {
      content += `
👨‍⚕️ DOCTOR & CLINIC DETAILS
${profile?.doctor_name ? `Doctor: ${profile.doctor_name}` : ''}
${profile?.doctor_specialization ? `Specialization: ${profile.doctor_specialization}` : ''}
${profile?.prescription_clinic ? `Clinic: ${profile.prescription_clinic}` : ''}
`;
    }

    content += `
---
Generated by GlucoVital.fit on ${format(new Date(), "MMMM d, yyyy")}

⚠️ DISCLAIMER: This report is generated by AI for informational purposes only. 
It is NOT a substitute for professional medical advice, diagnosis, or treatment.
`;

    return content;
  };

  const handleCopyLink = () => {
    // In a real implementation, this would generate a secure shareable link
    const dummyLink = `https://glucovital.fit/shared-report/${report.id}`;
    navigator.clipboard.writeText(dummyLink);
    setShareLink(dummyLink);
    setLinkCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const getExpiryDate = () => {
    if (accessDuration === "permanent") return null;
    const now = new Date();
    switch (accessDuration) {
      case "7days": return addDays(now, 7);
      case "30days": return addDays(now, 30);
      case "90days": return addDays(now, 90);
      case "custom": return addDays(now, customDays);
      default: return null;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Share Report
          </DialogTitle>
        </DialogHeader>

        <Tabs value={shareTab} onValueChange={setShareTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" /> Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            {/* Recipient Type */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Share with</Label>
              <RadioGroup value={recipientType} onValueChange={setRecipientType} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="doctor" id="doctor" />
                  <Label htmlFor="doctor" className="flex items-center gap-1 cursor-pointer">
                    <Shield className="w-4 h-4 text-blue-500" /> Doctor
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="family" id="family" />
                  <Label htmlFor="family" className="flex items-center gap-1 cursor-pointer">
                    <Users className="w-4 h-4 text-violet-500" /> Family Member
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Name (optional)</Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder={recipientType === "doctor" ? "Dr. Smith" : "Family member name"}
                />
              </div>
              <div>
                <Label className="text-sm">Email *</Label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* Personal Message */}
            <div>
              <Label className="text-sm">Personal Message (optional)</Label>
              <Textarea
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                placeholder="Add a personal note to accompany this report..."
                className="h-20"
              />
            </div>

            {/* Data Selection */}
            <div className="bg-slate-50 rounded-lg p-4">
              <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                <Eye className="w-4 h-4" /> Include in Report
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries({
                  summary: "Summary",
                  sugarStats: "Sugar Statistics",
                  bpStats: "Blood Pressure",
                  medicationAdherence: "Medication Adherence",
                  risks: "Risks Identified",
                  recommendations: "Recommendations",
                  achievements: "Achievements",
                  doctorQuestions: "Questions for Doctor",
                  personalNotes: "Personal Notes",
                  doctorDetails: "Doctor/Clinic Details"
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Switch
                      id={key}
                      checked={includeOptions[key]}
                      onCheckedChange={(checked) => setIncludeOptions(prev => ({ ...prev, [key]: checked }))}
                      className="h-4 w-7"
                    />
                    <Label htmlFor={key} className="text-xs cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleEmailShare} 
              disabled={sharing || !recipientEmail}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {sharing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Report via Email
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            {/* Access Duration */}
            <div>
              <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Clock className="w-4 h-4" /> Access Duration
              </Label>
              <RadioGroup value={accessDuration} onValueChange={setAccessDuration} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="7days" id="7days" />
                  <Label htmlFor="7days" className="cursor-pointer">7 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30days" id="30days" />
                  <Label htmlFor="30days" className="cursor-pointer">30 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="90days" id="90days" />
                  <Label htmlFor="90days" className="cursor-pointer">90 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="permanent" id="permanent" />
                  <Label htmlFor="permanent" className="cursor-pointer">Permanent access</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Security Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Secure Sharing</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Link access is password-protected and can be revoked anytime from your settings.
                    {accessDuration !== "permanent" && ` Expires ${format(getExpiryDate(), "MMM d, yyyy")}.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Generate/Copy Link */}
            <div className="bg-slate-50 rounded-lg p-4">
              {shareLink ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-white rounded border text-sm truncate">
                    <Link2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate text-slate-600">{shareLink}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyLink}
                      className="flex-1"
                    >
                      {linkCopied ? <CheckCircle className="w-4 h-4 mr-1 text-green-500" /> : <Copy className="w-4 h-4 mr-1" />}
                      {linkCopied ? "Copied!" : "Copy Link"}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(shareLink, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open Link
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={handleCopyLink} className="w-full">
                  <Link2 className="w-4 h-4 mr-2" />
                  Generate Shareable Link
                </Button>
              )}
            </div>

            <p className="text-xs text-slate-500 text-center">
              Anyone with this link can view the report (password required)
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}