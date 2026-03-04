import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, SlidersHorizontal } from 'lucide-react';

export default function DefectFilters({ filters, onFilterChange, users = [], t }) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      status: 'all',
      priority: 'all',
      severity: 'all',
      assigned_to: 'all'
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.status !== 'all' || 
    filters.priority !== 'all' || 
    filters.severity !== 'all' ||
    filters.assigned_to !== 'all';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center gap-2 text-slate-700">
        <SlidersHorizontal className="w-4 h-4" />
        <span className="font-medium text-sm">{t('defects.filters')}</span>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto text-slate-500 h-7 text-xs"
            onClick={clearFilters}
          >
            <X className="w-3 h-3 mr-1" />
            {t('defects.clear')}
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder={t('defects.search_placeholder')}
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Select value={filters.status} onValueChange={(v) => handleChange('status', v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t('defects.form.status_label')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('defects.all_status')}</SelectItem>
            <SelectItem value="Open">{t('defects.status.open')}</SelectItem>
            <SelectItem value="In Progress">{t('defects.status.in_progress')}</SelectItem>
            <SelectItem value="Resolved">{t('defects.status.resolved')}</SelectItem>
            <SelectItem value="Closed">{t('defects.status.closed')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(v) => handleChange('priority', v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t('defects.form.priority_label')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('defects.all_priority')}</SelectItem>
            <SelectItem value="Low">{t('defects.priority.low')}</SelectItem>
            <SelectItem value="Medium">{t('defects.priority.medium')}</SelectItem>
            <SelectItem value="High">{t('defects.priority.high')}</SelectItem>
            <SelectItem value="Critical">{t('defects.priority.critical')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.severity} onValueChange={(v) => handleChange('severity', v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t('defects.form.severity_label')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('defects.all_severity')}</SelectItem>
            <SelectItem value="Minor">{t('defects.severity.minor')}</SelectItem>
            <SelectItem value="Major">{t('defects.severity.major')}</SelectItem>
            <SelectItem value="Critical">{t('defects.severity.critical')}</SelectItem>
            <SelectItem value="Blocker">{t('defects.severity.blocker')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.assigned_to} onValueChange={(v) => handleChange('assigned_to', v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t('defects.form.assign_to')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('defects.all_assignees')}</SelectItem>
            <SelectItem value="unassigned">{t('defects.unassigned')}</SelectItem>
            {users.map(user => (
              <SelectItem key={user.email} value={user.email}>
                {user.full_name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}