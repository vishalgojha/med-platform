import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Save, X } from "lucide-react";
import { TEST_LABELS } from "./LabResultsList";

const REFERENCE_RANGES = {
  hba1c: { low: 4, high: 5.6, unit: "%", diabeticTarget: 7 },
  fasting_glucose: { low: 70, high: 100, unit: "mg/dL" },
  post_meal_glucose: { low: 70, high: 140, unit: "mg/dL" },
  total_cholesterol: { low: 0, high: 200, unit: "mg/dL" },
  ldl: { low: 0, high: 100, unit: "mg/dL" },
  hdl: { low: 40, high: 60, unit: "mg/dL" },
  triglycerides: { low: 0, high: 150, unit: "mg/dL" },
  creatinine: { low: 0.6, high: 1.2, unit: "mg/dL" },
  egfr: { low: 90, high: 120, unit: "mL/min" },
  hemoglobin: { low: 12, high: 17, unit: "g/dL" },
  tsh: { low: 0.4, high: 4.0, unit: "mIU/L" },
  vitamin_d: { low: 30, high: 100, unit: "ng/mL" },
  vitamin_b12: { low: 200, high: 900, unit: "pg/mL" }
};

export default function LabResultForm({ initialData, userEmail, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    test_type: "",
    test_name: "",
    value: "",
    value_text: "",
    unit: "",
    reference_range_low: "",
    reference_range_high: "",
    reference_range_text: "",
    status: "unknown",
    test_date: new Date(),
    lab_name: "",
    source: "manual_entry",
    notes: "",
    ...initialData
  });

  const [saving, setSaving] = useState(false);

  // Auto-fill reference ranges when test type changes
  useEffect(() => {
    if (formData.test_type && REFERENCE_RANGES[formData.test_type]) {
      const ref = REFERENCE_RANGES[formData.test_type];
      const testLabel = TEST_LABELS[formData.test_type];
      setFormData(prev => ({
        ...prev,
        reference_range_low: prev.reference_range_low || ref.low,
        reference_range_high: prev.reference_range_high || ref.high,
        unit: prev.unit || ref.unit || testLabel?.unit || ""
      }));
    }
  }, [formData.test_type]);

  // Auto-calculate status based on value and reference range
  useEffect(() => {
    if (formData.value && formData.reference_range_low && formData.reference_range_high) {
      const val = parseFloat(formData.value);
      const low = parseFloat(formData.reference_range_low);
      const high = parseFloat(formData.reference_range_high);
      
      let status = "normal";
      if (val < low * 0.8) status = "critical_low";
      else if (val < low) status = "low";
      else if (val > high * 1.5) status = "critical_high";
      else if (val > high) status = "high";
      
      setFormData(prev => ({ ...prev, status }));
    }
  }, [formData.value, formData.reference_range_low, formData.reference_range_high]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const dataToSave = {
      ...formData,
      user_email: userEmail,
      value: formData.value ? parseFloat(formData.value) : null,
      reference_range_low: formData.reference_range_low ? parseFloat(formData.reference_range_low) : null,
      reference_range_high: formData.reference_range_high ? parseFloat(formData.reference_range_high) : null,
      test_date: format(new Date(formData.test_date), "yyyy-MM-dd")
    };

    await onSave(dataToSave);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Test Type *</Label>
          <Select 
            value={formData.test_type} 
            onValueChange={(val) => setFormData({ ...formData, test_type: val })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select test type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hba1c">🩸 HbA1c</SelectItem>
              <SelectItem value="fasting_glucose">🍽️ Fasting Glucose</SelectItem>
              <SelectItem value="post_meal_glucose">🍴 Post-Meal Glucose</SelectItem>
              <SelectItem value="total_cholesterol">💛 Total Cholesterol</SelectItem>
              <SelectItem value="ldl">⬇️ LDL Cholesterol</SelectItem>
              <SelectItem value="hdl">⬆️ HDL Cholesterol</SelectItem>
              <SelectItem value="triglycerides">🔻 Triglycerides</SelectItem>
              <SelectItem value="creatinine">🫘 Creatinine</SelectItem>
              <SelectItem value="egfr">🫘 eGFR</SelectItem>
              <SelectItem value="hemoglobin">🩸 Hemoglobin</SelectItem>
              <SelectItem value="tsh">🦋 TSH</SelectItem>
              <SelectItem value="vitamin_d">☀️ Vitamin D</SelectItem>
              <SelectItem value="vitamin_b12">💊 Vitamin B12</SelectItem>
              <SelectItem value="liver_sgpt">🫀 SGPT/ALT</SelectItem>
              <SelectItem value="liver_sgot">🫀 SGOT/AST</SelectItem>
              <SelectItem value="other">📋 Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.test_type === "other" && (
          <div className="col-span-2">
            <Label>Test Name</Label>
            <Input 
              value={formData.test_name}
              onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
              placeholder="Enter test name"
              className="mt-1"
            />
          </div>
        )}

        <div>
          <Label>Value *</Label>
          <Input 
            type="number"
            step="0.01"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder="e.g., 6.5"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Unit</Label>
          <Input 
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            placeholder="e.g., %"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Reference Low</Label>
          <Input 
            type="number"
            step="0.01"
            value={formData.reference_range_low}
            onChange={(e) => setFormData({ ...formData, reference_range_low: e.target.value })}
            placeholder="e.g., 4.0"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Reference High</Label>
          <Input 
            type="number"
            step="0.01"
            value={formData.reference_range_high}
            onChange={(e) => setFormData({ ...formData, reference_range_high: e.target.value })}
            placeholder="e.g., 5.6"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Test Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full mt-1 justify-start">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {formData.test_date ? format(new Date(formData.test_date), "MMM d, yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={new Date(formData.test_date)}
                onSelect={(date) => setFormData({ ...formData, test_date: date })}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Lab Name</Label>
          <Input 
            value={formData.lab_name}
            onChange={(e) => setFormData({ ...formData, lab_name: e.target.value })}
            placeholder="e.g., Apollo Labs"
            className="mt-1"
          />
        </div>

        <div className="col-span-2">
          <Label>Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(val) => setFormData({ ...formData, status: val })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">✅ Normal</SelectItem>
              <SelectItem value="low">🔽 Low</SelectItem>
              <SelectItem value="high">🔼 High</SelectItem>
              <SelectItem value="critical_low">⚠️ Critical Low</SelectItem>
              <SelectItem value="critical_high">⚠️ Critical High</SelectItem>
              <SelectItem value="unknown">❓ Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label>Notes</Label>
          <Textarea 
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes..."
            className="mt-1"
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
        <Button type="submit" disabled={saving || !formData.test_type || !formData.value} className="flex-1 bg-purple-600 hover:bg-purple-700">
          <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save Result"}
        </Button>
      </div>
    </form>
  );
}