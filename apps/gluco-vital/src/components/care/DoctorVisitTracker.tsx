import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Stethoscope, Plus, Clock, CheckCircle2, AlertTriangle, MapPin, Bot, MessageCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, isPast, isFuture, differenceInDays, addDays } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const VISIT_TYPES = {
  routine_checkup: { label: "Routine Checkup", color: "bg-blue-100 text-blue-700" },
  follow_up: { label: "Follow-up", color: "bg-green-100 text-green-700" },
  emergency: { label: "Emergency", color: "bg-red-100 text-red-700" },
  lab_review: { label: "Lab Review", color: "bg-purple-100 text-purple-700" },
  medication_review: { label: "Medication Review", color: "bg-amber-100 text-amber-700" },
  complication_check: { label: "Complication Check", color: "bg-orange-100 text-orange-700" },
  annual_review: { label: "Annual Review", color: "bg-indigo-100 text-indigo-700" }
};

const SPECIALTIES = [
  { value: "general_physician", label: "General Physician" },
  { value: "endocrinologist", label: "Endocrinologist" },
  { value: "diabetologist", label: "Diabetologist" },
  { value: "cardiologist", label: "Cardiologist" },
  { value: "ophthalmologist", label: "Eye Specialist" },
  { value: "nephrologist", label: "Kidney Specialist" },
  { value: "podiatrist", label: "Foot Specialist" },
  { value: "nutritionist", label: "Nutritionist" },
  { value: "other", label: "Other" }
];

export default function DoctorVisitTracker({ userEmail }) {
  const [showForm, setShowForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    doctor_name: "", doctor_specialty: "general_physician", visit_type: "routine_checkup",
    visit_date: "", clinic_name: "", clinic_address: "", notes: "", reminder_days_before: 2
  });
  const queryClient = useQueryClient();

  const { data: visits = [] } = useQuery({
    queryKey: ['doctor-visits', userEmail],
    queryFn: () => appClient.entities.DoctorVisit.filter({ user_email: userEmail }, '-visit_date'),
    enabled: !!userEmail
  });

  const saveMutation = useMutation({
    mutationFn: (data) => appClient.entities.DoctorVisit.create({ ...data, user_email: userEmail, status: 'scheduled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-visits'] });
      toast.success("Visit scheduled!");
      setShowForm(false);
      setFormData({
        doctor_name: "", doctor_specialty: "general_physician", visit_type: "routine_checkup",
        visit_date: "", clinic_name: "", clinic_address: "", notes: "", reminder_days_before: 2
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appClient.entities.DoctorVisit.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-visits'] });
      toast.success("Updated!");
    }
  });

  const upcomingVisits = visits.filter(v => v.status === 'scheduled' && isFuture(parseISO(v.visit_date)));
  const pastVisits = visits.filter(v => v.status === 'completed' || isPast(parseISO(v.visit_date)));

  // Check for overdue annual checkups
  const lastAnnualReview = pastVisits.find(v => v.visit_type === 'annual_review');
  const daysSinceAnnual = lastAnnualReview 
    ? differenceInDays(new Date(), parseISO(lastAnnualReview.visit_date))
    : 365;
  const needsAnnualReview = daysSinceAnnual > 330;

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-500" />
              Doctor Visits
              <Badge variant="outline" className="ml-1 text-xs font-normal text-violet-600 border-violet-200">
                <Bot className="w-3 h-3 mr-1" />
                Agent-managed
              </Badge>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">Tell the agent about your visits</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Annual Review Alert */}
        {needsAnnualReview && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Annual Review Due</p>
              <p className="text-xs text-amber-600">
                {lastAnnualReview 
                  ? `Last review was ${daysSinceAnnual} days ago`
                  : "No annual review on record"
                }. Schedule your yearly diabetes checkup.
              </p>
            </div>
          </div>
        )}

        {/* Upcoming Visits */}
        {upcomingVisits.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Upcoming
            </h4>
            <div className="space-y-2">
              {upcomingVisits.map(visit => {
                const daysUntil = differenceInDays(parseISO(visit.visit_date), new Date());
                const typeConfig = VISIT_TYPES[visit.visit_type] || VISIT_TYPES.routine_checkup;
                return (
                  <div key={visit.id} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{visit.doctor_name || 'Doctor Visit'}</span>
                          <Badge className={typeConfig.color + " text-xs"}>{typeConfig.label}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {format(parseISO(visit.visit_date), "EEEE, MMM d 'at' h:mm a")}
                        </p>
                        {visit.clinic_name && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" /> {visit.clinic_name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={daysUntil <= 2 ? "border-amber-300 text-amber-700" : ""}>
                          {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-1 text-xs"
                          onClick={() => updateMutation.mutate({ id: visit.id, data: { status: 'completed' } })}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Done
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Past Visits */}
        {pastVisits.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Past Visits
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {pastVisits.slice(0, 5).map(visit => {
                const typeConfig = VISIT_TYPES[visit.visit_type] || VISIT_TYPES.routine_checkup;
                return (
                  <div key={visit.id} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-sm">{visit.doctor_name || 'Visit'}</span>
                      <p className="text-xs text-slate-500">
                        {format(parseISO(visit.visit_date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">{typeConfig.label}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {visits.length === 0 && (
          <div className="text-center py-6 bg-gradient-to-br from-violet-50 to-slate-50 rounded-lg border border-violet-100">
            <Bot className="w-10 h-10 text-violet-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">No visits logged yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[220px] mx-auto">
              Just tell the agent — it'll track your appointments
            </p>
            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-xs text-left max-w-[240px] mx-auto">
              <p className="font-medium text-slate-700 mb-2">Try saying:</p>
              <p className="text-slate-500">"Doctor visit tomorrow at 10am"</p>
              <p className="text-slate-500">"Appointment with Dr Sharma"</p>
              <p className="text-slate-500">"Going to Apollo on Friday"</p>
            </div>
            
            {/* Advanced: Manual add */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="mt-4">
              <CollapsibleTrigger asChild>
                <button className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto">
                  <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  Advanced: Add manually
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add manually
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
        
        {/* Tip when visits exist */}
        {visits.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
              <p className="text-xs text-violet-700 flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span className="font-medium">Add more:</span> "Doctor visit next week" on WhatsApp
              </p>
            </div>
            
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <button className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  Advanced: Add manually
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add manually
                </Button>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Schedule Form */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Doctor Visit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Doctor Name</Label>
                  <Input
                    value={formData.doctor_name}
                    onChange={(e) => setFormData(p => ({ ...p, doctor_name: e.target.value }))}
                    placeholder="Dr. Sharma"
                  />
                </div>
                <div>
                  <Label>Specialty</Label>
                  <Select value={formData.doctor_specialty} onValueChange={(v) => setFormData(p => ({ ...p, doctor_specialty: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Visit Type</Label>
                  <Select value={formData.visit_type} onValueChange={(v) => setFormData(p => ({ ...p, visit_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(VISIT_TYPES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.visit_date}
                    onChange={(e) => setFormData(p => ({ ...p, visit_date: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Clinic/Hospital</Label>
                  <Input
                    value={formData.clinic_name}
                    onChange={(e) => setFormData(p => ({ ...p, clinic_name: e.target.value }))}
                    placeholder="Apollo Hospital"
                  />
                </div>
                <div className="col-span-2">
                  <Label>What should I remind you to ask the doctor?</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Questions or topics to discuss..."
                    className="h-20"
                  />
                </div>
              </div>
              <Button 
                onClick={() => saveMutation.mutate(formData)} 
                disabled={!formData.visit_date || saveMutation.isPending}
                className="w-full"
              >
                Schedule Visit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}