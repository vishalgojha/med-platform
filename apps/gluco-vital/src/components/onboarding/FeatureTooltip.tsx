import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TOOLTIPS = {
  whatsapp_card: {
    title: "Connect WhatsApp 💬",
    description: "This is where you connect WhatsApp to log health data via messages. Try it!",
    position: "top"
  },
  sugar_chart: {
    title: "Your Sugar Trends 📈",
    description: "This chart shows your blood sugar over time. The more you log, the better insights you'll get!",
    position: "bottom"
  },
  quick_tips: {
    title: "Pro Tips 💡",
    description: "Helpful tips to manage your health better. Check these out!",
    position: "left"
  },
  achievements: {
    title: "Earn Rewards 🏆",
    description: "Log consistently to earn points, badges, and climb the leaderboard!",
    position: "top"
  }
};

export default function FeatureTooltip({ 
  tooltipId, 
  children, 
  showTooltips = false,
  onDismiss 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltip = TOOLTIPS[tooltipId];

  useEffect(() => {
    if (showTooltips && tooltip) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [showTooltips, tooltip]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.(tooltipId);
  };

  if (!tooltip) return children;

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
    left: "right-full top-1/2 -translate-y-1/2 mr-3",
    right: "left-full top-1/2 -translate-y-1/2 ml-3"
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-[#5b9a8b]",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-[#5b9a8b]",
    left: "left-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-[#5b9a8b]",
    right: "right-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-[#5b9a8b]"
  };

  return (
    <div className="relative">
      {children}
      
      <AnimatePresence>
        {isVisible && showTooltips && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute z-50 ${positionClasses[tooltip.position]}`}
          >
            <div className="bg-[#5b9a8b] text-white rounded-xl p-4 shadow-xl max-w-xs">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold">{tooltip.title}</h4>
                <button
                  onClick={handleDismiss}
                  className="p-0.5 hover:bg-white/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-white/90 mb-3">{tooltip.description}</p>
              <Button
                size="sm"
                onClick={handleDismiss}
                className="w-full bg-white text-[#5b9a8b] hover:bg-white/90"
              >
                Got it <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className={`absolute w-0 h-0 ${arrowClasses[tooltip.position]}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}