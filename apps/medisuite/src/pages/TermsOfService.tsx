import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, FileText, AlertCircle, Scale, Ban, RefreshCw, Mail } from 'lucide-react';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-teal-600 to-emerald-600 text-white py-16">
                <div className="max-w-4xl mx-auto px-6">
                    <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                            <FileText className="w-7 h-7" />
                        </div>
                        <h1 className="text-4xl font-bold">Terms of Service</h1>
                    </div>
                    <p className="text-white/80">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 space-y-8">
                    
                    {/* Important Notice */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-amber-800 mb-2">Important Notice</h3>
                                <p className="text-amber-700 text-sm leading-relaxed">
                                    By accessing or using MediSuite.fit services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                                </p>
                            </div>
                        </div>
                    </div>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-600 leading-relaxed">
                            These Terms of Service ("Terms") govern your access to and use of MediSuite.fit, including Glucovital.fit, MediPal.fit, Mediscribe.fit, and our AI assistant Maya (collectively, the "Services"). By using our Services, you agree to these Terms and our Privacy Policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Services</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            MediSuite.fit provides health and wellness management tools, including:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                            <li><strong>Glucovital.fit:</strong> Glucose tracking and diabetes management tools</li>
                            <li><strong>MediPal.fit:</strong> Personal health companion and medication management</li>
                            <li><strong>Mediscribe.fit:</strong> AI-powered medical documentation tools</li>
                            <li><strong>Maya:</strong> Multilingual AI health assistant</li>
                        </ul>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                            <h2 className="text-2xl font-bold text-gray-900">3. Medical Disclaimer</h2>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
                            <p className="leading-relaxed mb-4">
                                <strong>OUR SERVICES ARE NOT MEDICAL DEVICES AND DO NOT PROVIDE MEDICAL ADVICE.</strong>
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                                <li>Our Services are for informational and wellness purposes only</li>
                                <li>They are not intended to diagnose, treat, cure, or prevent any disease</li>
                                <li>Information from Maya AI is general guidance, not professional medical advice</li>
                                <li>Always consult qualified healthcare professionals for medical decisions</li>
                                <li>Never disregard professional medical advice because of our Services</li>
                                <li>In case of emergency, contact emergency services immediately</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Accounts</h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                            <li>You must be at least 18 years old to use our Services</li>
                            <li>You are responsible for maintaining account security</li>
                            <li>You must provide accurate and complete information</li>
                            <li>You are responsible for all activities under your account</li>
                            <li>Notify us immediately of any unauthorized access</li>
                        </ul>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Ban className="w-6 h-6 text-teal-600" />
                            <h2 className="text-2xl font-bold text-gray-900">5. Prohibited Uses</h2>
                        </div>
                        <p className="text-gray-600 mb-4">You agree not to:</p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                            <li>Use Services for any unlawful purpose</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Interfere with or disrupt the Services</li>
                            <li>Transmit viruses or malicious code</li>
                            <li>Impersonate others or provide false information</li>
                            <li>Use Services to provide medical advice to others</li>
                            <li>Resell or commercially exploit the Services without permission</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
                        <p className="text-gray-600 leading-relaxed">
                            All content, features, and functionality of our Services are owned by MediSuite.fit and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our written permission.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Scale className="w-6 h-6 text-teal-600" />
                            <h2 className="text-2xl font-bold text-gray-900">7. Limitation of Liability</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                            <li>Services are provided "AS IS" without warranties of any kind</li>
                            <li>We do not guarantee accuracy or completeness of health information</li>
                            <li>We are not liable for any health decisions made based on our Services</li>
                            <li>We are not liable for indirect, incidental, or consequential damages</li>
                            <li>Our total liability shall not exceed the amount you paid us in the past 12 months</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Indemnification</h2>
                        <p className="text-gray-600 leading-relaxed">
                            You agree to indemnify and hold harmless MediSuite.fit, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Services or violation of these Terms.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <RefreshCw className="w-6 h-6 text-teal-600" />
                            <h2 className="text-2xl font-bold text-gray-900">9. Changes to Terms</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through our Services. Continued use after changes constitutes acceptance of the new Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may terminate or suspend your access to Services immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use Services will cease immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
                        <p className="text-gray-600 leading-relaxed">
                            These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes shall be resolved in the appropriate courts of jurisdiction.
                        </p>
                    </section>

                    <section className="bg-teal-50 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Mail className="w-6 h-6 text-teal-600" />
                            <h2 className="text-xl font-bold text-gray-900">Contact Us</h2>
                        </div>
                        <p className="text-gray-600 mb-2">
                            For questions about these Terms:
                        </p>
                        <p className="text-teal-700 font-medium">
                            Email: legal@medisuite.fit
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}