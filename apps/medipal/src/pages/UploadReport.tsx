import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReportUploader from '../components/reports/ReportUploader';

export default function UploadReportPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <Link to={createPageUrl('Reports')}>
            <Button variant="ghost" className="pl-0 hover:pl-0 hover:bg-transparent text-slate-500 hover:text-indigo-600 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Reports
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Smart Report Upload 🧠</h1>
          <p className="text-slate-600">
            Upload your PDF or image reports from any lab. Our AI will read them, digitize the data, and explain the results to you instantly.
          </p>
        </div>

        <ReportUploader onUploadComplete={() => setTimeout(() => navigate(createPageUrl('Reports')), 2000)} />
        
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
           <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
              <div className="text-2xl mb-2">📸</div>
              <div className="font-bold text-slate-800 text-sm">Any Format</div>
              <div className="text-xs text-slate-500">PDF, JPG, PNG</div>
           </div>
           <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
              <div className="text-2xl mb-2">🔒</div>
              <div className="font-bold text-slate-800 text-sm">Secure & Private</div>
              <div className="text-xs text-slate-500">Encrypted storage</div>
           </div>
           <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-bold text-slate-800 text-sm">Instant Analysis</div>
              <div className="text-xs text-slate-500">AI-powered summary</div>
           </div>
        </div>

      </div>
    </div>
  );
}