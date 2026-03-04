import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, FileCheck, Clock, ChevronRight, MessageCircle, Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import ReportAssistant from '../components/reports/ReportAssistant';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

export default function ReportsPage() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => appClient.entities.Report.list({ limit: 20 }),
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => appClient.entities.UserProfile.list({ limit: 1 }).then(res => res[0]),
  });

  return (
    <div className="py-12 container mx-auto px-4 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <FileCheck className="w-8 h-8 text-green-600" />
          Your Health Reports
        </h1>
        <Link to={createPageUrl('UploadReport')}>
           <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200">
              <Sparkles className="w-4 h-4 mr-2" />
              Smart Upload
           </Button>
        </Link>
      </div>
      
      <div className="mb-8">
        <MedicalDisclaimer variant="banner" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {reports?.map((report) => (
            <Card key={report.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-slate-200">
              <div className={`h-1.5 w-full ${report.status === 'ready' ? 'bg-green-500' : 'bg-amber-400'}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{report.test_name}</CardTitle>
                  <CardDescription>{new Date(report.date).toLocaleDateString()}</CardDescription>
                </div>
                <Badge variant={report.status === 'ready' ? 'default' : 'secondary'} className={report.status === 'ready' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>
                  {report.status === 'ready' ? 'Ready' : 'Processing'}
                </Badge>
              </CardHeader>
              <CardContent>
                {report.status === 'ready' ? (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
                    <p className="text-slate-700 font-medium mb-2">MediPal Summary 💙</p>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {report.summary}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Lab is analyzing your sample. Check back soon!</span>
                  </div>
                )}
              </CardContent>
              {report.status === 'ready' && (
                <CardFooter className="bg-slate-50/50 border-t border-slate-100 pt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm group">
                        <Sparkles className="w-4 h-4 mr-2 text-indigo-500 group-hover:text-indigo-600" />
                        Chat with MediPal about this report
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
                      <ReportAssistant report={report} userProfile={userProfile} />
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              )}
            </Card>
          ))}
          
          {(!reports || reports.length === 0) && (
             <div className="text-center py-12 text-slate-400">
                No reports found. Time for a checkup?
             </div>
          )}
        </div>
      )}
    </div>
  );
}