import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Activity, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VitalsForm({ onLogAdded }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState('Blood Glucose');
  const [valuePrimary, setValuePrimary] = useState('');
  const [valueSecondary, setValueSecondary] = useState('');
  const [context, setContext] = useState('Random');
  const [measuredAt, setMeasuredAt] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valuePrimary) return;

    setIsSubmitting(true);
    try {
      await appClient.entities.VitalSign.create({
        type,
        value_primary: parseFloat(valuePrimary),
        value_secondary: valueSecondary ? parseFloat(valueSecondary) : null,
        measured_at: new Date(measuredAt).toISOString(),
        context,
        notes
      });

      toast.success("Log saved successfully! 📈");
      setValuePrimary('');
      setValueSecondary('');
      setNotes('');
      onLogAdded();
    } catch (error) {
      console.error("Error saving vital:", error);
      toast.error("Could not save log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-indigo-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-indigo-900 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Log New Measurement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Measurement Type</Label>
            <Tabs value={type} onValueChange={(v) => { setType(v); setContext(v === 'Blood Glucose' ? 'Fasting' : 'Resting'); }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="Blood Glucose">🩸 Blood Glucose</TabsTrigger>
                <TabsTrigger value="Blood Pressure">❤️ Blood Pressure</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{type === 'Blood Glucose' ? 'Glucose Level (mg/dL)' : 'Systolic (Upper)'}</Label>
              <Input 
                type="number" 
                placeholder="e.g. 120" 
                value={valuePrimary}
                onChange={(e) => setValuePrimary(e.target.value)}
                required
              />
            </div>
            {type === 'Blood Pressure' && (
              <div className="space-y-2">
                <Label>Diastolic (Lower)</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 80" 
                  value={valueSecondary}
                  onChange={(e) => setValueSecondary(e.target.value)}
                  required
                />
              </div>
            )}
             <div className="space-y-2">
              <Label>Time</Label>
              <Input 
                type="datetime-local" 
                value={measuredAt}
                onChange={(e) => setMeasuredAt(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Context</Label>
            <Select value={context} onValueChange={setContext}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {type === 'Blood Glucose' ? (
                  <>
                    <SelectItem value="Fasting">Fasting (Morning)</SelectItem>
                    <SelectItem value="Before Meal">Before Meal</SelectItem>
                    <SelectItem value="After Meal">After Meal (2h)</SelectItem>
                    <SelectItem value="Bedtime">Bedtime</SelectItem>
                    <SelectItem value="Random">Random</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="Resting">Resting</SelectItem>
                    <SelectItem value="Active">After Activity</SelectItem>
                    <SelectItem value="Stress">Under Stress</SelectItem>
                    <SelectItem value="Random">Random</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input 
              placeholder="Any symptoms or factors?" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Log</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}