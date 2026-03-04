import React from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import ProductsSection from '@/components/landing/ProductsSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import WhatsAppSection from '@/components/landing/WhatsAppSection';
import Footer from '@/components/landing/Footer';

export default function Home() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <main>
                <HeroSection />
                <ProductsSection />
                <FeaturesSection />
                <WhatsAppSection />
            </main>
            <Footer />
        </div>
    );
}