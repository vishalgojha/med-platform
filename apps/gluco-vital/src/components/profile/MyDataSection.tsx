import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Download, Trash2, Shield, AlertTriangle, Loader2, CheckCircle, Mail } from "lucide-react";
import { toast } from "sonner";

export default function MyDataSection({ user, profile }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    setExportComplete(false);
    
    try {
      // Fetch all user data
      const [healthLogs, medicationReminders, labResults, labReports, doctorVisits, achievements] = await Promise.all([
        appClient.entities.HealthLog.filter({ user_email: user.email }).catch(() => []),
        appClient.entities.MedicationReminder.filter({ user_email: user.email }).catch(() => []),
        appClient.entities.LabResult.filter({ user_email: user.email }).catch(() => []),
        appClient.entities.LabReport.filter({ user_email: user.email }).catch(() => []),
        appClient.entities.DoctorVisit.filter({ user_email: user.email }).catch(() => []),
        appClient.entities.UserAchievements.filter({ user_email: user.email }).catch(() => [])
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user: {
          email: user.email,
          full_name: user.full_name
        },
        profile: profile || {},
        health_logs: healthLogs,
        medication_reminders: medicationReminders,
        lab_results: labResults,
        lab_reports: labReports,
        doctor_visits: doctorVisits,
        achievements: achievements
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glucovital-data-${user.email.split('@')[0]}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportComplete(true);
      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    
    try {
      // Delete all user data from various entities
      const entitiesToDelete = [
        'HealthLog',
        'MedicationReminder',
        'MedicationAdherence',
        'LabResult',
        'LabReport',
        'DoctorVisit',
        'UserAchievements',
        'HealthReport',
        'ConversationMemory',
        'DoctorConnection',
        'CaregiverAccess',
        'PatientProfile'
      ];

      for (const entityName of entitiesToDelete) {
        try {
          const records = await appClient.entities[entityName].filter({ user_email: user.email });
          for (const record of records) {
            await appClient.entities[entityName].delete(record.id);
          }
        } catch (e) {
          console.log(`No ${entityName} to delete or error:`, e.message);
        }
      }

      toast.success("Your data has been deleted. Account will be removed within 90 days.");
      
      // Logout after deletion
      setTimeout(() => {
        appClient.auth.logout();
      }, 2000);
      
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete data. Please contact support@glucovital.fit");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="w-5 h-5 text-violet-500" />
          My Data (DPDP Rights)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Under the Digital Personal Data Protection Act (DPDP) 2023, you have the right to access, export, and delete your personal data.
        </p>

        {/* Data Summary */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-700 text-sm mb-2">Your Data Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div>• Health logs</div>
            <div>• Medication reminders</div>
            <div>• Lab results & reports</div>
            <div>• Doctor visits</div>
            <div>• Profile information</div>
            <div>• Achievement data</div>
          </div>
        </div>

        {/* Export Data */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div>
            <h4 className="font-medium text-blue-800 text-sm">Download Your Data</h4>
            <p className="text-xs text-blue-600 mt-0.5">Get a copy of all your personal data in JSON format</p>
          </div>
          <Button 
            onClick={handleExportData} 
            disabled={isExporting}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : exportComplete ? (
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isExporting ? "Exporting..." : exportComplete ? "Downloaded!" : "Export Data"}
          </Button>
        </div>

        {/* Withdraw Consent / Delete Account */}
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
          <div>
            <h4 className="font-medium text-red-800 text-sm">Delete My Data</h4>
            <p className="text-xs text-red-600 mt-0.5">Permanently delete all your data (irreversible)</p>
          </div>
          <Button 
            onClick={() => setShowDeleteDialog(true)} 
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>

        {/* Grievance Contact */}
        <div className="flex items-center justify-between p-4 bg-violet-50 rounded-lg border border-violet-200">
          <div>
            <h4 className="font-medium text-violet-800 text-sm">Data Concerns?</h4>
            <p className="text-xs text-violet-600 mt-0.5">Contact our Grievance Officer</p>
          </div>
          <a href="mailto:support@glucovital.fit">
            <Button 
              variant="outline"
              className="border-violet-300 text-violet-700 hover:bg-violet-100"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact
            </Button>
          </a>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Delete All Your Data?
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                This action is <strong>permanent and irreversible</strong>. All your health logs, medication reminders, lab results, and profile data will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>Before deleting:</strong> We recommend downloading your data first using the "Export Data" button above.
                </p>
              </div>
              
              <div>
                <Label className="text-sm text-slate-700">
                  Type <strong>DELETE</strong> to confirm:
                </Label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="mt-2"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                {isDeleting ? "Deleting..." : "Delete Everything"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}