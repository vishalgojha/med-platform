import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Globe, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
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
                            <Shield className="w-7 h-7" />
                        </div>
                        <h1 className="text-4xl font-bold">Privacy Policy</h1>
                    </div>
                    <p className="text-white/80">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 space-y-8">
                    
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
                        <p className="text-gray-600 leading-relaxed">
                            MediSuite.fit ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our websites (Glucovital.fit, MediPal.fit, Mediscribe.fit) and services, including our AI assistant Maya.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="w-6 h-6 text-teal-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
                        </div>
                        <div className="space-y-4 text-gray-600">
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2">Personal Information</h3>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>Name and contact information (email, phone number)</li>
                                    <li>Account credentials</li>
                                    <li>Health-related data you voluntarily provide</li>
                                    <li>Communication preferences</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-2">Usage Information</h3>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>Device information and identifiers</li>
                                    <li>Log data and analytics</li>
                                    <li>Interactions with our AI assistant</li>
                                    <li>Feature usage patterns</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Eye className="w-6 h-6 text-teal-600" />
                            <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                            <li>To provide and maintain our services</li>
                            <li>To personalize your experience and health insights</li>
                            <li>To communicate with you about updates and features</li>
                            <li>To improve our products and develop new features</li>
                            <li>To ensure security and prevent fraud</li>
                            <li>To comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="w-6 h-6 text-teal-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            We implement appropriate technical and organizational security measures to protect your personal information. This includes encryption in transit and at rest, access controls, and regular security assessments. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Globe className="w-6 h-6 text-teal-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Data Sharing & Third Parties</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We do not sell your personal information. We may share data with:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                            <li>Service providers who assist in operating our services</li>
                            <li>Analytics partners to improve our products</li>
                            <li>Legal authorities when required by law</li>
                            <li>Business partners with your explicit consent</li>
                        </ul>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <UserCheck className="w-6 h-6 text-teal-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Your Rights</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Depending on your location, you may have the following rights:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                            <li>Access and receive a copy of your data</li>
                            <li>Correct inaccurate information</li>
                            <li>Delete your personal data</li>
                            <li>Object to or restrict processing</li>
                            <li>Data portability</li>
                            <li>Withdraw consent at any time</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a minor, please contact us immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. Continued use of our services after changes constitutes acceptance of the updated policy.
                        </p>
                    </section>

                    <section className="bg-teal-50 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Mail className="w-6 h-6 text-teal-600" />
                            <h2 className="text-xl font-bold text-gray-900">Contact Us</h2>
                        </div>
                        <p className="text-gray-600 mb-2">
                            For privacy-related inquiries or to exercise your rights:
                        </p>
                        <p className="text-teal-700 font-medium">
                            Email: privacy@medisuite.fit
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}