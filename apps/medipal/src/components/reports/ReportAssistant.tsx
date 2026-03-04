import React, { useState, useRef, useEffect } from 'react';
import { appClient } from '@/api/appClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, Sparkles, Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
  { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export default function ReportAssistant({ report, userProfile }) {
  const [language, setLanguage] = useState('en');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef(null);

  // Set initial greeting based on language
  useEffect(() => {
    const greeting = language === 'en' 
      ? `Hi ${userProfile?.nickname || 'there'}! 👋 I've looked at your **${report.test_name}** report. \n\nIs there anything specific causing you concern, or would you like me to explain a particular result?`
      : null;
    
    if (greeting) {
      setMessages([{ role: 'assistant', content: greeting }]);
    } else {
      // Generate translated greeting
      generateTranslatedGreeting();
    }
  }, []);

  const generateTranslatedGreeting = async () => {
    setIsThinking(true);
    try {
      const langName = LANGUAGES.find(l => l.code === language)?.label || 'English';
      const response = await appClient.integrations.Core.InvokeLLM({
        prompt: `Translate this greeting to ${langName}. Keep it warm and friendly:\n\n"Hi ${userProfile?.nickname || 'there'}! 👋 I've looked at your ${report.test_name} report. Is there anything specific causing you concern, or would you like me to explain a particular result?"\n\nRespond ONLY with the translation, nothing else.`
      });
      setMessages([{ role: 'assistant', content: response }]);
    } catch (e) {
      setMessages([{ role: 'assistant', content: `Hi ${userProfile?.nickname || 'there'}! 👋 I've looked at your **${report.test_name}** report.` }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleLanguageChange = async (newLang) => {
    if (newLang === language) return;
    setLanguage(newLang);
    const langName = LANGUAGES.find(l => l.code === newLang)?.label || 'English';
    
    setIsThinking(true);
    try {
      const response = await appClient.integrations.Core.InvokeLLM({
        prompt: `Translate this greeting to ${langName}. Keep it warm and friendly:\n\n"Hi ${userProfile?.nickname || 'there'}! 👋 I've looked at your ${report.test_name} report. Is there anything specific causing you concern, or would you like me to explain a particular result?"\n\nRespond ONLY with the translation, nothing else.`
      });
      setMessages([{ role: 'assistant', content: response }]);
    } catch (e) {
      // Keep existing messages
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsThinking(true);

    try {
      // Construct a context-rich prompt
      const prompt = `
You are MediPal, a helpful, empathetic medical AI assistant.
User Context:
- Nickname: ${userProfile?.nickname || 'User'}
- Health Goals: ${userProfile?.health_goals || 'None stated'}
- Concerns: ${userProfile?.health_concerns || 'None stated'}

Report Context:
- Test: ${report.test_name}
- Date: ${report.date}
- Summary: ${report.summary}
- Technical Results (JSON): ${report.results_json || 'Not available'}

User Question: "${userMsg}"

Conversation History:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Instructions:
1. RESPOND IN ${LANGUAGES.find(l => l.code === language)?.label || 'English'} LANGUAGE.
2. Answer the user's question simply and clearly.
3. If they ask about abnormal values, explain what they generally mean in simple terms, but DO NOT diagnose. Use phrases like "This typically indicates..." or "Doctors often look at this for...".
4. Reference their health goals/concerns if relevant (e.g., "Since you're training for a marathon, this iron level is important because...").
5. Suggest next steps or lifestyle tips if applicable (e.g., "Staying hydrated helps with this").
6. If relevant, suggest other tests from our catalog (Test entity) they might consider asking their doctor about, but be soft about it.
7. Keep tone warm, comforting, and use an emoji or two. 💙
8. Be concise.
`;

      const response = await appClient.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true // helpful for general medical info
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error("AI Error:", error);
      toast.error("MediPal got a bit confused. Try asking again!");
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having a little trouble connecting right now. Could you ask that again? 🤕" }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full shadow-sm">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-indigo-900">MediPal Assistant</h3>
            <p className="text-xs text-indigo-600">Ask about your results & next steps</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:bg-indigo-100">
              <Globe className="w-4 h-4 mr-1" />
              {LANGUAGES.find(l => l.code === language)?.flag}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem 
                key={lang.code} 
                onClick={() => handleLanguageChange(lang.code)}
                className={language === lang.code ? 'bg-indigo-50' : ''}
              >
                {lang.flag} {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-slate-200' : 'bg-indigo-100'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-indigo-600" />}
              </div>
              <div className={`rounded-2xl p-3 max-w-[85%] text-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-100 shadow-sm rounded-tl-none'
              }`}>
                <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              </div>
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-none p-3">
                <span className="text-xs text-slate-400 animate-pulse">MediPal is thinking...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            placeholder="e.g., Is my cholesterol too high?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isThinking}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isThinking || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}