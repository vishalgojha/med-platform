import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  User, 
  Calendar, 
  Link2, 
  AlertCircle,
  Edit,
  Trash2,
  Clock,
  MapPin,
  ListOrdered,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

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

export default function DefectDetails({ defect, isOpen, onClose, onEdit, onDelete, t }) {
  if (!defect) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={statusColors[defect.status]}>
                  {defect.status}
                </Badge>
                <span className="text-xs text-slate-400 font-mono">#{defect.id?.slice(-6)}</span>
              </div>
              <SheetTitle className="text-left text-xl">{defect.title}</SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(defect)}>
              <Edit className="w-4 h-4 mr-2" />
              {t('defects.details.edit')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(defect)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('defects.details.delete')}
            </Button>
          </div>

          {/* Classification */}
          <div className="flex flex-wrap gap-2">
            <Badge className={priorityColors[defect.priority]}>
              Priority: {defect.priority}
            </Badge>
            <Badge className={severityColors[defect.severity]}>
              <AlertCircle className="w-3 h-3 mr-1" />
              {defect.severity}
            </Badge>
            {defect.environment && (
              <Badge variant="outline">
                <MapPin className="w-3 h-3 mr-1" />
                {defect.environment}
              </Badge>
            )}
          </div>

          {/* Description */}
          {defect.description && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Description</h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">
                {defect.description}
              </p>
            </div>
          )}

          {/* Assignment & Link Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                <User className="w-3 h-3" /> {t('defects.details.assigned_to')}
              </span>
              <p className="text-sm font-medium text-slate-800">
                {defect.assigned_to || t('defects.unassigned')}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                <Link2 className="w-3 h-3" /> {t('defects.details.linked_test')}
              </span>
              <p className="text-sm font-medium text-indigo-600">
                {defect.linked_test_name || t('defects.form.no_linked_test')}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3" /> {t('defects.details.created')}
              </span>
              <p className="text-sm font-medium text-slate-800">
                {defect.created_date && format(new Date(defect.created_date), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" /> {t('defects.details.updated')}
              </span>
              <p className="text-sm font-medium text-slate-800">
                {defect.updated_date && format(new Date(defect.updated_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Steps to Reproduce */}
          {defect.steps_to_reproduce && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <ListOrdered className="w-4 h-4" />
                {t('defects.details.steps')}
              </h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">
                {defect.steps_to_reproduce}
              </p>
            </div>
          )}

          {/* Expected vs Actual */}
          {(defect.expected_result || defect.actual_result) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {defect.expected_result && (
                <div>
                  <h4 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {t('defects.details.expected')}
                  </h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap bg-emerald-50 p-3 rounded-lg">
                    {defect.expected_result}
                  </p>
                </div>
              )}
              {defect.actual_result && (
                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {t('defects.details.actual')}
                  </h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap bg-red-50 p-3 rounded-lg">
                    {defect.actual_result}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Resolution Notes */}
          {defect.resolution_notes && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('defects.details.resolution')}
              </h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                {defect.resolution_notes}
              </p>
            </div>
          )}

          {/* Reporter Info */}
          <div className="text-xs text-slate-400 pt-4 border-t">
            Reported by: {defect.created_by}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}