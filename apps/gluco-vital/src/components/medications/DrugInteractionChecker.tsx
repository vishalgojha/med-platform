import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Shield, Info, Loader2, CheckCircle, XCircle } from "lucide-react";
import { appClient } from "@/api/appClient";

// Known common drug interactions for quick checks (expanded for diabetes meds)
const KNOWN_INTERACTIONS = {
  "metformin": {
    "alcohol": { severity: "moderate", description: "Alcohol can increase the risk of lactic acidosis with metformin" },
    "contrast dye": { severity: "severe", description: "Stop metformin before and after procedures with iodinated contrast" },
    "topiramate": { severity: "moderate", description: "May increase risk of lactic acidosis" }
  },
  "glimepiride": {
    "fluconazole": { severity: "moderate", description: "May increase blood sugar lowering effect, risk of hypoglycemia" },
    "alcohol": { severity: "moderate", description: "May cause unpredictable blood sugar changes" },
    "beta-blockers": { severity: "moderate", description: "May mask symptoms of low blood sugar" }
  },
  "insulin": {
    "alcohol": { severity: "moderate", description: "Can cause unpredictable blood sugar changes" },
    "beta-blockers": { severity: "moderate", description: "May mask symptoms of hypoglycemia" },
    "pioglitazone": { severity: "moderate", description: "Increased risk of fluid retention and heart failure" }
  },
  "sitagliptin": {
    "digoxin": { severity: "mild", description: "May slightly increase digoxin levels" }
  },
  "empagliflozin": {
    "diuretics": { severity: "moderate", description: "May increase risk of dehydration and low blood pressure" },
    "insulin": { severity: "mild", description: "May need to reduce insulin dose to prevent hypoglycemia" }
  },
  "lisinopril": {
    "potassium supplements": { severity: "moderate", description: "Risk of high potassium levels" },
    "nsaids": { severity: "moderate", description: "May reduce blood pressure lowering effect" },
    "spironolactone": { severity: "severe", description: "High risk of dangerous potassium levels" }
  },
  "atorvastatin": {
    "grapefruit": { severity: "moderate", description: "Grapefruit can increase statin levels and side effects" },
    "erythromycin": { severity: "severe", description: "Significantly increases statin levels, muscle damage risk" },
    "gemfibrozil": { severity: "severe", description: "Increased risk of muscle damage (rhabdomyolysis)" }
  },
  "aspirin": {
    "ibuprofen": { severity: "moderate", description: "May reduce aspirin's heart-protective effects" },
    "warfarin": { severity: "severe", description: "Increased risk of bleeding" },
    "methotrexate": { severity: "severe", description: "Aspirin can increase methotrexate toxicity" }
  },
  "amlodipine": {
    "simvastatin": { severity: "moderate", description: "May increase statin levels, limit simvastatin dose" },
    "grapefruit": { severity: "mild", description: "May slightly increase amlodipine levels" }
  }
};

export function checkLocalInteractions(medications) {
  const interactions = [];
  const medNames = medications.map(m => m.medication_name?.toLowerCase() || m.toLowerCase());
  
  for (let i = 0; i < medNames.length; i++) {
    const med1 = medNames[i];
    const med1Key = Object.keys(KNOWN_INTERACTIONS).find(k => med1.includes(k));
    
    if (med1Key && KNOWN_INTERACTIONS[med1Key]) {
      for (let j = 0; j < medNames.length; j++) {
        if (i === j) continue;
        const med2 = medNames[j];
        
        for (const [interactingDrug, info] of Object.entries(KNOWN_INTERACTIONS[med1Key])) {
          if (med2.includes(interactingDrug)) {
            interactions.push({
              drug1: medications[i].medication_name || medications[i],
              drug2: medications[j].medication_name || medications[j],
              severity: info.severity,
              description: info.description
            });
          }
        }
      }
    }
  }
  
  return interactions;
}

export default function DrugInteractionChecker({ medications = [], newMedication, onClose }) {
  const [checking, setChecking] = useState(false);
  const [interactions, setInteractions] = useState([]);
  const [aiChecked, setAiChecked] = useState(false);

  useEffect(() => {
    if (medications.length > 0 || newMedication) {
      checkInteractions();
    }
  }, [medications, newMedication]);

  const checkInteractions = async () => {
    // First do local check
    const allMeds = newMedication 
      ? [...medications, newMedication]
      : medications;
    
    const localInteractions = checkLocalInteractions(allMeds);
    setInteractions(localInteractions);

    // Then do AI check for comprehensive analysis
    if (allMeds.length >= 2) {
      setChecking(true);
      try {
        const medList = allMeds.map(m => m.medication_name || m).join(", ");
        
        const result = await appClient.integrations.Core.InvokeLLM({
          prompt: `Check for drug interactions between these medications: ${medList}

For each potential interaction found, provide:
1. The two drugs involved
2. Severity (mild, moderate, severe)
3. Brief description of the interaction and what to watch for

Only report clinically significant interactions. Be accurate and conservative.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              interactions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    drug1: { type: "string" },
                    drug2: { type: "string" },
                    severity: { type: "string", enum: ["mild", "moderate", "severe"] },
                    description: { type: "string" }
                  }
                }
              },
              general_advice: { type: "string" }
            }
          }
        });

        if (result.interactions?.length > 0) {
          // Merge with local interactions, avoiding duplicates
          const newInteractions = result.interactions.filter(ai => 
            !localInteractions.some(local => 
              local.drug1.toLowerCase().includes(ai.drug1.toLowerCase()) &&
              local.drug2.toLowerCase().includes(ai.drug2.toLowerCase())
            )
          );
          setInteractions([...localInteractions, ...newInteractions]);
        }
        setAiChecked(true);
      } catch (error) {
        console.error("AI interaction check failed:", error);
      } finally {
        setChecking(false);
      }
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "severe": return "bg-red-50 border-red-200 text-red-800";
      case "moderate": return "bg-amber-50 border-amber-200 text-amber-800";
      case "mild": return "bg-blue-50 border-blue-200 text-blue-800";
      default: return "bg-slate-50 border-slate-200 text-slate-800";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "severe": return <XCircle className="w-5 h-5 text-red-500" />;
      case "moderate": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "mild": return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-slate-800 flex items-center gap-2">
          <Shield className="w-5 h-5 text-violet-500" />
          Drug Interaction Check
        </h4>
        {checking && <Loader2 className="w-4 h-4 animate-spin text-violet-500" />}
      </div>

      {interactions.length === 0 && !checking ? (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertTitle className="text-green-800">No interactions detected</AlertTitle>
          <AlertDescription className="text-green-700 text-sm">
            No known drug interactions found between your medications.
            {!aiChecked && " Full AI check in progress..."}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {interactions.map((interaction, idx) => (
            <Alert key={idx} className={getSeverityColor(interaction.severity)}>
              {getSeverityIcon(interaction.severity)}
              <AlertTitle className="flex items-center gap-2">
                <span className="capitalize">{interaction.severity}</span> Interaction
              </AlertTitle>
              <AlertDescription>
                <p className="font-medium mb-1">
                  {interaction.drug1} + {interaction.drug2}
                </p>
                <p className="text-sm">{interaction.description}</p>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
        ⚠️ This is for informational purposes only. Always consult your doctor or pharmacist about drug interactions.
      </p>
    </div>
  );
}

// Inline warning component for forms
export function InteractionWarningBadge({ medications, newMedicationName }) {
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    if (newMedicationName && medications.length > 0) {
      const allMeds = [...medications, { medication_name: newMedicationName }];
      const interactions = checkLocalInteractions(allMeds);
      
      const severe = interactions.find(i => i.severity === "severe");
      const moderate = interactions.find(i => i.severity === "moderate");
      
      if (severe) {
        setWarning({ type: "severe", interaction: severe });
      } else if (moderate) {
        setWarning({ type: "moderate", interaction: moderate });
      } else {
        setWarning(null);
      }
    } else {
      setWarning(null);
    }
  }, [medications, newMedicationName]);

  if (!warning) return null;

  return (
    <div className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
      warning.type === "severe" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
    }`}>
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div>
        <span className="font-medium">Potential interaction with {warning.interaction.drug2}:</span>{" "}
        {warning.interaction.description}
      </div>
    </div>
  );
}