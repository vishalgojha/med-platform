import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, FileText, CheckCircle2, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ReportUploader({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, extracting, analyzing, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [aiSummary, setAiSummary] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setErrorMsg('');
    }
  };

  const processFile = async () => {
    if (!file) return;

    setStatus('uploading');
    try {
      // 1. Upload File
      const uploadRes = await appClient.integrations.Core.UploadFile({
        file: file
      });

      if (!uploadRes || !uploadRes.file_url) {
        throw new Error("Upload failed");
      }

      setStatus('extracting');

      // 2. Extract Data
      const extractionRes = await appClient.integrations.Core.ExtractDataFromUploadedFile({
        file_url: uploadRes.file_url,
        json_schema: {
          type: "object",
          properties: {
            test_name: { type: "string", description: "Name of the test or report (e.g. CBC, Lipid Profile)" },
            date: { type: "string", format: "date", description: "Date of the report (YYYY-MM-DD)" },
            summary: { type: "string", description: "A short, simple summary of the findings for a patient" },
            results: { 
              type: "array", 
              items: { 
                type: "object", 
                properties: { 
                  parameter: { type: "string" }, 
                  value: { type: "string" }, 
                  unit: { type: "string" },
                  reference_range: { type: "string" }
                } 
              } 
            }
          },
          required: ["test_name", "date", "summary"]
        }
      });

      if (extractionRes.status === 'error') {
        throw new Error(extractionRes.details || "Extraction failed");
      }

      const data = extractionRes.output;

      // 3. Get AI Analysis from Nurse Priya
      setStatus('analyzing');
      
      const analysisPrompt = `You are Nurse Priya, a caring medical assistant. Analyze this medical report and provide a helpful summary.

Report: ${data.test_name}
Date: ${data.date}
Results: ${JSON.stringify(data.results || [])}

Provide:
1. A brief, reassuring overview (2-3 sentences)
2. Key findings in bullet points (highlight normal ✅ and concerning ⚠️ values)
3. Simple lifestyle tips if applicable

Keep it warm, simple, and easy to understand. Use emojis sparingly.`;

      const aiAnalysis = await appClient.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        add_context_from_internet: true
      });

      // 4. Create Report Entity with AI summary
      await appClient.entities.Report.create({
        test_name: data.test_name || "Uploaded Report",
        date: data.date || new Date().toISOString().split('T')[0],
        status: 'ready',
        summary: aiAnalysis || data.summary || "No summary available",
        results_json: JSON.stringify(data.results || [])
      });

      setAiSummary(aiAnalysis);
      setStatus('success');
      toast.success("Report analyzed by Nurse Priya! 🎉");
      if (onUploadComplete) onUploadComplete();

    } catch (error) {
      console.error("Processing failed:", error);
      setStatus('error');
      setErrorMsg(error.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <Card className="border-dashed border-2 border-indigo-200 bg-indigo-50/30">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          
          {status === 'idle' && (
            <>
              <div className="p-4 bg-indigo-100 rounded-full">
                <UploadCloud className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-indigo-900">Upload your Medical Report</h3>
                <p className="text-sm text-indigo-600/80 max-w-xs mx-auto">
                  PDF, JPG, or PNG. We'll use AI to extract the data and summarize it for you.
                </p>
              </div>
              
              <div className="w-full max-w-xs">
                <Label htmlFor="file-upload" className="sr-only">Choose File</Label>
                <div className="flex gap-2">
                   <Input 
                    id="file-upload" 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="bg-white"
                  />
                </div>
              </div>

              {file && (
                <Button onClick={processFile} className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700">
                  <Sparkles className="w-4 h-4 mr-2" /> Analyze with AI
                </Button>
              )}
            </>
          )}

          {(status === 'uploading' || status === 'extracting' || status === 'analyzing') && (
            <div className="py-8 space-y-4">
              <div className="relative">
                 <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    {status === 'analyzing' ? <Sparkles className="w-5 h-5 text-indigo-600" /> : <FileText className="w-5 h-5 text-indigo-600" />}
                 </div>
              </div>
              <p className="text-indigo-900 font-medium animate-pulse">
                {status === 'uploading' ? 'Uploading document...' : status === 'extracting' ? 'Reading your report...' : 'Nurse Priya is analyzing...'}
              </p>
              <p className="text-xs text-indigo-500">
                {status === 'analyzing' ? 'Getting personalized insights for you 💙' : 'This usually takes about 10-20 seconds'}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-4 space-y-3 w-full">
              <div className="p-3 bg-green-100 rounded-full inline-block">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-green-800">Nurse Priya's Analysis 💙</h3>
              {aiSummary && (
                <div className="bg-white border border-green-200 rounded-lg p-4 text-left text-sm text-slate-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {aiSummary}
                </div>
              )}
              <p className="text-xs text-slate-500">Report saved to your dashboard</p>
              <Button variant="outline" onClick={() => { setFile(null); setStatus('idle'); setAiSummary(''); }} className="mt-2">
                Upload Another
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4 space-y-3">
              <div className="p-3 bg-red-100 rounded-full inline-block">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-bold text-red-800">Processing Failed</h3>
              <p className="text-sm text-red-700 max-w-xs mx-auto">{errorMsg}</p>
              <Button variant="outline" onClick={() => setStatus('idle')} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  );
}