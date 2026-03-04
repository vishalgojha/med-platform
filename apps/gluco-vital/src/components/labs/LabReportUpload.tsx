import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, Calendar as CalendarIcon, Loader2, FileText, Sparkles, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function LabReportUpload({ userEmail, onReportUploaded, onResultsExtracted }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [reportData, setReportData] = useState({
    report_type: "diabetes_panel",
    report_date: new Date(),
    lab_name: ""
  });
  const [uploadedReport, setUploadedReport] = useState(null);
  const [extractedResults, setExtractedResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      // Upload file
      const { file_url } = await appClient.integrations.Core.UploadFile({ file });
      
      // Create LabReport record
      const report = await appClient.entities.LabReport.create({
        user_email: userEmail,
        report_name: file.name,
        report_type: reportData.report_type,
        report_date: format(reportData.report_date, "yyyy-MM-dd"),
        lab_name: reportData.lab_name,
        document_url: file_url,
        document_type: file.type.includes("pdf") ? "pdf" : "image",
        extracted: false,
        extraction_status: "processing"
      });

      setUploadedReport(report);
      toast.success("Report uploaded! Extracting data...");
      onReportUploaded?.(report);
      
      // Auto-extract after upload
      await autoExtract(report, file_url);
    } catch (error) {
      toast.error("Failed to upload report");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const autoExtract = async (report, fileUrl) => {
    setExtracting(true);
    try {
      // Extract data using AI
      const extractionResult = await appClient.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: "object",
          properties: {
            lab_name: { type: "string" },
            report_date: { type: "string" },
            patient_name: { type: "string" },
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  test_name: { type: "string" },
                  test_type: { 
                    type: "string",
                    enum: ["hba1c", "fasting_glucose", "post_meal_glucose", "random_glucose", "total_cholesterol", "ldl", "hdl", "triglycerides", "creatinine", "egfr", "urea", "uric_acid", "hemoglobin", "wbc", "platelets", "tsh", "t3", "t4", "vitamin_d", "vitamin_b12", "iron", "ferritin", "liver_sgpt", "liver_sgot", "bilirubin", "sodium", "potassium", "calcium", "albumin_creatinine_ratio", "microalbumin", "c_peptide", "insulin_fasting", "other"]
                  },
                  value: { type: "number" },
                  unit: { type: "string" },
                  reference_range: { type: "string" },
                  status: { 
                    type: "string",
                    enum: ["normal", "low", "high", "critical_low", "critical_high"]
                  }
                }
              }
            }
          }
        }
      });

      if (extractionResult.status === "success" && extractionResult.output?.results) {
        setExtractedResults(extractionResult.output.results);
        
        // Update report with extracted lab name if found
        const updatedLabName = extractionResult.output.lab_name || reportData.lab_name;
        await appClient.entities.LabReport.update(report.id, {
          extracted: true,
          extraction_status: "completed",
          lab_name: updatedLabName
        });
        
        // Update local state
        if (extractionResult.output.lab_name && !reportData.lab_name) {
          setReportData(prev => ({ ...prev, lab_name: extractionResult.output.lab_name }));
        }

        toast.success(`Found ${extractionResult.output.results.length} test results!`);
      } else {
        await appClient.entities.LabReport.update(report.id, {
          extraction_status: "failed"
        });
        toast.error("Could not extract data. Please add results manually.");
      }
    } catch (error) {
      toast.error("Extraction failed. You can add results manually.");
      console.error(error);
      await appClient.entities.LabReport.update(report.id, {
        extraction_status: "failed"
      });
    } finally {
      setExtracting(false);
    }
  };



  const handleSaveExtracted = async () => {
    if (!extractedResults?.length) return;
    
    try {
      // Create LabResult entries for each extracted result
      for (const result of extractedResults) {
        // Parse reference range
        let refLow = null, refHigh = null;
        if (result.reference_range) {
          const match = result.reference_range.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
          if (match) {
            refLow = parseFloat(match[1]);
            refHigh = parseFloat(match[2]);
          }
        }

        await appClient.entities.LabResult.create({
          user_email: userEmail,
          test_type: result.test_type || "other",
          test_name: result.test_name,
          value: result.value,
          unit: result.unit,
          reference_range_low: refLow,
          reference_range_high: refHigh,
          reference_range_text: result.reference_range,
          status: result.status || "unknown",
          test_date: format(reportData.report_date, "yyyy-MM-dd"),
          lab_name: reportData.lab_name,
          source: "extracted",
          report_id: uploadedReport.id,
          verified: false
        });
      }

      toast.success("All results saved!");
      onResultsExtracted?.(extractedResults);
      
      // Reset form
      setFile(null);
      setUploadedReport(null);
      setExtractedResults(null);
    } catch (error) {
      toast.error("Failed to save results");
      console.error(error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-100">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-purple-600" />
        Upload Lab Report
      </h3>

      {!uploadedReport ? (
        <div className="space-y-4">
          <div>
            <Label>Report Type</Label>
            <Select 
              value={reportData.report_type} 
              onValueChange={(val) => setReportData({ ...reportData, report_type: val })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hba1c">HbA1c Report</SelectItem>
                <SelectItem value="diabetes_panel">Diabetes Panel</SelectItem>
                <SelectItem value="lipid_profile">Lipid Profile</SelectItem>
                <SelectItem value="kidney_function">Kidney Function</SelectItem>
                <SelectItem value="liver_function">Liver Function</SelectItem>
                <SelectItem value="complete_blood_count">Complete Blood Count</SelectItem>
                <SelectItem value="thyroid">Thyroid Panel</SelectItem>
                <SelectItem value="comprehensive_metabolic">Comprehensive Metabolic</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Report Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full mt-1 justify-start">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(reportData.report_date, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={reportData.report_date}
                    onSelect={(date) => setReportData({ ...reportData, report_date: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Lab Name</Label>
              <Input 
                value={reportData.lab_name}
                onChange={(e) => setReportData({ ...reportData, lab_name: e.target.value })}
                placeholder="e.g., Apollo Labs"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Upload Report (PDF/Image)</Label>
            <div className="mt-1 border-2 border-dashed border-purple-200 rounded-xl p-4 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
                id="lab-report-upload"
              />
              <label htmlFor="lab-report-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">
                  {file ? file.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG up to 10MB</p>
              </label>
            </div>
          </div>

          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Upload Report</>
            )}
          </Button>
        </div>
      ) : !extractedResults ? (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-3">
              {extracting ? (
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-500" />
              )}
              <div>
                <p className="font-medium text-slate-800">
                  {extracting ? "Extracting Results..." : "Report Uploaded!"}
                </p>
                <p className="text-sm text-slate-500">
                  {extracting ? "AI is reading your report" : uploadedReport.report_name}
                </p>
              </div>
            </div>
          </div>

          {!extracting && (
            <Button 
              onClick={() => autoExtract(uploadedReport, uploadedReport.document_url)} 
              disabled={extracting}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Retry Extraction
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-green-100">
            <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Extracted Results ({extractedResults.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {extractedResults.map((result, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-sm">
                  <span className="font-medium text-slate-700">{result.test_name}</span>
                  <span className="text-slate-600">
                    {result.value} {result.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleSaveExtracted}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Save All Results
          </Button>
        </div>
      )}
    </div>
  );
}