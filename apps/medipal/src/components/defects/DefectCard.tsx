import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  User, 
  Calendar, 
  Link2, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const statusColors = {
  'Open': 'bg-red-50 text-red-700 border-red-200',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
  'Resolved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Closed': 'bg-slate-100 text-slate-600 border-slate-200'
};

const priorityColors = {
  'Low': 'bg-slate-100 text-slate-600',
  'Medium': 'bg-blue-100 text-blue-700',
  'High': 'bg-orange-100 text-orange-700',
  'Critical': 'bg-red-100 text-red-700'
};

const severityColors = {
  'Minor': 'bg-slate-100 text-slate-600',
  'Major': 'bg-yellow-100 text-yellow-700',
  'Critical': 'bg-orange-100 text-orange-700',
  'Blocker': 'bg-red-100 text-red-700'
};

export default function DefectCard({ defect, onEdit, onViewDetails }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 hover:border-indigo-200 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={`${statusColors[defect.status]} font-medium`}>
                  {defect.status}
                </Badge>
                <span className="text-xs text-slate-400 font-mono">#{defect.id?.slice(-6)}</span>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {defect.title}
              </h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onViewDetails(defect)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          {defect.description && (
            <p className="text-sm text-slate-500 line-clamp-2">
              {defect.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Badge className={priorityColors[defect.priority]}>
              {defect.priority}
            </Badge>
            <Badge className={severityColors[defect.severity]}>
              <AlertCircle className="w-3 h-3 mr-1" />
              {defect.severity}
            </Badge>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              {defect.assigned_to && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {defect.assigned_to.split('@')[0]}
                </span>
              )}
              {defect.linked_test_name && (
                <span className="flex items-center gap-1 text-indigo-600">
                  <Link2 className="w-3 h-3" />
                  {defect.linked_test_name}
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {defect.created_date && format(new Date(defect.created_date), 'MMM d')}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}