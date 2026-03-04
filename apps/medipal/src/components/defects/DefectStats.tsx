import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bug, AlertCircle, Clock, CheckCircle } from 'lucide-react';

export default function DefectStats({ defects = [], t }) {
  const stats = {
    total: defects.length,
    open: defects.filter(d => d.status === 'Open').length,
    inProgress: defects.filter(d => d.status === 'In Progress').length,
    resolved: defects.filter(d => d.status === 'Resolved').length,
    closed: defects.filter(d => d.status === 'Closed').length,
    critical: defects.filter(d => d.severity === 'Critical' || d.severity === 'Blocker').length,
  };

  const statCards = [
    {
      label: t('defects.stats.total'),
      value: stats.total,
      icon: Bug,
      color: 'text-slate-700',
      bg: 'bg-slate-50'
    },
    {
      label: t('defects.stats.open'),
      value: stats.open,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      label: t('defects.stats.in_progress'),
      value: stats.inProgress,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: t('defects.stats.resolved'),
      value: stats.resolved + stats.closed,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, i) => (
        <Card key={i} className={`${stat.bg} border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}