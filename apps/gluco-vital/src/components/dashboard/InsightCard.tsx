import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InsightCard({ type = "info", title, description, action }) {
  const typeConfig = {
    success: {
      icon: CheckCircle,
      bg: "bg-gradient-to-br from-emerald-50 to-green-50",
      border: "border-emerald-100",
      iconBg: "bg-emerald-100 text-emerald-600"
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-gradient-to-br from-amber-50 to-orange-50",
      border: "border-amber-100",
      iconBg: "bg-amber-100 text-amber-600"
    },
    improvement: {
      icon: TrendingUp,
      bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
      border: "border-blue-100",
      iconBg: "bg-blue-100 text-blue-600"
    },
    decline: {
      icon: TrendingDown,
      bg: "bg-gradient-to-br from-red-50 to-rose-50",
      border: "border-red-100",
      iconBg: "bg-red-100 text-red-600"
    },
    info: {
      icon: Sparkles,
      bg: "bg-gradient-to-br from-violet-50 to-purple-50",
      border: "border-violet-100",
      iconBg: "bg-violet-100 text-violet-600"
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className={cn("rounded-xl p-4 border", config.bg, config.border)}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", config.iconBg)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800 text-sm">{title}</h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
          {action && (
            <p className="text-xs font-medium text-slate-700 mt-2 bg-white/60 inline-block px-2 py-1 rounded">
              💡 {action}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}