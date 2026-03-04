import React, { useState, useRef, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { format, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Calendar, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle, Lightbulb, Trophy, Share2, Download, Mail, X, Loader2, 
  BarChart3, HelpCircle, Stethoscope, Heart, Droplet, Pill, Edit3, Save,
  LineChart, Activity, Users, Link2
} from "lucide-react";
import { toast } from "sonner";
import { 
  ResponsiveContainer, LineChart as RechartsLine, BarChart, Line, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Area, AreaChart,
  PieChart, Pie, Cell
} from "recharts";
import AdvancedReportSharing from "./AdvancedReportSharing";
import { DetailedSugarAnalysis, BPAnalysis, AdherenceAnalysis } from "./AdvancedAnalytics";

export default function EnhancedReportViewer({ report, profile, onClose, onUpdate, isCaregiver = false }) {
  const [sharing, setSharing] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState(profile?.doctor_email || "");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAdvancedShare, setShowAdvancedShare] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [logs, setLogs] = useState([]);
  const [adherenceRecords, setAdherenceRecords] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [personalNotes, setPersonalNotes] = useState(report?.personal_notes || "");
  const reportRef = useRef(null);

  useEffect(() => {
    if (report?.user_email) {
      setLoadingLogs(true);
      
      // Fetch logs and adherence records in parallel
      Promise.all([
        appClient.entities.HealthLog.list('-created_date', 500),
        appClient.entities.MedicationAdherence.list('-scheduled_time', 500).catch(() => [])
      ]).then(([allLogs, allAdherence]) => {
        const userLogs = allLogs.filter(log => 
          (log.user_email === report.user_email || log.created_by === report.user_email) &&
          log.status !== 'corrected' && log.status !== 'deleted'
        );
        const filtered = userLogs.filter(log => {
          const logDate = new Date(log.created_date);
          return logDate >= new Date(report.start_date) && logDate <= new Date(report.end_date);
        });
        setLogs(filtered);
        
        // Filter adherence records
        const userAdherence = allAdherence.filter(a => 
          a.user_email === report.user_email &&
          new Date(a.scheduled_time) >= new Date(report.start_date) &&
          new Date(a.scheduled_time) <= new Date(report.end_date)
        );
        setAdherenceRecords(userAdherence);
      }).finally(() => setLoadingLogs(false));
    }
  }, [report]);

  const saveNotes = async () => {
    try {
      await appClient.entities.HealthReport.update(report.id, { personal_notes: personalNotes });
      toast.success("Notes saved!");
      setEditingNotes(false);
      onUpdate?.();
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const handleShare = async () => {
    if (!doctorEmail) {
      toast.error("Please enter doctor's email");
      return;
    }
    
    setSharing(true);
    try {
      await appClient.integrations.Core.SendEmail({
        to: doctorEmail,
        subject: `Health Report: ${profile?.name || 'Patient'} - ${format(new Date(report.start_date), "MMM d")} to ${format(new Date(report.end_date), "MMM d, yyyy")}`,
        body: generateEmailBody()
      });

      await appClient.entities.HealthReport.update(report.id, { 
        shared_with_doctor: true,
        doctor_email: doctorEmail
      });

      toast.success("Report shared with doctor!");
      setShowShareDialog(false);
      onUpdate?.();
    } catch (error) {
      toast.error("Failed to share report");
    } finally {
      setSharing(false);
    }
  };

  const generateEmailBody = () => `
Health Report for ${profile?.name || 'Patient'}
Period: ${format(new Date(report.start_date), "MMMM d")} - ${format(new Date(report.end_date), "MMMM d, yyyy")}
Type: ${report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)} Report

SUMMARY
${report.summary}

${report.personal_notes ? `PATIENT NOTES\n${report.personal_notes}\n` : ''}

SUGAR STATISTICS
${report.sugar_stats ? `
• Average: ${report.sugar_stats.average} mg/dL
• Range: ${report.sugar_stats.lowest} - ${report.sugar_stats.highest} mg/dL
• Fasting Avg: ${report.sugar_stats.fasting_avg || 'N/A'} mg/dL
• Post-Meal Avg: ${report.sugar_stats.post_meal_avg || 'N/A'} mg/dL
• Readings: ${report.sugar_stats.readings_count}
• In Target: ${report.sugar_stats.in_target_percent}%
• Trend: ${report.sugar_stats.trend || 'N/A'}
` : 'No sugar data available'}

${report.bp_stats ? `
BLOOD PRESSURE
• Average: ${report.bp_stats.avg_systolic}/${report.bp_stats.avg_diastolic} mmHg
• Readings: ${report.bp_stats.readings_count}
• In Target: ${report.bp_stats.in_target_percent}%
` : ''}

MEDICATION ADHERENCE: ${report.medication_adherence}%
${report.adherence_details ? `(${report.adherence_details.total_taken}/${report.adherence_details.total_expected} doses taken)` : ''}

RISKS IDENTIFIED
${report.risks_identified?.map(r => `• ${r}`).join('\n') || 'None identified'}

RECOMMENDATIONS
${report.recommendations?.map(r => `• ${r}`).join('\n') || 'No recommendations'}

ACHIEVEMENTS
${report.achievements?.map(a => `• ${a}`).join('\n') || 'No achievements noted'}

QUESTIONS FOR DOCTOR
${report.questions_for_doctor?.map(q => `• ${q}`).join('\n') || 'No specific questions'}

---
Generated by GlucoVital.fit

DISCLAIMER: This report is generated by AI for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
  `;

  const exportToPDF = (includeDoctorDetails = false) => {
    const printWindow = window.open('', '_blank');
    const chartType = report.chart_preferences?.sugar_chart_type || 'line';
    
    const doctorSection = includeDoctorDetails && (profile?.doctor_name || profile?.prescription_clinic) ? `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h2 style="color: #166534; margin-top: 0;">👨‍⚕️ Doctor & Clinic Details</h2>
        ${profile?.doctor_name ? `<p><strong>Doctor:</strong> ${profile.doctor_name}${profile?.doctor_specialization ? ` (${profile.doctor_specialization})` : ''}</p>` : ''}
        ${profile?.doctor_registration_no ? `<p><strong>Registration No:</strong> ${profile.doctor_registration_no}</p>` : ''}
        ${profile?.doctor_phone ? `<p><strong>Phone:</strong> ${profile.doctor_phone}</p>` : ''}
        ${profile?.prescription_clinic ? `<p><strong>Clinic:</strong> ${profile.prescription_clinic}</p>` : ''}
        ${profile?.prescription_clinic_address ? `<p><strong>Address:</strong> ${profile.prescription_clinic_address}</p>` : ''}
      </div>
    ` : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Health Report - ${profile?.name || 'Patient'}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1e293b; }
            h1 { color: #1e293b; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
            h2 { color: #334155; margin-top: 28px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
            .header-info { background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
            .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
            .stat { background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1e293b; }
            .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
            .risk { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 8px 0; border-radius: 4px; }
            .achievement { background: #dcfce7; border-left: 4px solid #22c55e; padding: 12px; margin: 8px 0; border-radius: 4px; }
            .recommendation { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; margin: 8px 0; border-radius: 4px; }
            .question { background: #f3e8ff; border-left: 4px solid #8b5cf6; padding: 12px; margin: 8px 0; border-radius: 4px; }
            .notes { background: #fef9c3; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #fde047; }
            .disclaimer { background: #fee2e2; padding: 16px; border-radius: 8px; margin-top: 32px; font-size: 11px; color: #991b1b; border: 1px solid #fecaca; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>🏥 Health Report</h1>
          
          <div class="header-info">
            <p><strong>Patient:</strong> ${profile?.name || 'Patient'}</p>
            <p><strong>Period:</strong> ${format(new Date(report.start_date), "MMMM d")} - ${format(new Date(report.end_date), "MMMM d, yyyy")} (${differenceInDays(new Date(report.end_date), new Date(report.start_date))} days)</p>
            <p><strong>Report Type:</strong> ${report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}</p>
            <p><strong>Generated:</strong> ${format(new Date(report.created_date), "MMMM d, yyyy 'at' h:mm a")}</p>
          </div>
          
          ${doctorSection}
          
          <h2>📋 Summary</h2>
          <p style="line-height: 1.6;">${report.summary}</p>
          
          ${report.personal_notes ? `
          <div class="notes">
            <h3 style="margin-top: 0; color: #854d0e;">📝 Patient Notes</h3>
            <p>${report.personal_notes}</p>
          </div>
          ` : ''}
          
          ${report.sugar_stats ? `
          <h2>🩸 Sugar Statistics</h2>
          <div class="stat-grid">
            <div class="stat">
              <div class="stat-value">${report.sugar_stats.average}</div>
              <div class="stat-label">Average (mg/dL)</div>
            </div>
            <div class="stat">
              <div class="stat-value">${report.sugar_stats.readings_count}</div>
              <div class="stat-label">Total Readings</div>
            </div>
            <div class="stat">
              <div class="stat-value" style="color: ${report.sugar_stats.in_target_percent >= 70 ? '#16a34a' : '#dc2626'};">${report.sugar_stats.in_target_percent}%</div>
              <div class="stat-label">In Target</div>
            </div>
            <div class="stat">
              <div class="stat-value">${report.sugar_stats.trend || 'N/A'}</div>
              <div class="stat-label">Trend</div>
            </div>
          </div>
          <p><strong>Range:</strong> ${report.sugar_stats.lowest} - ${report.sugar_stats.highest} mg/dL</p>
          ${report.sugar_stats.fasting_avg ? `<p><strong>Fasting Average:</strong> ${report.sugar_stats.fasting_avg} mg/dL</p>` : ''}
          ${report.sugar_stats.post_meal_avg ? `<p><strong>Post-Meal Average:</strong> ${report.sugar_stats.post_meal_avg} mg/dL</p>` : ''}
          ` : ''}
          
          ${report.bp_stats ? `
          <h2>❤️ Blood Pressure</h2>
          <div class="stat-grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="stat">
              <div class="stat-value">${report.bp_stats.avg_systolic}/${report.bp_stats.avg_diastolic}</div>
              <div class="stat-label">Average (mmHg)</div>
            </div>
            <div class="stat">
              <div class="stat-value">${report.bp_stats.readings_count}</div>
              <div class="stat-label">Readings</div>
            </div>
            <div class="stat">
              <div class="stat-value" style="color: ${report.bp_stats.in_target_percent >= 70 ? '#16a34a' : '#dc2626'};">${report.bp_stats.in_target_percent}%</div>
              <div class="stat-label">In Target</div>
            </div>
          </div>
          ` : ''}
          
          <h2>💊 Medication Adherence</h2>
          <div class="stat" style="max-width: 200px;">
            <div class="stat-value" style="color: ${report.medication_adherence >= 80 ? '#16a34a' : report.medication_adherence >= 60 ? '#f59e0b' : '#dc2626'};">${report.medication_adherence}%</div>
            <div class="stat-label">Adherence Rate</div>
          </div>
          ${report.adherence_details ? `<p style="margin-top: 8px;">${report.adherence_details.total_taken} of ${report.adherence_details.total_expected} doses taken</p>` : ''}
          
          ${report.risks_identified?.length > 0 ? `
          <h2>⚠️ Risks Identified</h2>
          ${report.risks_identified.map(r => `<div class="risk">${r}</div>`).join('')}
          ` : ''}
          
          ${report.recommendations?.length > 0 ? `
          <h2>💡 Recommendations</h2>
          ${report.recommendations.map(r => `<div class="recommendation">${r}</div>`).join('')}
          ` : ''}
          
          ${report.achievements?.length > 0 ? `
          <h2>🏆 Achievements</h2>
          ${report.achievements.map(a => `<div class="achievement">${a}</div>`).join('')}
          ` : ''}
          
          ${report.questions_for_doctor?.length > 0 ? `
          <h2>❓ Questions for Your Doctor</h2>
          <p style="color: #6b7280; font-size: 12px;">Consider asking these questions at your next visit:</p>
          ${report.questions_for_doctor.map(q => `<div class="question">${q}</div>`).join('')}
          ` : ''}
          
          <div class="disclaimer">
            <strong>⚠️ MEDICAL DISCLAIMER</strong><br><br>
            This report is generated by GlucoVital.fit using AI technology for informational and educational purposes only. 
            It is NOT a substitute for professional medical advice, diagnosis, or treatment. 
            Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. 
            Never disregard professional medical advice or delay in seeking it because of something you have read in this report.
            <br><br>
            The health data and analysis presented here may not be complete or accurate. AI-generated insights should be verified by a healthcare professional.
          </div>
          
          <div class="footer">
            <p>Generated by GlucoVital.fit on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
            <p>© ${new Date().getFullYear()} GlucoVital.fit - www.glucovital.fit</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setShowExportOptions(false);
  };

  // Prepare chart data
  const sugarChartData = logs
    .filter(l => l.log_type === "sugar" && l.numeric_value)
    .slice(0, 30)
    .reverse()
    .map(log => ({
      date: format(new Date(log.created_date), "MMM d"),
      value: log.numeric_value,
      time: log.time_of_day?.replace(/_/g, ' ') || ''
    }));

  const bpChartData = logs
    .filter(l => l.log_type === "blood_pressure")
    .slice(0, 20)
    .reverse()
    .map(log => {
      const match = log.value?.match(/(\d+)\/(\d+)/);
      return {
        date: format(new Date(log.created_date), "MMM d"),
        systolic: match ? parseInt(match[1]) : 0,
        diastolic: match ? parseInt(match[2]) : 0
      };
    });

  const chartType = report.chart_preferences?.sugar_chart_type || 'line';
  const hasDoctorDetails = profile?.doctor_name || profile?.prescription_clinic;

  if (!report) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" ref={reportRef}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 capitalize">{report.report_type} Report</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(report.start_date), "MMM d")} - {format(new Date(report.end_date), "MMM d, yyyy")}
                <span className="text-slate-400">({differenceInDays(new Date(report.end_date), new Date(report.start_date))} days)</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report.sugar_stats?.trend && (
              <Badge className={
                report.sugar_stats.trend === 'improving' ? 'bg-green-100 text-green-700' :
                report.sugar_stats.trend === 'worsening' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-700'
              }>
                {report.sugar_stats.trend === 'improving' && <TrendingUp className="w-3 h-3 mr-1" />}
                {report.sugar_stats.trend === 'worsening' && <TrendingDown className="w-3 h-3 mr-1" />}
                {report.sugar_stats.trend}
              </Badge>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4 h-auto">
              <TabsTrigger value="summary" className="text-xs sm:text-sm py-2">Summary</TabsTrigger>
              <TabsTrigger value="charts" className="flex items-center gap-1 text-xs sm:text-sm py-2">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" /> Charts
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs sm:text-sm py-2">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs sm:text-sm py-2">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6">
              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Summary
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{report.summary}</p>
              </div>

              {/* Personal Notes */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-amber-800 flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Personal Notes
                  </h3>
                  {!isCaregiver && (
                    editingNotes ? (
                      <Button size="sm" onClick={saveNotes}>
                        <Save className="w-3 h-3 mr-1" /> Save
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setEditingNotes(true)}>
                        <Edit3 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    )
                  )}
                </div>
                {editingNotes && !isCaregiver ? (
                  <Textarea
                    value={personalNotes}
                    onChange={(e) => setPersonalNotes(e.target.value)}
                    placeholder="Add your personal notes..."
                    className="bg-white"
                  />
                ) : (
                  <p className="text-sm text-amber-700">
                    {report.personal_notes || "No personal notes added"}
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {report.sugar_stats && (
                  <>
                    <StatCard icon={Droplet} label="Avg Sugar" value={report.sugar_stats.average} unit="mg/dL" color="blue" />
                    <StatCard icon={Activity} label="Readings" value={report.sugar_stats.readings_count} color="slate" />
                    <StatCard 
                      icon={CheckCircle} 
                      label="In Target" 
                      value={`${report.sugar_stats.in_target_percent}%`} 
                      color={report.sugar_stats.in_target_percent >= 70 ? "green" : "amber"} 
                    />
                    <StatCard icon={Pill} label="Med Adherence" value={`${report.medication_adherence}%`} color={report.medication_adherence >= 80 ? "green" : "amber"} />
                  </>
                )}
              </div>

              {/* Risks */}
              {report.risks_identified?.length > 0 && (
                <Section title="Risks Identified" icon={AlertTriangle} iconColor="text-amber-500">
                  {report.risks_identified.map((risk, i) => (
                    <ItemCard key={i} icon={TrendingDown} color="amber" text={risk} />
                  ))}
                </Section>
              )}

              {/* Recommendations */}
              {report.recommendations?.length > 0 && (
                <Section title="Recommendations" icon={Lightbulb} iconColor="text-blue-500">
                  {report.recommendations.map((rec, i) => (
                    <ItemCard key={i} icon={CheckCircle} color="blue" text={rec} />
                  ))}
                </Section>
              )}

              {/* Achievements */}
              {report.achievements?.length > 0 && (
                <Section title="Achievements" icon={Trophy} iconColor="text-amber-500">
                  {report.achievements.map((ach, i) => (
                    <ItemCard key={i} icon={Trophy} color="green" text={ach} />
                  ))}
                </Section>
              )}

              {/* Questions for Doctor */}
              {report.questions_for_doctor?.length > 0 && (
                <Section title="Questions for Your Doctor" icon={Stethoscope} iconColor="text-violet-500">
                  <p className="text-xs text-violet-600 mb-3">
                    💡 Based on your health data, consider asking these questions:
                  </p>
                  {report.questions_for_doctor.map((q, i) => (
                    <ItemCard key={i} icon={HelpCircle} color="violet" text={q} />
                  ))}
                </Section>
              )}
            </TabsContent>

            <TabsContent value="charts" className="space-y-6">
              {loadingLogs ? (
                <div className="text-center py-8 text-slate-400">Loading charts...</div>
              ) : (
                <>
                  {/* Sugar Chart */}
                  {sugarChartData.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-slate-100">
                      <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-blue-500" />
                        Sugar Trend
                        <Badge variant="outline" className="ml-2 text-xs">
                          {chartType === 'line' ? <LineChart className="w-3 h-3 mr-1" /> : <BarChart3 className="w-3 h-3 mr-1" />}
                          {chartType}
                        </Badge>
                      </h3>
                      <ResponsiveContainer width="100%" height={250}>
                        {chartType === 'line' ? (
                          <AreaChart data={sugarChartData}>
                            <defs>
                              <linearGradient id="sugarGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis domain={[60, 'auto']} tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={profile?.target_sugar_fasting || 100} stroke="#22c55e" strokeDasharray="5 5" label="Fasting Target" />
                            <ReferenceLine y={profile?.target_sugar_post_meal || 140} stroke="#f59e0b" strokeDasharray="5 5" label="Post-Meal Target" />
                            <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#sugarGradient)" strokeWidth={2} />
                          </AreaChart>
                        ) : (
                          <BarChart data={sugarChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis domain={[60, 'auto']} tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={profile?.target_sugar_fasting || 100} stroke="#22c55e" strokeDasharray="5 5" />
                            <ReferenceLine y={profile?.target_sugar_post_meal || 140} stroke="#f59e0b" strokeDasharray="5 5" />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* BP Chart */}
                  {bpChartData.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-slate-100">
                      <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        Blood Pressure Trend
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsLine data={bpChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis domain={[60, 180]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} name="Systolic" />
                          <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} name="Diastolic" />
                        </RechartsLine>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Adherence Pie */}
                  {report.medication_adherence > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-slate-100">
                      <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <Pill className="w-4 h-4 text-green-500" />
                        Medication Adherence
                      </h3>
                      <div className="flex items-center justify-center">
                        <ResponsiveContainer width={200} height={200}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Taken', value: report.medication_adherence },
                                { name: 'Missed', value: 100 - report.medication_adherence }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              dataKey="value"
                            >
                              <Cell fill="#22c55e" />
                              <Cell fill="#e2e8f0" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="ml-4">
                          <p className="text-3xl font-bold text-slate-800">{report.medication_adherence}%</p>
                          <p className="text-sm text-slate-500">Adherence Rate</p>
                          {report.adherence_details && (
                            <p className="text-xs text-slate-400 mt-1">
                              {report.adherence_details.total_taken}/{report.adherence_details.total_expected} doses
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              {loadingLogs ? (
                <div className="text-center py-8 text-slate-400">Loading analytics...</div>
              ) : (
                <>
                  <DetailedSugarAnalysis 
                    logs={logs} 
                    profile={profile}
                    startDate={report.start_date}
                    endDate={report.end_date}
                  />
                  <BPAnalysis logs={logs} profile={profile} />
                  <AdherenceAnalysis 
                    logs={logs} 
                    adherenceRecords={adherenceRecords}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {/* Detailed Stats */}
              {report.sugar_stats && (
                <div className="bg-white rounded-xl p-4 border border-slate-100">
                  <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-blue-500" />
                    Sugar Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Average:</span><span className="font-medium">{report.sugar_stats.average} mg/dL</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Range:</span><span className="font-medium">{report.sugar_stats.lowest} - {report.sugar_stats.highest}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Fasting Avg:</span><span className="font-medium">{report.sugar_stats.fasting_avg || 'N/A'} mg/dL</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Post-Meal Avg:</span><span className="font-medium">{report.sugar_stats.post_meal_avg || 'N/A'} mg/dL</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Total Readings:</span><span className="font-medium">{report.sugar_stats.readings_count}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">In Target:</span><span className="font-medium">{report.sugar_stats.in_target_percent}%</span></div>
                  </div>
                </div>
              )}

              {report.bp_stats && (
                <div className="bg-white rounded-xl p-4 border border-slate-100">
                  <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Blood Pressure Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Average:</span><span className="font-medium">{report.bp_stats.avg_systolic}/{report.bp_stats.avg_diastolic} mmHg</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Readings:</span><span className="font-medium">{report.bp_stats.readings_count}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Systolic Range:</span><span className="font-medium">{report.bp_stats.lowest_systolic} - {report.bp_stats.highest_systolic}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">In Target:</span><span className="font-medium">{report.bp_stats.in_target_percent}%</span></div>
                  </div>
                </div>
              )}

              {report.adherence_details && (
                <div className="bg-white rounded-xl p-4 border border-slate-100">
                  <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-green-500" />
                    Medication Adherence Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Total Expected:</span><span className="font-medium">{report.adherence_details.total_expected}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Doses Taken:</span><span className="font-medium text-green-600">{report.adherence_details.total_taken}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Missed:</span><span className="font-medium text-red-600">{report.adherence_details.missed_count}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Rate:</span><span className="font-medium">{report.medication_adherence}%</span></div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Actions */}
        {!isCaregiver && (
          <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-2">
            <Button variant="outline" onClick={() => setShowExportOptions(true)} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => setShowShareDialog(true)} className="flex-1">
              <Mail className="w-4 h-4 mr-2" />
              Quick Share
            </Button>
            <Button onClick={() => setShowAdvancedShare(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              <Share2 className="w-4 h-4 mr-2" />
              Share Options
            </Button>
          </div>
        )}
      </div>

      {/* Advanced Share Dialog */}
      {showAdvancedShare && (
        <AdvancedReportSharing
          report={report}
          profile={profile}
          onClose={() => setShowAdvancedShare(false)}
          onShareComplete={() => {
            setShowAdvancedShare(false);
            onUpdate?.();
          }}
        />
      )}

      {/* Export Options Dialog */}
      <Dialog open={showExportOptions} onOpenChange={setShowExportOptions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Report as PDF</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-slate-600 mb-4">Choose what to include:</p>
            {hasDoctorDetails && (
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4"
                onClick={() => exportToPDF(true)}
              >
                <div className="flex items-start gap-3">
                  <Stethoscope className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-left">
                    <p className="font-medium">With Doctor Details</p>
                    <p className="text-xs text-slate-500 mt-1">Includes doctor and clinic information</p>
                  </div>
                </div>
              </Button>
            )}
            <Button 
              variant="outline" 
              className="w-full justify-start h-auto py-4"
              onClick={() => exportToPDF(false)}
            >
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium">Health Data Only</p>
                  <p className="text-xs text-slate-500 mt-1">Export with medical disclaimer</p>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Report with Doctor</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Doctor's Email</label>
            <Input
              type="email"
              value={doctorEmail}
              onChange={(e) => setDoctorEmail(e.target.value)}
              placeholder="doctor@example.com"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>Cancel</Button>
            <Button onClick={handleShare} disabled={sharing}>
              {sharing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
              Send Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, unit, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-50 text-slate-600"
  };
  return (
    <div className={`${colors[color]} rounded-xl p-4 text-center`}>
      <Icon className="w-4 h-4 mx-auto mb-1" />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}{unit && ` (${unit})`}</p>
    </div>
  );
}

function Section({ title, icon: Icon, iconColor, children }) {
  return (
    <div>
      <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ItemCard({ icon: Icon, color, text }) {
  const colors = {
    amber: "bg-amber-50 border-amber-100 text-amber-800",
    blue: "bg-blue-50 border-blue-100 text-blue-800",
    green: "bg-green-50 border-green-100 text-green-800",
    violet: "bg-violet-50 border-violet-100 text-violet-800"
  };
  const iconColors = {
    amber: "text-amber-600",
    blue: "text-blue-600",
    green: "text-green-600",
    violet: "text-violet-600"
  };
  return (
    <div className={`flex items-start gap-2 rounded-lg p-3 border ${colors[color]}`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColors[color]}`} />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded-lg shadow-lg border border-slate-200">
        <p className="font-medium">{payload[0].value} mg/dL</p>
        {payload[0].payload.time && <p className="text-xs text-slate-500">{payload[0].payload.time}</p>}
      </div>
    );
  }
  return null;
}