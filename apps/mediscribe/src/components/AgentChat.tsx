import React, { useState, useEffect, useRef } from 'react';
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

export default function AgentChat({ agentName, title, description, initialMessage }) {
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        const initChat = async () => {
            try {
                // Check if user is authenticated
                const isAuth = await appClient.auth.isAuthenticated();
                if (!isAuth) {
                    appClient.auth.redirectToLogin();
                    return;
                }
                
                // Create a new conversation or fetch existing one if we persisted ID (not doing persistence for simplicity here)
                const conv = await appClient.agents.createConversation({
                    agent_name: agentName,
                    metadata: { name: `Web Session ${new Date().toLocaleString()}` }
                });
                setConversation(conv);
                
                // Add initial greeting if provided and no messages
                if (initialMessage && conv.messages.length === 0) {
                    // We can't easily "inject" a system message as user visible, 
                    // but we can rely on the agent's greeting or just show a local fake message
                    setMessages([{ role: 'assistant', content: initialMessage }]);
                } else {
                    setMessages(conv.messages || []);
                }
            } catch (error) {
                console.error("Failed to init chat", error);
            }
        };
        initChat();
    }, [agentName, initialMessage]);

    useEffect(() => {
        if (!conversation?.id) return;

        const unsubscribe = appClient.agents.subscribeToConversation(conversation.id, (data) => {
            setMessages(data.messages);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [conversation?.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || !conversation) return;
        
        const content = inputValue;
        setInputValue("");
        setIsLoading(true);

        try {
            await appClient.agents.addMessage(conversation, {
                role: "user",
                content: content
            });
        } catch (error) {
            console.error("Send failed", error);
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Card className="h-[600px] flex flex-col border-slate-200 shadow-md">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-lg text-slate-800">{title}</CardTitle>
                        <p className="text-xs text-slate-500 font-normal">{description}</p>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden p-0 bg-slate-50/30">
                <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                        {messages.map((msg, idx) => {
                            if (msg.role === 'system') return null; // Hide system prompts
                            const isUser = msg.role === 'user';
                            return (
                                <div key={idx} className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
                                    {!isUser && (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                                            <Bot className="w-4 h-4 text-blue-600" />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                                        isUser ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
                                    )}>
                                        <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                                            {msg.content}
                                        </ReactMarkdown>
                                        
                                        {/* Render tool calls if any (simplified) */}
                                        {msg.tool_calls?.map((tool, i) => (
                                            <div key={i} className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                <span>Processing {tool.name.split('.').pop()}...</span>
                                            </div>
                                        ))}
                                    </div>
                                    {isUser && (
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1">
                                            <User className="w-4 h-4 text-slate-500" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className="p-4 bg-white border-t border-slate-100">
                <div className="flex w-full items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                        <Paperclip className="w-5 h-5" />
                    </Button>
                    <Input 
                        placeholder="Describe your symptoms..." 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1"
                    />
                    <Button 
                        onClick={handleSend} 
                        disabled={isLoading || !inputValue.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}