import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Heart, ShoppingCart, FileText, Menu, X, UserCircle, Globe, Stethoscope, Dumbbell, BrainCircuit, Activity, Bug, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { appClient } from '@/api/appClient';
import { LanguageProvider, useTranslation } from './components/LanguageProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function LayoutContent({ children }) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();
  const { t, changeLanguage, language } = useTranslation();

  // Simplified navigation
  const navItems = [
    { label: t('nav.home'), pageName: 'Home', icon: Heart },
    { label: t('nav.tests'), pageName: 'Tests', icon: FileText },
    { label: t('nav.symptoms'), pageName: 'SymptomChecker', icon: Stethoscope },
    { label: t('nav.coach'), pageName: 'HealthCoach', icon: Dumbbell },
    { label: t('nav.vitals'), pageName: 'Vitals', icon: Activity },
    { label: t('nav.insights'), pageName: 'Insights', icon: BrainCircuit },
    { label: t('nav.cart'), pageName: 'Cart', icon: ShoppingCart },
    { label: t('nav.reports'), pageName: 'Reports', icon: FileText },
    { label: 'Track Order', pageName: 'TrackOrder', icon: Truck },
    { label: 'Defects', pageName: 'Defects', icon: Bug },
    { label: t('nav.profile'), pageName: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2 group">
              <div className="bg-indigo-600 text-white p-2 rounded-xl group-hover:scale-110 transition-transform">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                MediPal
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.pageName}
                  to={createPageUrl(item.pageName)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    location.pathname === '/' + item.pageName
                      ? 'text-indigo-600'
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-500">
                    <Globe className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => changeLanguage('en')} className={language === 'en' ? 'bg-slate-100' : ''}>
                    🇺🇸 English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('es')} className={language === 'es' ? 'bg-slate-100' : ''}>
                    🇪🇸 Español
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('hi')} className={language === 'hi' ? 'bg-slate-100' : ''}>
                    🇮🇳 हिंदी (Hindi)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('bn')} className={language === 'bn' ? 'bg-slate-100' : ''}>
                        🇧🇩 বাংলা (Bangladesh)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => changeLanguage('bn_wb')} className={language === 'bn_wb' ? 'bg-slate-100' : ''}>
                        🇮🇳 বাংলা (West Bengal)
                      </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('ta')} className={language === 'ta' ? 'bg-slate-100' : ''}>
                    🇮🇳 தமிழ் (Tamil)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('te')} className={language === 'te' ? 'bg-slate-100' : ''}>
                    🇮🇳 తెలుగు (Telugu)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('mr')} className={language === 'mr' ? 'bg-slate-100' : ''}>
                    🇮🇳 मराठी (Marathi)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <a 
                href={appClient.agents.getWhatsAppConnectURL('medi_pal')} 
                target="_blank" 
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-green-200 hover:shadow-green-300"
              >
                {t('nav.whatsapp')} 💬
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-slate-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white p-4 space-y-4 absolute w-full shadow-xl">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={createPageUrl(item.pageName)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-600"
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
             <div className="grid grid-cols-3 gap-2 p-3">
               <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => changeLanguage('en')}>🇺🇸 EN</Button>
               <Button variant={language === 'es' ? 'secondary' : 'ghost'} size="sm" onClick={() => changeLanguage('es')}>🇪🇸 ES</Button>
               <Button variant={language === 'hi' ? 'secondary' : 'ghost'} size="sm" onClick={() => changeLanguage('hi')}>🇮🇳 HI</Button>
               <Button variant={language === 'bn' ? 'secondary' : 'ghost'} size="sm" onClick={() => changeLanguage('bn')}>🇧🇩 BN</Button>
               <Button variant={language === 'bn_wb' ? 'secondary' : 'ghost'} size="sm" onClick={() => changeLanguage('bn_wb')}>🇮🇳 WB</Button>
               <Button variant={language === 'ta' ? 'secondary' : 'ghost'} size="sm" onClick={() => changeLanguage('ta')}>🇮🇳 TA</Button>
               <Button variant={language === 'te' ? 'secondary' : 'ghost'} size="sm" onClick={() => changeLanguage('te')}>🇮🇳 TE</Button>
               <Button variant={language === 'mr' ? 'secondary' : 'ghost'} size="sm" onClick={() => changeLanguage('mr')}>🇮🇳 MR</Button>
             </div>
             <a 
                href={appClient.agents.getWhatsAppConnectURL('medi_pal')} 
                target="_blank" 
                className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-700 font-medium"
              >
                {t('nav.whatsapp')} 💬
              </a>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
                  <footer className="bg-slate-900 text-slate-400 py-12 mt-20">
                    <div className="container mx-auto px-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Heart className="w-6 h-6 text-indigo-500 fill-current" />
                        <span className="text-xl font-bold text-white">MediPal</span>
                      </div>
                      <p className="text-sm max-w-md mx-auto mb-6">
                        {t('footer.text')}
                      </p>
                      <div className="max-w-xl mx-auto mb-6 px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-400 leading-relaxed">
                          <span className="text-amber-400 font-semibold">Medical Disclaimer:</span> MediPal provides health information for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
                        </p>
                      </div>
                      <div className="flex justify-center gap-4 text-xs text-slate-500 mb-4">
                        <a href="#" className="hover:text-slate-300">Privacy Policy</a>
                        <span>•</span>
                        <a href="#" className="hover:text-slate-300">Terms of Service</a>
                      </div>
                      <div className="text-xs text-slate-600">
                        {t('footer.copyright')}
                      </div>
                    </div>
                  </footer>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <LanguageProvider>
      <LayoutContent>{children}</LayoutContent>
    </LanguageProvider>
  );
}