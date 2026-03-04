import React from "react";
import AgentChat from "@/components/AgentChat";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Activity, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function TriageReportList() {
    const { data: reports } = useQuery({
        queryKey: ["triage_reports"],
        queryFn: () => appClient.entities.TriageReport.list("-created_date", 10),
        refetchInterval: 5000 // Poll for new reports
    });

    const severityColors = {
        low: "bg-slate-100 text-slate-700 border-slate-200",
        medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
        high: "bg-orange-50 text-orange-700 border-orange-200",
        critical: "bg-red-50 text-red-700 border-red-200",
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Recent Triage Reports</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {reports?.length === 0 && <p className="text-slate-500 text-center py-4">No reports yet.</p>}
                    {reports?.map((report) => (
                        <div key={report.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50/50 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900">{report.patient_name || "Anonymous"}</span>
                                    <Badge variant="outline" className={severityColors[report.severity]}>
                                        {report.severity}
                                    </Badge>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(report.created_date), "MMM d, h:mm a")}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600">{report.ai_summary}</p>
                            </div>
                            <Badge className="w-fit whitespace-nowrap" variant={
                                report.action_recommended === 'emergency_room' ? 'destructive' : 
                                report.action_recommended === 'urgent_care' ? 'default' : 'secondary'
                            }>
                                {report.action_recommended.replace('_', ' ')}
                            </Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default function PatientTriage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Patient Triage</h1>
        <p className="text-slate-500">Self-service symptom checker and doctor review panel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Symptom Checker Demo
            </h2>
            <AgentChat 
                agentName="patient_triage" 
                title="MediScribe Triage Bot"
                description="AI-powered symptom assessment"
                initialMessage="Hello. I am the MediScribe Triage Assistant. Please describe your main symptom or health concern."
            />
        </div>
        
        <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Doctor Review Panel
            </h2>
            <TriageReportList />
        </div>
      </div>
    </div>
  );
}