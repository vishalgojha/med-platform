import React, { useState, useRef } from "react";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle, AlertCircle, Watch, Heart, Moon, Footprints, X, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const WEARABLE_SOURCES = [
  { id: "fitbit", name: "Fitbit", icon: "⌚" },
  { id: "apple_health", name: "Apple Health", icon: "🍎" },
  { id: "google_fit", name: "Google Fit", icon: "🏃" },
  { id: "other", name: "Other", icon: "📊" }
];

const CSV_FORMATS = {
  fitbit: {
    steps: "date,steps",
    heart_rate: "date,time,heart_rate",
    sleep: "date,duration_hours,quality"
  },
  apple_health: {
    steps: "Date,Step Count",
    heart_rate: "Date,Time,Heart Rate (bpm)",
    sleep: "Date,Hours Asleep,Sleep Quality"
  },
  google_fit: {
    steps: "Date,Steps",
    heart_rate: "Date,Time,BPM",
    sleep: "Date,Duration,Quality"
  }
};

export default function WearableImport({ userEmail, onImportComplete }) {
  const [source, setSource] = useState("");
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [showFormat, setShowFormat] = useState(false);
  const fileInputRef = useRef(null);

  const parseCSV = (text) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"));
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      if (values.length >= headers.length) {
        const row = {};
        headers.forEach((h, idx) => row[h] = values[idx]);
        rows.push(row);
      }
    }
    return rows;
  };

  const detectDataType = (headers) => {
    const h = headers.join(" ").toLowerCase();
    if (h.includes("step")) return "steps";
    if (h.includes("heart") || h.includes("bpm") || h.includes("pulse")) return "heart_rate";
    if (h.includes("sleep") || h.includes("asleep") || h.includes("duration")) return "sleep";
    return null;
  };

  const processRows = (rows, dataType) => {
    const logs = [];
    
    for (const row of rows) {
      const dateKey = Object.keys(row).find(k => k.includes("date"));
      const date = row[dateKey];
      if (!date) continue;

      let log = {
        user_email: userEmail,
        source: source,
        log_type: dataType
      };

      if (dataType === "steps") {
        const stepsKey = Object.keys(row).find(k => k.includes("step"));
        const steps = parseInt(row[stepsKey]);
        if (isNaN(steps)) continue;
        log.value = `${steps.toLocaleString()} steps`;
        log.numeric_value = steps;
        log.time_of_day = "other";
        log.notes = `Imported from ${source} on ${date}`;
      } 
      else if (dataType === "heart_rate") {
        const hrKey = Object.keys(row).find(k => k.includes("heart") || k.includes("bpm") || k.includes("rate"));
        const hr = parseInt(row[hrKey]);
        if (isNaN(hr)) continue;
        log.value = `${hr} bpm`;
        log.numeric_value = hr;
        log.time_of_day = "other";
        log.notes = `Imported from ${source} on ${date}`;
      }
      else if (dataType === "sleep") {
        const durationKey = Object.keys(row).find(k => k.includes("duration") || k.includes("hour") || k.includes("asleep"));
        const duration = parseFloat(row[durationKey]);
        if (isNaN(duration)) continue;
        log.value = `${duration} hours`;
        log.numeric_value = duration;
        log.time_of_day = "bedtime";
        log.notes = `Sleep data from ${source} on ${date}`;
      }

      logs.push(log);
    }
    return logs;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file || !source) {
      toast.error("Please select a source and file");
      return;
    }

    setImporting(true);
    setResults(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        toast.error("No valid data found in CSV");
        setImporting(false);
        return;
      }

      const headers = Object.keys(rows[0]);
      const dataType = detectDataType(headers);
      
      if (!dataType) {
        toast.error("Could not detect data type. Please check CSV format.");
        setImporting(false);
        return;
      }

      const logs = processRows(rows, dataType);
      
      if (logs.length === 0) {
        toast.error("No valid entries found to import");
        setImporting(false);
        return;
      }

      // Bulk create logs
      await appClient.entities.HealthLog.bulkCreate(logs);

      setResults({
        success: true,
        count: logs.length,
        dataType: dataType
      });

      toast.success(`Imported ${logs.length} ${dataType.replace("_", " ")} records!`);
      onImportComplete?.();

    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import data");
      setResults({ success: false, error: error.message });
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Watch className="w-5 h-5 text-[#5b9a8b]" />
          Import Wearable Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source Selection */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Select Source
          </label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your wearable..." />
            </SelectTrigger>
            <SelectContent>
              {WEARABLE_SOURCES.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2">
                    <span>{s.icon}</span> {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* CSV Format Info */}
        {source && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <button 
              onClick={() => setShowFormat(!showFormat)}
              className="flex items-center gap-2 text-sm text-blue-700 font-medium w-full"
            >
              <Info className="w-4 h-4" />
              Expected CSV Format
              <span className="ml-auto text-xs">{showFormat ? "Hide" : "Show"}</span>
            </button>
            {showFormat && (
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Footprints className="w-3.5 h-3.5" />
                  <code className="bg-white px-2 py-1 rounded">date,steps</code>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Heart className="w-3.5 h-3.5" />
                  <code className="bg-white px-2 py-1 rounded">date,time,heart_rate</code>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Moon className="w-3.5 h-3.5" />
                  <code className="bg-white px-2 py-1 rounded">date,duration_hours,quality</code>
                </div>
              </div>
            )}
          </div>
        )}

        {/* File Upload */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          
          {!file ? (
            <label
              htmlFor="csv-upload"
              className={cn(
                "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                source ? "border-[#5b9a8b] bg-[#5b9a8b]/5 hover:bg-[#5b9a8b]/10" : "border-slate-200 bg-slate-50"
              )}
            >
              <Upload className={cn("w-8 h-8 mb-2", source ? "text-[#5b9a8b]" : "text-slate-400")} />
              <p className="text-sm font-medium text-slate-700">Upload CSV File</p>
              <p className="text-xs text-slate-500 mt-1">Steps, heart rate, or sleep data</p>
            </label>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <FileText className="w-8 h-8 text-[#5b9a8b]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={resetImport} className="p-1.5 hover:bg-slate-200 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}
        </div>

        {/* Import Button */}
        {file && !results && (
          <Button 
            onClick={handleImport} 
            disabled={importing || !source}
            className="w-full bg-[#5b9a8b] hover:bg-[#4a8a7b]"
          >
            {importing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </>
            )}
          </Button>
        )}

        {/* Results */}
        {results && (
          <div className={cn(
            "p-4 rounded-xl",
            results.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          )}>
            {results.success ? (
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Import Successful!</p>
                  <p className="text-sm text-green-600">
                    {results.count} {results.dataType.replace("_", " ")} records added
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Import Failed</p>
                  <p className="text-sm text-red-600">{results.error}</p>
                </div>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetImport}
              className="mt-3 w-full"
            >
              Import More Data
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}