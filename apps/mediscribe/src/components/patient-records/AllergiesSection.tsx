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
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { appClient } from "@/api/appClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const severityColors = {
  mild: "bg-yellow-100 text-yellow-800 border-yellow-200",
  moderate: "bg-orange-100 text-orange-800 border-orange-200",
  severe: "bg-red-100 text-red-800 border-red-200",
  "life-threatening": "bg-red-600 text-white border-red-700",
};

export default function AllergiesSection({ patient }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    allergen: "",
    reaction: "",
    severity: "moderate",
    date_identified: "",
  });

  const queryClient = useQueryClient();
  const allergies = patient?.allergy_details || [];

  const updateMutation = useMutation({
    mutationFn: (data) => appClient.entities.Patient.update(patient.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patient.id] });
      setIsDialogOpen(false);
      setFormData({
        allergen: "",
        reaction: "",
        severity: "moderate",
        date_identified: "",
      });
    },
  });

  const handleAdd = () => {
    const updated = [...allergies, formData];
    updateMutation.mutate({ allergy_details: updated });
  };

  const handleRemove = (index) => {
    const updated = allergies.filter((_, i) => i !== index);
    updateMutation.mutate({ allergy_details: updated });
  };

  return (
    <Card className="border-red-200">
      <CardHeader className="bg-red-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <CardTitle className="text-red-900">Allergies & Adverse Reactions</CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Allergy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Allergy</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Allergen</label>
                  <Input
                    value={formData.allergen}
                    onChange={(e) => setFormData({ ...formData, allergen: e.target.value })}
                    placeholder="e.g., Penicillin, Peanuts, Latex"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Reaction</label>
                  <Input
                    value={formData.reaction}
                    onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
                    placeholder="e.g., Rash, Anaphylaxis, Swelling"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Severity</label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                      <SelectItem value="life-threatening">Life-Threatening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Date Identified</label>
                  <Input
                    type="date"
                    value={formData.date_identified}
                    onChange={(e) =>
                      setFormData({ ...formData, date_identified: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAdd}
                    disabled={!formData.allergen || !formData.reaction}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Add Allergy
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {allergies.length === 0 ? (
          <div className="text-slate-400 text-sm italic text-center py-6 bg-green-50 rounded-lg border border-green-200">
            No known allergies
          </div>
        ) : (
          <div className="space-y-3">
            {allergies.map((allergy, index) => (
              <div
                key={index}
                className={`flex items-start justify-between p-4 rounded-lg border-2 ${
                  severityColors[allergy.severity] || severityColors.moderate
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg">{allergy.allergen}</span>
                    <Badge
                      variant="outline"
                      className={`capitalize ${severityColors[allergy.severity]}`}
                    >
                      {allergy.severity}
                    </Badge>
                  </div>
                  <div className="text-sm font-medium mb-1">
                    Reaction: {allergy.reaction}
                  </div>
                  {allergy.date_identified && (
                    <div className="text-xs opacity-75">
                      Identified: {format(new Date(allergy.date_identified), "MMMM d, yyyy")}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(index)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}