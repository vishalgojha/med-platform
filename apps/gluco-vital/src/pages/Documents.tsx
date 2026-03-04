import React, { useState, useEffect, useMemo } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Search, Filter, Loader2, FolderOpen, Grid, List } from "lucide-react";
import { toast } from "sonner";
import DocumentUploadModal from "@/components/documents/DocumentUploadModal";
import DocumentCard from "@/components/documents/DocumentCard";

const ALL_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "prescription", label: "Prescriptions" },
  { value: "lab_report", label: "Lab Reports" },
  { value: "discharge_summary", label: "Discharge Summaries" },
  { value: "imaging", label: "Imaging" },
  { value: "insurance", label: "Insurance" },
  { value: "care_plan", label: "Care Plans" },
  { value: "referral", label: "Referrals" },
  { value: "educational", label: "Educational" },
  { value: "diet_plan", label: "Diet Plans" },
  { value: "exercise_plan", label: "Exercise Plans" },
  { value: "other", label: "Other" }
];

export default function Documents() {
  const [user, setUser] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [tab, setTab] = useState("my"); // "my" | "shared" | "uploaded"
  const queryClient = useQueryClient();

  useEffect(() => {
    appClient.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['health-documents', user?.email],
    queryFn: () => appClient.entities.HealthDocument.filter({}, '-created_date', 200),
    enabled: !!user?.email
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => appClient.entities.HealthDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-documents'] });
      toast.success("Document deleted");
    }
  });

  const togglePinMutation = useMutation({
    mutationFn: (doc) => appClient.entities.HealthDocument.update(doc.id, { is_pinned: !doc.is_pinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-documents'] });
    }
  });

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Filter by tab
    if (tab === "my") {
      filtered = filtered.filter(d => d.owner_email === user?.email);
    } else if (tab === "shared") {
      filtered = filtered.filter(d => d.owner_email !== user?.email && d.uploaded_by_email !== user?.email);
    } else if (tab === "uploaded") {
      filtered = filtered.filter(d => d.uploaded_by_email === user?.email && d.owner_email !== user?.email);
    }

    // Filter by category
    if (category !== "all") {
      filtered = filtered.filter(d => d.category === category);
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(d =>
        d.title?.toLowerCase().includes(searchLower) ||
        d.description?.toLowerCase().includes(searchLower) ||
        d.tags?.some(t => t.toLowerCase().includes(searchLower)) ||
        d.file_name?.toLowerCase().includes(searchLower)
      );
    }

    // Sort: pinned first, then by date
    return filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_date) - new Date(a.created_date);
    });
  }, [documents, tab, category, search, user?.email]);

  const userRole = user?.user_type || "patient";
  const showUploadedTab = ["doctor", "coach", "caregiver"].includes(userRole);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5b9a8b]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7f4] via-[#f8faf9] to-[#faf8f5]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#5b9a8b]" />
              Documents
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage your health documents securely</p>
          </div>
          <Button onClick={() => setShowUpload(true)} className="bg-[#5b9a8b] hover:bg-[#4a8a7b]">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="my">My Documents</TabsTrigger>
            <TabsTrigger value="shared">Shared with Me</TabsTrigger>
            {showUploadedTab && <TabsTrigger value="uploaded">Uploaded for Others</TabsTrigger>}
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Documents */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No documents found</h3>
            <p className="text-slate-400 text-sm mb-4">
              {search || category !== "all" 
                ? "Try adjusting your search or filters" 
                : "Upload your first document to get started"}
            </p>
            {!search && category === "all" && (
              <Button onClick={() => setShowUpload(true)} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid sm:grid-cols-2 gap-4" : "space-y-3"}>
            {filteredDocuments.map(doc => (
              <DocumentCard
                key={doc.id}
                document={doc}
                currentUserEmail={user.email}
                onDelete={(d) => deleteMutation.mutate(d.id)}
                onTogglePin={(d) => togglePinMutation.mutate(d)}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        {filteredDocuments.length > 0 && (
          <p className="text-center text-sm text-slate-400 mt-6">
            Showing {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        user={user}
      />
    </div>
  );
}