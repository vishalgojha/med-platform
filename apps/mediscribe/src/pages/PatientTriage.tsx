import React from "react";
import AgentChat from "@/components/AgentChat";
import { appClient } from "@/api/appClient";
import { getIndiaAgentDeploymentProfile, listSpecialties } from "@/api/agentRouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Activity, AlertTriangle, Clock, Network, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function TriageReportList() {
  const { data: reports } = useQuery({
    queryKey: ["triage_reports"],
    queryFn: () => appClient.entities.TriageReport.list("-created_date", 10),
    refetchInterval: 5000,
  });

  const severityColors: Record<string, string> = {
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
          {reports?.map((report: any) => (
            <div
              key={report.id}
              className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50/50 gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{report.patient_name || "Anonymous"}</span>
                  <Badge variant="outline" className={severityColors[report.severity] ?? severityColors.low}>
                    {report.severity}
                  </Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(report.created_date), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{report.ai_summary}</p>
              </div>
              <Badge
                className="w-fit whitespace-nowrap"
                variant={
                  report.action_recommended === "emergency_room"
                    ? "destructive"
                    : report.action_recommended === "urgent_care"
                      ? "default"
                      : "secondary"
                }
              >
                {String(report.action_recommended ?? "review").replace("_", " ")}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PatientTriage() {
  const {
    data: specialties,
    isLoading: isSpecialtyLoading,
    isFetching: isSpecialtyRefreshing,
    error: specialtyError,
    refetch: refetchSpecialties,
  } = useQuery({
    queryKey: ["agent_specialties", "clinic", "en"],
    queryFn: () => listSpecialties({ setting: "clinic", language: "en" }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: deploymentProfile } = useQuery({
    queryKey: ["agent_deployment_profile", "en", "hi"],
    queryFn: () => getIndiaAgentDeploymentProfile(["en", "hi"]),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Patient Triage</h1>
        <p className="text-slate-500">Self-service symptom checker and doctor review panel.</p>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Network className="w-5 h-5 text-emerald-700" />
              India Multi-Agent Routing Coverage
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetchSpecialties()}
              disabled={isSpecialtyRefreshing}
              className="bg-white"
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${isSpecialtyRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-emerald-200 bg-white p-3">
              <p className="text-xs text-slate-500">Clinic Specialties</p>
              <p className="text-xl font-semibold text-slate-900">{specialties?.length ?? 0}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-white p-3">
              <p className="text-xs text-slate-500">Agent Roles</p>
              <p className="text-xl font-semibold text-slate-900">{deploymentProfile?.roles.length ?? 0}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-white p-3">
              <p className="text-xs text-slate-500">Specialty Routes</p>
              <p className="text-xl font-semibold text-slate-900">{deploymentProfile?.routes.length ?? 0}</p>
            </div>
          </div>

          {isSpecialtyLoading ? (
            <p className="text-sm text-slate-500">Loading specialty directory...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(specialties ?? []).slice(0, 12).map((specialty) => (
                <Badge key={specialty.id} variant="outline" className="bg-white">
                  {specialty.label}
                </Badge>
              ))}
            </div>
          )}

          {specialtyError ? (
            <p className="text-sm text-red-600 mt-3">
              Agent router unavailable. Set `VITE_AGENT_API_BASE_URL` and verify `doctor-agent` is running.
            </p>
          ) : null}
        </CardContent>
      </Card>

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
