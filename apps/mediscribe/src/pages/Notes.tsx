import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Filter } from "lucide-react";
import NoteEditor from "@/components/notes/NoteEditor";
import NotesList from "@/components/notes/NotesList";

export default function Notes() {
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteNote, setDeleteNote] = useState(null);

  // Fetch notes
  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ["clinical_notes"],
    queryFn: () => appClient.entities.ClinicalNote.list("-created_date", 100),
  });

  // Fetch patients for the editor
  const { data: patients } = useQuery({
    queryKey: ["patients_for_notes"],
    queryFn: () => appClient.entities.Patient.list("-created_date", 100),
  });

  const handleCreateNew = () => {
    setEditingNote(null);
    setShowEditor(true);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setShowEditor(true);
  };

  const handleDelete = async () => {
    if (deleteNote) {
      await appClient.entities.ClinicalNote.delete(deleteNote.id);
      queryClient.invalidateQueries({ queryKey: ["clinical_notes"] });
      setDeleteNote(null);
    }
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingNote(null);
  };

  // Filter notes
  const filteredNotes = notes?.filter((note) => {
    const matchesSearch =
      !searchTerm ||
      note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.patient_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || note.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || note.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categoryLabels = {
    patient_history: "Patient History",
    diagnosis: "Diagnosis",
    prescription: "Prescription",
    lab_results: "Lab Results",
    follow_up: "Follow-Up",
    procedure: "Procedure",
    consultation: "Consultation",
    other: "Other",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Clinical Notes</h2>
          <p className="text-slate-500 mt-1">
            AI-powered note-taking with voice dictation, auto-categorization, and medical coding
          </p>
        </div>
        <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

      {showEditor ? (
        <NoteEditor
          note={editingNote}
          patients={patients}
          onClose={handleCloseEditor}
          onSaved={handleCloseEditor}
        />
      ) : (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <Search className="w-5 h-5 text-slate-400 ml-2" />
              <Input
                className="border-none shadow-none focus-visible:ring-0 text-base"
                placeholder="Search notes by title, content, or patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="finalized">Finalized</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes List */}
          <NotesList
            notes={filteredNotes}
            isLoading={notesLoading}
            onEdit={handleEdit}
            onDelete={setDeleteNote}
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteNote} onOpenChange={() => setDeleteNote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}