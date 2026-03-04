import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Dumbbell, Calendar, TrendingUp, MessageSquareQuote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import PlanGenerator from '../components/coach/PlanGenerator';
import DailyCheckin from '../components/coach/DailyCheckin';
import { Loader2 } from 'lucide-react';

export default function HealthCoachPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => appClient.entities.UserProfile.list({ limit: 1 }).then(res => res[0]),
  });

  const { data: tests } = useQuery({
    queryKey: ['tests'],
    queryFn: () => appClient.entities.Test.list({ limit: 20 }),
  });

  const { data: activePlan, isLoading: isPlanLoading, refetch: refetchPlan } = useQuery({
    queryKey: ['activePlan', refreshTrigger],
    queryFn: async () => {
       const plans = await appClient.entities.HealthPlan.list({ 
           limit: 1, 
           sort: { created_date: -1 } // Get most recent
       });
       // Check if the most recent is actually active, simplistic approach
       return plans.length > 0 && plans[0].status === 'active' ? plans[0] : null;
    },
  });

  const { data: logs, refetch: refetchLogs } = useQuery({
    queryKey: ['healthLogs', refreshTrigger],
    queryFn: () => appClient.entities.HealthLog.list({ limit: 7, sort: { date: -1 } }),
  });

  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: () => appClient.entities.Report.list({ limit: 5, sort: { date: -1 } }),
  });

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    refetchPlan();
    refetchLogs();
  };

  const handleArchivePlan = async () => {
    if (!activePlan) return;
    if (confirm("Are you sure you want to end this plan and start a new one?")) {
        await appClient.entities.HealthPlan.update(activePlan.id, { status: 'archived' });
        handleRefresh();
    }
  };

  if (isPlanLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row items-start gap-8">
          
          {/* Left Column: Plan & Daily Actions */}
          <div className="w-full md:w-2/3 space-y-8">
            
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-100 p-2 rounded-xl">
                 <Dumbbell className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Health Coach</h1>
            </div>

            {!activePlan ? (
              <PlanGenerator 
                userProfile={userProfile} 
                tests={tests}
                reports={reports}
                onPlanCreated={handleRefresh} 
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-start">
                   <div>
                     <div className="uppercase tracking-wide text-xs font-bold bg-white/20 inline-block px-2 py-1 rounded mb-3">
                        Current {activePlan.type} Plan
                     </div>
                     <h2 className="text-2xl font-bold mb-2">{activePlan.title}</h2>
                     <p className="text-indigo-100 text-sm opacity-90">Created on {new Date(activePlan.created_date).toLocaleDateString()}</p>
                   </div>
                   <Button variant="ghost" className="text-white hover:bg-white/20" onClick={handleArchivePlan}>
                     End Plan
                   </Button>
                </div>
                <div className="p-6 prose prose-indigo max-w-none">
                   <ReactMarkdown>{activePlan.content}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Daily Check-in & History */}
          <div className="w-full md:w-1/3 space-y-6">
             
             {activePlan && (
                <DailyCheckin userProfile={userProfile} onLogSubmitted={handleRefresh} />
             )}

             {/* Recent Logs */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <TrendingUp className="w-5 h-5 text-indigo-500" />
                   Recent Progress
                </h3>
                
                <div className="space-y-4">
                   {logs?.length === 0 && <p className="text-slate-400 text-sm">No logs yet. Start checking in!</p>}
                   {logs?.map((log) => (
                      <div key={log.id} className="border-l-2 border-indigo-100 pl-4 pb-1 relative">
                         <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-indigo-400" />
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {format(new Date(log.date), 'MMM dd')}
                            </span>
                            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                {log.mood}
                            </span>
                         </div>
                         {log.notes && <p className="text-sm text-slate-700 mb-2 italic">"{log.notes}"</p>}
                         {log.ai_feedback && (
                            <div className="bg-indigo-50 p-2 rounded-lg text-xs text-indigo-800 flex gap-2">
                               <MessageSquareQuote className="w-4 h-4 flex-shrink-0 opacity-50" />
                               {log.ai_feedback}
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}