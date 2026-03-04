import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Image, File, Download, Trash2, Pin, PinOff, MoreVertical, ExternalLink, User, Stethoscope, Heart } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS = {
  prescription: { label: "Prescription", color: "bg-blue-100 text-blue-700" },
  lab_report: { label: "Lab Report", color: "bg-purple-100 text-purple-700" },
  discharge_summary: { label: "Discharge Summary", color: "bg-slate-100 text-slate-700" },
  imaging: { label: "Imaging", color: "bg-cyan-100 text-cyan-700" },
  insurance: { label: "Insurance", color: "bg-green-100 text-green-700" },
  care_plan: { label: "Care Plan", color: "bg-amber-100 text-amber-700" },
  referral: { label: "Referral", color: "bg-red-100 text-red-700" },
  educational: { label: "Educational", color: "bg-indigo-100 text-indigo-700" },
  diet_plan: { label: "Diet Plan", color: "bg-lime-100 text-lime-700" },
  exercise_plan: { label: "Exercise Plan", color: "bg-orange-100 text-orange-700" },
  other: { label: "Other", color: "bg-gray-100 text-gray-700" }
};

const ROLE_ICONS = {
  patient: User,
  doctor: Stethoscope,
  coach: Heart,
  caregiver: User
};

export default function DocumentCard({ document, currentUserEmail, onDelete, onTogglePin }) {
  const isOwner = document.owner_email === currentUserEmail;
  const isUploader = document.uploaded_by_email === currentUserEmail;
  const canModify = isOwner || isUploader;

  const FileIcon = document.file_type === 'pdf' ? FileText : document.file_type === 'image' ? Image : File;
  const categoryInfo = CATEGORY_LABELS[document.category] || CATEGORY_LABELS.other;
  const RoleIcon = ROLE_ICONS[document.uploaded_by_role] || User;

  const handleDownload = () => {
    window.open(document.file_url, '_blank');
  };

  return (
    <Card className={cn("hover:shadow-md transition-shadow", document.is_pinned && "border-[#5b9a8b] bg-[#5b9a8b]/5")}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Thumbnail / Icon */}
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            {document.file_type === 'image' ? (
              <img src={document.file_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <FileIcon className="w-6 h-6 text-slate-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-slate-800 truncate">{document.title}</h3>
                  {document.is_pinned && <Pin className="w-3 h-3 text-[#5b9a8b]" />}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className={cn("text-xs", categoryInfo.color)}>{categoryInfo.label}</Badge>
                  {document.document_date && (
                    <span className="text-xs text-slate-400">
                      {format(new Date(document.document_date), "MMM d, yyyy")}
                    </span>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownload}>
                    <ExternalLink className="w-4 h-4 mr-2" /> View / Download
                  </DropdownMenuItem>
                  {canModify && (
                    <>
                      <DropdownMenuItem onClick={() => onTogglePin(document)}>
                        {document.is_pinned ? <PinOff className="w-4 h-4 mr-2" /> : <Pin className="w-4 h-4 mr-2" />}
                        {document.is_pinned ? "Unpin" : "Pin to Top"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(document)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {document.description && (
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">{document.description}</p>
            )}

            {/* Tags */}
            {document.tags?.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {document.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                    #{tag}
                  </span>
                ))}
                {document.tags.length > 3 && (
                  <span className="text-xs text-slate-400">+{document.tags.length - 3}</span>
                )}
              </div>
            )}

            {/* Uploader info */}
            {document.uploaded_by_email !== document.owner_email && (
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                <RoleIcon className="w-3 h-3" />
                <span>Uploaded by {document.uploaded_by_name || document.uploaded_by_role}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}