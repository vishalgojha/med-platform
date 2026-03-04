import React from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';

const products = [
    {
        id: 'glucovital',
        name: 'Glucovital.fit',
        tagline: 'Smart Glucose Management',
        icon: '🩸',
        description: 'Take control of your diabetes journey with AI-powered glucose monitoring, personalized insights, and predictive analytics that help you stay ahead.',
        features: [
            'Real-time glucose tracking & trends',
            'AI-powered pattern recognition',
            'Personalized meal recommendations',
            'Integration with CGM devices'
        ],
        url: 'https://glucovital.fit'
    },
    {
        id: 'medipal',
        name: 'MediPal.fit',
        tagline: 'Your Personal Health Companion',
        icon: '💊',
        description: 'Never miss a medication again. Your intelligent health companion that keeps track of your wellness journey and connects you with care.',
        features: [
            'Smart medication reminders',
            'Symptom tracking & analysis',
            'Health records management',
            'Telehealth integration'
        ],
        url: 'https://medipal.fit'
    },
    {
        id: 'dietpal',
        name: 'DietPal.fit',
        tagline: 'Your AI Nutrition Clinic',
        icon: '🥗',
        description: 'WhatsApp-first health tracking meets professional dietician dashboard. Track nutrition effortlessly via WhatsApp while dieticians manage clients through a powerful web dashboard.',
        features: [
            'WhatsApp-native client tracking',
            'Professional dietician dashboard',
            'Personalized meal planning',
            'Progress monitoring & analytics'
        ],
        url: 'https://dietpal.fit'
    },
    {
        id: 'mediscribe',
        name: 'Mediscribe.fit',
        tagline: 'AI Medical Documentation',
        icon: '📝',
        description: 'Let AI handle the paperwork. Advanced medical transcription that gives healthcare professionals more time to focus on what matters — patients.',
        features: [
            'Real-time voice transcription',
            'Automated clinical notes',
            'EHR integration ready',
            'Multi-language support'
        ],
        url: 'https://mediscribe.fit'
    }
];

export default function ProductsSection() {
    return (
        <section id="products" className="py-24 bg-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.015]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section header */}
                <motion.div 
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <motion.span 
                        className="inline-block px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mb-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        Our Products
                    </motion.span>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Four Pillars of
                        <span className="block bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                            Modern Healthcare
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Each platform designed with care, powered by AI, and built to transform how you experience health.
                    </p>
                </motion.div>

                {/* Products grid */}
                <div className="grid md:grid-cols-2 gap-8">
                    {products.map((product, index) => (
                        <ProductCard key={product.id} product={product} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}