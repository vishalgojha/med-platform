import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProductCard({ product, index }) {
    const [isHovered, setIsHovered] = useState(false);

    const gradients = {
        glucovital: 'from-blue-500 via-cyan-500 to-teal-500',
        medipal: 'from-purple-500 via-violet-500 to-indigo-500',
        dietpal: 'from-green-500 via-emerald-500 to-teal-500',
        mediscribe: 'from-orange-500 via-amber-500 to-yellow-500'
    };

    const bgGradients = {
        glucovital: 'from-blue-50 to-cyan-50',
        medipal: 'from-purple-50 to-violet-50',
        dietpal: 'from-green-50 to-emerald-50',
        mediscribe: 'from-orange-50 to-amber-50'
    };

    const iconBg = {
        glucovital: 'bg-blue-100',
        medipal: 'bg-purple-100',
        dietpal: 'bg-green-100',
        mediscribe: 'bg-orange-100'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative"
        >
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${bgGradients[product.id]} p-1`}>
                <div className="relative bg-white rounded-[22px] p-8 h-full">
                    {/* Gradient border on hover */}
                    <motion.div 
                        className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${gradients[product.id]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                        style={{ padding: '2px', margin: '-4px' }}
                    />

                    {/* Icon */}
                    <motion.div 
                        className={`w-16 h-16 rounded-2xl ${iconBg[product.id]} flex items-center justify-center text-3xl mb-6`}
                        animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        {product.icon}
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {product.name}
                    </h3>
                    <p className={`text-sm font-medium bg-gradient-to-r ${gradients[product.id]} bg-clip-text text-transparent mb-4`}>
                        {product.tagline}
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        {product.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                        {product.features.map((feature, i) => (
                            <motion.li 
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="flex items-center gap-3 text-sm text-gray-600"
                            >
                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${gradients[product.id]}`} />
                                {feature}
                            </motion.li>
                        ))}
                    </ul>

                    {/* CTA */}
                    <a 
                        href={product.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                    >
                        <Button 
                            className={`w-full py-6 rounded-xl bg-gradient-to-r ${gradients[product.id]} hover:opacity-90 text-white font-medium transition-all group/btn`}
                        >
                            Visit {product.name.split('.')[0]}
                            <ArrowUpRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </Button>
                    </a>

                    {/* Decorative corner */}
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradients[product.id]} opacity-5 rounded-bl-full`} />
                </div>
            </div>
        </motion.div>
    );
}