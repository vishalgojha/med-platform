import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';
import TestCard from '../components/TestCard';
import { toast } from 'sonner';
import { useTranslation } from '../components/LanguageProvider';

export default function HomePage() {
  const { t } = useTranslation();
  const { data: featuredTests, isLoading } = useQuery({
    queryKey: ['featuredTests'],
    queryFn: () => appClient.entities.Test.list({ limit: 3, sort: { created_date: -1 } }),
  });

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: () => appClient.entities.Provider.list({ limit: 6 }),
  });

  const handleAddToCart = async (test) => {
    try {
      await appClient.entities.CartItem.create({
        test_name: test.name,
        price: test.price,
        status: 'in_cart'
      });
      toast.success(`Added ${test.name} to your cart! 🎉`);
    } catch (error) {
      console.error("Cart error", error);
      toast.error("Could not add to cart. Please try again.");
    }
  };

  return (
    <div className="min-h-screen">
      <Hero />

      {/* Partners Section */}
      <section className="py-12 bg-white border-b border-slate-100">
         <div className="container mx-auto px-4">
            <p className="text-center text-slate-500 text-sm font-semibold uppercase tracking-wider mb-8">Trusted by Leading Healthcare Providers</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
               {providers?.map(provider => (
                  <div key={provider.id} className="flex flex-col items-center gap-2 group">
                     <img src={provider.logo_url} alt={provider.name} className="h-12 w-12 object-cover rounded-full" />
                     <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600">{provider.name}</span>
                  </div>
               ))}
               {!providers?.length && (
                  <>
                     <div className="h-8 bg-slate-200 w-32 rounded animate-pulse"></div>
                     <div className="h-8 bg-slate-200 w-32 rounded animate-pulse"></div>
                     <div className="h-8 bg-slate-200 w-32 rounded animate-pulse"></div>
                  </>
               )}
            </div>
         </div>
      </section>

      <Features />

      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">{t('home.popular_title')}</h2>
              <p className="text-slate-600 max-w-md">
                {t('home.popular_desc')}
              </p>
            </div>
            <Link to={createPageUrl('Tests')}>
              <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700">
                {t('home.view_all')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredTests?.map((test) => (
                <TestCard 
                  key={test.id} 
                  test={test} 
                  onAddToCart={handleAddToCart} 
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-indigo-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">{t('home.cta_title')}</h2>
          <p className="text-indigo-200 text-lg mb-10 max-w-2xl mx-auto">
            {t('home.cta_desc')}
          </p>
          <a 
             href={appClient.agents.getWhatsAppConnectURL('medi_pal')}
             target="_blank"
          >
            <Button size="lg" className="bg-white text-indigo-900 hover:bg-indigo-50 text-lg h-14 px-10 rounded-full font-bold">
              {t('home.get_started')}
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}