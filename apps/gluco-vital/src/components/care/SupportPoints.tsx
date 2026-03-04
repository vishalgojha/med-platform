import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, Phone, Mail, Plus, Pencil, Trash2, Star, 
  Building2, Stethoscope, FlaskConical, Users, Heart, Bot, MessageCircle, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const TYPE_CONFIG = {
  pharmacy: { icon: Building2, color: "text-green-600", bg: "bg-green-50", label: "Pharmacy" },
  clinic: { icon: Stethoscope, color: "text-blue-600", bg: "bg-blue-50", label: "Clinic" },
  hospital: { icon: Building2, color: "text-red-600", bg: "bg-red-50", label: "Hospital" },
  lab: { icon: FlaskConical, color: "text-purple-600", bg: "bg-purple-50", label: "Lab" },
  caregiver: { icon: Heart, color: "text-pink-600", bg: "bg-pink-50", label: "Caregiver" },
  family_member: { icon: Users, color: "text-amber-600", bg: "bg-amber-50", label: "Family" },
  community_health_worker: { icon: Users, color: "text-teal-600", bg: "bg-teal-50", label: "CHW" },
  diabetes_educator: { icon: Stethoscope, color: "text-indigo-600", bg: "bg-indigo-50", label: "Educator" },
  nutritionist: { icon: Heart, color: "text-lime-600", bg: "bg-lime-50", label: "Nutritionist" },
  other: { icon: MapPin, color: "text-slate-600", bg: "bg-slate-50", label: "Other" }
};

export default function SupportPoints({ userEmail }) {
  const [showForm, setShowForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [formData, setFormData] = useState({
    name: "", type: "pharmacy", contact_name: "", phone: "", whatsapp: "",
    email: "", address: "", city: "", region: "", country: "", services: [], notes: "", is_primary: false
  });
  const queryClient = useQueryClient();

  const { data: supportPoints = [], isLoading } = useQuery({
    queryKey: ['support-points', userEmail],
    queryFn: () => appClient.entities.SupportPoint.filter({ user_email: userEmail }),
    enabled: !!userEmail
  });

  // Fetch health logs to detect support points from conversations
  const { data: healthLogs = [] } = useQuery({
    queryKey: ['health-logs-support', userEmail],
    queryFn: async () => {
      const logs = await appClient.entities.HealthLog.filter({ user_email: userEmail });
      return logs.filter(l => l.status !== 'deleted' && l.status !== 'corrected').slice(0, 100);
    },
    enabled: !!userEmail
  });

  // Infer support points from health logs
  const inferredSupport = React.useMemo(() => {
    const inferred = [];
    
    // Look for pharmacy mentions
    healthLogs.forEach(log => {
      const notes = (log.notes || '').toLowerCase();
      const value = (log.value || '').toLowerCase();
      
      if (notes.includes('pharmacy') || notes.includes('apollo') || notes.includes('medplus') || notes.includes('netmeds')) {
        const existing = inferred.find(i => i.type === 'pharmacy');
        if (!existing) {
          inferred.push({ type: 'pharmacy', hint: 'Mentioned in logs', confidence: 'detected' });
        }
      }
      
      if (notes.includes('lab') || notes.includes('thyrocare') || notes.includes('lal path') || notes.includes('test')) {
        const existing = inferred.find(i => i.type === 'lab');
        if (!existing) {
          inferred.push({ type: 'lab', hint: 'Mentioned in logs', confidence: 'detected' });
        }
      }
      
      if (notes.includes('doctor') || notes.includes('dr.') || notes.includes('clinic')) {
        const existing = inferred.find(i => i.type === 'clinic');
        if (!existing) {
          inferred.push({ type: 'clinic', hint: 'Mentioned in logs', confidence: 'detected' });
        }
      }
    });
    
    return inferred;
  }, [healthLogs]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, user_email: userEmail };
      if (editingPoint) {
        return appClient.entities.SupportPoint.update(editingPoint.id, payload);
      }
      return appClient.entities.SupportPoint.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-points'] });
      toast.success(editingPoint ? "Updated!" : "Added!");
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.SupportPoint.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-points'] });
      toast.success("Deleted");
    }
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingPoint(null);
    setFormData({
      name: "", type: "pharmacy", contact_name: "", phone: "", whatsapp: "",
      email: "", address: "", city: "", region: "", country: "", services: [], notes: "", is_primary: false
    });
  };

  const handleEdit = (point) => {
    setEditingPoint(point);
    setFormData({ ...point });
    setShowForm(true);
  };

  // Group by type
  const grouped = supportPoints.reduce((acc, point) => {
    if (!acc[point.type]) acc[point.type] = [];
    acc[point.type].push(point);
    return acc;
  }, {});

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#5b9a8b]" />
              Your Care Network
              <Badge variant="outline" className="ml-1 text-xs font-normal text-violet-600 border-violet-200">
                <Bot className="w-3 h-3 mr-1" />
                Agent-managed
              </Badge>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">Tell the agent who supports you</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Agent detection hints */}
        {inferredSupport.length > 0 && supportPoints.length === 0 && (
          <div className="mb-4 p-3 bg-violet-50 rounded-lg border border-violet-100">
            <p className="text-xs font-medium text-violet-700 mb-2 flex items-center gap-1">
              <Bot className="w-3 h-3" /> Agent detected mentions of:
            </p>
            <div className="flex flex-wrap gap-2">
              {inferredSupport.map((item, idx) => {
                const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
                return (
                  <Badge key={idx} variant="outline" className="text-xs text-violet-600 border-violet-300">
                    {config.label}
                  </Badge>
                );
              })}
            </div>
            <p className="text-xs text-violet-600 mt-2">
              Say more details on WhatsApp to save them automatically
            </p>
          </div>
        )}

        {supportPoints.length === 0 && inferredSupport.length === 0 ? (
          <div className="text-center py-6 bg-gradient-to-br from-violet-50 to-slate-50 rounded-lg border border-violet-100">
            <Bot className="w-10 h-10 text-violet-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">No care network yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[220px] mx-auto">
              Just tell the agent naturally — it'll save contacts for you
            </p>
            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-xs text-left max-w-[240px] mx-auto">
              <p className="font-medium text-slate-700 mb-2">Try saying:</p>
              <p className="text-slate-500">"My pharmacy is Apollo near Andheri"</p>
              <p className="text-slate-500">"Dr Sharma is my diabetologist"</p>
              <p className="text-slate-500">"My wife manages my meds"</p>
            </div>
            
            {/* Advanced: Manual add (hidden by default) */}
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
        ) : supportPoints.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(grouped).map(([type, points]) => {
              const config = TYPE_CONFIG[type] || TYPE_CONFIG.other;
              const Icon = config.icon;
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className="text-sm font-medium text-slate-700">{config.label}</span>
                  </div>
                  <div className="space-y-2">
                    {points.map(point => (
                      <div key={point.id} className={`p-3 rounded-lg ${config.bg} border border-slate-100`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{point.name}</span>
                              {point.is_primary && (
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            {point.contact_name && (
                              <p className="text-xs text-slate-600">{point.contact_name}</p>
                            )}
                            {point.address && (
                              <p className="text-xs text-slate-500 mt-1">{point.address}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {point.phone && (
                              <a href={`tel:${point.phone}`} className="p-1.5 hover:bg-white rounded">
                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                              </a>
                            )}
                            <button onClick={() => handleEdit(point)} className="p-1.5 hover:bg-white rounded">
                              <Pencil className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <button onClick={() => deleteMutation.mutate(point.id)} className="p-1.5 hover:bg-white rounded">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </div>
                        {point.services?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {point.services.map(s => (
                              <Badge key={s} variant="outline" className="text-xs py-0">{s}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* Tip for adding more */}
            <div className="mt-4 p-3 bg-violet-50 rounded-lg border border-violet-100">
              <p className="text-xs text-violet-700 flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                <span className="font-medium">Add more:</span> Just tell the agent on WhatsApp
              </p>
            </div>
            
            {/* Advanced manual add */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="mt-3">
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
        ) : null}

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={resetForm}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPoint ? "Edit" : "Add"} Support Point</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Apollo Pharmacy"
                  />
                </div>
                <div>
                  <Label>Type *</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => setFormData(p => ({ ...p, contact_name: e.target.value }))}
                    placeholder="Dr. Sharma"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input
                    value={formData.whatsapp}
                    onChange={(e) => setFormData(p => ({ ...p, whatsapp: e.target.value }))}
                    placeholder="If different"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Region</Label>
                  <Input
                    value={formData.region}
                    onChange={(e) => setFormData(p => ({ ...p, region: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Any additional info"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData(p => ({ ...p, is_primary: e.target.checked }))}
                    className="rounded"
                  />
                  <Label className="text-sm">Primary contact for this type</Label>
                </div>
              </div>
              <Button 
                onClick={() => saveMutation.mutate(formData)} 
                disabled={!formData.name || saveMutation.isPending}
                className="w-full"
              >
                {editingPoint ? "Update" : "Add"} Support Point
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}