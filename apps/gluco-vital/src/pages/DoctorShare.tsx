import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Shield, Eye, FileText, Sparkles, Trash2, MessageCircle, Send, Loader2, CheckCircle, Clock, XCircle, Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isPast, addDays } from "date-fns";
import TimeBoundAccessSelector, { calculateExpiryDate } from "@/components/sharing/TimeBoundAccessSelector";

const PERMISSIONS = [
  { id: "view_logs", label: "Health Logs", description: "Sugar, BP, meals, medications" },
  { id: "view_reports", label: "Health Reports", description: "Weekly/monthly summaries" },
  { id: "view_insights", label: "AI Insights", description: "Patterns and recommendations" },
  { id: "send_feedback", label: "Send Feedback", description: "Doctor can send recommendations" }
];

export default function DoctorShare() {
  const [user, setUser] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    doctor_email: "",
    doctor_name: "",
    permissions: ["view_logs", "view_reports", "view_insights", "send_feedback"],
    access_duration: "permanent",
    custom_expiry_date: ""
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    appClient.auth.me().then(setUser).catch(() => {});
  }, []);

  // Get connections where patient invited doctor OR doctor invited patient
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['doctor-connections', user?.email],
    queryFn: async () => {
      const patientInitiated = await appClient.entities.DoctorConnection.filter({ patient_email: user?.email });
      const doctorInitiated = await appClient.entities.DoctorConnection.filter({ patient_email: user?.email });
      // Combine and dedupe by id
      const all = [...patientInitiated, ...doctorInitiated];
      const unique = all.filter((conn, idx, self) => 
        idx === self.findIndex(c => c.id === conn.id)
      );
      return unique;
    },
    enabled: !!user?.email
  });

  const { data: unreadFeedback = [] } = useQuery({
    queryKey: ['unread-feedback', user?.email],
    queryFn: () => appClient.entities.DoctorFeedback.filter({ 
      patient_email: user?.email, 
      is_read_by_patient: false 
    }),
    enabled: !!user?.email
  });

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      // Check if connection already exists
      const existing = connections.find(c => c.doctor_email === data.doctor_email);
      if (existing) {
        throw new Error("This doctor is already connected or has a pending invitation");
      }

      const expiryDate = calculateExpiryDate(data.access_duration, data.custom_expiry_date);
      
      const connection = await appClient.entities.DoctorConnection.create({
        doctor_email: data.doctor_email,
        doctor_name: data.doctor_name,
        permissions: data.permissions,
        patient_email: user.email,
        patient_name: user.full_name,
        status: "pending",
        access_type: data.access_duration === "permanent" ? "permanent" : "time_bound",
        access_expires_at: expiryDate,
        invited_at: new Date().toISOString()
      });

      // Send invitation email to doctor
      await appClient.integrations.Core.SendEmail({
        to: data.doctor_email,
        subject: `${user.full_name} has invited you to connect on Gluco Vital`,
        body: `Hello${data.doctor_name ? ' ' + data.doctor_name : ''},

${user.full_name} has invited you to connect on Gluco Vital for better diabetes care management.

To accept this invitation:
1. Sign up or log in at https://glucovital.fit
2. Go to "Doctor Portal" in the menu
3. You'll see the pending invitation from ${user.full_name}
4. Click "Accept" to view their health data

Shared access includes:
${data.permissions.includes('view_logs') ? '• Health Logs (Sugar, BP, meals, medications)\n' : ''}${data.permissions.includes('view_reports') ? '• Health Reports (Weekly/monthly summaries)\n' : ''}${data.permissions.includes('view_insights') ? '• AI Insights (Patterns and recommendations)\n' : ''}${data.permissions.includes('send_feedback') ? '• Send Feedback (Provide recommendations)\n' : ''}
If you did not expect this invitation, you can safely ignore this email.

Best regards,
Gluco Vital Team`,
        from_name: "Gluco Vital"
      });

      return connection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-connections'] });
      setShowInvite(false);
      setInviteForm({ 
        doctor_email: "", 
        doctor_name: "", 
        permissions: ["view_logs", "view_reports", "view_insights", "send_feedback"],
        access_duration: "permanent",
        custom_expiry_date: ""
      });
      toast.success("Invitation email sent to doctor!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invitation");
    }
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => appClient.entities.DoctorConnection.update(id, { status: "revoked" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-connections'] });
      toast.success("Access revoked");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.DoctorConnection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-connections'] });
      toast.success("Connection removed");
    }
  });

  // Accept invitation from doctor
  const acceptDoctorInviteMutation = useMutation({
    mutationFn: (id) => appClient.entities.DoctorConnection.update(id, { 
      status: "active",
      accepted_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-connections'] });
      toast.success("Connection accepted! Your doctor can now view your health data.");
    }
  });

  const togglePermission = (permId) => {
    setInviteForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const getStatusBadge = (status, conn) => {
    // Check if time-bound access has expired
    if (status === "active" && conn?.access_type === "time_bound" && conn?.access_expires_at) {
      if (isPast(new Date(conn.access_expires_at))) {
        return (
          <Badge className="bg-slate-100 text-slate-700 gap-1">
            <Clock className="w-3 h-3" />
            Expired
          </Badge>
        );
      }
    }
    
    const styles = {
      pending: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
      active: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
      revoked: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
      expired: { bg: "bg-slate-100", text: "text-slate-700", icon: Clock }
    };
    const s = styles[status] || styles.pending;
    const Icon = s.icon;
    return (
      <Badge className={`${s.bg} ${s.text} gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Share with Doctor</h1>
            <p className="text-slate-500 mt-1">Securely share your health data with healthcare providers</p>
          </div>
          <Dialog open={showInvite} onOpenChange={setShowInvite}>
            <DialogTrigger asChild>
              <Button className="bg-[#5b9a8b] hover:bg-[#4a8a7b]">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Your Doctor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Doctor's Email</Label>
                  <Input
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={inviteForm.doctor_email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, doctor_email: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Doctor's Name</Label>
                  <Input
                    placeholder="Dr. Smith"
                    value={inviteForm.doctor_name}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, doctor_name: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="mb-3 block">What can they access?</Label>
                  <div className="space-y-3">
                    {PERMISSIONS.map(perm => (
                      <div key={perm.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <Checkbox
                          checked={inviteForm.permissions.includes(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                        />
                        <div>
                          <p className="font-medium text-slate-700 text-sm">{perm.label}</p>
                          <p className="text-xs text-slate-500">{perm.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Time-bound access selector */}
                <TimeBoundAccessSelector
                  value={inviteForm.access_duration}
                  onChange={(v) => setInviteForm(prev => ({ ...prev, access_duration: v }))}
                  customDate={inviteForm.custom_expiry_date}
                  onCustomDateChange={(v) => setInviteForm(prev => ({ ...prev, custom_expiry_date: v }))}
                />
                
                <Button
                  onClick={() => inviteMutation.mutate(inviteForm)}
                  disabled={!inviteForm.doctor_email || inviteMutation.isPending}
                  className="w-full bg-[#5b9a8b] hover:bg-[#4a8a7b]"
                >
                  {inviteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Export & View Feedback Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Link to={createPageUrl("Reports")}>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF Report
            </Button>
          </Link>
          <Link to={createPageUrl("PatientFeedback")}>
            <Button variant="outline" className="gap-2 relative">
              <MessageCircle className="w-4 h-4" />
              View Doctor's Feedback
              {unreadFeedback.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadFeedback.length}
                </span>
              )}
            </Button>
          </Link>
        </div>

        {/* Unread Feedback Alert */}
        {unreadFeedback.length > 0 && (
          <div className="mb-6 p-4 bg-violet-50 border border-violet-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-violet-800">You have {unreadFeedback.length} new feedback from your doctor(s)</p>
                  <p className="text-sm text-violet-600">Check your messages for recommendations</p>
                </div>
              </div>
              <Link to={createPageUrl("DoctorMessages")}>
                <Button size="sm" variant="outline" className="border-violet-300 text-violet-700">
                  View Messages
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Security Info */}
        <Card className="mb-6 border-[#5b9a8b]/20 bg-[#5b9a8b]/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#5b9a8b] mt-0.5" />
              <div>
                <p className="font-medium text-[#3d6b5f]">Your data is secure</p>
                <p className="text-sm text-[#5a6b66]">
                  Only doctors you invite can see your data. You can revoke access anytime.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connected Doctors */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Connected Doctors</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : connections.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No doctors connected yet</p>
                <p className="text-sm text-slate-400 mt-1">Invite your healthcare provider or ask them to invite you</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {connections.map(conn => {
                const isPendingFromDoctor = conn.status === 'pending' && conn.created_by === conn.doctor_email;
                return (
                <Card key={conn.id} className={conn.status === "revoked" ? "opacity-60" : isPendingFromDoctor ? "border-amber-200 bg-amber-50/30" : ""}>
                  <CardContent className="p-5">
                    {isPendingFromDoctor && (
                      <div className="mb-3 p-2 bg-amber-100 rounded-lg text-sm text-amber-800">
                        🔔 {conn.doctor_name || 'A doctor'} has invited you to connect
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center">
                          <span className="text-lg font-semibold text-blue-600">
                            {conn.doctor_name?.[0]?.toUpperCase() || "D"}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{conn.doctor_name || "Doctor"}</h3>
                          <p className="text-sm text-slate-500">{conn.doctor_email}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {getStatusBadge(conn.status, conn)}
                            {conn.access_type === "time_bound" && conn.access_expires_at && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Calendar className="w-3 h-3" />
                                Expires: {format(new Date(conn.access_expires_at), "MMM d, yyyy")}
                              </Badge>
                            )}
                            {conn.invited_at && (
                              <span className="text-xs text-slate-400">
                                Invited {new Date(conn.invited_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPendingFromDoctor && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => acceptDoctorInviteMutation.mutate(conn.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                        )}
                        {conn.status === "active" && (
                          <Link to={createPageUrl(`DoctorMessages?connection=${conn.id}`)}>
                            <Button size="sm" variant="outline">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Message
                            </Button>
                          </Link>
                        )}
                        {conn.status !== "revoked" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => revokeMutation.mutate(conn.id)}
                          >
                            {isPendingFromDoctor ? "Decline" : "Revoke"}
                          </Button>
                        )}
                        {conn.status === "revoked" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => deleteMutation.mutate(conn.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-2">Shared access:</p>
                      <div className="flex flex-wrap gap-2">
                        {(conn.permissions || []).map(perm => {
                          const permInfo = PERMISSIONS.find(p => p.id === perm);
                          return (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm === "view_logs" && <Eye className="w-3 h-3 mr-1" />}
                              {perm === "view_reports" && <FileText className="w-3 h-3 mr-1" />}
                              {perm === "view_insights" && <Sparkles className="w-3 h-3 mr-1" />}
                              {perm === "send_feedback" && <MessageCircle className="w-3 h-3 mr-1" />}
                              {permInfo?.label || perm}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}