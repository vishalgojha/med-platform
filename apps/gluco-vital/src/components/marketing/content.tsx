// Centralized marketing content - Single source of truth
// Update here to reflect changes across all pages

export const BRAND = {
  name: "GlucoVital",
  tagline: "Your AI Health Companion",
  domain: "glucovital.fit",
  supportEmail: "support@glucovital.fit",
  company: "Chaos Craft Labs LLP",
  companyUrl: "https://www.chaoscraftlabs.com",
  country: "India",
  countryFlag: "🇮🇳",
  year: 2025,
  whatsappNumber: "919819471310"
};

export const FEATURES = [
  { key: "whatsapp", label: "WhatsApp logging", description: "Just text your readings" },
  { key: "voice", label: "Voice & text", description: "Call or message — your choice" },
  { key: "insights", label: "AI insights", description: "Pattern detection and trends" },
  { key: "reminders", label: "Medication reminders", description: "Never miss a dose" },
  { key: "reports", label: "Doctor reports", description: "Clean PDF summaries" },
  { key: "languages", label: "21 languages", description: "From Hindi to Chinese" },
  { key: "streaks", label: "Streaks & badges", description: "Stay motivated daily" },
  { key: "security", label: "Encrypted", description: "Your data, protected" }
];

export const LANGUAGES = {
  count: 21,
  popular: ["English", "हिंदी", "தமிழ்", "తెలుగు", "मराठी", "ગુજરાતી", "বাংলা"],
  all: ["English", "Hindi", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Bengali", "Chinese", "Urdu", "Arabic", "Spanish", "Portuguese", "Japanese", "Russian", "Turkish", "German", "Indonesian", "Hinglish"]
};

export const DISCLAIMERS = {
  medical: "GlucoVital is for informational and educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for any health concerns.",
  notMedicalDevice: "GlucoVital is not a medical device. It does not diagnose, treat, cure, or prevent any disease.",
  dataPrivacy: "We follow industry-standard practices to protect your health data.",
  experimental: "GlucoVital.fit is an experimental health project built to explore frictionless diabetes logging and care."
};

export const STATS = {
  indianDiabetics: "77M+",
  targetRangeFasting: "70-140 mg/dL",
  targetRangePostMeal: "70-180 mg/dL",
  lowSugarThreshold: 70,
  highSugarThreshold: 180
};

export const PRICING = {
  basic: { name: "Basic", price: 0, period: "Always free" },
  starter: { name: "Starter", price: 99, period: "/mo", trialDays: 30 },
  premium: { name: "Premium", price: 499, period: "/mo", popular: true },
  family: { name: "Family", price: 799, period: "/mo", members: 5 }
};

export const LINKS = {
  about: "About",
  privacy: "PrivacyPolicy", 
  terms: "Terms",
  refunds: "CancellationRefund",
  contact: "ContactUs"
};

export const ELEVENLABS = {
  grantsUrl: "https://elevenlabs.io/startup-grants",
  logoUrl: "https://eleven-public-cdn.elevenlabs.io/payloadcms/pwsc4vchsqt-ElevenLabsGrants.webp"
};