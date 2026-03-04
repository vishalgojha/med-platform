import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { FileImage, Upload, Calendar as CalendarIcon, AlertTriangle, CheckCircle, Loader2, X, Sparkles, Phone, MapPin, User, Pill } from "lucide-react";
import { format, differenceInMonths, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PrescriptionUpload({ profile, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [prescriptionDate, setPrescriptionDate] = useState(
    profile?.prescription_date ? new Date(profile.prescription_date) : null
  );
  const [prescriptionNotes, setPrescriptionNotes] = useState(profile?.prescription_notes || "");
  const [prescriptionClinic, setPrescriptionClinic] = useState(profile?.prescription_clinic || "");
  const [clinicAddress, setClinicAddress] = useState(profile?.prescription_clinic_address || "");
  const [clinicPhone, setClinicPhone] = useState(profile?.prescription_clinic_phone || "");
  const [doctorName, setDoctorName] = useState(profile?.doctor_name || "");
  const [doctorPhone, setDoctorPhone] = useState(profile?.doctor_phone || "");
  const [doctorWhatsapp, setDoctorWhatsapp] = useState(profile?.doctor_whatsapp || "");
  const [doctorRegNo, setDoctorRegNo] = useState(profile?.doctor_registration_no || "");
  const [doctorSpecialization, setDoctorSpecialization] = useState(profile?.doctor_specialization || "");
  const [extractedMeds, setExtractedMeds] = useState(profile?.prescription_extracted_meds || []);
  const [diagnosis, setDiagnosis] = useState(profile?.prescription_diagnosis || "");
  const [validMonths, setValidMonths] = useState(profile?.prescription_valid_months || 3);

  // Sync state when profile changes
  useEffect(() => {
    if (profile) {
      setPrescriptionDate(profile.prescription_date ? new Date(profile.prescription_date) : null);
      setPrescriptionNotes(profile.prescription_notes || "");
      setPrescriptionClinic(profile.prescription_clinic || "");
      setClinicAddress(profile.prescription_clinic_address || "");
      setClinicPhone(profile.prescription_clinic_phone || "");
      setDoctorName(profile.doctor_name || "");
      setDoctorPhone(profile.doctor_phone || "");
      setDoctorWhatsapp(profile.doctor_whatsapp || "");
      setDoctorRegNo(profile.doctor_registration_no || "");
      setDoctorSpecialization(profile.doctor_specialization || "");
      setExtractedMeds(profile.prescription_extracted_meds || []);
      setDiagnosis(profile.prescription_diagnosis || "");
      setValidMonths(profile.prescription_valid_months || 3);
    }
  }, [profile]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error("Please upload an image or PDF file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await appClient.integrations.Core.UploadFile({ file });
      
      // Update profile with prescription image
      await onUpdate({
        prescription_image_url: file_url
      });
      
      toast.success("Prescription uploaded! Extracting data...");
      
      // Auto-extract data from prescription
      await extractPrescriptionData(file_url);
      
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload prescription");
    } finally {
      setUploading(false);
    }
  };

  const extractPrescriptionData = async (imageUrl) => {
    setExtracting(true);
    try {
      const result = await appClient.integrations.Core.InvokeLLM({
        prompt: `Extract all information from this medical prescription image. Be thorough and extract everything visible.

Return a JSON object with these fields (use null if not found):
- doctor_name: Full name of the doctor
- doctor_phone: Phone number of doctor/clinic
- doctor_whatsapp: WhatsApp number if different from phone
- doctor_registration_no: Medical registration/license number
- doctor_specialization: Doctor's specialization (e.g., Diabetologist, General Physician)
- clinic_name: Name of clinic/hospital
- clinic_address: Full address of clinic
- clinic_phone: Clinic phone number
- prescription_date: Date on prescription (format: YYYY-MM-DD)
- diagnosis: Main diagnosis or condition mentioned
- medications: Array of medications, each with: name, dosage, frequency, timing, duration
- notes: Any special instructions or notes

Be precise with medication names and dosages. Extract phone numbers in full format.`,
        file_urls: [imageUrl],
        response_json_schema: {
          type: "object",
          properties: {
            doctor_name: { type: "string" },
            doctor_phone: { type: "string" },
            doctor_whatsapp: { type: "string" },
            doctor_registration_no: { type: "string" },
            doctor_specialization: { type: "string" },
            clinic_name: { type: "string" },
            clinic_address: { type: "string" },
            clinic_phone: { type: "string" },
            prescription_date: { type: "string" },
            diagnosis: { type: "string" },
            medications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  dosage: { type: "string" },
                  frequency: { type: "string" },
                  timing: { type: "string" },
                  duration: { type: "string" }
                }
              }
            },
            notes: { type: "string" }
          }
        }
      });

      // Update local state with extracted data
      if (result.doctor_name) setDoctorName(result.doctor_name);
      if (result.doctor_phone) setDoctorPhone(result.doctor_phone);
      if (result.doctor_whatsapp) setDoctorWhatsapp(result.doctor_whatsapp);
      if (result.doctor_registration_no) setDoctorRegNo(result.doctor_registration_no);
      if (result.doctor_specialization) setDoctorSpecialization(result.doctor_specialization);
      if (result.clinic_name) setPrescriptionClinic(result.clinic_name);
      if (result.clinic_address) setClinicAddress(result.clinic_address);
      if (result.clinic_phone) setClinicPhone(result.clinic_phone);
      if (result.prescription_date) {
        try {
          setPrescriptionDate(new Date(result.prescription_date));
        } catch (e) {}
      }
      if (result.diagnosis) setDiagnosis(result.diagnosis);
      if (result.medications?.length > 0) setExtractedMeds(result.medications);
      if (result.notes) setPrescriptionNotes(result.notes);

      // Auto-save extracted data
      const updateData = {
        ...(result.doctor_name && { doctor_name: result.doctor_name }),
        ...(result.doctor_phone && { doctor_phone: result.doctor_phone }),
        ...(result.doctor_whatsapp && { doctor_whatsapp: result.doctor_whatsapp }),
        ...(result.doctor_registration_no && { doctor_registration_no: result.doctor_registration_no }),
        ...(result.doctor_specialization && { doctor_specialization: result.doctor_specialization }),
        ...(result.clinic_name && { prescription_clinic: result.clinic_name }),
        ...(result.clinic_address && { prescription_clinic_address: result.clinic_address }),
        ...(result.clinic_phone && { prescription_clinic_phone: result.clinic_phone }),
        ...(result.prescription_date && { prescription_date: result.prescription_date }),
        ...(result.diagnosis && { prescription_diagnosis: result.diagnosis }),
        ...(result.medications?.length > 0 && { prescription_extracted_meds: result.medications }),
        ...(result.notes && { prescription_notes: result.notes })
      };

      if (Object.keys(updateData).length > 0) {
        await onUpdate(updateData);
        toast.success("Prescription data extracted and saved!");
      } else {
        toast.info("Could not extract data. Please fill in manually.");
      }

    } catch (error) {
      console.error("Extraction error:", error);
      toast.error("Failed to extract prescription data");
    } finally {
      setExtracting(false);
    }
  };

  const handleSavePrescriptionDetails = async () => {
    await onUpdate({
      prescription_date: prescriptionDate ? format(prescriptionDate, 'yyyy-MM-dd') : null,
      prescription_notes: prescriptionNotes,
      prescription_clinic: prescriptionClinic,
      prescription_clinic_address: clinicAddress,
      prescription_clinic_phone: clinicPhone,
      prescription_valid_months: validMonths,
      doctor_name: doctorName,
      doctor_phone: doctorPhone,
      doctor_whatsapp: doctorWhatsapp,
      doctor_registration_no: doctorRegNo,
      doctor_specialization: doctorSpecialization,
      prescription_extracted_meds: extractedMeds,
      prescription_diagnosis: diagnosis
    });
    toast.success("Prescription details saved!");
  };

  const getPrescriptionAge = () => {
    if (!profile?.prescription_date) return null;
    
    const prescDate = new Date(profile.prescription_date);
    const now = new Date();
    const monthsOld = differenceInMonths(now, prescDate);
    const daysOld = differenceInDays(now, prescDate);
    
    if (monthsOld >= 12) {
      return { text: `${Math.floor(monthsOld / 12)} year${monthsOld >= 24 ? 's' : ''} old`, status: 'expired' };
    } else if (monthsOld >= (validMonths || 3)) {
      return { text: `${monthsOld} months old`, status: 'expired' };
    } else if (monthsOld >= (validMonths || 3) - 1) {
      return { text: `${monthsOld} months old`, status: 'expiring' };
    } else if (daysOld < 30) {
      return { text: `${daysOld} days old`, status: 'recent' };
    } else {
      return { text: `${monthsOld} months old`, status: 'valid' };
    }
  };

  const prescriptionAge = getPrescriptionAge();

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileImage className="w-5 h-5 text-orange-500" />
          Prescription Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prescription Image */}
        <div>
          <Label>Prescription Image</Label>
          <div className="mt-2">
            {profile?.prescription_image_url ? (
              <div className="relative">
                <div className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center gap-4">
                    <img 
                      src={profile.prescription_image_url} 
                      alt="Prescription" 
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-700">Prescription attached</p>
                      {prescriptionAge && (
                        <div className={cn(
                          "flex items-center gap-1.5 mt-1 text-sm",
                          prescriptionAge.status === 'expired' && "text-red-600",
                          prescriptionAge.status === 'expiring' && "text-amber-600",
                          prescriptionAge.status === 'valid' && "text-green-600",
                          prescriptionAge.status === 'recent' && "text-blue-600"
                        )}>
                          {prescriptionAge.status === 'expired' && <AlertTriangle className="w-4 h-4" />}
                          {prescriptionAge.status === 'expiring' && <AlertTriangle className="w-4 h-4" />}
                          {prescriptionAge.status === 'valid' && <CheckCircle className="w-4 h-4" />}
                          {prescriptionAge.status === 'recent' && <CheckCircle className="w-4 h-4" />}
                          <span>{prescriptionAge.text}</span>
                          {prescriptionAge.status === 'expired' && " - Consider getting a new prescription"}
                          {prescriptionAge.status === 'expiring' && " - Expiring soon"}
                        </div>
                      )}
                      <a 
                        href={profile.prescription_image_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                      >
                        View full image
                      </a>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" asChild disabled={uploading}>
                          <span>{uploading ? "Uploading..." : "Replace"}</span>
                        </Button>
                      </label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => extractPrescriptionData(profile.prescription_image_url)}
                        disabled={extracting}
                      >
                        {extracting ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <Sparkles className="w-3 h-3 mr-1" />
                        )}
                        {extracting ? "Extracting..." : "Re-extract"}
                      </Button>
                    </div>
                  </div>
                </div>
                {extracting && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700">Extracting prescription data using AI...</span>
                  </div>
                )}
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-slate-300 hover:bg-slate-50 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-slate-400 mx-auto animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Click to upload prescription</p>
                      <p className="text-xs text-slate-400 mt-1">Supports images & PDF (max 5MB)</p>
                    </>
                  )}
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Prescription Date */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Prescription Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1.5",
                    !prescriptionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {prescriptionDate ? format(prescriptionDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={prescriptionDate}
                  onSelect={setPrescriptionDate}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Valid For (months)</Label>
            <Input
              type="number"
              min="1"
              max="12"
              value={validMonths}
              onChange={(e) => setValidMonths(parseInt(e.target.value) || 3)}
              className="mt-1.5"
            />
            <p className="text-xs text-slate-500 mt-1">Typical: 3 months for diabetes medications</p>
          </div>
        </div>

        {/* Doctor Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
          <h4 className="font-medium text-blue-800 flex items-center gap-2">
            <User className="w-4 h-4" />
            Doctor Information
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Doctor's Name</Label>
              <Input
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Name"
                className="mt-1.5 bg-white"
              />
            </div>
            <div>
              <Label>Specialization</Label>
              <Input
                value={doctorSpecialization}
                onChange={(e) => setDoctorSpecialization(e.target.value)}
                placeholder="e.g., Diabetologist, Endocrinologist"
                className="mt-1.5 bg-white"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={doctorPhone}
                onChange={(e) => setDoctorPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="mt-1.5 bg-white"
              />
            </div>
            <div>
              <Label>WhatsApp (if different)</Label>
              <Input
                value={doctorWhatsapp}
                onChange={(e) => setDoctorWhatsapp(e.target.value)}
                placeholder="+91 98765 43210"
                className="mt-1.5 bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Registration Number</Label>
              <Input
                value={doctorRegNo}
                onChange={(e) => setDoctorRegNo(e.target.value)}
                placeholder="Medical council registration no."
                className="mt-1.5 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Clinic Info */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
          <h4 className="font-medium text-green-800 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Clinic / Hospital Information
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Clinic / Hospital Name</Label>
              <Input
                value={prescriptionClinic}
                onChange={(e) => setPrescriptionClinic(e.target.value)}
                placeholder="e.g., Apollo Hospital"
                className="mt-1.5 bg-white"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={clinicPhone}
                onChange={(e) => setClinicPhone(e.target.value)}
                placeholder="+91 22 1234 5678"
                className="mt-1.5 bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <Textarea
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                placeholder="Full clinic address"
                className="mt-1.5 bg-white h-16"
              />
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div>
          <Label>Diagnosis</Label>
          <Input
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g., Type 2 Diabetes Mellitus"
            className="mt-1.5"
          />
        </div>

        {/* Extracted Medications */}
        {extractedMeds.length > 0 && (
          <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
            <h4 className="font-medium text-violet-800 flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4" />
              Medications from Prescription
            </h4>
            <div className="space-y-2">
              {extractedMeds.map((med, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border border-violet-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{med.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {med.dosage && (
                          <Badge variant="outline" className="text-xs">{med.dosage}</Badge>
                        )}
                        {med.frequency && (
                          <Badge variant="outline" className="text-xs">{med.frequency}</Badge>
                        )}
                        {med.timing && (
                          <Badge variant="outline" className="text-xs">{med.timing}</Badge>
                        )}
                        {med.duration && (
                          <Badge variant="outline" className="text-xs">{med.duration}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-violet-600 mt-3">
              💡 These medications were extracted from your prescription image. Always verify with your doctor.
            </p>
          </div>
        )}

        {/* Notes */}
        <div>
          <Label>Prescription Notes / Instructions</Label>
          <Textarea
            value={prescriptionNotes}
            onChange={(e) => setPrescriptionNotes(e.target.value)}
            placeholder="Any special instructions from your doctor..."
            className="mt-1.5 h-24"
          />
        </div>

        {/* Alert for old prescription */}
        {prescriptionAge?.status === 'expired' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Prescription may be outdated</p>
                <p className="text-sm text-red-600 mt-1">
                  Your prescription is {prescriptionAge.text}. Please consult your doctor for an updated prescription 
                  to ensure your medications are still appropriate.
                </p>
              </div>
            </div>
          </div>
        )}

        {prescriptionAge?.status === 'expiring' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Prescription expiring soon</p>
                <p className="text-sm text-amber-600 mt-1">
                  Consider scheduling an appointment with your doctor for a prescription review.
                </p>
              </div>
            </div>
          </div>
        )}

        <Button onClick={handleSavePrescriptionDetails} className="w-full">
          Save Prescription Details
        </Button>
      </CardContent>
    </Card>
  );
}