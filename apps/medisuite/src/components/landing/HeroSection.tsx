import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
    return (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-emerald-50" />
            
            {/* Floating orbs */}
            <motion.div 
                className="absolute top-20 right-[20%] w-64 h-64 rounded-full bg-gradient-to-br from-teal-200/40 to-emerald-200/40 blur-3xl"
                animate={{ 
                    y: [0, -20, 0],
                    scale: [1, 1.05, 1]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
                className="absolute bottom-20 left-[10%] w-80 h-80 rounded-full bg-gradient-to-br from-orange-100/40 to-amber-100/40 blur-3xl"
                animate={{ 
                    y: [0, 20, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Badge */}
                        <motion.div 
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-teal-100 shadow-sm mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Sparkles className="w-4 h-4 text-teal-600" />
                            <span className="text-sm font-medium text-teal-700">Your Health, Reimagined</span>
                        </motion.div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6">
                            <span className="block">Healthcare</span>
                            <span className="block bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                Made Simple
                            </span>
                        </h1>

                        <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-lg">
                            Four powerful platforms united under one mission — empowering you to take control of your health journey with intelligent, compassionate technology.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Button 
                                size="lg" 
                                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-8 py-6 text-lg rounded-2xl shadow-lg shadow-teal-200/50 transition-all hover:shadow-xl hover:shadow-teal-200/60"
                            >
                                Explore Products
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <Button 
                                size="lg" 
                                variant="outline"
                                className="px-8 py-6 text-lg rounded-2xl border-2 border-gray-200 hover:border-teal-200 hover:bg-teal-50/50"
                            >
                                Talk to Maya
                            </Button>
                        </div>

                        {/* Trust indicators */}
                        <div className="flex items-center gap-8 mt-12 pt-8 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-teal-600" />
                                <span className="text-sm text-gray-600">Secure & Private</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Heart className="w-5 h-5 text-rose-500" />
                                <span className="text-sm text-gray-600">Trusted by 50K+ Users</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right visual */}
                    <motion.div
                        className="relative hidden lg:block"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <div className="relative">
                            {/* Main card */}
                            <motion.div 
                                className="relative z-20 bg-white rounded-3xl p-8 shadow-2xl shadow-gray-200/50"
                                whileHover={{ y: -5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                                        <Heart className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">MediSuite.fit</h3>
                                        <p className="text-sm text-gray-500">Your Complete Health Ecosystem</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {['Glucovital.fit', 'MediPal.fit', 'DietPal.fit', 'Mediscribe.fit'].map((product, i) => (
                                        <motion.div 
                                            key={product}
                                            className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-transparent"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + i * 0.1 }}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                i === 0 ? 'bg-blue-100 text-blue-600' :
                                                i === 1 ? 'bg-purple-100 text-purple-600' :
                                                i === 2 ? 'bg-green-100 text-green-600' :
                                                'bg-orange-100 text-orange-600'
                                            }`}>
                                                {i === 0 ? '🩸' : i === 1 ? '💊' : i === 2 ? '🥗' : '📝'}
                                            </div>
                                            <span className="font-medium text-gray-700">{product}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Floating elements */}
                            <motion.div 
                                className="absolute -top-4 -right-4 z-30 bg-white rounded-2xl p-4 shadow-xl"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-sm font-medium text-gray-700">AI Powered</span>
                                </div>
                            </motion.div>

                            <motion.div 
                                className="absolute -bottom-6 -left-6 z-30 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-4 shadow-xl text-white"
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 5, repeat: Infinity }}
                            >
                                <div className="text-2xl font-bold">20+</div>
                                <div className="text-sm opacity-90">Languages</div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}