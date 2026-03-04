import { MessageCircle, CheckCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appClient } from "@/api/appClient";

// Single WhatsApp Number for all interactions (voice + text logging)
const WHATSAPP_NUMBER = "919819471310";

export default function WhatsAppConnect({ isConnected = false }) {
  if (isConnected) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800">WhatsApp Connected!</h3>
            <p className="text-sm text-emerald-600 mt-0.5">
              Send health updates anytime. I'm always here to help.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Connect WhatsApp</h3>
            <p className="text-green-100 text-sm">Log health data via simple messages</p>
          </div>
        </div>

        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm">
            <Smartphone className="w-4 h-4 text-green-200" />
            <span className="text-green-50">Send "Sugar 120" to log readings</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Smartphone className="w-4 h-4 text-green-200" />
            <span className="text-green-50">Get instant AI insights</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Smartphone className="w-4 h-4 text-green-200" />
            <span className="text-green-50">No app needed - just WhatsApp!</span>
          </div>
        </div>

        <div className="space-y-2">
          <a 
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20Asha!%20I%20want%20to%20start%20tracking%20my%20health.`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="w-full bg-white text-emerald-600 hover:bg-green-50 font-semibold h-12 rounded-xl">
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat with Asha
            </Button>
          </a>
          
          <a 
            href={appClient.agents.getWhatsAppConnectURL('health_buddy')} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 font-medium h-10 rounded-xl mt-2">
              <MessageCircle className="w-4 h-4 mr-2" />
              Try Gluco Vital Agent (Beta)
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}