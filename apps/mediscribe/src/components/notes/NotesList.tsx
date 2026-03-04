import React from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Edit, 
  Trash2, 
  User, 
  Calendar,
  CheckCircle,
  Clock,
  FileCheck
} from "lucide-react";

export default function NotesList({ notes, isLoading, onEdit, onDelete }) {
  const categoryLabels = {
    patient_history: "Patient History",
    diagnosis: "Diagnosis",
    prescription: "Prescription",
    lab_results: "Lab Results",
    follow_up: "Follow-Up",
    procedure: "Procedure",
    consultation: "Consultation",
    other: "Other",
  };

  const categoryColors = {
    patient_history: "bg-blue-100 text-blue-800 border-blue-200",
    diagnosis: "bg-purple-100 text-purple-800 border-purple-200",
    prescription: "bg-green-100 text-green-800 border-green-200",
    lab_results: "bg-yellow-100 text-yellow-800 border-yellow-200",
    follow_up: "bg-orange-100 text-orange-800 border-orange-200",
    procedure: "bg-red-100 text-red-800 border-red-200",
    consultation: "bg-indigo-100 text-indigo-800 border-indigo-200",
    other: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const statusIcons = {
    draft: <Clock className="w-3 h-3" />,
    finalized: <FileCheck className="w-3 h-3" />,
    signed: <CheckCircle className="w-3 h-3" />,
  };

  const statusColors = {
    draft: "bg-slate-100 text-slate-600",
    finalized: "bg-blue-100 text-blue-600",
    signed: "bg-green-100 text-green-600",
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="border-slate-200">
            <CardContent className="p-5">
              <div className="space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-1">No notes yet</h3>
          <p className="text-slate-400">Create your first clinical note to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card 
          key={note.id} 
          className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onEdit(note)}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {note.title || "Untitled Note"}
                  </h3>
                  <Badge variant="outline" className={`${categoryColors[note.category]} text-xs`}>
                    {categoryLabels[note.category] || "Other"}
                  </Badge>
                  <Badge className={`${statusColors[note.status]} text-xs flex items-center gap-1`}>
                    {statusIcons[note.status]}
                    {note.status}
                  </Badge>
                </div>

                {note.patient_name && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-2">
                    <User className="w-3.5 h-3.5" />
                    <span>{note.patient_name}</span>
                  </div>
                )}

                {note.summary ? (
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                    {note.summary}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                    {note.content}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(note.created_date), "MMM d, yyyy h:mm a")}
                  </div>
                  {note.icd10_codes?.length > 0 && (
                    <span>{note.icd10_codes.length} ICD-10 codes</span>
                  )}
                  {note.cpt_codes?.length > 0 && (
                    <span>{note.cpt_codes.length} CPT codes</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" onClick={() => onEdit(note)}>
                  <Edit className="w-4 h-4 text-slate-400" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onDelete(note)}
                  className="hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4 text-slate-400" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}