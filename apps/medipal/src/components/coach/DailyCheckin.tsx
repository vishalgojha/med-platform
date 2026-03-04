import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DailyCheckin({ userProfile, onLogSubmitted }) {
  const [mood, setMood] = useState('Good');
  const [followedPlan, setFollowedPlan] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Get AI motivation based on the log
      const prompt = `
        User Check-in:
        - Mood: ${mood}
        - Followed Plan: ${followedPlan ? 'Yes' : 'No'}
        - Notes: "${notes}"
        - User Name: ${userProfile?.nickname || 'User'}
        
        Task: Provide a short, supportive response (max 2 sentences). 
        If they didn't follow the plan or feel bad, be kind and encouraging. 
        If they did well, celebrate it!
      `;

      const feedback = await appClient.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      await appClient.entities.HealthLog.create({
        date: format(new Date(), 'yyyy-MM-dd'),
        mood,
        followed_plan: followedPlan,
        notes,
        ai_feedback: feedback
      });

      toast.success("Check-in saved! Keep it up! 🚀");
      setNotes('');
      onLogSubmitted();
    } catch (error) {
      console.error("Check-in failed", error);
      toast.error("Could not save check-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-indigo-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-indigo-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-500" />
          Daily Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>How are you feeling?</Label>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Great">Great 🤩</SelectItem>
                <SelectItem value="Good">Good 🙂</SelectItem>
                <SelectItem value="Okay">Okay 😐</SelectItem>
                <SelectItem value="Tired">Tired 😴</SelectItem>
                <SelectItem value="Stressed">Stressed 😫</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 flex flex-col justify-center">
            <Label className="mb-2">Did you follow the plan?</Label>
            <div className="flex items-center space-x-2">
              <Switch checked={followedPlan} onCheckedChange={setFollowedPlan} />
              <span className="text-sm text-slate-600">{followedPlan ? "Yes, I crushed it! 🔥" : "Not really..."}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea 
                placeholder="What went well? What was hard?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-20 resize-none"
            />
        </div>

        <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Submit Log</>}
        </Button>
      </CardContent>
    </Card>
  );
}