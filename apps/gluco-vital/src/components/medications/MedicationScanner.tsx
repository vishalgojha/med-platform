import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, QrCode, Loader2, X, Search, Pill } from "lucide-react";
import { appClient } from "@/api/appClient";
import { toast } from "sonner";

export default function MedicationScanner({ onScanComplete, open, onOpenChange }) {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const fileInputRef = useRef(null);

  const handleImageCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    try {
      // Upload the image
      const { file_url } = await appClient.integrations.Core.UploadFile({ file });

      // Use AI to extract medication info from the image
      const result = await appClient.integrations.Core.InvokeLLM({
        prompt: `Analyze this medication packaging/label image and extract the following information:
- Medication name (generic and brand name if visible)
- Dosage/Strength (e.g., 500mg, 10mg)
- Form (tablet, capsule, injection, etc.)
- Manufacturer
- Any barcode/NDC number visible
- Instructions or warnings visible

Be precise and only extract what's clearly visible. If something isn't visible, leave it blank.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            medication_name: { type: "string" },
            brand_name: { type: "string" },
            generic_name: { type: "string" },
            dosage: { type: "string" },
            strength: { type: "string" },
            form: { type: "string" },
            manufacturer: { type: "string" },
            barcode: { type: "string" },
            instructions: { type: "string" },
            warnings: { type: "string" }
          }
        }
      });

      if (result.medication_name || result.brand_name || result.generic_name) {
        toast.success("Medication details extracted!");
        onScanComplete({
          medication_name: result.medication_name || result.brand_name || result.generic_name,
          dosage: result.dosage || result.strength || "",
          strength: result.strength || "",
          notes: [result.instructions, result.warnings].filter(Boolean).join(". "),
          manufacturer: result.manufacturer,
          barcode: result.barcode
        });
        onOpenChange(false);
      } else {
        toast.error("Couldn't extract medication details. Try a clearer image.");
      }
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Failed to process image");
    } finally {
      setProcessing(false);
    }
  };

  const handleManualLookup = async () => {
    if (!manualCode.trim()) {
      toast.error("Please enter a barcode or medication name");
      return;
    }

    setProcessing(true);
    try {
      // Use AI to look up medication info
      const result = await appClient.integrations.Core.InvokeLLM({
        prompt: `Look up medication information for: "${manualCode}"
        
This could be a barcode/NDC number, or a medication name. Provide accurate information about:
- Full medication name
- Common dosages available
- Form (tablet, capsule, etc.)
- Common usage/purpose
- Important warnings or interactions

Only provide information you're confident about.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            medication_name: { type: "string" },
            generic_name: { type: "string" },
            common_dosages: { type: "array", items: { type: "string" } },
            form: { type: "string" },
            purpose: { type: "string" },
            warnings: { type: "string" },
            common_interactions: { type: "array", items: { type: "string" } }
          }
        }
      });

      if (result.medication_name) {
        toast.success("Medication found!");
        onScanComplete({
          medication_name: result.medication_name,
          generic_name: result.generic_name,
          dosage: result.common_dosages?.[0] || "",
          notes: result.warnings || "",
          purpose: result.purpose,
          known_interactions: result.common_interactions || []
        });
        onOpenChange(false);
      } else {
        toast.error("Medication not found. Please enter details manually.");
      }
    } catch (error) {
      console.error("Lookup error:", error);
      toast.error("Failed to lookup medication");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-violet-500" />
            Scan Medication
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera/Image Capture */}
          <div className="space-y-2">
            <Label>Take a photo of the medication packaging</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className="w-full h-32 bg-gradient-to-br from-violet-50 to-violet-100 border-2 border-dashed border-violet-300 hover:border-violet-400 text-violet-700"
              variant="outline"
            >
              {processing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-sm">Processing...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8" />
                  <span className="text-sm">Tap to capture or upload image</span>
                </div>
              )}
            </Button>
            <p className="text-xs text-slate-500 text-center">
              Take a clear photo of the medication label, barcode, or packaging
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or enter manually</span>
            </div>
          </div>

          {/* Manual Entry */}
          <div className="space-y-2">
            <Label>Enter barcode number or medication name</Label>
            <div className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g., Metformin or NDC 12345-678-90"
                onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
              />
              <Button onClick={handleManualLookup} disabled={processing}>
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Common Diabetes Meds Quick Select */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-500">Quick select common medications</Label>
            <div className="flex flex-wrap gap-2">
              {["Metformin", "Glimepiride", "Insulin", "Sitagliptin", "Empagliflozin"].map((med) => (
                <Button
                  key={med}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setManualCode(med);
                    handleManualLookup();
                  }}
                  disabled={processing}
                  className="text-xs"
                >
                  <Pill className="w-3 h-3 mr-1" />
                  {med}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}