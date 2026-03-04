import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Send, Loader2, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format } from "date-fns";

const FEEDBACK_TYPES = [
  { value: "recommendation", label: "General Recommendation", icon: "💡" },
  { value: "medication_change", label: "Medication Change", icon: "💊" },
  { value: "target_adjustment", label: "Target Adjustment", icon: "🎯" },
  { value: "lifestyle", label: "Lifestyle Advice", icon: "🏃" },
  { value: "follow_up", label: "Follow-up Required", icon: "📅" },
  { value: "general", label: "General Note", icon: "📝" }
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "text-slate-600" },
  { value: "medium", label: "Medium", color: "text-amber-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "urgent", label: "Urgent", color: "text-red-600" }
];

export default function DoctorFeedback() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    feedback_type: "recommendation",
    title: "",
    content: "",
    priority: "medium",
    follow_up_date: ""
  });
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const connectionId = urlParams.get('connection');

  useEffect(() => {
    appClient.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: connection } = useQuery({
    queryKey: ['feedback-connection', connectionId],
    queryFn: async () => {
      const conns = await appClient.entities.DoctorConnection.filter({ id: connectionId });
      return conns[0];
    },
    enabled: !!connectionId
  });

  const { data: existingFeedback = [] } = useQuery({
    queryKey: ['existing-feedback', connectionId],
    queryFn: () => appClient.entities.DoctorFeedback.filter(
      { connection_id: connectionId },
      '-created_date'
    ),
    enabled: !!connectionId
  });

  const submitMutation = useMutation({
    mutationFn: (data) => appClient.entities.DoctorFeedback.create({
      ...data,
      connection_id: connectionId,
      patient_email: connection.patient_email,
      doctor_email: user.email,
      doctor_name: user.full_name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['existing-feedback'] });
      toast.success("Feedback sent to patient!");
      setForm({
        feedback_type: "recommendation",
        title: "",
        content: "",
        priority: "medium",
        follow_up_date: ""
      });
    },
    onError: () => {
      toast.error("Failed to send feedback");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error("Please fill in title and content");
      return;
    }
    submitMutation.mutate(form);
  };

  if (!user || !connectionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 md:mb-8">
          <Link to={createPageUrl(`PatientDetail?email=${connection?.patient_email}&connection=${connectionId}`)}>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Send Feedback</h1>
            <p className="text-slate-500 text-sm truncate">To: {connection?.patient_name}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {/* Feedback Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#5b9a8b]" />
                  New Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Feedback Type</Label>
                    <Select
                      value={form.feedback_type}
                      onValueChange={(v) => setForm(prev => ({ ...prev, feedback_type: v }))}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FEEDBACK_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Title</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief summary of your feedback"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={form.content}
                      onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Detailed feedback, recommendations, or notes..."
                      className="mt-1.5 min-h-[150px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={form.priority}
                        onValueChange={(v) => setForm(prev => ({ ...prev, priority: v }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className={opt.color}>{opt.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Follow-up Date (Optional)</Label>
                      <Input
                        type="date"
                        value={form.follow_up_date}
                        onChange={(e) => setForm(prev => ({ ...prev, follow_up_date: e.target.value }))}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="w-full bg-[#5b9a8b] hover:bg-[#4a8a7b]"
                  >
                    {submitMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Feedback
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Previous Feedback */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Previous Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {existingFeedback.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No feedback sent yet</p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {existingFeedback.map(fb => (
                      <div key={fb.id} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{fb.title}</p>
                            <p className="text-xs text-slate-500 capitalize">{fb.feedback_type.replace(/_/g, ' ')}</p>
                          </div>
                          {fb.is_read_by_patient ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Unread</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          {format(new Date(fb.created_date), "MMM d, yyyy")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}