import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function PlanGenerator({ userProfile, tests, reports, onPlanCreated }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [planType, setPlanType] = useState('General');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const testsContext = tests?.map(t => `${t.name} (${t.category})`).join(', ');
      const reportsContext = reports?.map(r => `${r.test_name} (${r.date}): ${r.summary}`).join('; ') || 'No recent reports';

      const prompt = `
        Create a personalized 7-day ${planType} plan for a user, referencing their health history and available tests.
        
        User Context:
        - Name: ${userProfile?.nickname || 'Friend'}
        - Goals: ${userProfile?.health_goals || 'General wellness'}
        - Concerns: ${userProfile?.health_concerns || 'None'}
        - Recent Health Reports: ${reportsContext}
        
        Available Medical Tests Catalog: ${testsContext}
        
        Output Requirements:
        1. Title: A catchy title for the plan.
        2. Content: A structured Markdown plan. Include:
           - A motivating intro that acknowledges their recent progress or reports.
           - A simple daily routine (morning, afternoon, evening) or a 7-day schedule tailored to their profile.
           - Specific advice addressing their goals, concerns, and any findings from past reports.
           - 1-2 recommended tests *specifically* from the "Available Medical Tests Catalog" that would help monitor their specific goals or follow up on past reports. Explain WHY based on their history.
        
        Return as JSON: { "title": "string", "content": "markdown string" }
      `;

      const response = await appClient.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
            type: "object",
            properties: {
                title: { type: "string" },
                content: { type: "string" }
            },
            required: ["title", "content"]
        }
      });

      // Create the plan in the DB
      await appClient.entities.HealthPlan.create({
        title: response.title,
        type: planType,
        content: response.content,
        status: 'active'
      });

      toast.success("Your personalized plan is ready! 🎉");
      onPlanCreated();
    } catch (error) {
      console.error("Plan generation failed:", error);
      toast.error("Couldn't generate plan. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-indigo-100 shadow-md bg-gradient-to-br from-white to-indigo-50/30">
      <CardHeader>
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-indigo-600" />
        </div>
        <CardTitle className="text-2xl text-indigo-900">Create Your Health Plan</CardTitle>
        <CardDescription>
          MediPal will analyze your profile and goals to create a custom weekly routine just for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Focus Area</label>
                <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger className="bg-white">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="General">General Wellness 🌟</SelectItem>
                    <SelectItem value="Fitness">Fitness & Strength 💪</SelectItem>
                    <SelectItem value="Diet">Nutrition & Diet 🍎</SelectItem>
                    <SelectItem value="Mental Health">Mental Wellbeing 🧘‍♀️</SelectItem>
                </SelectContent>
                </Select>
            </div>
            
            <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all hover:scale-[1.02]"
            >
                {isGenerating ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Crafting your plan...
                </>
                ) : (
                <>
                    Generate My Plan ✨
                </>
                )}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}