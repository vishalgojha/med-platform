import { format } from "date-fns";
import { FileText, Calendar, Share2, ChevronRight, Users, Mail, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ReportCard({ report, onClick, showSharedBadge = false }) {
  const typeColors = {
    weekly: "bg-blue-50 text-blue-700 border-blue-200",
    monthly: "bg-violet-50 text-violet-700 border-violet-200",
    quarterly: "bg-amber-50 text-amber-700 border-amber-200"
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-4 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-slate-50 rounded-lg">
          <FileText className="w-5 h-5 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge className={cn("capitalize", typeColors[report.report_type] || "bg-slate-50 text-slate-700")}>
              {report.report_type}
            </Badge>
            {(showSharedBadge || report.shared_with_doctor) && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                <Mail className="w-3 h-3 mr-1" />
                Shared
              </Badge>
            )}
            {report.accessible_to_caregivers && (
              <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">
                <Users className="w-3 h-3 mr-1" />
                Family
              </Badge>
            )}
            {report.sugar_stats?.trend && (
              <Badge className={cn("text-xs", 
                report.sugar_stats.trend === 'improving' ? "bg-green-100 text-green-700" :
                report.sugar_stats.trend === 'worsening' ? "bg-red-100 text-red-700" :
                "bg-slate-100 text-slate-600"
              )}>
                {report.sugar_stats.trend === 'improving' && <TrendingUp className="w-3 h-3 mr-1" />}
                {report.sugar_stats.trend === 'worsening' && <TrendingDown className="w-3 h-3 mr-1" />}
                {report.sugar_stats.trend}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(report.start_date), "MMM d")} - {format(new Date(report.end_date), "MMM d, yyyy")}
          </p>
          {report.sugar_stats?.average && (
            <p className="text-xs text-slate-400 mt-1">
              Avg Sugar: {report.sugar_stats.average} mg/dL • {report.sugar_stats.readings_count} readings
            </p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300" />
      </div>
    </div>
  );
}