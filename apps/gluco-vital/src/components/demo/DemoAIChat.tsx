import React, { useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SAMPLE_RESPONSES = {
  high_sugar: [
    "That's a bit higher than your usual range. What did you have for your last meal?",
    "I noticed this is above your target. Have you been feeling okay? Sometimes stress can affect readings too.",
    "Your post-meal readings tend to be higher after rice-heavy meals. Maybe try reducing the portion next time?"
  ],
  low_sugar: [
    "That's on the lower side. Have you eaten recently? If you're feeling shaky, have a small snack.",
    "Good reading! Your fasting numbers have been improving. The morning walks might be helping."
  ],
  medication: [
    "Great job logging your medication! You've been 92% consistent this week 💪",
    "Noted! Remember to take it after your meal for best absorption."
  ],
  meal: [
    "Logged! That sounds like a balanced meal. The fiber from the vegetables will help with your sugar levels.",
    "I've recorded your meal. Your after-dinner readings have been better when you eat before 8 PM."
  ],
  general: [
    "I'm here to help! You can ask me about your patterns, log readings, or get tips for managing your health.",
    "Your consistency is great! You've logged for 12 days straight. That's valuable data for understanding your patterns.",
    "Based on your recent logs, your fasting sugars are improving. Keep up the morning routine!"
  ]
};

export default function DemoAIChat({ isOpen, onClose, triggerType = "general" }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: getInitialMessage(triggerType)
    }
  ]);
  const [input, setInput] = useState("");

  function getInitialMessage(type) {
    const responses = SAMPLE_RESPONSES[type] || SAMPLE_RESPONSES.general;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");

    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    // Simulate AI response after a short delay
    setTimeout(() => {
      let responseType = "general";
      const lowerInput = userMessage.toLowerCase();
      
      if (lowerInput.includes("sugar") || lowerInput.includes("glucose") || lowerInput.includes("reading")) {
        responseType = "high_sugar";
      } else if (lowerInput.includes("medicine") || lowerInput.includes("medication") || lowerInput.includes("took")) {
        responseType = "medication";
      } else if (lowerInput.includes("ate") || lowerInput.includes("food") || lowerInput.includes("meal")) {
        responseType = "meal";
      }

      const responses = SAMPLE_RESPONSES[responseType];
      const response = responses[Math.floor(Math.random() * responses.length)];

      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Health Buddy AI</h3>
              <p className="text-xs text-slate-500">Demo conversation</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.role === "user"
                    ? "bg-[#5b9a8b] text-white rounded-br-md"
                    : "bg-slate-100 text-slate-800 rounded-bl-md"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Demo Notice */}
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-amber-700 text-center">
            🎭 This is a demo conversation with sample responses
          </p>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={handleSend} className="bg-[#5b9a8b] hover:bg-[#4a8a7b]">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}