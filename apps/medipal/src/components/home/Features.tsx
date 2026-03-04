import React from 'react';
import { Smile, Zap, ShieldCheck, MessageCircle } from 'lucide-react';

const features = [
  {
    icon: Smile,
    title: "No Medical Jargon",
    description: "We explain everything in plain English. No 'phlebotomy' or 'hematocrit' without a simple translation!",
    color: "bg-orange-100 text-orange-600"
  },
  {
    icon: MessageCircle,
    title: "Chat to Book",
    description: "Just text 'I'm tired' or 'Need a checkup' on WhatsApp, and MediPal handles the rest.",
    color: "bg-green-100 text-green-600"
  },
  {
    icon: ShieldCheck,
    title: "Zero Anxiety Results",
    description: "We don't just dump data on you. We explain what it means and guide you on next steps calmly.",
    color: "bg-blue-100 text-blue-600"
  }
];

export default function Features() {
  return (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center group">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${feature.color} transition-transform group-hover:scale-110 duration-300`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed max-w-xs">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}