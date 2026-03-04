import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, CheckCircle, AlertTriangle, Calendar, Clock, User, Filter, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FEEDBACK_TYPE_ICONS = {
  recommendation: "💡",
  medication_change: "💊",
  target_adjustment: "🎯",
  lifestyle: "🏃",
  follow_up: "📅",
  general: "📝"
};

const PRIORITY_COLORS = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700"
};

export default function PatientFeedback() {
  const [user, setUser] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [filterRead, setFilterRead] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    appClient.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ['patient-feedback', user?.email],
    queryFn: () => appClient.entities.DoctorFeedback.filter(
      { patient_email: user?.email },
      '-created_date'
    ),
    enabled: !!user?.email
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => appClient.entities.DoctorFeedback.update(id, { is_read_by_patient: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-feedback'] });
    }
  });

  const filteredFeedback = feedback.filter(fb => {
    if (filterType !== "all" && fb.feedback_type !== filterType) return false;
    if (filterRead === "unread" && fb.is_read_by_patient) return false;
    if (filterRead === "read" && !fb.is_read_by_patient) return false;
    return true;
  });

  const unreadCount = feedback.filter(fb => !fb.is_read_by_patient).length;

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
            <h1 className="text-3xl font-bold text-slate-800">Doctor's Feedback</h1>
            <p className="text-slate-500 mt-1">
              Recommendations and notes from your healthcare providers
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-violet-100 text-violet-700 text-sm px-3 py-1">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="recommendation">💡 Recommendations</SelectItem>
              <SelectItem value="medication_change">💊 Medication</SelectItem>
              <SelectItem value="target_adjustment">🎯 Targets</SelectItem>
              <SelectItem value="lifestyle">🏃 Lifestyle</SelectItem>
              <SelectItem value="follow_up">📅 Follow-up</SelectItem>
              <SelectItem value="general">📝 General</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterRead} onValueChange={setFilterRead}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Read status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredFeedback.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No feedback yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Once your doctor sends feedback, it will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredFeedback.map(fb => (
              <Card 
                key={fb.id} 
                className={`transition-all ${!fb.is_read_by_patient ? 'border-violet-200 bg-violet-50/30 shadow-md' : ''}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{FEEDBACK_TYPE_ICONS[fb.feedback_type] || "📝"}</span>
                      <div>
                        <h3 className="font-semibold text-slate-800">{fb.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm text-slate-500 capitalize">
                            {fb.feedback_type?.replace(/_/g, ' ')}
                          </span>
                          <Badge className={PRIORITY_COLORS[fb.priority] || PRIORITY_COLORS.medium}>
                            {fb.priority}
                          </Badge>
                          {!fb.is_read_by_patient && (
                            <Badge className="bg-violet-100 text-violet-700">New</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {!fb.is_read_by_patient && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markReadMutation.mutate(fb.id)}
                        className="text-violet-600 border-violet-200"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Read
                      </Button>
                    )}
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-slate-100 mb-3">
                    <p className="text-slate-700 whitespace-pre-wrap">{fb.content}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {fb.doctor_name || "Doctor"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(fb.created_date), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    {fb.follow_up_date && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Calendar className="w-3 h-3" />
                        Follow-up: {format(new Date(fb.follow_up_date), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>

                  {fb.priority === "urgent" && (
                    <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-700">This is marked as urgent. Please follow up soon.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}