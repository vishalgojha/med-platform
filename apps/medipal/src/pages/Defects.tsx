import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Button } from '@/components/ui/button';
import { Plus, Bug, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '../components/LanguageProvider';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import DefectCard from '../components/defects/DefectCard';
import DefectFilters from '../components/defects/DefectFilters';
import DefectForm from '../components/defects/DefectForm';
import DefectDetails from '../components/defects/DefectDetails';
import DefectStats from '../components/defects/DefectStats';

export default function DefectsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDefect, setEditingDefect] = useState(null);
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [deleteDefect, setDeleteDefect] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    severity: 'all',
    assigned_to: 'all'
  });

  // Fetch defects
  const { data: defects = [], isLoading } = useQuery({
    queryKey: ['defects'],
    queryFn: () => appClient.entities.Defect.list('-created_date'),
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => appClient.entities.User.list(),
  });

  // Fetch tests for linking
  const { data: tests = [] } = useQuery({
    queryKey: ['tests'],
    queryFn: () => appClient.entities.Test.list(),
  });

  // Create defect
  const createMutation = useMutation({
    mutationFn: (data) => appClient.entities.Defect.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
      setIsFormOpen(false);
      toast.success(t('defects.toast.created'));
    },
  });

  // Update defect
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => appClient.entities.Defect.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
      setIsFormOpen(false);
      setEditingDefect(null);
      setSelectedDefect(null);
      toast.success(t('defects.toast.updated'));
    },
  });

  // Delete defect
  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.Defect.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
      setDeleteDefect(null);
      setSelectedDefect(null);
      toast.success(t('defects.toast.deleted'));
    },
  });

  const handleSubmit = (data) => {
    if (editingDefect) {
      updateMutation.mutate({ id: editingDefect.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (defect) => {
    setEditingDefect(defect);
    setIsFormOpen(true);
    setSelectedDefect(null);
  };

  const handleDelete = (defect) => {
    setDeleteDefect(defect);
  };

  const confirmDelete = () => {
    if (deleteDefect) {
      deleteMutation.mutate(deleteDefect.id);
    }
  };

  // Filter defects
  const filteredDefects = defects.filter(defect => {
    if (filters.search && !defect.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status !== 'all' && defect.status !== filters.status) {
      return false;
    }
    if (filters.priority !== 'all' && defect.priority !== filters.priority) {
      return false;
    }
    if (filters.severity !== 'all' && defect.severity !== filters.severity) {
      return false;
    }
    if (filters.assigned_to !== 'all') {
      if (filters.assigned_to === 'unassigned' && defect.assigned_to) {
        return false;
      }
      if (filters.assigned_to !== 'unassigned' && defect.assigned_to !== filters.assigned_to) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Bug className="w-8 h-8 text-red-500" />
                {t('defects.title')}
              </h1>
              <p className="text-slate-500 mt-1">
                {t('defects.subtitle')}
              </p>
            </div>
            <Button 
              onClick={() => {
                setEditingDefect(null);
                setIsFormOpen(true);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('defects.log_new')}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <DefectStats defects={defects} t={t} />

        {/* Filters */}
        <DefectFilters 
          filters={filters} 
          onFilterChange={setFilters}
          users={users}
          t={t}
        />

        {/* Defects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredDefects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Bug className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              {defects.length === 0 ? t('defects.no_defects') : t('defects.no_matching')}
            </h3>
            <p className="text-slate-400 mb-6">
              {defects.length === 0 
                ? t('defects.log_first')
                : t('defects.adjust_filters')}
            </p>
            {defects.length === 0 && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('defects.log_new')}
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredDefects.map((defect) => (
                <DefectCard
                  key={defect.id}
                  defect={defect}
                  onEdit={handleEdit}
                  onViewDetails={setSelectedDefect}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <DefectForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDefect(null);
        }}
        onSubmit={handleSubmit}
        defect={editingDefect}
        users={users}
        tests={tests}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        t={t}
      />

      {/* Details Sheet */}
      <DefectDetails
        defect={selectedDefect}
        isOpen={!!selectedDefect}
        onClose={() => setSelectedDefect(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        t={t}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDefect} onOpenChange={() => setDeleteDefect(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('defects.delete_dialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('defects.delete_dialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('defects.delete_dialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('defects.delete_dialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}