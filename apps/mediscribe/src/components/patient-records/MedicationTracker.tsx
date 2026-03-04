import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, Plus, Trash2 } from "lucide-react";
import { appClient } from "@/api/appClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function MedicationTracker({ patient }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: "",
    dosage: "",
    frequency: "",
    start_date: "",
    end_date: "",
    status: "active",
    prescribed_by: "",
    notes: "",
  });

  const queryClient = useQueryClient();
  const medications = patient?.medication_history || [];

  const updateMutation = useMutation({
    mutationFn: (data) => appClient.entities.Patient.update(patient.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patient.id] });
      setIsDialogOpen(false);
      setFormData({
        medication_name: "",
        dosage: "",
        frequency: "",
        start_date: "",
        end_date: "",
        status: "active",
        prescribed_by: "",
        notes: "",
      });
    },
  });

  const handleAdd = () => {
    const updated = [...medications, formData];
    updateMutation.mutate({ medication_history: updated });
  };

  const handleRemove = (index) => {
    const updated = medications.filter((_, i) => i !== index);
    updateMutation.mutate({ medication_history: updated });
  };

  const activeMeds = medications.filter((m) => m.status === "active");
  const pastMeds = medications.filter((m) => m.status !== "active");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-purple-600" />
            <CardTitle>Medication Tracker</CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Medication
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Medication</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Medication Name</label>
                    <Input
                      value={formData.medication_name}
                      onChange={(e) =>
                        setFormData({ ...formData, medication_name: e.target.value })
                      }
                      placeholder="e.g., Metformin"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Dosage</label>
                    <Input
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      placeholder="e.g., 500mg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Frequency</label>
                    <Input
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      placeholder="e.g., Twice daily"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Status</label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="discontinued">Discontinued</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Start Date</label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">End Date</label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Prescribed By</label>
                  <Input
                    value={formData.prescribed_by}
                    onChange={(e) => setFormData({ ...formData, prescribed_by: e.target.value })}
                    placeholder="Doctor name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Notes</label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAdd} disabled={!formData.medication_name}>
                    Add Medication
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Active Medications */}
          <div>
            <h4 className="font-semibold text-sm text-slate-700 mb-3">
              Active Medications ({activeMeds.length})
            </h4>
            {activeMeds.length === 0 ? (
              <div className="text-slate-400 text-sm italic text-center py-4 bg-slate-50 rounded-lg">
                No active medications
              </div>
            ) : (
              <div className="space-y-2">
                {activeMeds.map((med, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800">{med.medication_name}</span>
                        <Badge className="bg-green-600">Active</Badge>
                      </div>
                      <div className="text-sm text-slate-600">
                        {med.dosage} • {med.frequency}
                      </div>
                      {med.start_date && (
                        <div className="text-xs text-slate-500 mt-1">
                          Started: {format(new Date(med.start_date), "MMM d, yyyy")}
                        </div>
                      )}
                      {med.prescribed_by && (
                        <div className="text-xs text-slate-500">By: {med.prescribed_by}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRemove(medications.findIndex((m) => m === med))
                      }
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Medications */}
          {pastMeds.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-slate-700 mb-3">
                Past Medications ({pastMeds.length})
              </h4>
              <div className="space-y-2">
                {pastMeds.map((med, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg opacity-75"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-700">{med.medication_name}</span>
                        <Badge variant="outline" className="capitalize">
                          {med.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-500">
                        {med.dosage} • {med.frequency}
                      </div>
                      {med.start_date && med.end_date && (
                        <div className="text-xs text-slate-400 mt-1">
                          {format(new Date(med.start_date), "MMM yyyy")} -{" "}
                          {format(new Date(med.end_date), "MMM yyyy")}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRemove(medications.findIndex((m) => m === med))
                      }
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}