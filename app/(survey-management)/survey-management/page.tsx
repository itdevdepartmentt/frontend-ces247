"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Link as LinkIcon,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminSurveyFields,
  useCreateSurveyField,
  useUpdateSurveyField,
  useDeleteSurveyField,
  useAdminSurveyResponses,
  type SurveyField,
} from "@/hooks/use-survey";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";

export default function SurveyManagementPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  
  // Set default tab safely avoiding hydration issues
  const [activeTab, setActiveTab] = useState("responses");

  useEffect(() => {
    if (isAdmin) {
      setActiveTab("fields");
    } else {
      setActiveTab("responses");
    }
  }, [isAdmin]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Survey Management</h2>
        <Button onClick={() => document.dispatchEvent(new CustomEvent('open-generate-link'))} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <LinkIcon className="mr-2 h-4 w-4" /> Generate Link Survey
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {isAdmin && (
          <TabsList>
            <TabsTrigger value="fields">Survey Fields (Questions)</TabsTrigger>
            <TabsTrigger value="responses">Data Responses</TabsTrigger>
          </TabsList>
        )}
        {isAdmin && (
          <TabsContent value="fields" className="space-y-4">
            <SurveyFieldsTab />
          </TabsContent>
        )}
        <TabsContent value="responses" className="space-y-4">
          <SurveyResponsesTab />
        </TabsContent>
      </Tabs>
      <GenerateLinkDialog />
    </div>
  );
}

function SurveyFieldsTab() {
  const { data, isLoading } = useAdminSurveyFields({ limit: 100 });
  const fields = data?.data || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<Partial<SurveyField> | null>(null);

  const createMutation = useCreateSurveyField();
  const updateMutation = useUpdateSurveyField();
  const deleteMutation = useDeleteSurveyField();

  const handleSave = async () => {
    try {
      if (!editingField?.label || !editingField.type) {
        toast.error("Label and Type are required");
        return;
      }
      
      const payload = {
        ...editingField,
        order: Number(editingField.order) || 0,
        options: editingField.type === "SELECT" && typeof editingField.options === "string" 
          ? editingField.options.split("\n").map(s => s.trim()).filter(Boolean)
          : editingField.options
      };

      if (editingField.id) {
        await updateMutation.mutateAsync(payload as any);
        toast.success("Field updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Field created successfully");
      }
      setIsDialogOpen(false);
      setEditingField(null);
    } catch (err) {
      toast.error("Failed to save field");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this field?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Field deleted");
      } catch (err) {
        toast.error("Failed to delete field");
      }
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between mb-4">
          <div className="text-sm text-muted-foreground">Manage the questions shown in the public survey.</div>
          <Button onClick={() => { setEditingField({ isRequired: true, isActive: true, order: 0 }); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Field
          </Button>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Label / Question</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" /></TableCell></TableRow>
              ) : fields.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No fields found.</TableCell></TableRow>
              ) : (
                fields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell>{field.order}</TableCell>
                    <TableCell className="font-medium">{field.label}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{field.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {field.isRequired ? <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200">Yes</Badge> : <Badge variant="secondary">No</Badge>}
                    </TableCell>
                    <TableCell>
                      {field.isActive ? <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-200">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingField({
                          ...field,
                          label: field.label.split('\n')[0],
                          options: Array.isArray(field.options) 
                            ? field.options.map((opt: string) => opt.replace(/\s*\(.*?\)$/, '')).join("\n") 
                            : field.options,
                          dependsOnValue: field.dependsOnValue ? String(field.dependsOnValue).replace(/\s*\(.*?\)$/, '') : field.dependsOnValue
                        });
                        setIsDialogOpen(true);
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDelete(field.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField?.id ? "Edit Field" : "Create Field"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">Label / Question</label>
              <Input value={editingField?.label || ""} onChange={e => setEditingField({ ...editingField, label: e.target.value })} placeholder="E.g. How satisfied are you?" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={editingField?.type || ""} onValueChange={val => setEditingField({ ...editingField, type: val as any })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RATING">Rating (Emoji 1-5)</SelectItem>
                  <SelectItem value="NPS">NPS (Scale 0-10)</SelectItem>
                  <SelectItem value="TEXT">Text (Feedback)</SelectItem>
                  <SelectItem value="SELECT">Select (Dropdown/Radio)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editingField?.type === "SELECT" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Options (Pisahkan per baris / Enter)</label>
                <Textarea 
                  value={editingField.options || ""} 
                  onChange={e => setEditingField({ ...editingField, options: e.target.value })} 
                  placeholder="Option 1&#10;Option 2&#10;Option 3" 
                  className="min-h-[100px]"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Order</label>
                <Input type="number" value={editingField?.order || 0} onChange={e => setEditingField({ ...editingField, order: parseInt(e.target.value) })} />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="text-sm font-semibold">Logika Lanjutan (Opsional)</div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bergantung Pada Pertanyaan:</label>
                <Select 
                  value={editingField?.dependsOnFieldId ? String(editingField.dependsOnFieldId) : "none"} 
                  onValueChange={val => setEditingField({ 
                    ...editingField, 
                    dependsOnFieldId: val === "none" ? null : parseInt(val),
                    dependsOnValue: val === "none" ? null : editingField?.dependsOnValue
                  })}
                >
                  <SelectTrigger><SelectValue placeholder="Pilih Pertanyaan Parent" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Tidak Ada (Selalu Muncul) --</SelectItem>
                    {fields.filter(f => f.id !== editingField?.id).map(f => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {editingField?.dependsOnFieldId && (
                <div className="space-y-2 animate-in fade-in">
                  <label className="text-sm font-medium">Muncul Jika Jawaban Parent Adalah:</label>
                  <Input 
                    value={editingField?.dependsOnValue || ""} 
                    onChange={e => setEditingField({ ...editingField, dependsOnValue: e.target.value })} 
                    placeholder="Contoh: 1,2 atau Ya" 
                  />
                  <p className="text-xs text-slate-500">Gunakan koma jika ada beberapa nilai (contoh: 1,2)</p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4 pt-2 border-t">
              <Button 
                type="button" 
                variant={editingField?.isRequired ? "default" : "outline"} 
                onClick={() => setEditingField({ ...editingField, isRequired: !editingField?.isRequired })}
                className="flex-1"
              >
                {editingField?.isRequired ? <ToggleRight className="mr-2" /> : <ToggleLeft className="mr-2" />}
                {editingField?.isRequired ? "Required: YES" : "Required: NO"}
              </Button>
              <Button 
                type="button" 
                variant={editingField?.isActive ? "default" : "outline"} 
                onClick={() => setEditingField({ ...editingField, isActive: !editingField?.isActive })}
                className={editingField?.isActive ? "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" : "flex-1"}
              >
                {editingField?.isActive ? <ToggleRight className="mr-2" /> : <ToggleLeft className="mr-2" />}
                {editingField?.isActive ? "Status: ACTIVE" : "Status: INACTIVE"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SurveyResponsesTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data, isLoading, refetch } = useAdminSurveyResponses({ page, limit, search });
  const { data: fieldsData } = useAdminSurveyFields({ limit: 100 });
  
  useEffect(() => {
    const handleRefetch = () => refetch();
    document.addEventListener('survey-link-generated', handleRefetch);
    return () => document.removeEventListener('survey-link-generated', handleRefetch);
  }, [refetch]);

  const responses = data?.data || [];
  const meta = data?.meta;
  const fields = fieldsData?.data || [];

  const handleDownload = async () => {
    try {
      toast.info("Preparing download...");
      const response = await api.get('/survey/admin/responses/download', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'survey-responses.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download complete");
    } catch (err) {
      toast.error('Gagal download data');
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search name or email..." 
              className="pl-8" 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Button onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Download className="mr-2 h-4 w-4" /> Download Excel
          </Button>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead className="whitespace-nowrap">No</TableHead>
                <TableHead className="whitespace-nowrap">Waktu Generate</TableHead>
                <TableHead className="whitespace-nowrap">Answered_time</TableHead>
                <TableHead className="whitespace-nowrap">Ticket-ID</TableHead>
                <TableHead className="whitespace-nowrap">Nama Agent</TableHead>
                {fields.map(f => (
                  <TableHead key={f.id} className="whitespace-nowrap max-w-[200px] truncate" title={f.label}>{f.label}</TableHead>
                ))}
                <TableHead className="whitespace-nowrap text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6 + fields.length} className="text-center py-10"><Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" /></TableCell></TableRow>
              ) : responses.length === 0 ? (
                <TableRow><TableCell colSpan={6 + fields.length} className="text-center py-10 text-muted-foreground">No responses found.</TableCell></TableRow>
              ) : (
                responses.map((res, i) => (
                  <TableRow key={res.id}>
                    <TableCell>{(page - 1) * limit + i + 1}</TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500">{res.generatedAt ? new Date(res.generatedAt).toLocaleString('id-ID') : '-'}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{Object.keys(res.answers || {}).length > 0 ? new Date(res.createdAt).toLocaleString('id-ID') : '-'}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium text-indigo-600 dark:text-indigo-400">{res.ticketId || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{res.agentName || '-'}</TableCell>
                    {fields.map(f => (
                      <TableCell key={f.id} className="min-w-[150px] max-w-[300px] truncate" title={res.answers?.[f.id]}>
                        {res.answers?.[f.id] || '-'}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => {
                        const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
                        navigator.clipboard.writeText(`${origin}/survey?id=${res.ticketId}`);
                        toast.success("Link berhasil disalin!");
                      }} title="Copy Link">
                        <Copy className="h-4 w-4 text-slate-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {meta && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, meta.total)} dari {meta.total} data
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>
                First
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <div className="text-sm font-medium px-2">Page {page} of {Math.max(1, meta.lastPage)}</div>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))} disabled={page === meta.lastPage || meta.lastPage === 0}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(meta.lastPage)} disabled={page === meta.lastPage || meta.lastPage === 0}>
                Last
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GenerateLinkDialog() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [ticketId, setTicketId] = React.useState("");
  const [generatedLink, setGeneratedLink] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    document.addEventListener('open-generate-link', handleOpen);
    return () => document.removeEventListener('open-generate-link', handleOpen);
  }, []);

  const handleGenerate = async () => {
    const cleanTicketId = ticketId.trim();
    if (!cleanTicketId) {
      toast.error("Ticket ID tidak boleh kosong");
      return;
    }
    if (cleanTicketId.length !== 17) {
      toast.error(`Ticket ID harus tepat 17 karakter (saat ini ${cleanTicketId.length} karakter)`);
      return;
    }

    setIsGenerating(true);
    let success = false;
    
    try {
      await api.post(`/survey/admin/generate`, { ticketId: cleanTicketId });
      success = true;
    } catch (e: any) {
      console.error("Gagal men-generate link survey:", e);
      if (e.response?.status === 409) {
        toast.error("Survey untuk Ticket ID ini sudah pernah diisi oleh customer!");
      } else {
        toast.error("Gagal generate link survey dari server.");
      }
    }
    
    setIsGenerating(false);

    if (success) {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
      // Tampilkan link menggunakan ID langsung agar linknya rapi (17 karakter)
      const link = `${origin}/survey?id=${cleanTicketId}`;
      setGeneratedLink(link);
      toast.success("Link berhasil dibuat dan data telah tercatat.");
      
      // Dispatch custom event to trigger refetch
      document.dispatchEvent(new CustomEvent('survey-link-generated'));
    }
  };

  const handleCopy = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success("Link berhasil disalin!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setTicketId("");
        setGeneratedLink("");
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Link Survey</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ticket ID</label>
            <div className="flex gap-2">
              <Input 
                placeholder="Masukkan Ticket ID..." 
                value={ticketId}
                onChange={e => {
                  // Izinkan semua karakter kecuali '#', batasi maksimal 17 karakter, hapus spasi
                  const val = e.target.value.replace(/#/g, '').replace(/\s/g, '').slice(0, 17);
                  setTicketId(val);
                  setGeneratedLink("");
                }}
              />
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
              </Button>
            </div>
          </div>
          
          {generatedLink && (
            <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-bottom-2">
              <label className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Generated Link:</label>
              <div className="flex gap-2 items-center">
                <Input value={generatedLink} readOnly className="bg-slate-50 dark:bg-slate-900 font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
