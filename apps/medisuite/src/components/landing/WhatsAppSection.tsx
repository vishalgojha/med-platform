import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Globe, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { appClient } from '@/api/appClient';

const languages = [
    { code: 'en', name: 'English', greeting: 'Hello!' },
    { code: 'hi', name: 'हिंदी', greeting: 'नमस्ते!' },
    { code: 'ta', name: 'தமிழ்', greeting: 'வணக்கம்!' },
    { code: 'te', name: 'తెలుగు', greeting: 'నమస్కారం!' },
    { code: 'bn', name: 'বাংলা', greeting: 'নমস্কার!' },
    { code: 'mr', name: 'मराठी', greeting: 'नमस्कार!' },
    { code: 'gu', name: 'ગુજરાતી', greeting: 'નમસ્તે!' },
    { code: 'kn', name: 'ಕನ್ನಡ', greeting: 'ನಮಸ್ಕಾರ!' },
    { code: 'ml', name: 'മലയാളം', greeting: 'നമസ്കാരം!' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ!' },
    { code: 'es', name: 'Español', greeting: '¡Hola!' },
    { code: 'ar', name: 'العربية', greeting: 'مرحبا!' },
];

export default function WhatsAppSection() {
    const whatsappUrl = appClient.agents.getWhatsAppConnectURL('health_assistant');

    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700" />
            
            {/* Decorative shapes */}
            <motion.div 
                className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"
                animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
                transition={{ duration: 15, repeat: Infinity }}
            />
            <motion.div 
                className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"
                animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
                transition={{ duration: 12, repeat: Infinity }}
            />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="text-white"
                    >
                        <motion.div 
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">WhatsApp AI Assistant</span>
                        </motion.div>

                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Meet Maya,
                            <span className="block opacity-90">Your Health Guide</span>
                        </h2>

                        <p className="text-xl text-white/80 leading-relaxed mb-8">
                            A warm, multilingual AI assistant ready to help you 24/7. Ask health questions, get product recommendations, or just have a friendly chat about your wellness journey.
                        </p>

                        <div className="space-y-4 mb-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <span className="text-lg">Speaks 20+ languages fluently</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Heart className="w-5 h-5" />
                                </div>
                                <span className="text-lg">Warm, empathetic & supportive</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <span className="text-lg">Powered by advanced AI</span>
                            </div>
                        </div>

                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                            <Button 
                                size="lg"
                                className="bg-white text-teal-700 hover:bg-white/90 px-8 py-6 text-lg rounded-2xl shadow-xl shadow-black/10 font-semibold"
                            >
                                <MessageCircle className="mr-2 w-5 h-5" />
                                Chat with Maya on WhatsApp
                            </Button>
                        </a>
                    </motion.div>

                    {/* Right - Language showcase */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                            <h3 className="text-white text-xl font-semibold mb-6 text-center">
                                Maya speaks your language
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                {languages.map((lang, i) => (
                                    <motion.div
                                        key={lang.code}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ scale: 1.05 }}
                                        className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center cursor-default hover:bg-white/20 transition-colors"
                                    >
                                        <div className="text-2xl mb-1">{lang.greeting}</div>
                                        <div className="text-sm text-white/70">{lang.name}</div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Decorative chat bubbles */}
                            <motion.div 
                                className="absolute -top-4 -right-4 bg-white rounded-2xl px-4 py-2 shadow-lg"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <span className="text-teal-700 font-medium">Hi! 👋</span>
                            </motion.div>

                            <motion.div 
                                className="absolute -bottom-4 -left-4 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl px-4 py-2 shadow-lg"
                                animate={{ y: [0, 5, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                <span className="text-white font-medium">¿Cómo puedo ayudarte?</span>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}