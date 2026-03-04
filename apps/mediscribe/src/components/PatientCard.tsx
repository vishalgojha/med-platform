import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function PatientCard({ patient }) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow bg-white border-slate-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-900">
              {patient.full_name}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {patient.phone_number || "N/A"}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {patient.date_of_birth ? format(new Date(patient.date_of_birth), "MMM d, yyyy") : "N/A"}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
                <Badge variant="outline" className="text-xs font-normal text-slate-600 bg-slate-50">
                    {patient.gender || 'Unknown'}
                </Badge>
                 <Badge variant="outline" className="text-xs font-normal text-blue-600 bg-blue-50 border-blue-100">
                    {patient.clinic_id}
                </Badge>
            </div>
          </div>
        </div>
        
        <Link to={`${createPageUrl("PatientHistory")}?id=${patient.id}`}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                <ArrowRight className="w-5 h-5" />
            </Button>
        </Link>
      </div>
    </Card>
  );
}