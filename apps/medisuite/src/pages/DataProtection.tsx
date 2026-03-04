import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Shield, Lock, Server, Eye, UserCheck, Globe, Trash2, Mail } from 'lucide-react';

export default function DataProtection() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white py-16">
                <div className="max-w-4xl mx-auto px-6">
                    <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                            <Lock className="w-7 h-7" />
                        </div>
                        <h1 className="text-4xl font-bold">Data Protection</h1>
                    </div>
                    <p className="text-white/80">How we protect and handle your health data</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 space-y-8">
                    
                    {/* Commitment */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-blue-800 text-lg mb-2">Our Commitment</h3>
                                <p className="text-blue-700 leading-relaxed">
                                    At MediSuite.fit, protecting your health data is our top priority. We understand the sensitive nature of health information and have implemented comprehensive security measures to safeguard your data.
                                </p>
                            </div>
                        </div>
                    </div>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="w-6 h-6 text-blue-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Security Measures</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-5">
                                <h3 className="font-semibold text-gray-800 mb-2">Encryption</h3>
                                <p className="text-gray-600 text-sm">
                                    All data is encrypted in transit (TLS 1.3) and at rest using industry-standard encryption algorithms.
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-5">
                                <h3 className="font-semibold text-gray-800 mb-2">Access Controls</h3>
                                <p className="text-gray-600 text-sm">
                                    Strict role-based access controls ensure only authorized personnel can access data.
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-5">
                                <h3 className="font-semibold text-gray-800 mb-2">Regular Audits</h3>
                                <p className="text-gray-600 text-sm">
                                    We conduct regular security assessments and vulnerability testing.
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-5">
                                <h3 className="font-semibold text-gray-800 mb-2">Secure Infrastructure</h3>
                                <p className="text-gray-600 text-sm">
                                    Our systems are hosted on secure, compliant cloud infrastructure with redundancy.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Server className="w-6 h-6 text-blue-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Data Storage & Retention</h2>
                        </div>
                        <ul className="list-disc list-inside space-y-3 text-gray-600 ml-4">
                            <li>Data is stored on secure, encrypted servers</li>
                            <li>We retain your data only as long as necessary for service provision</li>
                            <li>Account data is retained while your account is active</li>
                            <li>Health tracking data is retained per your preferences</li>
                            <li>Conversation logs with Maya are retained for service improvement (anonymized)</li>
                            <li>You can request data deletion at any time</li>
                        </ul>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Eye className="w-6 h-6 text-blue-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Data We Do NOT Collect</h2>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                            <ul className="list-disc list-inside space-y-2 text-green-800">
                                <li>We do NOT sell your personal or health data</li>
                                <li>We do NOT share identifiable data with advertisers</li>
                                <li>We do NOT use your health data for insurance purposes</li>
                                <li>We do NOT track you across other websites</li>
                                <li>We do NOT retain unnecessary sensitive information</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Globe className="w-6 h-6 text-blue-600" />
                            <h2 className="text-2xl font-bold text-gray-900">International Data Transfers</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            If your data is transferred outside your country of residence, we ensure appropriate safeguards are in place, including standard contractual clauses and adequacy decisions where applicable.
                        </p>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <UserCheck className="w-6 h-6 text-blue-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Your Data Rights</h2>
                        </div>
                        <p className="text-gray-600 mb-4">You have the right to:</p>
                        <div className="grid md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">1</div>
                                <span className="text-gray-700">Access your personal data</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">2</div>
                                <span className="text-gray-700">Correct inaccurate data</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">3</div>
                                <span className="text-gray-700">Request data deletion</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">4</div>
                                <span className="text-gray-700">Export your data</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">5</div>
                                <span className="text-gray-700">Restrict processing</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">6</div>
                                <span className="text-gray-700">Withdraw consent</span>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Trash2 className="w-6 h-6 text-blue-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Data Deletion</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            You can request deletion of your data at any time by contacting us. Upon request, we will:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                            <li>Delete your account and associated personal data</li>
                            <li>Remove your health tracking data</li>
                            <li>Anonymize conversation logs (cannot be linked back to you)</li>
                            <li>Confirm deletion within 30 days</li>
                        </ul>
                        <p className="text-gray-500 text-sm mt-4">
                            Note: Some data may be retained for legal compliance or legitimate business purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Regulatory Compliance</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We are committed to complying with applicable data protection regulations including:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                            <li>General Data Protection Regulation (GDPR) for EU users</li>
                            <li>California Consumer Privacy Act (CCPA) for California residents</li>
                            <li>Information Technology Act, 2000 for Indian users</li>
                            <li>Other applicable local data protection laws</li>
                        </ul>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                            <p className="text-amber-800 text-sm">
                                <strong>Note:</strong> While we implement strong security practices, we are not currently HIPAA certified. We are working towards compliance for applicable use cases.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Breach Notification</h2>
                        <p className="text-gray-600 leading-relaxed">
                            In the unlikely event of a data breach affecting your personal information, we will notify affected users and relevant authorities as required by applicable law, typically within 72 hours of becoming aware of the breach.
                        </p>
                    </section>

                    <section className="bg-blue-50 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Mail className="w-6 h-6 text-blue-600" />
                            <h2 className="text-xl font-bold text-gray-900">Data Protection Inquiries</h2>
                        </div>
                        <p className="text-gray-600 mb-2">
                            For data protection requests or concerns:
                        </p>
                        <p className="text-blue-700 font-medium">
                            Email: privacy@medisuite.fit
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                            We aim to respond to all requests within 30 days.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}