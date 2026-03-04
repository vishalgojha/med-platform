import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, FileText, Image, File, X } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = {
  patient: [
    { value: "prescription", label: "Prescription" },
    { value: "lab_report", label: "Lab Report" },
    { value: "discharge_summary", label: "Discharge Summary" },
    { value: "imaging", label: "X-Ray / Scan / Imaging" },
    { value: "insurance", label: "Insurance Document" },
    { value: "other", label: "Other" }
  ],
  doctor: [
    { value: "care_plan", label: "Care Plan" },
    { value: "referral", label: "Referral Note" },
    { value: "prescription", label: "Prescription" },
    { value: "educational", label: "Educational Material" },
    { value: "other", label: "Other" }
  ],
  coach: [
    { value: "care_plan", label: "Care Plan" },
    { value: "diet_plan", label: "Diet Plan" },
    { value: "exercise_plan", label: "Exercise Plan" },
    { value: "educational", label: "Educational Material" },
    { value: "other", label: "Other" }
  ],
  caregiver: [
    { value: "prescription", label: "Prescription" },
    { value: "lab_report", label: "Lab Report" },
    { value: "other", label: "Other" }
  ]
};

export default function DocumentUploadModal({ open, onClose, user, ownerEmail = null, ownerName = null }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    document_date: "",
    tags: ""
  });
  const queryClient = useQueryClient();

  const userRole = user?.user_type || "patient";
  const categories = CATEGORIES[userRole] || CATEGORIES.patient;
  const isUploadingForOther = ownerEmail && ownerEmail !== user?.email;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      if (!form.title) {
        setForm(prev => ({ ...prev, title: selectedFile.name.replace(/\.[^/.]+$/, "") }));
      }
    }
  };

  const getFileType = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    return 'other';
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      
      // Upload file
      const { file_url } = await appClient.integrations.Core.UploadFile({ file });
      
      // Create document record
      const document = {
        owner_email: ownerEmail || user.email,
        uploaded_by_email: user.email,
        uploaded_by_name: user.full_name,
        uploaded_by_role: userRole,
        title: form.title,
        description: form.description,
        category: form.category,
        file_url,
        file_type: getFileType(file.name),
        file_name: file.name,
        document_date: form.document_date || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        shared_with: isUploadingForOther ? [user.email] : []
      };
      
      return appClient.entities.HealthDocument.create(document);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-documents'] });
      toast.success("Document uploaded successfully");
      handleClose();
    },
    onError: (error) => {
      toast.error("Failed to upload document");
      console.error(error);
    },
    onSettled: () => setUploading(false)
  });

  const handleClose = () => {
    setFile(null);
    setForm({ title: "", description: "", category: "", document_date: "", tags: "" });
    onClose();
  };

  const FileIcon = file?.type?.includes('pdf') ? FileText : file?.type?.includes('image') ? Image : File;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        {isUploadingForOther && (
          <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg mb-2">
            Uploading for: <strong>{ownerName || ownerEmail}</strong>
          </div>
        )}

        <div className="space-y-4">
          {/* File Upload */}
          {!file ? (
            <label className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center cursor-pointer hover:border-[#5b9a8b] hover:bg-[#5b9a8b]/5 transition-colors">
              <Upload className="w-10 h-10 text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-600">Click to upload</p>
              <p className="text-xs text-slate-400 mt-1">PDF, Images up to 10MB</p>
              <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" />
            </label>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <FileIcon className="w-8 h-8 text-[#5b9a8b]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div>
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Blood Test Report - Jan 2025"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Document Date</Label>
            <Input
              type="date"
              value={form.document_date}
              onChange={(e) => setForm(prev => ({ ...prev, document_date: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional notes about this document"
              className="mt-1 h-20"
            />
          </div>

          <div>
            <Label>Tags</Label>
            <Input
              value={form.tags}
              onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="diabetes, hba1c, quarterly (comma separated)"
              className="mt-1"
            />
          </div>

          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!file || !form.title || !form.category || uploading}
            className="w-full bg-[#5b9a8b] hover:bg-[#4a8a7b]"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload Document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}