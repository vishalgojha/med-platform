import React from "react";
import { Sparkles } from "lucide-react";
import VoicePlayer from "./VoicePlayer";
import { cn } from "@/lib/utils";

export default function VoiceInsightCard({ 
  title, 
  description, 
  type = "info", // info | warning | success | improvement
  action,
  className 
}) {
  const typeStyles = {
    info: "bg-blue-50 border-blue-200",
    warning: "bg-amber-50 border-amber-200",
    success: "bg-green-50 border-green-200",
    improvement: "bg-violet-50 border-violet-200"
  };

  const iconColors = {
    info: "text-blue-500",
    warning: "text-amber-500",
    success: "text-green-500",
    improvement: "text-violet-500"
  };

  // Combine text for voice
  const voiceText = `${title}. ${description}${action ? `. Suggestion: ${action}` : ''}`;

  return (
    <div className={cn(
      "rounded-xl p-4 border",
      typeStyles[type],
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Sparkles className={cn("w-5 h-5 mt-0.5 shrink-0", iconColors[type])} />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-800 text-sm">{title}</h3>
            <p className="text-slate-600 text-xs mt-1">{description}</p>
            {action && (
              <p className="text-xs mt-2 font-medium text-slate-700">
                💡 {action}
              </p>
            )}
          </div>
        </div>
        <VoicePlayer text={voiceText} variant="mini" />
      </div>
    </div>
  );
}