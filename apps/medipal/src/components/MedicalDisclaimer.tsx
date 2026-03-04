import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function MedicalDisclaimer({ variant = 'inline' }) {
  if (variant === 'banner') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">Medical Disclaimer</p>
          <p>
            MediPal provides health information for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider with questions about your health.
          </p>
        </div>
      </div>
    );
  }

  return (
    <p className="text-xs text-slate-500 leading-relaxed">
      <span className="font-semibold">Disclaimer:</span> MediPal is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for diagnosis and treatment.
    </p>
  );
}