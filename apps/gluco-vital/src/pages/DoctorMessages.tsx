import React, { useState, useEffect, useRef } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2, MessageCircle, User, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function DoctorMessages() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [isDoctor, setIsDoctor] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const connectionId = urlParams.get('connection');

  useEffect(() => {
    appClient.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: connection } = useQuery({
    queryKey: ['message-connection', connectionId],
    queryFn: async () => {
      const conns = await appClient.entities.DoctorConnection.filter({ id: connectionId });
      return conns[0];
    },
    enabled: !!connectionId
  });

  useEffect(() => {
    if (connection && user) {
      setIsDoctor(connection.doctor_email === user.email);
    }
  }, [connection, user]);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', connectionId],
    queryFn: () => appClient.entities.DoctorMessage.filter(
      { connection_id: connectionId },
      'created_date'
    ),
    enabled: !!connectionId,
    refetchInterval: 5000 // Poll every 5 seconds
  });

  // Mark messages as read
  useEffect(() => {
    if (messages.length > 0 && user) {
      const unreadMessages = messages.filter(m => 
        !m.is_read && m.sender_email !== user.email
      );
      unreadMessages.forEach(m => {
        appClient.entities.DoctorMessage.update(m.id, { is_read: true });
      });
    }
  }, [messages, user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (messageText) => appClient.entities.DoctorMessage.create({
      connection_id: connectionId,
      patient_email: connection.patient_email,
      doctor_email: connection.doctor_email,
      sender_email: user.email,
      sender_role: isDoctor ? "doctor" : "patient",
      message: messageText,
      message_type: "text"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessage("");
    }
  });

  const handleSend = () => {
    if (message.trim()) {
      sendMutation.mutate(message.trim());
    }
  };

  const otherPartyName = isDoctor ? connection?.patient_name : connection?.doctor_name;
  const backUrl = isDoctor ? "DoctorDashboard" : "DoctorShare";

  if (!user || !connectionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link to={createPageUrl(backUrl)}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5b9a8b]/20 to-[#7eb8a8]/20 flex items-center justify-center">
            {isDoctor ? (
              <User className="w-5 h-5 text-[#5b9a8b]" />
            ) : (
              <Stethoscope className="w-5 h-5 text-[#5b9a8b]" />
            )}
          </div>
          <div>
            <h1 className="font-semibold text-slate-800">{otherPartyName || "Chat"}</h1>
            <p className="text-xs text-slate-500">
              {isDoctor ? "Patient" : "Doctor"} • {connection?.status === "active" ? "Active" : "Pending"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No messages yet</p>
              <p className="text-sm text-slate-400">Start the conversation</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.sender_email === user.email;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${isMine ? 'order-2' : ''}`}>
                    <div className={`rounded-2xl px-4 py-2.5 ${
                      isMine 
                        ? 'bg-[#5b9a8b] text-white rounded-br-md' 
                        : 'bg-white border border-slate-200 rounded-bl-md'
                    }`}>
                      {msg.message_type === "recommendation" && (
                        <div className={`text-xs font-medium mb-1 ${isMine ? 'text-white/80' : 'text-violet-600'}`}>
                          📋 Recommendation
                        </div>
                      )}
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <p className={`text-xs text-slate-400 mt-1 ${isMine ? 'text-right' : ''}`}>
                      {format(new Date(msg.created_date), "h:mm a")}
                      {msg.is_read && isMine && " • Read"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-3 sticky bottom-0">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button 
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            className="bg-[#5b9a8b] hover:bg-[#4a8a7b]"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}