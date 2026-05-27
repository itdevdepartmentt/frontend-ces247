"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Save,
  X,
  Database,
  Loader2,
  Filter,
  ListFilter,
  Check,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  accountMappingHooks,
  lookupKIPHooks,
  lookupAgentHooks,
  type AccountMappingRow,
  type LookupKIPRow,
  type LookupAgentRow,
} from "@/hooks/use-lookup-management";
import api from "@/lib/api";

// ─── Column Filter Popover Component (Excel-like) ───

function ColumnFilterPopover<T>({
  column,
  columnFilters,
  setColumnFilters,
  rows,
  serverOptions,
}: {
  column: ColumnDef<T>;
  columnFilters: Record<string, string | boolean | string[] | null>;
  setColumnFilters: React.Dispatch<
    React.SetStateAction<Record<string, string | boolean | string[] | null>>
  >;
  rows: T[];
  serverOptions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const currentFilterValue = columnFilters[column.key as string];
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  const [tempBoolean, setTempBoolean] = useState<boolean | null>(null);

  useEffect(() => {
    if (open) {
      if (column.type === "boolean") {
        setTempBoolean(
          currentFilterValue === true
            ? true
            : currentFilterValue === false
            ? false
            : null
        );
      } else if (Array.isArray(currentFilterValue)) {
        setTempSelected(currentFilterValue);
      } else if (typeof currentFilterValue === "string") {
        setTempSelected([currentFilterValue]);
      } else {
        setTempSelected([]);
      }
      setSearchVal("");
    }
  }, [open, currentFilterValue, column.type]);

  const allOptions = React.useMemo(() => {
    if (column.type === "boolean") {
      return ["true", "false"];
    }
    const clientOptions = rows
      .map((r) =>
        r[column.key] !== null && r[column.key] !== undefined
          ? String(r[column.key]).trim()
          : ""
      )
      .filter(Boolean);
    const combined = Array.from(
      new Set([...serverOptions, ...clientOptions])
    ).filter((opt) => opt !== "null" && opt !== "undefined");
    return combined.sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [rows, serverOptions, column.key, column.type]);

  const filteredOptions = React.useMemo(() => {
    if (!searchVal) return allOptions;
    return allOptions.filter((opt) =>
      opt.toLowerCase().includes(searchVal.toLowerCase())
    );
  }, [allOptions, searchVal]);

  const hasActiveFilter =
    currentFilterValue !== undefined &&
    currentFilterValue !== null &&
    (Array.isArray(currentFilterValue)
      ? currentFilterValue.length > 0
      : currentFilterValue !== "");

  const handleApply = () => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (column.type === "boolean") {
        if (tempBoolean === null) {
          delete next[column.key as string];
        } else {
          next[column.key as string] = tempBoolean;
        }
      } else {
        if (tempSelected.length === 0) {
          delete next[column.key as string];
        } else {
          next[column.key as string] = tempSelected;
        }
      }
      return next;
    });
    setOpen(false);
  };

  const handleClear = () => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[column.key as string];
      return next;
    });
    setTempSelected([]);
    setTempBoolean(null);
    setOpen(false);
  };

  const toggleOption = (opt: string) => {
    setTempSelected((prev) => {
      if (prev.includes(opt)) {
        return prev.filter((item) => item !== opt);
      } else {
        return [...prev, opt];
      }
    });
  };

  const isAllSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((opt) => tempSelected.includes(opt));
  const isSomeSelected =
    !isAllSelected && filteredOptions.some((opt) => tempSelected.includes(opt));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setTempSelected((prev) =>
        prev.filter((item) => !filteredOptions.includes(item))
      );
    } else {
      setTempSelected((prev) =>
        Array.from(new Set([...prev, ...filteredOptions]))
      );
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-5 w-5 ml-1.5 p-0 rounded-sm transition-colors ${
            hasActiveFilter
              ? "text-primary hover:text-primary bg-primary/10 dark:bg-primary/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListFilter className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3 bg-popover border border-border shadow-md rounded-md z-50 text-foreground"
        align="start"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Filter {column.label}
            </span>
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] text-destructive hover:bg-destructive/10"
                onClick={handleClear}
              >
                Clear
              </Button>
            )}
          </div>

          {column.type === "boolean" ? (
            <div className="space-y-1.5 pt-1">
              {[
                { label: "All", value: null },
                { label: "True", value: true },
                { label: "False", value: false },
              ].map((opt) => (
                <label
                  key={opt.label}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer text-xs transition-colors"
                >
                  <input
                    type="radio"
                    name={`bool-filter-${String(column.key)}`}
                    checked={tempBoolean === opt.value}
                    onChange={() => setTempBoolean(opt.value)}
                    className="cursor-pointer accent-primary"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          ) : (
            <>
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search values..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="h-8 pl-8 text-xs font-normal bg-background"
                />
              </div>

              <ScrollArea className="h-44 border rounded-md p-1.5 bg-background/50">
                <div className="space-y-1">
                  {filteredOptions.length > 0 && (
                    <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 cursor-pointer text-xs font-semibold transition-colors border-b border-border/50 pb-1.5 mb-1.5">
                      <input
                        type="checkbox"
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeSelected;
                        }}
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="cursor-pointer accent-primary rounded-sm"
                      />
                      <span>(Select All)</span>
                    </label>
                  )}

                  {filteredOptions.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground text-center py-8">
                      No options found
                    </div>
                  ) : (
                    filteredOptions.map((opt) => {
                      const isChecked = tempSelected.includes(opt);
                      return (
                        <label
                          key={opt}
                          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 cursor-pointer text-xs transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleOption(opt)}
                            className="cursor-pointer accent-primary rounded-sm"
                          />
                          <span className="truncate" title={opt}>
                            {opt}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </>
          )}

          <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 px-3 text-xs font-semibold"
              onClick={handleApply}
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Column definitions ───

interface ColumnDef<T> {
  key: keyof T;
  label: string;
  editable?: boolean;
  type?: "text" | "boolean";
  filterable?: boolean;
  filterType?: "text" | "select" | "boolean";
}

const accountMappingColumns: ColumnDef<AccountMappingRow>[] = [
  { key: "b2b_account_id", label: "B2B Account ID", editable: true, filterable: true },
  { key: "corporateName", label: "Corporate Name", editable: true, filterable: true },
  { key: "kategoriAccount", label: "Kategori Account", editable: true, filterable: true, filterType: "select" },
  { key: "group", label: "Group", editable: true, filterable: true, filterType: "select" },
  { key: "divisi", label: "Divisi", editable: true, filterable: true, filterType: "select" },
  { key: "department", label: "Department", editable: true, filterable: true, filterType: "select" },
  { key: "mppCodeNew", label: "MPP Code New", editable: true, filterable: true },
  { key: "namaAM", label: "Nama AM", editable: true, filterable: true },
];

const lookupKIPColumns: ColumnDef<LookupKIPRow>[] = [
  { key: "category", label: "Category", editable: true, filterable: true, filterType: "select" },
  { key: "subCategory", label: "Sub Category", editable: true, filterable: true },
  { key: "detailCategoryFull", label: "Detail Category Full", editable: true, filterable: true },
  { key: "detailCategory", label: "Detail Category", editable: true, filterable: true },
  { key: "detailCategory2", label: "Detail Category 2", editable: true, filterable: true },
  { key: "compositeKeyOmnix", label: "Composite Key Omnix", editable: true, filterable: true },
  { key: "compositeKey", label: "Composite Key", editable: true, filterable: true },
  { key: "fcrNonSatuan", label: "FCR Non Satuan", editable: true, filterable: true },
  { key: "escToSatuan", label: "Esc To Satuan", editable: true, filterable: true, filterType: "select" },
  { key: "fcrNonMassal", label: "FCR Non Massal", editable: true, filterable: true },
  { key: "escToMassal", label: "Esc To Massal", editable: true, filterable: true, filterType: "select" },
  { key: "isFcr", label: "Is FCR", editable: true, type: "boolean", filterable: true },
  { key: "product", label: "Product", editable: true, filterable: true, filterType: "select" },
];

const lookupAgentColumns: ColumnDef<LookupAgentRow>[] = [
  { key: "namaAgent", label: "Nama Agent", editable: true, filterable: true },
  { key: "group", label: "Group", editable: true, filterable: true, filterType: "select" },
];
// ─── Generic Editable Table ───

interface EditableTableProps<T extends { id: number }> {
  table: string;
  columns: ColumnDef<T>[];
  hooks: {
    useList: (params: {
      page?: number;
      limit?: number;
      search?: string;
      filters?: Record<string, string | boolean | string[] | null>;
    }) => any;
    useCreate: () => any;
    useUpdate: () => any;
    useDelete: () => any;
    useDeleteAll: () => any;
  };
  defaultNewRow: Partial<T>;
}

function EditableTable<T extends { id: number }>({
  table,
  columns,
  hooks,
  defaultNewRow,
}: EditableTableProps<T>) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<T>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRowData, setNewRowData] = useState<Partial<T>>(defaultNewRow);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [pageInput, setPageInput] = useState("");

  // ─── Column Filters State ───
  const [columnFilters, setColumnFilters] = useState<Record<string, string | boolean | string[] | null>>({});
  const [debouncedColumnFilters, setDebouncedColumnFilters] = useState<Record<string, string | boolean | string[] | null>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedColumnFilters(columnFilters);
      setPage(1); // Reset page to 1 when filters change
    }, 500);
    return () => clearTimeout(timer);
  }, [columnFilters]);

  // ─── Selection State ───
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const { data: result, isLoading } = hooks.useList({ page, limit, search, filters: debouncedColumnFilters });
  const createMutation = hooks.useCreate();
  const updateMutation = hooks.useUpdate();
  const deleteMutation = hooks.useDelete();
  const deleteAllMutation = hooks.useDeleteAll();

  const rows: T[] = result?.data ?? [];
  const meta = result?.meta ?? { total: 0, page: 1, lastPage: 1 };

  // ─── Selection Handlers ───
  const allPageIds = rows.map((r) => r.id);
  const allPageSelected =
    allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const somePageSelected =
    allPageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  // Indeterminate checkbox ref
  const selectAllRef = useRef<HTMLInputElement>(null);

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleRow = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
    setSelectedIds(new Set());
  }, [searchInput]);

  const startEdit = (row: T) => {
    setEditingId(row.id);
    setEditData({ ...row });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    try {
      await updateMutation.mutateAsync({ id: editingId, ...editData } as any);
      toast.success("Row updated successfully");
      setEditingId(null);
      setEditData({});
    } catch {
      toast.error("Failed to update row");
    }
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(newRowData as any);
      toast.success("Row created successfully");
      setIsAddDialogOpen(false);
      setNewRowData(defaultNewRow);
    } catch {
      toast.error("Failed to create row");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Row deleted successfully");
      setDeleteConfirmId(null);
    } catch {
      toast.error("Failed to delete row");
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete ALL rows? This cannot be undone.")) return;
    try {
      await deleteAllMutation.mutateAsync();
      toast.success("All rows deleted successfully");
      setSelectedIds(new Set());
    } catch {
      toast.error("Failed to delete all rows");
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    let successCount = 0;
    for (const id of ids) {
      try {
        await deleteMutation.mutateAsync(id);
        successCount++;
      } catch {
        // continue deleting others
      }
    }
    toast.success(`${successCount} of ${ids.length} rows deleted`);
    setSelectedIds(new Set());
    setIsBulkDeleteOpen(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv") {
      toast.error("Invalid format. Please upload a .csv file.");
      event.target.value = "";
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post(`lookup-management/${table}/upload-csv`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.info("Upload finished. Processing started...");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload file.");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full sm:w-64"
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-x-2 flex-wrap gap-y-2 items-center">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete All
          </Button>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            id={`file-lookup-${table}`}
            onChange={handleFileUpload}
          />
          <label htmlFor={`file-lookup-${table}`}>
            <Button asChild size="sm">
              <div>
                <Plus className="h-4 w-4 mr-1" />
                Bulk Add
              </div>
            </Button>
          </label>
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </Button>
        </div>
      </div>

      {/* Selection banner */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border bg-muted/40 dark:bg-slate-800/60">
          <span className="font-semibold text-foreground">{selectedIds.size}</span>
          <span className="text-muted-foreground">
            row{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <button
            className="ml-auto text-xs text-muted-foreground underline hover:text-foreground"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 dark:bg-slate-950/50 border-b">
              <TableHead className="w-10 py-3 align-middle">
                <input
                  type="checkbox"
                  ref={(el) => {
                    if (el) el.indeterminate = somePageSelected;
                  }}
                  checked={allPageSelected}
                  onChange={toggleSelectAll}
                  className="cursor-pointer accent-primary rounded-sm"
                  title="Select all on this page"
                />
              </TableHead>
              <TableHead className="w-12 text-xs py-3 align-middle">#</TableHead>
              {columns.map((col) => (
                <TableHead
                  key={String(col.key)}
                  className="text-xs whitespace-nowrap py-3 min-w-[140px] align-middle"
                >
                  <div className="flex items-center gap-1.5 h-full">
                    <span className="font-semibold text-foreground/80">
                      {col.label}
                    </span>
                    {col.filterable !== false && (
                      <ColumnFilterPopover
                        column={col}
                        columnFilters={columnFilters}
                        setColumnFilters={setColumnFilters}
                        rows={rows}
                        serverOptions={
                          ((meta as any).filterOptions?.[
                            col.key as string
                          ] as string[]) || []
                        }
                      />
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-24 text-xs text-right py-3 align-middle">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="font-semibold text-foreground/80 mr-1">
                    Actions
                  </span>
                  {Object.keys(columnFilters).length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-destructive hover:bg-destructive/15 rounded-sm"
                      onClick={() => setColumnFilters({})}
                      title="Clear all filters"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 3} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 3} className="text-center py-8 text-muted-foreground">
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  className={
                    selectedIds.has(row.id)
                      ? "bg-primary/5 dark:bg-primary/10"
                      : undefined
                  }
                >
                  <TableCell className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      className="cursor-pointer accent-primary"
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(meta.page - 1) * limit + idx + 1}
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)} className="text-xs">
                      {editingId === row.id && col.editable ? (
                        col.type === "boolean" ? (
                          <select
                            className="border rounded px-1 py-0.5 text-xs bg-background"
                            value={
                              editData[col.key] === true
                                ? "true"
                                : editData[col.key] === false
                                ? "false"
                                : ""
                            }
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                [col.key]:
                                  e.target.value === ""
                                    ? null
                                    : e.target.value === "true",
                              })
                            }
                          >
                            <option value="">null</option>
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : (
                          <Input
                            className="h-7 text-xs min-w-25"
                            value={(editData[col.key] as string) ?? ""}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                [col.key]: e.target.value || null,
                              })
                            }
                          />
                        )
                      ) : col.type === "boolean" ? (
                        row[col.key] === true ? (
                          <span className="text-green-600 font-medium">true</span>
                        ) : row[col.key] === false ? (
                          <span className="text-red-600 font-medium">false</span>
                        ) : (
                          <span className="text-muted-foreground">null</span>
                        )
                      ) : (
                        <span className="whitespace-nowrap">
                          {(row[col.key] as any) ?? (
                            <span className="text-muted-foreground">null</span>
                          )}
                        </span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    {editingId === row.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-green-600 hover:text-green-700"
                          onClick={saveEdit}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(row)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600 hover:text-red-700"
                          onClick={() => setDeleteConfirmId(row.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        {/* Left: showing info + rows per page */}
        <div className="flex items-center gap-3 text-muted-foreground">
          <span>
            Showing{" "}
            <span className="font-medium text-foreground">
              {rows.length > 0 ? (meta.page - 1) * limit + 1 : 0}
            </span>
            {"–"}
            <span className="font-medium text-foreground">
              {Math.min(meta.page * limit, meta.total)}
            </span>
            {" of "}
            <span className="font-medium text-foreground">{meta.total}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs">Rows:</span>
            <select
              className="h-7 rounded border px-1.5 text-xs bg-background cursor-pointer"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: navigation */}
        <div className="flex items-center gap-1">
          {/* First page */}
          <Button
            variant="outline" size="icon" className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => setPage(1)}
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Prev page */}
          <Button
            variant="outline" size="icon" className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page number buttons */}
          {(() => {
            const total = meta.lastPage;
            const current = meta.page;
            const pages: (number | "...")[] = [];

            if (total <= 7) {
              for (let i = 1; i <= total; i++) pages.push(i);
            } else {
              pages.push(1);
              if (current > 3) pages.push("...");
              const start = Math.max(2, current - 1);
              const end = Math.min(total - 1, current + 1);
              for (let i = start; i <= end; i++) pages.push(i);
              if (current < total - 2) pages.push("...");
              pages.push(total);
            }

            return pages.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === current ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </Button>
              )
            );
          })()}

          {/* Next page */}
          <Button
            variant="outline" size="icon" className="h-8 w-8"
            disabled={page >= meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          <Button
            variant="outline" size="icon" className="h-8 w-8"
            disabled={page >= meta.lastPage}
            onClick={() => setPage(meta.lastPage)}
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>

          {/* Go-to input */}
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Go to</span>
            <input
              type="number"
              min={1}
              max={meta.lastPage}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const n = parseInt(pageInput);
                  if (!isNaN(n) && n >= 1 && n <= meta.lastPage) {
                    setPage(n);
                  }
                  setPageInput("");
                }
              }}
              placeholder={String(meta.page)}
              className="h-8 w-14 rounded border px-2 text-xs bg-background text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Row</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {columns
              .filter((col) => col.editable)
              .map((col) => (
                <div key={String(col.key)} className="grid gap-1.5">
                  <label className="text-xs font-medium">{col.label}</label>
                  {col.type === "boolean" ? (
                    <select
                      className="border rounded px-2 py-1.5 text-sm bg-background"
                      value={
                        newRowData[col.key] === true
                          ? "true"
                          : newRowData[col.key] === false
                          ? "false"
                          : ""
                      }
                      onChange={(e) =>
                        setNewRowData({
                          ...newRowData,
                          [col.key]:
                            e.target.value === "" ? null : e.target.value === "true",
                        })
                      }
                    >
                      <option value="">null</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <Input
                      className="text-sm"
                      value={(newRowData[col.key] as string) ?? ""}
                      onChange={(e) =>
                        setNewRowData({
                          ...newRowData,
                          [col.key]: e.target.value || null,
                        })
                      }
                    />
                  )}
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this row? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Selected Rows</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You are about to permanently delete{" "}
            <span className="font-semibold text-foreground">
              {selectedIds.size} row{selectedIds.size > 1 ? "s" : ""}
            </span>
            . This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Delete {selectedIds.size} Row{selectedIds.size > 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ───

export default function LookupManagementPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          <h1 className="text-xl font-semibold">Lookup Data Management</h1>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5 shrink-0 self-start sm:self-center"
        >
          <a
            href="https://drive.google.com/drive/folders/1aLST1pakPfiGUQ_Pww5I7CQiNw1bMCDv"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Download Template Upload</span>
          </a>
        </Button>
      </div>

      <Card className="dark:bg-slate-900">
        <CardContent className="pt-0">
          <Tabs defaultValue="account-mapping">
            <TabsList className="mb-4 dark:bg-slate-800">
              <TabsTrigger value="account-mapping">Account Mapping</TabsTrigger>
              <TabsTrigger value="lookup-kip">Lookup KIP</TabsTrigger>
              <TabsTrigger value="lookup-agent">Lookup Agent</TabsTrigger>
            </TabsList>

            <TabsContent value="account-mapping">
              <EditableTable<AccountMappingRow>
                table="account-mapping"
                columns={accountMappingColumns}
                hooks={accountMappingHooks}
                defaultNewRow={{ b2b_account_id: "" }}
              />
            </TabsContent>

            <TabsContent value="lookup-kip">
              <EditableTable<LookupKIPRow>
                table="lookup-kip"
                columns={lookupKIPColumns}
                hooks={lookupKIPHooks}
                defaultNewRow={{}}
              />
            </TabsContent>

            <TabsContent value="lookup-agent">
              <EditableTable<LookupAgentRow>
                table="lookup-agent"
                columns={lookupAgentColumns}
                hooks={lookupAgentHooks}
                defaultNewRow={{}}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
