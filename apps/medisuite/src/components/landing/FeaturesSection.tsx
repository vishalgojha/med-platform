import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Globe, Clock, Lock, HeartPulse } from 'lucide-react';

const features = [
    {
        icon: Shield,
        title: 'Secure by Design',
        description: 'Your health data is protected with industry-standard security practices and encryption.'
    },
    {
        icon: Zap,
        title: 'AI-Powered',
        description: 'Advanced machine learning algorithms that learn and adapt to provide personalized insights.'
    },
    {
        icon: Globe,
        title: 'Multilingual',
        description: 'Break language barriers with support for 10+ languages across all platforms.'
    },
    {
        icon: Clock,
        title: '24/7 Available',
        description: 'Access your health tools and AI assistant anytime, anywhere you need them.'
    },
    {
        icon: Lock,
        title: 'Privacy First',
        description: 'We never sell your data. Your health information stays yours, always.'
    },
    {
        icon: HeartPulse,
        title: 'Clinically Informed',
        description: 'Built in collaboration with healthcare professionals for accuracy and reliability.'
    }
];

export default function FeaturesSection() {
    return (
        <section className="py-24 bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div 
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
                        Why MediSuite
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Built for Trust,
                        <span className="block text-gray-400">Designed for You</span>
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                        >
                            <div className="bg-white rounded-2xl p-8 h-full border border-gray-100 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-100/50 transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-7 h-7 text-teal-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}