import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { executeAgentWorkflow, type ExecuteAgentWorkflowRequest } from "@/api/agentRouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Activity, Clock, Phone } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TriageReportRecord {
  id: string;
  patient_id?: string;
  doctor_id?: string;
  patient_name?: string;
  patient_phone?: string;
  severity?: string;
  symptoms?: string;
  ai_summary?: string;
  action_recommended?: string;
  agent_name?: string;
  created_date: string;
}

const resolveSpecialtyId = (report: TriageReportRecord): string => {
  const severity = report.severity ?? "";
  const action = report.action_recommended ?? "";
  if (severity === "critical" || severity === "high" || action === "emergency_room" || action === "urgent_care") {
    return "emergency_medicine";
  }
  return "family_medicine";
};

const buildWorkflowRequest = (report: TriageReportRecord, doctorId: string): ExecuteAgentWorkflowRequest => {
  const patientId = typeof report.patient_id === "string" && report.patient_id.length > 0 ? report.patient_id : undefined;
  const clinicalContext =
    (typeof report.symptoms === "string" && report.symptoms.trim().length > 0 ? report.symptoms : undefined) ??
    (typeof report.ai_summary === "string" && report.ai_summary.trim().length > 0
      ? report.ai_summary
      : "Follow-up requested from assistant dashboard.");

  if (patientId) {
    return {
      workflow: "follow_up_outreach",
      specialtyId: resolveSpecialtyId(report),
      doctorId,
      patientId,
      payload: {
        trigger: "custom",
        customMessage: clinicalContext,
        channel: "whatsapp",
        sendNow: false,
      },
      dryRun: false,
      confirm: true,
    };
  }

  return {
    workflow: "triage_intake",
    specialtyId: resolveSpecialtyId(report),
    doctorId,
    payload: {
      query: clinicalContext,
    },
    dryRun: false,
    confirm: true,
  };
};

export default function AssistantDashboard() {
  const [activeRoutingId, setActiveRoutingId] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => appClient.auth.me(),
  });

  const { data: allAppointments } = useQuery({
    queryKey: ["all_appointments"],
    queryFn: () => appClient.entities.Appointment.list("-start_time", 50),
  });

  const { data: triageReports } = useQuery({
    queryKey: ["triage_reports"],
    queryFn: () => appClient.entities.TriageReport.list("-created_date", 50),
  });

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: () => appClient.entities.Patient.list("-created_date", 100),
  });

  const routeCaseMutation = useMutation({
    mutationFn: async (report: TriageReportRecord) => {
      const doctorId =
        (typeof report.doctor_id === "string" && report.doctor_id.length > 0 ? report.doctor_id : undefined) ??
        (typeof user?.id === "string" ? user.id : undefined) ??
        "d_api";
      const request = buildWorkflowRequest(report, doctorId);
      return executeAgentWorkflow(request);
    },
    onSuccess: (result) => {
      const workflowLabel = result.workflow.replace(/_/g, " ");
      toast.success(`Routed via ${result.leadAgent} (${workflowLabel})`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to execute routed workflow";
      toast.error(message);
    },
    onSettled: () => {
      setActiveRoutingId(null);
    },
  });

  const runRouting = (report: TriageReportRecord): void => {
    setActiveRoutingId(report.id);
    routeCaseMutation.mutate(report);
  };

  const upcomingAppointments =
    allAppointments?.filter((apt: any) => apt.status === "scheduled" && new Date(apt.start_time) > new Date()) || [];

  const pendingFollowups =
    triageReports?.filter(
      (report: TriageReportRecord) =>
        report.action_recommended === "schedule_appointment" || report.action_recommended === "urgent_care",
    ) || [];

  const urgentCases =
    triageReports?.filter((report: TriageReportRecord) => report.severity === "high" || report.severity === "critical") || [];

  const getSeverityColor = (severity?: string): string => {
    switch (severity) {
      case "critical":
        return "bg-red-600";
      case "high":
        return "bg-orange-600";
      case "medium":
        return "bg-yellow-600";
      default:
        return "bg-green-600";
    }
  };

  const isRouting = (reportId: string): boolean => routeCaseMutation.isPending && activeRoutingId === reportId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Assistant Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage follow-ups, routing, and scheduling</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Follow-ups</p>
                <p className="text-2xl font-bold text-slate-900">{pendingFollowups.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Today's Appointments</p>
                <p className="text-2xl font-bold text-slate-900">
                  {
                    upcomingAppointments.filter((apt: any) => {
                      const aptDate = new Date(apt.start_time);
                      const today = new Date();
                      return aptDate.toDateString() === today.toDateString();
                    }).length
                  }
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Urgent Cases</p>
                <p className="text-2xl font-bold text-slate-900">{urgentCases.length}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <Activity className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Patients</p>
                <p className="text-2xl font-bold text-slate-900">{patients?.length || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-600" />
              Urgent Cases - Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urgentCases.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No urgent cases</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentCases.slice(0, 5).map((report: TriageReportRecord) => (
                  <div key={report.id} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{report.patient_name || "Patient"}</p>
                        <p className="text-sm text-slate-600 mt-1">{report.symptoms?.substring(0, 80)}...</p>
                      </div>
                      <Badge className={getSeverityColor(report.severity)}>{report.severity}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(report.created_date), "MMM d, h:mm a")}
                      </span>
                      <span>{report.agent_name?.replace("_", " ")}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {report.patient_phone ? (
                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                          <Phone className="w-3 h-3 mr-2" />
                          Call {report.patient_phone}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => runRouting(report)}
                        disabled={isRouting(report.id)}
                      >
                        {isRouting(report.id) ? "Routing..." : "Run AI Route"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.filter((apt: any) => {
              const aptDate = new Date(apt.start_time);
              const today = new Date();
              return aptDate.toDateString() === today.toDateString();
            }).length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No appointments today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments
                  .filter((apt: any) => {
                    const aptDate = new Date(apt.start_time);
                    const today = new Date();
                    return aptDate.toDateString() === today.toDateString();
                  })
                  .slice(0, 5)
                  .map((apt: any) => (
                    <div key={apt.id} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{format(new Date(apt.start_time), "h:mm a")}</p>
                          <p className="text-sm text-slate-600">{apt.reason}</p>
                        </div>
                        <Badge variant="outline">{apt.status}</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-purple-600" />
              Pending Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingFollowups.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Phone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No pending follow-ups</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingFollowups.slice(0, 8).map((report: TriageReportRecord) => (
                  <div key={report.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-900">{report.patient_name || "Patient"}</p>
                          <Badge className={`text-xs ${getSeverityColor(report.severity)}`}>{report.severity}</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{report.symptoms?.substring(0, 100)}...</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(report.created_date), "MMM d, h:mm a")}
                          </span>
                          {report.patient_phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {report.patient_phone}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" variant="outline" className="text-xs">
                          Schedule
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="text-xs"
                          onClick={() => runRouting(report)}
                          disabled={isRouting(report.id)}
                        >
                          {isRouting(report.id) ? "Routing..." : "AI Route"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
