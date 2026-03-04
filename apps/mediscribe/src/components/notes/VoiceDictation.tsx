import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Loader2, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { appClient } from "@/api/appClient";

export default function VoiceDictation({ onTranscript, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [accuracyData, setAccuracyData] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        
        try {
          // Send to backend for transcription and accuracy check
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          const response = await appClient.functions.invoke('transcribeAudio', formData);
          const result = response.data;
          
          onTranscript(result.transcription);
          setAccuracyData(result.accuracy_check);
          
          // Auto-clear accuracy data after 10 seconds
          setTimeout(() => setAccuracyData(null), 10000);
        } catch (error) {
          console.error("Transcription failed:", error);
          alert("Transcription failed. Please try again.");
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const qualityColors = {
    excellent: "bg-green-100 text-green-800 border-green-200",
    good: "bg-blue-100 text-blue-800 border-blue-200",
    fair: "bg-yellow-100 text-yellow-800 border-yellow-200",
    poor: "bg-red-100 text-red-800 border-red-200"
  };

  const qualityIcons = {
    excellent: CheckCircle2,
    good: CheckCircle2,
    fair: AlertTriangle,
    poor: AlertCircle
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={isRecording ? "destructive" : "outline"}
          size="lg"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isProcessing}
          className={`relative ${isRecording ? "animate-pulse" : ""}`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Transcribing & Checking...
            </>
          ) : isRecording ? (
            <>
              <MicOff className="w-5 h-5 mr-2" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 mr-2" />
              Start Dictation
            </>
          )}
        </Button>
        {isRecording && (
          <div className="flex items-center gap-2 text-red-600">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording...</span>
          </div>
        )}
      </div>

      {accuracyData && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Transcription Quality Check</span>
            <Badge className={qualityColors[accuracyData.overall_quality]}>
              {React.createElement(qualityIcons[accuracyData.overall_quality], { className: "w-3 h-3 mr-1" })}
              {accuracyData.overall_quality}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Accuracy Score</span>
              <div className="font-semibold text-slate-900">{accuracyData.accuracy_score}%</div>
            </div>
            <div>
              <span className="text-slate-500">Medical Terms</span>
              <div className="font-semibold text-slate-900">
                {accuracyData.medical_terms_valid ? "✓ Valid" : "⚠ Review"}
              </div>
            </div>
          </div>

          {accuracyData.potential_errors?.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Potential Issues:</span>
              <ul className="text-xs text-slate-600 space-y-1 ml-4 list-disc">
                {accuracyData.potential_errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {accuracyData.suggestions?.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Suggestions:</span>
              <ul className="text-xs text-slate-600 space-y-1 ml-4 list-disc">
                {accuracyData.suggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}