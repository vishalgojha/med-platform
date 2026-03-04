import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Clock, Loader2, CheckCircle, Stethoscope, Heart, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const DAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" }
];

const DATES = Array.from({ length: 28 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}${getOrdinalSuffix(i + 1)}`
}));

function getOrdinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default function ReportScheduler({ user }) {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['report-schedule', user?.email],
    queryFn: async () => {
      const results = await appClient.entities.ScheduledReport.filter({ user_email: user?.email });
      return results?.[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: doctorConnections = [] } = useQuery({
    queryKey: ['doctor-connections', user?.email],
    queryFn: () => appClient.entities.DoctorConnection.filter({ patient_email: user?.email, status: 'active' }),
    enabled: !!user?.email
  });

  const { data: coachConnections = [] } = useQuery({
    queryKey: ['coach-connections', user?.email],
    queryFn: () => appClient.entities.CoachConnection.filter({ client_email: user?.email, status: 'active' }),
    enabled: !!user?.email
  });

  const [formData, setFormData] = useState({
    report_type: 'weekly',
    is_active: true,
    send_to_self: true,
    send_to_doctor: false,
    send_to_coach: false,
    doctor_emails: [],
    coach_emails: [],
    preferred_day: 'monday',
    preferred_date: 1
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        report_type: schedule.report_type || 'weekly',
        is_active: schedule.is_active ?? true,
        send_to_self: schedule.send_to_self ?? true,
        send_to_doctor: schedule.send_to_doctor || false,
        send_to_coach: schedule.send_to_coach || false,
        doctor_emails: schedule.doctor_emails || [],
        coach_emails: schedule.coach_emails || [],
        preferred_day: schedule.preferred_day || 'monday',
        preferred_date: schedule.preferred_date || 1
      });
    }
  }, [schedule]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        user_email: user.email,
        ...data,
        doctor_emails: data.send_to_doctor ? doctorConnections.map(c => c.doctor_email) : [],
        coach_emails: data.send_to_coach ? coachConnections.map(c => c.coach_email) : []
      };

      if (schedule?.id) {
        return appClient.entities.ScheduledReport.update(schedule.id, payload);
      } else {
        return appClient.entities.ScheduledReport.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedule'] });
      toast.success('Report schedule saved!');
    },
    onError: (err) => {
      toast.error('Failed to save schedule');
    }
  });

  const handleGenerateNow = async () => {
    setGenerating(true);
    try {
      const response = await appClient.functions.invoke('generateScheduledReport', {
        report_type: formData.report_type,
        send_email: true
      });
      if (response.data?.success) {
        toast.success('Report generated and sent!');
        queryClient.invalidateQueries({ queryKey: ['health-reports'] });
      } else {
        toast.error(response.data?.error || 'Failed to generate report');
      }
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-[#5b9a8b]" />
          Scheduled Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Enable Automatic Reports</Label>
            <p className="text-xs text-slate-500">Receive regular health summaries</p>
          </div>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
          />
        </div>

        {formData.is_active && (
          <>
            {/* Report Type */}
            <div>
              <Label className="text-sm mb-2 block">Report Frequency</Label>
              <div className="flex gap-2">
                <Button
                  variant={formData.report_type === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, report_type: 'weekly' }))}
                  className={formData.report_type === 'weekly' ? 'bg-[#5b9a8b]' : ''}
                >
                  Weekly
                </Button>
                <Button
                  variant={formData.report_type === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, report_type: 'monthly' }))}
                  className={formData.report_type === 'monthly' ? 'bg-[#5b9a8b]' : ''}
                >
                  Monthly
                </Button>
              </div>
            </div>

            {/* Schedule Day/Date */}
            <div>
              <Label className="text-sm mb-2 block">
                {formData.report_type === 'weekly' ? 'Send On' : 'Send On Date'}
              </Label>
              {formData.report_type === 'weekly' ? (
                <Select
                  value={formData.preferred_day}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, preferred_day: v }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(day => (
                      <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={String(formData.preferred_date)}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, preferred_date: parseInt(v) }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATES.map(date => (
                      <SelectItem key={date.value} value={date.value}>{date.label} of month</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Recipients */}
            <div className="space-y-3">
              <Label className="text-sm">Send Report To</Label>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">Myself ({user?.email})</span>
                </div>
                <Switch
                  checked={formData.send_to_self}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, send_to_self: checked }))}
                />
              </div>

              {doctorConnections.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-500" />
                    <div>
                      <span className="text-sm">My Doctor(s)</span>
                      <p className="text-xs text-slate-500">
                        {doctorConnections.map(c => c.doctor_name || c.doctor_email).join(', ')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.send_to_doctor}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, send_to_doctor: checked }))}
                  />
                </div>
              )}

              {coachConnections.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-purple-500" />
                    <div>
                      <span className="text-sm">My Coach(es)</span>
                      <p className="text-xs text-slate-500">
                        {coachConnections.map(c => c.coach_name || c.coach_email).join(', ')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.send_to_coach}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, send_to_coach: checked }))}
                  />
                </div>
              )}
            </div>

            {/* Last Sent Info */}
            {schedule?.last_sent_at && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                Last sent: {format(new Date(schedule.last_sent_at), 'MMM d, yyyy h:mm a')}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending}
            className="bg-[#5b9a8b] hover:bg-[#4a8a7b]"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Save Schedule
          </Button>
          
          <Button
            variant="outline"
            onClick={handleGenerateNow}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Generate Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}