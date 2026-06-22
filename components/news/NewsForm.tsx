"use client";

import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import { Extension, Mark, mergeAttributes, CommandProps } from "@tiptap/core";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNews } from "@/hooks/use-news";
import { useAuth } from "@/hooks/use-auth";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  RemoveFormatting,
  Table as TableIcon,
  ImageIcon,
  FileText,
  Save,
  User,
  Info,
  FileQuestion,
  AlertCircle,
  Newspaper,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileCheck,
  BookOpen,
  ArrowRight,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Underline as UnderlineIcon,
  Eraser,
  Link as LinkIcon,
  Maximize2,
  Minimize2,
  HelpCircle,
  ChevronDown,
  Palette,
  Type,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";

// Helper function to extract the first image in TipTap JSON for dynamic cover preview
const extractFirstImage = (content: any): string | null => {
  if (!content) return null;
  if (content.type === "image" && content.attrs?.src) {
    return content.attrs.src;
  }
  if (Array.isArray(content.content)) {
    for (const child of content.content) {
      const img = extractFirstImage(child);
      if (img) return img;
    }
  }
  return null;
};

const MenuButton = ({
  icon: Icon,
  isActive,
  onClick,
  tooltip,
}: {
  icon: any;
  isActive?: boolean;
  onClick: () => void;
  tooltip: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer border border-transparent",
          isActive && "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-650 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60 shadow-2xs font-bold scale-102 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
        )}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
      >
        <Icon className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 text-xs">
      {tooltip}
    </TooltipContent>
  </Tooltip>
);

const Toolbar = ({
  editor,
  handleInsertTable,
  handleFileUpload,
  isUploadingImage,
  isFullscreen,
  setIsFullscreen,
  showCodeView,
  toggleCodeView,
}: any) => {
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => {
      setTick((t) => t + 1);
    };
    editor.on("transaction", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);
    return () => {
      editor.off("transaction", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor]);

  if (!editor) return null;

  const currentFontValue = (editor as any).getAttributes("fontFamily").fontFamily || "";
  const currentFontName = fonts.find((f) => f.value.includes(currentFontValue))?.name || "Font Family";
  const currentColorValue = (editor as any).getAttributes("textColor").color || "";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap items-center gap-2 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 p-2.5 sticky top-0 z-10 select-none">
        
        {/* Group 1: Magic Wand (Style) */}
        <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-md p-0.5 shadow-2xs">
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer font-bold text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-505" />
                    <span className="max-w-[70px] truncate">
                      {editor.isActive("heading", { level: 1 })
                        ? "Heading 1"
                        : editor.isActive("heading", { level: 2 })
                        ? "Heading 2"
                        : editor.isActive("blockquote")
                        ? "Kutipan"
                        : editor.isActive("codeBlock")
                        ? "Blok Kode"
                        : "Normal"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 text-xs">Pilih Gaya Teks</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-48 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl shadow-xl flex flex-col gap-0.5" align="start">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-between text-xs font-medium rounded-lg h-8 px-2.5 w-full flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent",
                  (!editor.isActive("heading") && !editor.isActive("blockquote") && !editor.isActive("codeBlock")) && "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border-indigo-100 dark:border-indigo-900/40"
                )}
                onClick={() => editor.chain().focus().setParagraph().run()}
              >
                <span>Normal (Paragraf)</span>
                {!editor.isActive("heading") && !editor.isActive("blockquote") && !editor.isActive("codeBlock") && (
                  <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-between text-xs font-medium rounded-lg h-8 px-2.5 w-full flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent",
                  editor.isActive("heading", { level: 1 }) && "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border-indigo-100 dark:border-indigo-900/40"
                )}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              >
                <span className="text-sm font-bold">Heading 1</span>
                {editor.isActive("heading", { level: 1 }) && (
                  <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-between text-xs font-medium rounded-lg h-8 px-2.5 w-full flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent",
                  editor.isActive("heading", { level: 2 }) && "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border-indigo-100 dark:border-indigo-900/40"
                )}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <span className="text-xs font-bold">Heading 2</span>
                {editor.isActive("heading", { level: 2 }) && (
                  <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-between text-xs font-medium rounded-lg h-8 px-2.5 w-full flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent",
                  editor.isActive("blockquote") && "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border-indigo-100 dark:border-indigo-900/40"
                )}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                <span className="italic">Kutipan</span>
                {editor.isActive("blockquote") && (
                  <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-between text-xs font-mono rounded-lg h-8 px-2.5 w-full flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent",
                  editor.isActive("codeBlock") && "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border-indigo-100 dark:border-indigo-900/40"
                )}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              >
                <span>Blok Kode</span>
                {editor.isActive("codeBlock") && (
                  <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                )}
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        {/* Group 2: B / I / U / Eraser */}
        <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-md p-0.5 shadow-2xs">
          <MenuButton
            icon={Bold}
            isActive={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            tooltip="Tebal (Ctrl+B)"
          />
          <MenuButton
            icon={Italic}
            isActive={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            tooltip="Miring (Ctrl+I)"
          />
          <MenuButton
            icon={UnderlineIcon}
            isActive={(editor as any).isActive("underline")}
            onClick={() => (editor as any).chain().focus().toggleUnderline().run()}
            tooltip="Garis Bawah (Ctrl+U)"
          />
          <MenuButton
            icon={Eraser}
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            tooltip="Bersihkan Format"
          />
        </div>

        {/* Group 3: Font Family Dropdown */}
        <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-md p-0.5 shadow-2xs">
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer font-semibold text-xs"
                  >
                    <Type className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[80px]">{currentFontName}</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 text-xs">Pilih Font</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-48 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl shadow-xl flex flex-col gap-0.5" align="start">
              {fonts.map((f) => (
                <Button
                  key={f.name}
                  variant="ghost"
                  size="sm"
                  style={f.value ? { fontFamily: f.value } : {}}
                  className={cn(
                    "justify-between text-xs font-medium rounded-lg h-8 px-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 w-full flex items-center gap-2 border border-transparent",
                    (f.value ? currentFontValue === f.value : !currentFontValue) && "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border-indigo-100 dark:border-indigo-900/40"
                  )}
                  onClick={() => {
                    if (f.value) {
                      (editor as any).chain().focus().setFontFamily(f.value).run();
                    } else {
                      (editor as any).chain().focus().unsetFontFamily().run();
                    }
                  }}
                >
                  <span>{f.name}</span>
                  {(f.value ? currentFontValue === f.value : !currentFontValue) && (
                    <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
          <FontSizeSelector editor={editor} />
        </div>

        {/* Group 4: Text Color Selector */}
        <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-md p-0.5 shadow-2xs">
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 px-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer font-bold text-xs"
                  >
                    <Palette className="h-3.5 w-3.5" style={{ color: currentColorValue || undefined }} />
                    <span>Warna</span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 text-xs">Pilih Warna Teks</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-56 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl animate-in fade-in zoom-in-95" align="start">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Warna Teks</h4>
                <div className="grid grid-cols-5 gap-2">
                  {colors.map((c) => (
                    <Tooltip key={c.name}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "h-7 w-7 rounded-full border border-slate-200 dark:border-slate-800 relative transition-transform hover:scale-110 cursor-pointer flex items-center justify-center shadow-xs",
                            currentColorValue === c.value && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950"
                          )}
                          style={c.value ? { backgroundColor: c.value } : { backgroundColor: "transparent" }}
                          onClick={() => {
                            if (c.value) {
                              (editor as any).chain().focus().setTextColor(c.value).run();
                            } else {
                              (editor as any).chain().focus().unsetTextColor().run();
                            }
                          }}
                        >
                          {currentColorValue === c.value && (
                            <Check className={cn("h-3.5 w-3.5", (c.value === "#ffffff" || c.value === "" || c.value === "#eab308") ? "text-slate-850" : "text-white")} />
                          )}
                          {!c.value && currentColorValue && <RemoveFormatting className="h-3.5 w-3.5 text-slate-400" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-800">{c.name}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Group 5: Paragraph Formatting Group */}
        <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-md p-0.5 shadow-2xs">
          <MenuButton
            icon={List}
            isActive={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            tooltip="Daftar Bulatan"
          />
          <MenuButton
            icon={ListOrdered}
            isActive={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            tooltip="Daftar Angka"
          />
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                    {editor.isActive({ textAlign: "center" }) ? (
                      <AlignCenter className="h-4 w-4" />
                    ) : editor.isActive({ textAlign: "right" }) ? (
                      <AlignRight className="h-4 w-4" />
                    ) : editor.isActive({ textAlign: "justify" }) ? (
                      <AlignJustify className="h-4 w-4" />
                    ) : (
                      <AlignLeft className="h-4 w-4" />
                    )}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 text-xs">Pilih Perataan Paragraf</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-40 p-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl flex flex-col gap-0.5" align="start">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start gap-2 text-xs font-medium rounded-lg h-8 px-2",
                  editor.isActive({ textAlign: "left" }) && "bg-slate-100 dark:bg-slate-800 font-bold"
                )}
                onClick={() => (editor as any).chain().focus().setTextAlign("left").run()}
              >
                <AlignLeft className="h-3.5 w-3.5" /> Rata Kiri
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start gap-2 text-xs font-medium rounded-lg h-8 px-2",
                  editor.isActive({ textAlign: "center" }) && "bg-slate-100 dark:bg-slate-800 font-bold"
                )}
                onClick={() => (editor as any).chain().focus().setTextAlign("center").run()}
              >
                <AlignCenter className="h-3.5 w-3.5" /> Rata Tengah
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start gap-2 text-xs font-medium rounded-lg h-8 px-2",
                  editor.isActive({ textAlign: "right" }) && "bg-slate-100 dark:bg-slate-800 font-bold"
                )}
                onClick={() => (editor as any).chain().focus().setTextAlign("right").run()}
              >
                <AlignRight className="h-3.5 w-3.5" /> Rata Kanan
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start gap-2 text-xs font-medium rounded-lg h-8 px-2",
                  editor.isActive({ textAlign: "justify" }) && "bg-slate-100 dark:bg-slate-800 font-bold"
                )}
                onClick={() => (editor as any).chain().focus().setTextAlign("justify").run()}
              >
                <AlignJustify className="h-3.5 w-3.5" /> Justify (Rata Penuh)
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        {/* Group 6: Table creator */}
        <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-md p-0.5 shadow-2xs">
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                    <TableIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 text-xs">Sisipkan Tabel</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-64 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl shadow-xl animate-in fade-in zoom-in-95" align="end">
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dimensi Tabel</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Baris</span>
                      <Input type="number" min={1} className="h-8 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl" value={tableRows} onChange={(e) => setTableRows(Number(e.target.value))} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Kolom</span>
                      <Input type="number" min={1} className="h-8 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl" value={tableCols} onChange={(e) => setTableCols(Number(e.target.value))} />
                    </div>
                  </div>
                </div>
                <Button className="w-full h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer" onClick={() => handleInsertTable(tableRows, tableCols)}>
                  Buat Tabel
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Group 7: Insert (Link, Image, PDF) */}
        <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-md p-0.5 shadow-2xs">
          <LinkPopoverButton editor={editor} />

          <input type="file" id="img-up" hidden accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { handleFileUpload(e.target.files[0], "image"); } e.target.value = ""; }} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isUploadingImage}
                className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-60"
                onClick={() => document.getElementById("img-up")?.click()}
              >
                {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 text-xs">
              {isUploadingImage ? "Mengunggah gambar..." : "Unggah Gambar"}
            </TooltipContent>
          </Tooltip>

          <input type="file" id="pdf-up" hidden accept=".pdf" onChange={(e) => { if (e.target.files?.[0]) { handleFileUpload(e.target.files[0], "pdf"); } e.target.value = ""; }} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer" onClick={() => document.getElementById("pdf-up")?.click()}>
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 text-xs">Unggah Dokumen PDF</TooltipContent>
          </Tooltip>
        </div>

        {/* Group 8: View / Action Group */}
        <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-md p-0.5 shadow-2xs sm:ml-auto">
          {/* Fullscreen Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4 text-indigo-550 font-bold" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 text-xs">
              {isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
            </TooltipContent>
          </Tooltip>
        </div>

      </div>
    </TooltipProvider>
  );
};

const Underline = Mark.create({
  name: "underline",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: "u",
      },
      {
        style: "text-decoration",
        consuming: false,
        getAttrs: (value) => (value as string).includes("underline") ? {} : false,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["u", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleUnderline:
        () =>
        ({ commands }: { commands: any }) => {
          return commands.toggleMark(this.name);
        },
    } as any;
  },
});

const FontFamily = Mark.create({
  name: "fontFamily",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-font-family") || element.style.fontFamily?.replace(/['"]/g, ""),
        renderHTML: (attributes) => {
          if (!attributes.fontFamily) {
            return {};
          }
          return {
            "data-font-family": attributes.fontFamily,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-font-family]",
      },
      {
        style: "font-family",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily: string) =>
        ({ commands }: { commands: any }) => {
          return commands.setMark(this.name, { fontFamily });
        },
      unsetFontFamily:
        () =>
        ({ commands }: { commands: any }) => {
          return commands.unsetMark(this.name);
        },
    } as any;
  },
});

const FontSize = Mark.create({
  name: "fontSize",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-font-size") || element.style.fontSize?.replace(/['"]/g, ""),
        renderHTML: (attributes) => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            "data-font-size": attributes.fontSize,
            style: `font-size: ${attributes.fontSize} !important;`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-font-size]",
      },
      {
        style: "font-size",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ commands }: { commands: any }) => {
          return commands.setMark(this.name, { fontSize });
        },
      unsetFontSize:
        () =>
        ({ commands }: { commands: any }) => {
          return commands.unsetMark(this.name);
        },
    } as any;
  },
});

const TextColor = Mark.create({
  name: "textColor",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-text-color") || element.style.color,
        renderHTML: (attributes) => {
          if (!attributes.color) {
            return {};
          }
          return {
            "data-text-color": attributes.color,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-text-color]",
      },
      {
        style: "color",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setTextColor:
        (color: string) =>
        ({ commands }: { commands: any }) => {
          return commands.setMark(this.name, { color });
        },
      unsetTextColor:
        () =>
        ({ commands }: { commands: any }) => {
          return commands.unsetMark(this.name);
        },
    } as any;
  },
});

const CustomLink = Mark.create({
  name: "customLink",

  addOptions() {
    return {
      HTMLAttributes: {
        target: "_blank",
        rel: "noopener noreferrer nofollow",
        class: "text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer font-bold",
      },
    };
  },

  addAttributes() {
    return {
      href: {
        default: null,
      },
      target: {
        default: this.options.HTMLAttributes.target,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "a[href]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["a", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setCustomLink:
        (attributes: { href: string; target?: string }) =>
        ({ commands }: { commands: any }) => {
          return commands.setMark(this.name, attributes);
        },
      unsetCustomLink:
        () =>
        ({ commands }: { commands: any }) => {
          return commands.unsetMark(this.name);
        },
    } as any;
  },
});

const fonts = [
  { name: "Default Font", value: "" },
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Courier New", value: "'Courier New', Courier, monospace" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { name: "Impact", value: "Impact, Charcoal, sans-serif" },
  { name: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { name: "Verdana", value: "Verdana, Geneva, sans-serif" },
];

const colors = [
  { name: "Default", value: "" },
  { name: "Hitam", value: "#000000" },
  { name: "Abu Gelap", value: "#334155" },
  { name: "Merah", value: "#ef4444" },
  { name: "Oranye", value: "#f97316" },
  { name: "Kuning", value: "#eab308" },
  { name: "Hijau", value: "#22c55e" },
  { name: "Biru", value: "#3b82f6" },
  { name: "Ungu", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
];

const fontSizes = [
  { name: "Normal", value: "" },
  { name: "10px", value: "10px" },
  { name: "12px", value: "12px" },
  { name: "14px", value: "14px" },
  { name: "16px", value: "16px" },
  { name: "18px", value: "18px" },
  { name: "20px", value: "20px" },
  { name: "24px", value: "24px" },
  { name: "30px", value: "30px" },
  { name: "36px", value: "36px" },
];

const FontSizeSelector = ({ editor }: { editor: any }) => {
  const currentFontSizeValue = (editor as any).getAttributes("fontSize").fontSize || "";
  const [inputValue, setInputValue] = useState(currentFontSizeValue ? parseInt(currentFontSizeValue).toString() : "");

  useEffect(() => {
    setInputValue(currentFontSizeValue ? parseInt(currentFontSizeValue).toString() : "");
  }, [currentFontSizeValue]);

  const handleApply = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      (editor as any).chain().focus().setFontSize(`${num}px`).run();
      setInputValue(num.toString());
    } else {
      (editor as any).chain().focus().unsetFontSize().run();
      setInputValue("");
    }
  };

  return (
    <div className="flex items-center ml-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-md shadow-2xs h-8">
      <input
        type="text"
        className="w-8 h-full bg-transparent text-xs text-center border-none outline-none focus:ring-0 text-slate-700 dark:text-slate-200"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={() => handleApply(inputValue)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleApply(inputValue);
          }
        }}
        placeholder="Aa"
      />
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button className="h-full px-1 border-l border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 rounded-r-md transition-colors cursor-pointer">
                <ChevronDown className="h-3 w-3 opacity-80" />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 text-xs">
            Pilih Ukuran Teks
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-32 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl shadow-xl flex flex-col gap-0.5" align="start">
          {fontSizes.map((f) => (
            <Button
              key={f.name}
              variant="ghost"
              size="sm"
              className={cn(
                "justify-between text-xs font-medium rounded-lg h-8 px-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 w-full flex items-center gap-2 border border-transparent",
                (f.value ? currentFontSizeValue === f.value : !currentFontSizeValue) && "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border-indigo-100 dark:border-indigo-900/40"
              )}
              onClick={() => {
                if (f.value) {
                  (editor as any).chain().focus().setFontSize(f.value).run();
                  setInputValue(parseInt(f.value).toString());
                } else {
                  (editor as any).chain().focus().unsetFontSize().run();
                  setInputValue("");
                }
              }}
            >
              <span>{f.name}</span>
              {(f.value ? currentFontSizeValue === f.value : !currentFontSizeValue) && (
                <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
              )}
            </Button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
};

const LinkPopoverButton = ({ editor }: { editor: any }) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(true);

  const handleOpenChange = (open: boolean) => {
    if (open && editor) {
      const attrs = editor.getAttributes("customLink");
      setLinkUrl(attrs?.href || "");
      setOpenInNewTab(attrs?.target === "_blank");

      const { from, to } = editor.state.selection;
      if (from !== to) {
        setLinkText(editor.state.doc.textBetween(from, to, " "));
      } else {
        setLinkText("");
      }
    }
  };

  const handleApplyLink = () => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (url) {
      const target = openInNewTab ? "_blank" : "_self";
      if (linkText) {
        editor.chain().focus().insertContent(`<a href="${url}" target="${target}">${linkText}</a>`).run();
      } else {
        editor.chain().focus().setCustomLink({ href: url, target }).run();
      }
    } else {
      editor.chain().focus().unsetCustomLink().run();
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className={cn(
                "h-8 w-8 p-0 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer",
                editor?.isActive("customLink") && "bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400"
              )}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 text-xs">
          Insert Link
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-[380px] p-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xl animate-in fade-in zoom-in-95 rounded-md" align="start">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-[15px]">Insert Link</h4>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Text to display</label>
            <Input
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-md shadow-sm"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">To what URL should this link go?</label>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="h-9 text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-md shadow-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={openInNewTab}
              onChange={(e) => setOpenInNewTab(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
            />
            Open in new window
          </label>
        </div>
        
        <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 px-4 py-3 bg-white dark:bg-slate-900/20">
          {editor?.isActive("customLink") && (
            <Button
              variant="ghost"
              type="button"
              className="h-9 mr-auto text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md"
              onClick={() => {
                editor.chain().focus().unsetCustomLink().run();
                setLinkUrl("");
              }}
            >
              Hapus
            </Button>
          )}
          <Button
            type="button"
            className="h-9 px-4 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium"
            onClick={handleApplyLink}
          >
            Insert Link
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const HiddenText = Mark.create({
  name: 'hiddenText',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'hidden-pdf-text',
        style: 'display: none; visibility: hidden; opacity: 0; font-size: 0; width: 0; height: 0; overflow: hidden;',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span.hidden-pdf-text',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },
});

const ImageExtension = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) => {
          const raw = element.getAttribute("data-width") || element.style.width || element.getAttribute("width");
          if (!raw) return "100%";
          return raw.endsWith("%") ? raw : `${raw}`;
        },
        renderHTML: (attributes) => {
          const width = attributes.width || "100%";
          const align = attributes.align || "center";
          return {
            "data-width": width,
            "data-align": align,
          };
        },
      },
      align: {
        default: "center",
        parseHTML: (element) => {
          const align = element.getAttribute("data-align");
          if (align === "left" || align === "center" || align === "right") return align;
          return "center";
        },
        renderHTML: () => ({}),
      },
    };
  },
});

const TextAlignExtension = Extension.create({
  name: "textAlign",
  addGlobalAttributes() {
    return [
      {
        types: ["heading", "paragraph", "blockquote"],
        attributes: {
          textAlign: {
            default: "left",
            parseHTML: (element) => {
              const inlineAlign = element.style.textAlign;
              const dataAlign = element.getAttribute("data-text-align");
              const align = inlineAlign || dataAlign || "left";
              if (align === "left" || align === "center" || align === "right" || align === "justify") {
                return align;
              }
              return "left";
            },
            renderHTML: (attributes) => {
              if (!attributes.textAlign || attributes.textAlign === "left") return {};
              return {
                "data-text-align": attributes.textAlign,
                style: `text-align: ${attributes.textAlign} !important;`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setTextAlign:
        (textAlign: "left" | "center" | "right" | "justify") =>
        ({ state, dispatch }: CommandProps) => {
          const allowedTypes = new Set(["paragraph", "heading", "blockquote"]);
          const { from, to, $from } = state.selection;
          let changed = false;
          const tr = state.tr;

          // Collapsed selection: apply on current block
          if (from === to) {
            const parent = $from.parent;
            if (allowedTypes.has(parent.type.name)) {
              const parentPos = $from.before();
              tr.setNodeMarkup(parentPos, undefined, {
                ...parent.attrs,
                textAlign,
              });
              changed = true;
            }
          } else {
            state.doc.nodesBetween(from, to, (node, pos) => {
              if (!allowedTypes.has(node.type.name)) return;
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                textAlign,
              });
              changed = true;
            });
          }

          if (changed && dispatch) {
            dispatch(tr);
          }
          return changed;
        },
      unsetTextAlign:
        () =>
        ({ state, dispatch }: CommandProps) => {
          const allowedTypes = new Set(["paragraph", "heading", "blockquote"]);
          const { from, to, $from } = state.selection;
          let changed = false;
          const tr = state.tr;

          if (from === to) {
            const parent = $from.parent;
            if (allowedTypes.has(parent.type.name)) {
              const parentPos = $from.before();
              tr.setNodeMarkup(parentPos, undefined, {
                ...parent.attrs,
                textAlign: "left",
              });
              changed = true;
            }
          } else {
            state.doc.nodesBetween(from, to, (node: ProseMirrorNode, pos: number) => {
              if (!allowedTypes.has(node.type.name)) return;
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                textAlign: "left",
              });
              changed = true;
            });
          }

          if (changed && dispatch) {
            dispatch(tr);
          }
          return changed;
        },
    } as any;
  },
});

export function NewsForm({
  initialData,
  onSubmit,
}: {
  initialData?: any;
  onSubmit: (data: any) => void;
}) {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [title, setTitle] = useState(initialData?.title || "");
  const [author, setAuthor] = useState(initialData?.authorName || "");
  const [category, setCategory] = useState(initialData?.category || "Informasi");
  const [error, setError] = useState<string | null>(null);
  const [savingType, setSavingType] = useState<"IDLE" | "DRAFT" | "PUBLISHED">("IDLE");
  const isSaving = savingType !== "IDLE";
  const [isHydratedFromDraft, setIsHydratedFromDraft] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragOverEditor, setIsDragOverEditor] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);
  const [codeViewValue, setCodeViewValue] = useState("");

  const { uploadFile } = useNews();
  const isEditMode = !!initialData?.id;
  const draftStorageKey = useMemo(() => {
    if (isEditMode && initialData?.id) return `news-form-draft-edit-${initialData.id}`;
    return "news-form-draft-create";
  }, [initialData?.id, isEditMode]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlignExtension,
      ImageExtension,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      HiddenText,
      Underline,
      FontFamily,
      FontSize,
      TextColor,
      CustomLink,
    ],
    content: initialData?.content || "",
    editorProps: {
      attributes: {
        class: "tiptap-editor prose dark:prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[350px] text-slate-800 dark:text-slate-200",
      },
    },
    onUpdate: () => {
      setHasUnsavedChanges(true);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    setTitle(initialData?.title ?? "");
    setAuthor(initialData?.authorName ?? "");
    setCategory(initialData?.category ?? "Informasi");
  }, [initialData]);

  useEffect(() => {
    if (!editor) return;
    if (initialData?.content) {
      editor.commands.setContent(initialData.content);
    }
  }, [editor, initialData?.content]);

  useEffect(() => {
    if (!editor || isEditMode) return;
    const raw = window.localStorage.getItem(draftStorageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.title) setTitle(parsed.title);
      if (parsed?.authorName) setAuthor(parsed.authorName);
      if (parsed?.category) setCategory(parsed.category);
      if (parsed?.content) editor.commands.setContent(parsed.content);
      setIsHydratedFromDraft(true);
      setHasUnsavedChanges(false);
      toast.message("Draft lokal dipulihkan.");
    } catch (e) {
      console.error("Failed to restore local draft", e);
    }
  }, [draftStorageKey, editor, isEditMode]);

  useEffect(() => {
    if (!editor || isSaving) return;
    const timeout = window.setTimeout(() => {
      if (showCodeView) {
        editor.commands.setContent(codeViewValue);
      }
      const content = editor.getJSON();
      const plainText = editor.getText().trim();
      const payload = {
        title: title.trim(),
        authorName: author.trim(),
        category,
        content,
        updatedAt: new Date().toISOString(),
      };

      const hasContent =
        payload.title.length > 0 ||
        payload.authorName.length > 0 ||
        plainText.length > 0;

      if (hasContent) {
        window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [author, category, draftStorageKey, editor, isSaving, title, showCodeView, codeViewValue]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleHotkey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "enter") {
        event.preventDefault();
        if (!isSaving) saveNews("PUBLISHED");
      }
    };
    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, [isSaving]);

  const clearLocalDraft = () => {
    window.localStorage.removeItem(draftStorageKey);
    setIsHydratedFromDraft(false);
    toast.success("Draft lokal dihapus.");
  };

  const handleInsertTable = (rows: number, cols: number) => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .focus()
      .run();
  };

  const handleFileUpload = async (file: File, type: "image" | "pdf") => {
    try {
      if (type === "image") {
        setIsUploadingImage(true);
      }
      const toastId = toast.loading("Mengunggah file...");
      const data = await uploadFile(file);
      const urlPath = data.url.startsWith("/") ? data.url : `/${data.url}`;
      let fullUrl = data.url;

      if (!data.url.startsWith("http")) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const apiOrigin = apiUrl ? new URL(apiUrl).origin : null;

        if (apiOrigin && typeof window !== "undefined" && apiOrigin !== window.location.origin) {
          fullUrl = `${apiOrigin}${urlPath}`;
        } else if (typeof window !== "undefined") {
          fullUrl = `${window.location.origin}${urlPath}`;
        } else {
          const baseApiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api").replace(/\/$/, "");
          const serverRoot = baseApiUrl.replace(/\/api$/, "");
          fullUrl = `${serverRoot}${urlPath}`;
        }
      }

      if (type === "image") {
        const cleanedName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim();
        const altText = title.trim() || cleanedName || "Gambar berita";
        const imageAttrs = {
          src: fullUrl,
          alt: altText,
          title: altText,
          width: "100%",
        } as any;

        editor
          ?.chain()
          .focus()
          .insertContent([{ type: "image", attrs: imageAttrs }, { type: "paragraph" }])
          .focus()
          .run();
        setHasUnsavedChanges(true);
      } else {
        editor
          ?.chain()
          .focus()
          .insertContent({
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: data.name,
                marks: [
                  {
                    type: 'customLink',
                    attrs: {
                      href: fullUrl,
                      target: '_blank',
                    },
                  },
                  {
                    type: 'hiddenText',
                  },
                ],
              },
            ],
          })
          .run();
      }
      toast.success("File berhasil diunggah", { id: toastId });
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("File upload gagal.");
    } finally {
      if (type === "image") {
        setIsUploadingImage(false);
      }
    }
  };

  const handleEditorDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer?.files?.length) return;
    event.preventDefault();
    setIsDragOverEditor(false);
    const imageFile = Array.from(event.dataTransfer.files).find((file) => file.type.startsWith("image/"));
    if (!imageFile) return;
    await handleFileUpload(imageFile, "image");
  };

  const handleEditorDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    event.preventDefault();
    setIsDragOverEditor(true);
  };

  const handleEditorDragLeave = () => {
    setIsDragOverEditor(false);
  };

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onPaste = async (event: ClipboardEvent) => {
      const items = Array.from(event.clipboardData?.items ?? []);
      const pastedImage = items.find((item) => item.type.startsWith("image/"));
      if (!pastedImage) return;
      const file = pastedImage.getAsFile();
      if (!file) return;
      event.preventDefault();
      await handleFileUpload(file, "image");
    };

    dom.addEventListener("paste", onPaste);
    return () => dom.removeEventListener("paste", onPaste);
  }, [editor, title]);

  const handleCodeViewBlur = () => {
    if (editor && codeViewValue !== editor.getHTML()) {
      editor.commands.setContent(codeViewValue);
      setHasUnsavedChanges(true);
    }
  };

  const toggleCodeView = () => {
    if (!editor) return;
    if (showCodeView) {
      editor.commands.setContent(codeViewValue);
      setShowCodeView(false);
    } else {
      setCodeViewValue(editor.getHTML());
      setShowCodeView(true);
    }
  };

  const saveNews = async (statusToSave: string = "PUBLISHED") => {
    if (!editor) {
      setError("Editor belum siap. Mohon tunggu sebentar.");
      return;
    }

    if (showCodeView) {
      editor.commands.setContent(codeViewValue);
    }

    const contentJson = editor.getJSON();
    
    // Custom text extractor that ignores PDF links and embeds
    const extractCleanText = (node: any): string => {
      if (!node) return "";
      let text = "";
      if (node.type === "text") {
        const isPdfLink = node.marks?.some(
          (m: any) => (m.type === "link" || m.type === "customLink") && m.attrs?.href?.endsWith(".pdf")
        );
        if (!isPdfLink) {
          text += node.text;
        }
      } else if (node.type === "pdfEmbed") {
        // skip legacy pdf embeds
      } else if (node.content) {
        node.content.forEach((child: any) => {
          text += extractCleanText(child);
        });
        if (node.type === "paragraph" || node.type === "heading") {
          text += " ";
        }
      }
      return text;
    };

    const rawText = extractCleanText(contentJson).replace(/\s{2,}/g, " ").trim();

    if (!title.trim() || !rawText) {
      setError("Judul dan isi artikel wajib diisi.");
      toast.error("Form tidak lengkap. Silakan lengkapi judul dan isi artikel.");
      return;
    }

    const summary = rawText.length > 220 ? `${rawText.slice(0, 220)}...` : rawText;
    setError(null);
    setSavingType(statusToSave as "DRAFT" | "PUBLISHED");

    try {
      await onSubmit({
        title: title.trim(),
        authorName: author.trim(),
        content: contentJson,
        summary,
        category,
        status: statusToSave,
      });
      window.localStorage.removeItem(draftStorageKey);
      setHasUnsavedChanges(false);
      setIsHydratedFromDraft(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingType("IDLE");
    }
  };

  const wordCount = editor?.getText().trim().split(/\s+/).filter(Boolean).length ?? 0;
  const estimatedReadMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const applyImageWidth = (width: "33%" | "50%" | "75%" | "100%") => {
    editor?.chain().focus().updateAttributes("image", { width }).run();
    setHasUnsavedChanges(true);
  };
  const applyImageAlign = (align: "left" | "center" | "right") => {
    editor?.chain().focus().updateAttributes("image", { align }).run();
    setHasUnsavedChanges(true);
  };





  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-full w-full select-none text-slate-800 dark:text-slate-100 animate-pulse">
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">
          {/* Title input skeleton */}
          <div className="h-10 border-b border-slate-200 dark:border-slate-800/80 w-3/4 pb-3" />
          
          {/* Editor skeleton */}
          <div className="flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl shadow-sm overflow-hidden h-[480px]">
            <div className="h-12 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" />
            <div className="flex-1 p-5 space-y-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-900 rounded-md w-1/3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-900 rounded-md w-5/6" />
              <div className="h-4 bg-slate-200 dark:bg-slate-900 rounded-md w-2/3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-900 rounded-md w-1/2" />
            </div>
            <div className="h-9 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800" />
          </div>
        </div>
        
        {/* Sidebar skeleton */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/60 p-6 h-[400px]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-full w-full select-none text-slate-800 dark:text-slate-100">
      
      {/* LEFT COLUMN: Notion-Style Live Writing Canvas (col-span-8) */}
      <div className="lg:col-span-8 flex flex-col gap-6 w-full">
        


        {/* Notion-Style Write Title canvas */}
        <div className="relative group w-full">
          <input
            placeholder="Ketik Judul Pengumuman Korporat..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasUnsavedChanges(true);
            }}
            className="w-full bg-transparent border-b border-slate-200 dark:border-slate-900 pb-3 text-3xl font-extrabold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-850 focus:outline-none focus:border-slate-350 dark:focus:border-slate-800 transition-colors"
          />
        </div>

        {/* Tiptap Text Canvas Editor Workspace */}
        {/* Unified Summernote-Style Rich Text Editor Card */}
        <div className={cn(
          "tiptap-editor flex flex-col border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl shadow-sm overflow-hidden select-none transition-all",
          isFullscreen && "fixed inset-0 z-50 h-screen w-screen p-0 max-h-screen max-w-full rounded-none"
        )}>
          {/* Boxed Top-Bar Segmented Toolbar */}
          <Toolbar
            editor={editor}
            handleInsertTable={handleInsertTable}
            handleFileUpload={handleFileUpload}
            isUploadingImage={isUploadingImage}
            isFullscreen={isFullscreen}
            setIsFullscreen={setIsFullscreen}
            showCodeView={showCodeView}
            toggleCodeView={toggleCodeView}
          />
          
          {/* Summernote Boxed Editor Content Area */}
          <div
            className={cn(
              "prose-container relative p-5 bg-white dark:bg-slate-950 overflow-y-auto focus-within:outline-none transition-colors border-b border-slate-200 dark:border-slate-800 shadow-inner",
              isDragOverEditor && "bg-indigo-50/10 dark:bg-indigo-950/5",
              isFullscreen ? "flex-1 min-h-[calc(100vh-140px)]" : "min-h-[380px] max-h-[600px]"
            )}
            onDrop={handleEditorDrop}
            onDragOver={handleEditorDragOver}
            onDragLeave={handleEditorDragLeave}
          >
            {isDragOverEditor && (
              <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-lg border border-dashed border-indigo-400 bg-indigo-500/10 text-xs font-semibold text-indigo-700 dark:text-indigo-300 animate-pulse">
                Lepas gambar di sini untuk upload
              </div>
            )}
            {showCodeView ? (
              <textarea
                value={codeViewValue}
                onChange={(e) => setCodeViewValue(e.target.value)}
                onBlur={handleCodeViewBlur}
                className="w-full h-full min-h-[380px] bg-slate-900 text-slate-100 font-mono p-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-slate-800 focus:border-slate-700"
                style={isFullscreen ? { height: "calc(100vh - 180px)", resize: "none" } : { height: "400px" }}
              />
            ) : (
              <>
                {editor && (
                  <BubbleMenu 
                    editor={editor} 
                    shouldShow={({ editor: currentEditor }) => currentEditor.isActive("image")}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-1 shadow-2xl backdrop-blur-md select-none"
                  >
                    {(["33%", "50%", "75%", "100%"] as const).map((size) => (
                      <Button
                        key={size}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 rounded-lg px-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                          editor.getAttributes("image")?.width === size && "bg-indigo-600/90 text-white hover:bg-indigo-650"
                        )}
                        onMouseDown={(event) => {
                          event.preventDefault();
                        }}
                        onClick={() => applyImageWidth(size)}
                      >
                        {size}
                      </Button>
                    ))}
                    <Separator orientation="vertical" className="mx-1 h-5 bg-slate-200 dark:bg-slate-800" />
                    {([
                      { key: "left", Icon: AlignLeft },
                      { key: "center", Icon: AlignCenter },
                      { key: "right", Icon: AlignRight },
                    ] as const).map(({ key, Icon }) => (
                      <Button
                        key={key}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 w-8 p-0 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                          editor.getAttributes("image")?.align === key && "bg-indigo-600/90 text-white hover:bg-indigo-650"
                        )}
                        onMouseDown={(event) => {
                          event.preventDefault();
                        }}
                        onClick={() => applyImageAlign(key)}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    ))}
                    <Separator orientation="vertical" className="mx-1 h-5 bg-slate-200 dark:bg-slate-800" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onClick={() => editor.chain().focus().deleteSelection().run()}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </BubbleMenu>
                )}
                <EditorContent editor={editor} className="tiptap-editor-canvas" />
              </>
            )}
          </div>

          {/* Boxed Bottom Status-Bar & Draft Info Footer */}
          <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 font-medium">
              <span>{wordCount} kata</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span>Estimasi {estimatedReadMinutes} menit baca</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              {hasUnsavedChanges ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold animate-pulse">Perubahan belum tersimpan</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Tersimpan di draft lokal
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isHydratedFromDraft && (
                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Draft dipulihkan</span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearLocalDraft}
                className="h-7 rounded-lg px-2 text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
              >
                Hapus Draft Lokal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Ultra-Premium Live Analytics & Config Sidebar (col-span-4) */}
      <div className="lg:col-span-4 flex flex-col gap-6 w-full sticky top-4">
        
        {/* Settings Widget Panel */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/60 p-5 md:p-6 backdrop-blur-md shadow-xl dark:shadow-2xl space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-900 pb-3">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-505 dark:text-slate-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Detail Berita
            </h2>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Draft
            </span>
          </div>

          {/* Author Details Block */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              Penulis Berita
            </label>
            <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/90 px-3.5 py-3 focus-within:border-slate-350 dark:focus-within:border-slate-800 transition-all shadow-sm dark:shadow-inner">
              <div className="h-7 w-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-650 dark:text-indigo-400 uppercase">
                {author ? author.charAt(0) : "A"}
              </div>
              <input
                placeholder="Ketik nama penulis..."
                value={author}
                onChange={(e) => {
                  setAuthor(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none font-semibold"
              />
            </div>
          </div>

          {/* Premium HSL Glow Category Select Grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              Pilih Kategori
            </label>
            <div className="grid grid-cols-1 gap-2.5 w-full">
              {[
                { 
                  name: "News", 
                  icon: Newspaper, 
                  activeClass: "bg-sky-500/10 border-sky-500/40 text-sky-650 dark:text-sky-400 ", 
                  hoverClass: "hover:border-sky-300 dark:hover:border-sky-950/60 hover:bg-sky-50/30 dark:hover:bg-sky-950/5",
                  glowBg: "sky"
                },
                { 
                  name: "Informasi", 
                  icon: Info, 
                  activeClass: "bg-emerald-500/10 border-emerald-500/40 text-emerald-650 dark:text-emerald-400 ", 
                  hoverClass: "hover:border-emerald-300 dark:hover:border-emerald-950/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/5",
                  glowBg: "emerald"
                },
                { 
                  name: "Permintaan", 
                  icon: FileQuestion, 
                  activeClass: "bg-purple-500/10 border-purple-500/40 text-purple-650 dark:text-purple-400 ", 
                  hoverClass: "hover:border-purple-300 dark:hover:border-purple-950/60 hover:bg-purple-50/30 dark:hover:bg-purple-950/5",
                  glowBg: "purple"
                },
                { 
                  name: "Komplain", 
                  icon: AlertCircle, 
                  activeClass: "bg-rose-500/10 border-rose-500/40 text-rose-650 dark:text-rose-400 ", 
                  hoverClass: "hover:border-rose-300 dark:hover:border-rose-950/60 hover:bg-rose-50/30 dark:hover:bg-rose-950/5",
                  glowBg: "rose"
                },
              ].map((cat) => {
                const Icon = cat.icon;
                const isActive = category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setCategory(cat.name);
                      setHasUnsavedChanges(true);
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border py-3.5 px-4 text-xs font-bold transition-all duration-300 cursor-pointer shadow-sm select-none w-full",
                      isActive
                        ? cat.activeClass
                        : "border-slate-200 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-950/20 text-slate-500 dark:text-slate-500 " + cat.hoverClass
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("h-4 w-4", isActive ? "" : "text-slate-650")} />
                      <span>{cat.name}</span>
                    </div>
                    {isActive ? (
                      <span className={cn(
                        "h-2 w-2 rounded-full",
                        cat.glowBg === "emerald" && "bg-emerald-400 animate-pulse",
                        cat.glowBg === "purple" && "bg-purple-400 animate-pulse",
                        cat.glowBg === "rose" && "bg-rose-400 animate-pulse",
                        cat.glowBg === "sky" && "bg-sky-400 animate-pulse"
                      )} />
                    ) : (
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-slate-600 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action publishing button inside sidebar */}
          <div className="flex flex-col gap-2 mt-4">
            <Button 
              disabled={!title.trim() || !editor || editor.getText().trim().length === 0 || isSaving} 
              onClick={() => saveNews("DRAFT")}
              variant="outline"
              className="w-full text-indigo-650 hover:bg-indigo-50 border-indigo-200 rounded-2xl py-6 font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>{savingType === "DRAFT" ? "Menyimpan..." : "Simpan Draft"}</span>
            </Button>
            
            <Button 
              disabled={!title.trim() || !editor || editor.getText().trim().length === 0 || isSaving} 
              onClick={() => saveNews("PUBLISHED")}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-750 hover:to-violet-750 text-white rounded-2xl py-6 font-bold shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>{savingType === "PUBLISHED" ? "Menyimpan..." : "Publikasikan Berita (Ctrl/Cmd+Enter)"}</span>
            </Button>
          </div>

        </div>
      </div>

    </div>
  );
}
