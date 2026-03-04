import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Bug, AlertTriangle } from 'lucide-react';

const defaultFormData = {
  title: '',
  description: '',
  status: 'Open',
  priority: 'Medium',
  severity: 'Major',
  assigned_to: '',
  linked_test_id: '',
  linked_test_name: '',
  environment: '',
  steps_to_reproduce: '',
  expected_result: '',
  actual_result: '',
  resolution_notes: ''
};

export default function DefectForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  defect = null, 
  users = [],
  tests = [],
  isSubmitting = false,
  t 
}) {
  const [formData, setFormData] = useState(defaultFormData);
  const isEditing = !!defect;

  useEffect(() => {
    if (defect) {
      setFormData({
        title: defect.title || '',
        description: defect.description || '',
        status: defect.status || 'Open',
        priority: defect.priority || 'Medium',
        severity: defect.severity || 'Major',
        assigned_to: defect.assigned_to || '',
        linked_test_id: defect.linked_test_id || '',
        linked_test_name: defect.linked_test_name || '',
        environment: defect.environment || '',
        steps_to_reproduce: defect.steps_to_reproduce || '',
        expected_result: defect.expected_result || '',
        actual_result: defect.actual_result || '',
        resolution_notes: defect.resolution_notes || ''
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [defect, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestChange = (testId) => {
    const selectedTest = tests.find(t => t.id === testId);
    setFormData(prev => ({
      ...prev,
      linked_test_id: testId,
      linked_test_name: selectedTest?.name || ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" />
            {isEditing ? t('defects.form.title_edit') : t('defects.form.title_new')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{t('defects.form.title_label')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder={t('defects.form.title_placeholder')}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">{t('defects.form.description_label')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('defects.form.description_placeholder')}
                rows={3}
              />
            </div>
          </div>

          {/* Classification */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>{t('defects.form.status_label')}</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">{t('defects.status.open')}</SelectItem>
                  <SelectItem value="In Progress">{t('defects.status.in_progress')}</SelectItem>
                  <SelectItem value="Resolved">{t('defects.status.resolved')}</SelectItem>
                  <SelectItem value="Closed">{t('defects.status.closed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('defects.form.priority_label')}</Label>
              <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">{t('defects.priority.low')}</SelectItem>
                  <SelectItem value="Medium">{t('defects.priority.medium')}</SelectItem>
                  <SelectItem value="High">{t('defects.priority.high')}</SelectItem>
                  <SelectItem value="Critical">{t('defects.priority.critical')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('defects.form.severity_label')}</Label>
              <Select value={formData.severity} onValueChange={(v) => handleChange('severity', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Minor">{t('defects.severity.minor')}</SelectItem>
                  <SelectItem value="Major">{t('defects.severity.major')}</SelectItem>
                  <SelectItem value="Critical">{t('defects.severity.critical')}</SelectItem>
                  <SelectItem value="Blocker">{t('defects.severity.blocker')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('defects.form.environment_label')}</Label>
              <Input
                value={formData.environment}
                onChange={(e) => handleChange('environment', e.target.value)}
                placeholder={t('defects.form.environment_placeholder')}
              />
            </div>
          </div>

          {/* Assignment & Linking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('defects.form.assign_to')}</Label>
              <Select 
                value={formData.assigned_to || 'unassigned'} 
                onValueChange={(v) => handleChange('assigned_to', v === 'unassigned' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('defects.form.select_assignee')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{t('defects.unassigned')}</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.email} value={user.email}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('defects.form.link_test')}</Label>
              <Select 
                value={formData.linked_test_id || 'none'} 
                onValueChange={(v) => handleTestChange(v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('defects.form.link_test')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('defects.form.no_linked_test')}</SelectItem>
                  {tests.map(test => (
                    <SelectItem key={test.id} value={test.id}>
                      {test.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reproduction Details */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 text-slate-700 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium text-sm">{t('defects.form.reproduction')}</span>
            </div>

            <div>
              <Label htmlFor="steps">{t('defects.form.steps_label')}</Label>
              <Textarea
                id="steps"
                value={formData.steps_to_reproduce}
                onChange={(e) => handleChange('steps_to_reproduce', e.target.value)}
                placeholder={t('defects.form.steps_placeholder')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expected">{t('defects.form.expected_label')}</Label>
                <Textarea
                  id="expected"
                  value={formData.expected_result}
                  onChange={(e) => handleChange('expected_result', e.target.value)}
                  placeholder={t('defects.form.expected_placeholder')}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="actual">{t('defects.form.actual_label')}</Label>
                <Textarea
                  id="actual"
                  value={formData.actual_result}
                  onChange={(e) => handleChange('actual_result', e.target.value)}
                  placeholder={t('defects.form.actual_placeholder')}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Resolution Notes (for editing) */}
          {isEditing && (
            <div>
              <Label htmlFor="resolution">{t('defects.form.resolution_label')}</Label>
              <Textarea
                id="resolution"
                value={formData.resolution_notes}
                onChange={(e) => handleChange('resolution_notes', e.target.value)}
                placeholder={t('defects.form.resolution_placeholder')}
                rows={2}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('defects.form.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? t('defects.form.submit_edit') : t('defects.form.submit_new')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}