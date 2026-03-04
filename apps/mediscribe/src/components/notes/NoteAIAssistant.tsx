import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Sparkles, 
  Tag, 
  FileCode, 
  FileText, 
  Loader2, 
  Copy, 
  Check,
  RefreshCw 
} from "lucide-react";

export default function NoteAIAssistant({ noteContent, onCategoryUpdate, onCodesUpdate, onSummaryUpdate }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const analyzeNote = async () => {
    if (!noteContent || noteContent.trim().length < 20) {
      alert("Please enter more note content for analysis.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await appClient.functions.invoke('analyzeClinicalNote', {
        note_content: noteContent
      });

      const result = response.data.analysis;
      setAnalysis(result);
      
      // Update parent component with AI suggestions
      if (result.category) onCategoryUpdate(result.category);
      if (result.icd10_codes) onCodesUpdate("icd10", result.icd10_codes);
      if (result.cpt_codes) onCodesUpdate("cpt", result.cpt_codes);
      if (result.summary) onSummaryUpdate(result.summary);
      
    } catch (error) {
      console.error("Error analyzing note:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const categoryLabels = {
    patient_history: "Patient History",
    diagnosis: "Diagnosis",
    prescription: "Prescription",
    lab_results: "Lab Results",
    follow_up: "Follow-Up",
    procedure: "Procedure",
    consultation: "Consultation",
    other: "Other"
  };

  const categoryColors = {
    patient_history: "bg-blue-100 text-blue-800",
    diagnosis: "bg-purple-100 text-purple-800",
    prescription: "bg-green-100 text-green-800",
    lab_results: "bg-yellow-100 text-yellow-800",
    follow_up: "bg-orange-100 text-orange-800",
    procedure: "bg-red-100 text-red-800",
    consultation: "bg-indigo-100 text-indigo-800",
    other: "bg-slate-100 text-slate-800"
  };

  return (
    <Card className="border-slate-200 shadow-sm h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-lg">AI Assistant</CardTitle>
          </div>
          <Button 
            onClick={analyzeNote} 
            disabled={isAnalyzing || !noteContent}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Analyze Note
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          AI-powered categorization, coding suggestions, and summarization
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!analysis && !isAnalyzing && (
          <div className="text-center py-8 text-slate-400">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Enter your clinical note and click "Analyze Note" to get AI suggestions</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-purple-600" />
            <p className="text-slate-600 font-medium">Analyzing clinical note...</p>
            <p className="text-sm text-slate-400 mt-1">Generating codes and summary</p>
          </div>
        )}

        {analysis && !isAnalyzing && (
          <>
            {/* Category */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-700">Category</span>
              </div>
              <Badge className={`text-sm px-3 py-1 ${categoryColors[analysis.category]}`}>
                {categoryLabels[analysis.category]}
              </Badge>
            </div>

            <Separator />

            {/* ICD-10 Codes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-700">ICD-10 Codes</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(analysis.icd10_codes.join("\n"), "icd10")}
                  className="h-7 text-xs"
                >
                  {copiedField === "icd10" ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <div className="space-y-2">
                {analysis.icd10_codes?.map((code, i) => (
                  <div key={i} className="p-2 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-100">
                    {code}
                  </div>
                ))}
                {(!analysis.icd10_codes || analysis.icd10_codes.length === 0) && (
                  <p className="text-sm text-slate-400">No ICD-10 codes identified</p>
                )}
              </div>
            </div>

            <Separator />

            {/* CPT Codes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-700">CPT Codes</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(analysis.cpt_codes.join("\n"), "cpt")}
                  className="h-7 text-xs"
                >
                  {copiedField === "cpt" ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <div className="space-y-2">
                {analysis.cpt_codes?.map((code, i) => (
                  <div key={i} className="p-2 bg-blue-50 rounded-lg text-sm text-blue-700 border border-blue-100">
                    {code}
                  </div>
                ))}
                {(!analysis.cpt_codes || analysis.cpt_codes.length === 0) && (
                  <p className="text-sm text-slate-400">No CPT codes identified</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-700">Summary</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(analysis.summary, "summary")}
                  className="h-7 text-xs"
                >
                  {copiedField === "summary" ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <Copy className="w-3 h-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-sm text-green-800 border border-green-100">
                {analysis.summary}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}