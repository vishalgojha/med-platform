import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, AlertTriangle, Heart, Bot, Stethoscope, Phone, Mail } from 'lucide-react';

export default function Disclaimer() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white py-16">
                <div className="max-w-4xl mx-auto px-6">
                    <Link to={createPageUrl('Home')} className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                            <AlertTriangle className="w-7 h-7" />
                        </div>
                        <h1 className="text-4xl font-bold">Disclaimer</h1>
                    </div>
                    <p className="text-white/80">Important information about using MediSuite.fit services</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 space-y-8">
                    
                    {/* Emergency Notice */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <Phone className="w-8 h-8 text-red-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-red-800 text-lg mb-2">Medical Emergency?</h3>
                                <p className="text-red-700 leading-relaxed">
                                    If you are experiencing a medical emergency, <strong>call your local emergency services immediately</strong> (e.g., 112, 911, 999). Do not rely on MediSuite.fit or Maya AI for emergency medical situations.
                                </p>
                            </div>
                        </div>
                    </div>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Stethoscope className="w-6 h-6 text-amber-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Medical Disclaimer</h2>
                        </div>
                        <div className="space-y-4 text-gray-600 leading-relaxed">
                            <p>
                                <strong className="text-gray-800">MediSuite.fit and all its products (Glucovital.fit, MediPal.fit, Mediscribe.fit) are NOT medical devices.</strong>
                            </p>
                            <p>
                                The information, content, and services provided through our platforms are intended for <strong>general informational, educational, and wellness purposes only</strong>. They should not be considered as:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Medical advice, diagnosis, or treatment</li>
                                <li>A substitute for professional medical consultation</li>
                                <li>A replacement for the relationship with qualified healthcare providers</li>
                                <li>Medical devices or FDA-approved health tools</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Bot className="w-6 h-6 text-amber-600" />
                            <h2 className="text-2xl font-bold text-gray-900">AI Assistant Disclaimer (Maya)</h2>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Maya, our AI health assistant, is designed to provide:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mb-4">
                                <li>General health and wellness information</li>
                                <li>Guidance on using MediSuite products</li>
                                <li>Supportive conversation about health topics</li>
                                <li>Multilingual accessibility to health resources</li>
                            </ul>
                            <p className="text-amber-800 font-medium">
                                Maya is NOT a doctor, nurse, or licensed healthcare provider. Maya cannot diagnose conditions, prescribe medications, or provide personalized medical advice.
                            </p>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <Heart className="w-6 h-6 text-amber-600" />
                            <h2 className="text-2xl font-bold text-gray-900">Health Information Accuracy</h2>
                        </div>
                        <div className="space-y-4 text-gray-600 leading-relaxed">
                            <p>
                                While we strive to provide accurate and up-to-date health information, we make no representations or warranties about:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>The completeness, accuracy, or reliability of any health content</li>
                                <li>The suitability of information for your specific health situation</li>
                                <li>The outcomes of following any wellness suggestions</li>
                                <li>The accuracy of AI-generated responses</li>
                            </ul>
                            <p className="font-medium text-gray-800">
                                Health information can change rapidly. Always verify important health information with qualified professionals.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">User Responsibility</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            By using MediSuite.fit services, you acknowledge and agree that:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                            <li>You are solely responsible for your health decisions</li>
                            <li>You will consult healthcare professionals before making health changes</li>
                            <li>You understand the limitations of AI-powered health tools</li>
                            <li>You will not delay seeking medical care based on our Services</li>
                            <li>You use our Services at your own risk</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Content</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Our Services may contain links to third-party websites or resources. We do not endorse and are not responsible for the content, accuracy, or practices of third-party sites. Access them at your own risk.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Professional Use (Mediscribe.fit)</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Healthcare professionals using Mediscribe.fit are responsible for reviewing and verifying all AI-generated documentation before use. AI transcription tools may contain errors and should not replace professional medical judgment.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
                        <p className="text-gray-600 leading-relaxed">
                            MediSuite.fit, its affiliates, and partners shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of our Services, reliance on health information, or health decisions made based on our content.
                        </p>
                    </section>

                    <section className="bg-teal-50 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Mail className="w-6 h-6 text-teal-600" />
                            <h2 className="text-xl font-bold text-gray-900">Questions?</h2>
                        </div>
                        <p className="text-gray-600 mb-2">
                            If you have questions about this disclaimer:
                        </p>
                        <p className="text-teal-700 font-medium">
                            Email: support@medisuite.fit
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}