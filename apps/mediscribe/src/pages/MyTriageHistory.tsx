import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, Activity, Heart, Brain, FileText, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MyTriageHistory() {
  const [allConversations, setAllConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const user = await appClient.auth.me();
        const agents = ['general_triage', 'patient_triage', 'neuro_triage', 'oncology_triage', 'ortho_triage', 'gastro_triage'];
        
        // Fetch agent conversations
        const conversationsPromises = agents.map(agentName =>
          appClient.agents.listConversations({ agent_name: agentName })
            .then(convos => convos.map(c => ({ ...c, agent_name: agentName, source: 'conversation' })))
            .catch(() => [])
        );
        
        const conversationResults = await Promise.all(conversationsPromises);
        const conversations = conversationResults.flat();
        
        // Fetch triage reports (from WhatsApp sessions)
        const reports = await appClient.entities.TriageReport.list('-created_date', 100);
        
        // Convert reports to conversation format
        const reportConversations = reports.map(report => ({
          id: report.id,
          agent_name: report.agent_name || 'general_triage',
          updated_date: report.updated_date,
          created_date: report.created_date,
          messages: [
            {
              role: 'assistant',
              content: report.ai_summary || report.symptoms || 'Triage session completed'
            }
          ],
          metadata: {
            name: report.patient_name || 'Triage Session',
            severity: report.severity,
            action: report.action_recommended
          },
          source: 'report',
          report_id: report.id,
          severity: report.severity
        }));
        
        // Merge and sort
        const merged = [...conversations, ...reportConversations].sort((a, b) => 
          new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date)
        );
        
        setAllConversations(merged);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const getAgentInfo = (agentName) => {
    const agentMap = {
      general_triage: { 
        name: 'GP Triage', 
        icon: Activity, 
        color: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      patient_triage: { 
        name: 'Cardiac Triage', 
        icon: Heart, 
        color: 'bg-red-100 text-red-700 border-red-200'
      },
      neuro_triage: { 
        name: 'Neuro Triage', 
        icon: Brain, 
        color: 'bg-purple-100 text-purple-700 border-purple-200'
      },
      oncology_triage: { 
        name: 'Oncology Triage', 
        icon: Activity, 
        color: 'bg-orange-100 text-orange-700 border-orange-200'
      },
      ortho_triage: {
        name: 'Orthopedic Triage',
        icon: Activity,
        color: 'bg-teal-100 text-teal-700 border-teal-200'
      },
      gastro_triage: {
        name: 'Gastro Triage',
        icon: Activity,
        color: 'bg-green-100 text-green-700 border-green-200'
      }
    };
    return agentMap[agentName] || { name: 'Triage', icon: MessageSquare, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Triage History</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">My Triage History</h1>
        <p className="text-slate-500">View all your AI triage conversations and assessments</p>
      </div>

      {allConversations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 text-center mb-4">No triage conversations yet</p>
            <Link to={createPageUrl("PatientTriageChat")}>
              <Button>Start Symptom Assessment</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {allConversations.map((conversation) => {
            const agentInfo = getAgentInfo(conversation.agent_name);
            const AgentIcon = agentInfo.icon;
            const messageCount = conversation.messages?.length || 0;
            const lastMessage = conversation.messages?.[conversation.messages.length - 1];
            
            return (
              <Card 
                key={conversation.id} 
                className="hover:shadow-lg transition-all cursor-pointer border-2"
                onClick={() => window.open(`https://wa.me/${conversation.whatsapp_number}`, '_blank')}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${agentInfo.color} border-2 flex-shrink-0`}>
                        <AgentIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <CardTitle className="text-lg">{conversation.metadata?.name || 'Triage Session'}</CardTitle>
                          <Badge variant="outline" className={`${agentInfo.color} text-xs`}>
                            {agentInfo.name}
                          </Badge>
                          {conversation.severity && (
                            <Badge className={
                              conversation.severity === 'critical' ? 'bg-red-600' :
                              conversation.severity === 'high' ? 'bg-orange-600' :
                              conversation.severity === 'medium' ? 'bg-yellow-600' :
                              'bg-green-600'
                            }>
                              {conversation.severity}
                            </Badge>
                          )}
                          {conversation.source === 'report' && (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              Report
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(conversation.updated_date || conversation.created_date), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {messageCount} messages
                          </div>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </div>
                </CardHeader>
                {lastMessage && (
                  <CardContent>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {lastMessage.content}
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Need Medical Records?</p>
              <p className="text-sm text-blue-700">Download your triage reports from the individual conversations or contact your healthcare provider.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}