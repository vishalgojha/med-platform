import React, { useState } from "react";
import { format } from "date-fns";
import { 
  FlaskConical, TrendingUp, TrendingDown, Minus, AlertTriangle, 
  CheckCircle, Plus, FileText, Calendar, Building2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import LabResultForm from "./LabResultForm";

const TEST_LABELS = {
  hba1c: { name: "HbA1c", unit: "%", category: "diabetes" },
  fasting_glucose: { name: "Fasting Glucose", unit: "mg/dL", category: "diabetes" },
  post_meal_glucose: { name: "Post-Meal Glucose", unit: "mg/dL", category: "diabetes" },
  random_glucose: { name: "Random Glucose", unit: "mg/dL", category: "diabetes" },
  total_cholesterol: { name: "Total Cholesterol", unit: "mg/dL", category: "lipid" },
  ldl: { name: "LDL Cholesterol", unit: "mg/dL", category: "lipid" },
  hdl: { name: "HDL Cholesterol", unit: "mg/dL", category: "lipid" },
  triglycerides: { name: "Triglycerides", unit: "mg/dL", category: "lipid" },
  creatinine: { name: "Creatinine", unit: "mg/dL", category: "kidney" },
  egfr: { name: "eGFR", unit: "mL/min", category: "kidney" },
  urea: { name: "Blood Urea", unit: "mg/dL", category: "kidney" },
  uric_acid: { name: "Uric Acid", unit: "mg/dL", category: "kidney" },
  albumin_creatinine_ratio: { name: "Albumin/Creatinine Ratio", unit: "mg/g", category: "kidney" },
  microalbumin: { name: "Microalbumin", unit: "mg/L", category: "kidney" },
  hemoglobin: { name: "Hemoglobin", unit: "g/dL", category: "blood" },
  wbc: { name: "WBC Count", unit: "cells/μL", category: "blood" },
  platelets: { name: "Platelets", unit: "×10³/μL", category: "blood" },
  tsh: { name: "TSH", unit: "mIU/L", category: "thyroid" },
  t3: { name: "T3", unit: "ng/dL", category: "thyroid" },
  t4: { name: "T4", unit: "μg/dL", category: "thyroid" },
  vitamin_d: { name: "Vitamin D", unit: "ng/mL", category: "vitamin" },
  vitamin_b12: { name: "Vitamin B12", unit: "pg/mL", category: "vitamin" },
  iron: { name: "Iron", unit: "μg/dL", category: "vitamin" },
  ferritin: { name: "Ferritin", unit: "ng/mL", category: "vitamin" },
  liver_sgpt: { name: "SGPT/ALT", unit: "U/L", category: "liver" },
  liver_sgot: { name: "SGOT/AST", unit: "U/L", category: "liver" },
  bilirubin: { name: "Bilirubin", unit: "mg/dL", category: "liver" },
  sodium: { name: "Sodium", unit: "mEq/L", category: "electrolyte" },
  potassium: { name: "Potassium", unit: "mEq/L", category: "electrolyte" },
  calcium: { name: "Calcium", unit: "mg/dL", category: "electrolyte" },
  c_peptide: { name: "C-Peptide", unit: "ng/mL", category: "diabetes" },
  insulin_fasting: { name: "Fasting Insulin", unit: "μIU/mL", category: "diabetes" },
  other: { name: "Other", unit: "", category: "other" }
};

const STATUS_CONFIG = {
  normal: { color: "bg-green-100 text-green-700", icon: CheckCircle },
  low: { color: "bg-blue-100 text-blue-700", icon: TrendingDown },
  high: { color: "bg-amber-100 text-amber-700", icon: TrendingUp },
  critical_low: { color: "bg-red-100 text-red-700", icon: AlertTriangle },
  critical_high: { color: "bg-red-100 text-red-700", icon: AlertTriangle },
  unknown: { color: "bg-slate-100 text-slate-600", icon: Minus }
};

const CATEGORY_COLORS = {
  diabetes: "border-l-blue-500",
  lipid: "border-l-amber-500",
  kidney: "border-l-purple-500",
  liver: "border-l-green-500",
  blood: "border-l-red-500",
  thyroid: "border-l-indigo-500",
  vitamin: "border-l-orange-500",
  electrolyte: "border-l-teal-500",
  other: "border-l-slate-400"
};

export default function LabResultsList({ results, onAddResult, onUpdateResult, userEmail }) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  // Group results by test_type for trend analysis
  const resultsByType = results.reduce((acc, result) => {
    if (!acc[result.test_type]) acc[result.test_type] = [];
    acc[result.test_type].push(result);
    return acc;
  }, {});

  // Get trend for a result
  const getTrend = (result) => {
    const typeResults = resultsByType[result.test_type] || [];
    const sorted = typeResults.sort((a, b) => new Date(b.test_date) - new Date(a.test_date));
    const currentIdx = sorted.findIndex(r => r.id === result.id);
    
    if (currentIdx < sorted.length - 1 && result.value && sorted[currentIdx + 1].value) {
      const diff = result.value - sorted[currentIdx + 1].value;
      return diff > 0 ? "up" : diff < 0 ? "down" : "same";
    }
    return null;
  };

  const handleSave = async (data) => {
    if (selectedResult) {
      await onUpdateResult(selectedResult.id, data);
    } else {
      await onAddResult(data);
    }
    setShowAddDialog(false);
    setSelectedResult(null);
  };

  // Sort by date, newest first
  const sortedResults = [...results].sort((a, b) => 
    new Date(b.test_date) - new Date(a.test_date)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-purple-600" />
          Lab Results
        </h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-1" /> Add Result
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedResult ? "Edit Lab Result" : "Add Lab Result"}</DialogTitle>
            </DialogHeader>
            <LabResultForm 
              initialData={selectedResult}
              userEmail={userEmail}
              onSave={handleSave}
              onCancel={() => {
                setShowAddDialog(false);
                setSelectedResult(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {sortedResults.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No lab results yet</p>
          <p className="text-slate-400 text-xs mt-1">Add your HbA1c, lipid panel, kidney function tests, etc.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedResults.map((result) => {
            const testInfo = TEST_LABELS[result.test_type] || TEST_LABELS.other;
            const statusConfig = STATUS_CONFIG[result.status] || STATUS_CONFIG.unknown;
            const StatusIcon = statusConfig.icon;
            const trend = getTrend(result);
            const categoryColor = CATEGORY_COLORS[testInfo.category] || CATEGORY_COLORS.other;

            return (
              <div 
                key={result.id}
                onClick={() => {
                  setSelectedResult(result);
                  setShowAddDialog(true);
                }}
                className={`bg-white rounded-xl p-4 border border-slate-100 border-l-4 ${categoryColor} hover:shadow-md transition-all cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-800">
                        {result.test_name || testInfo.name}
                      </h4>
                      <Badge className={`${statusConfig.color} text-[10px]`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {result.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-800">
                        {result.value ?? result.value_text ?? "--"}
                      </span>
                      <span className="text-sm text-slate-500">
                        {result.unit || testInfo.unit}
                      </span>
                      {trend && (
                        <span className={`text-xs ${trend === 'up' ? 'text-amber-600' : trend === 'down' ? 'text-blue-600' : 'text-slate-400'}`}>
                          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                        </span>
                      )}
                    </div>

                    {(result.reference_range_low || result.reference_range_high || result.reference_range_text) && (
                      <p className="text-xs text-slate-400 mt-1">
                        Ref: {result.reference_range_text || `${result.reference_range_low || ''} - ${result.reference_range_high || ''} ${result.unit || testInfo.unit}`}
                      </p>
                    )}
                  </div>

                  <div className="text-right text-xs text-slate-500">
                    <div className="flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(result.test_date), "MMM d, yyyy")}
                    </div>
                    {result.lab_name && (
                      <div className="flex items-center gap-1 justify-end mt-1">
                        <Building2 className="w-3 h-3" />
                        {result.lab_name}
                      </div>
                    )}
                    {result.report_id && (
                      <div className="flex items-center gap-1 justify-end mt-1 text-purple-600">
                        <FileText className="w-3 h-3" />
                        Report attached
                      </div>
                    )}
                  </div>
                </div>

                {result.notes && (
                  <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg p-2">
                    {result.notes}
                  </p>
                )}

                {result.ai_insight && (
                  <p className="text-xs text-purple-600 mt-2 bg-purple-50 rounded-lg p-2">
                    💡 {result.ai_insight}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { TEST_LABELS, STATUS_CONFIG, CATEGORY_COLORS };