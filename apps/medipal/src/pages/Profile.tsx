import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, UserCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nickname: '',
    health_goals: '',
    health_concerns: ''
  });

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => appClient.entities.UserProfile.list({ limit: 1 }),
  });

  const existingProfile = profiles?.[0];

  useEffect(() => {
    if (existingProfile) {
      setFormData({
        nickname: existingProfile.nickname || '',
        health_goals: existingProfile.health_goals || '',
        health_concerns: existingProfile.health_concerns || ''
      });
    }
  }, [existingProfile]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (existingProfile) {
        return appClient.entities.UserProfile.update(existingProfile.id, data);
      } else {
        return appClient.entities.UserProfile.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success("Profile updated! MediPal knows you better now. 💙");
    },
    onError: () => {
      toast.error("Failed to update profile.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="py-12 container mx-auto px-4 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <UserCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your Profile</h1>
            <p className="text-slate-600">Help MediPal get to know you better.</p>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Personalize Your Experience</CardTitle>
            <CardDescription>
              Sharing your goals helps us provide better recommendations and cheer you on! 
              <br/>
              <span className="text-xs text-slate-400 italic">* All info is private and just for your MediPal assistant.</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nickname">What should we call you?</Label>
                <Input
                  id="nickname"
                  placeholder="e.g. Captain, Sarah, Boss"
                  value={formData.nickname}
                  onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                  className="border-slate-200 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Health Goals 🎯</Label>
                <Textarea
                  id="goals"
                  placeholder="e.g. I want to have more energy, sleep better, or train for a 5k."
                  value={formData.health_goals}
                  onChange={(e) => setFormData({...formData, health_goals: e.target.value})}
                  className="min-h-[100px] border-slate-200 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="concerns">Any Concerns? 💭</Label>
                <Textarea
                  id="concerns"
                  placeholder="e.g. I get stressed easily, family history of heart issues, or just hate needles."
                  value={formData.health_concerns}
                  onChange={(e) => setFormData({...formData, health_concerns: e.target.value})}
                  className="min-h-[100px] border-slate-200 focus:ring-indigo-500"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}