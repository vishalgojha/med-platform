import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Mail, Twitter, Linkedin, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white">
            {/* Medical Disclaimer Banner */}
            <div className="bg-amber-900/30 border-b border-amber-800/50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-200/90 leading-relaxed">
                            <strong className="text-amber-300">Medical Disclaimer:</strong> MediSuite products are for informational and wellness purposes only. They are not intended to diagnose, treat, cure, or prevent any disease. Always consult a qualified healthcare professional before making health decisions. Our AI assistant Maya provides general guidance and is not a substitute for professional medical advice.
                        </p>
                    </div>
                </div>
            </div>

            <div className="py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-5 gap-12 mb-12">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold">MediSuite.fit</span>
                            </div>
                            <p className="text-gray-400 leading-relaxed max-w-md mb-4">
                                Transforming healthcare through intelligent technology. 
                                Our suite of products empowers you to take control of your health journey.
                            </p>
                            {/* Social */}
                            <div className="flex gap-3">
                                <motion.a 
                                    href="#" 
                                    whileHover={{ scale: 1.1 }}
                                    className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center hover:bg-teal-600 transition-colors"
                                >
                                    <Twitter className="w-4 h-4" />
                                </motion.a>
                                <motion.a 
                                    href="#" 
                                    whileHover={{ scale: 1.1 }}
                                    className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center hover:bg-teal-600 transition-colors"
                                >
                                    <Linkedin className="w-4 h-4" />
                                </motion.a>
                                <motion.a 
                                    href="#" 
                                    whileHover={{ scale: 1.1 }}
                                    className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center hover:bg-teal-600 transition-colors"
                                >
                                    <Mail className="w-4 h-4" />
                                </motion.a>
                            </div>
                        </div>

                        {/* Products */}
                        <div>
                            <h4 className="font-semibold mb-4 text-white">Products</h4>
                            <ul className="space-y-3">
                                <li>
                                    <a href="https://glucovital.fit" target="_blank" rel="noopener noreferrer" 
                                       className="text-gray-400 hover:text-teal-400 transition-colors">
                                        Glucovital.fit
                                    </a>
                                </li>
                                <li>
                                    <a href="https://medipal.fit" target="_blank" rel="noopener noreferrer"
                                       className="text-gray-400 hover:text-teal-400 transition-colors">
                                        MediPal.fit
                                    </a>
                                </li>
                                <li>
                                    <a href="https://dietpal.fit" target="_blank" rel="noopener noreferrer"
                                       className="text-gray-400 hover:text-teal-400 transition-colors">
                                        DietPal.fit
                                    </a>
                                </li>
                                <li>
                                    <a href="https://mediscribe.fit" target="_blank" rel="noopener noreferrer"
                                       className="text-gray-400 hover:text-teal-400 transition-colors">
                                        Mediscribe.fit
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="font-semibold mb-4 text-white">Legal</h4>
                            <ul className="space-y-3">
                                <li>
                                    <Link to={createPageUrl('PrivacyPolicy')} className="text-gray-400 hover:text-teal-400 transition-colors">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link to={createPageUrl('TermsOfService')} className="text-gray-400 hover:text-teal-400 transition-colors">
                                        Terms of Service
                                    </Link>
                                </li>
                                <li>
                                    <Link to={createPageUrl('Disclaimer')} className="text-gray-400 hover:text-teal-400 transition-colors">
                                        Disclaimer
                                    </Link>
                                </li>
                                <li>
                                    <Link to={createPageUrl('DataProtection')} className="text-gray-400 hover:text-teal-400 transition-colors">
                                        Data Protection
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h4 className="font-semibold mb-4 text-white">Support</h4>
                            <ul className="space-y-3">
                                <li>
                                    <a href="mailto:support@medisuite.fit" className="text-gray-400 hover:text-teal-400 transition-colors">
                                        Contact Us
                                    </a>
                                </li>
                                <li>
                                    <a href="mailto:privacy@medisuite.fit" className="text-gray-400 hover:text-teal-400 transition-colors">
                                        Privacy Inquiries
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="pt-8 border-t border-gray-800">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                            <p className="text-gray-500 text-sm">
                                © {currentYear} MediSuite.fit. All rights reserved.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                                <Link to={createPageUrl('PrivacyPolicy')} className="hover:text-teal-400 transition-colors">Privacy</Link>
                                <Link to={createPageUrl('TermsOfService')} className="hover:text-teal-400 transition-colors">Terms</Link>
                                <Link to={createPageUrl('Disclaimer')} className="hover:text-teal-400 transition-colors">Disclaimer</Link>
                                <Link to={createPageUrl('DataProtection')} className="hover:text-teal-400 transition-colors">Data Protection</Link>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 text-center leading-relaxed max-w-4xl mx-auto">
                            MediSuite.fit and its products are wellness and health management tools. Information provided is for educational purposes only and should not replace professional medical consultation. By using our services, you acknowledge that you have read and agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}