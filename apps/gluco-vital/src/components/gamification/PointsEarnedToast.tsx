import { motion, AnimatePresence } from "framer-motion";
import { Zap, Award } from "lucide-react";

export default function PointsEarnedToast({ points, badge, isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
            {badge ? (
              <>
                <Award className="w-5 h-5" />
                <span className="font-semibold">🎉 New Badge: {badge}</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span className="font-semibold">+{points} points!</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}