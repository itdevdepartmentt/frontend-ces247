// components/news/NewsRenderer.tsx
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import { Extension, Mark, mergeAttributes } from "@tiptap/core";
import { useMemo } from "react";

const CustomImage = Image.extend({
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
              };
            },
          },
        },
      },
    ];
  },
});

const Underline = Mark.create({
  name: "underline",

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
    return ["u", mergeAttributes(HTMLAttributes), 0];
  },
});

const FontFamily = Mark.create({
  name: "fontFamily",

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
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

const TextColor = Mark.create({
  name: "textColor",

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
    return ["span", mergeAttributes(HTMLAttributes), 0];
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
});

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

export function NewsRenderer({ content }: { content: any }) {
  // Convert TipTap JSON schema to high-fidelity HTML output
  const output = useMemo(() => {
    if (!content) return "";

    let html = generateHTML(content, [
      StarterKit,
      TextAlignExtension,
      CustomImage,
      Table,
      TableRow,
      TableHeader,
      TableCell,
      HiddenText,
      Underline,
      FontFamily,
      TextColor,
      CustomLink,
    ]);

    // Clean up standard XML namespaces that prevent clean rendering
    return html.replace(/xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g, "");
  }, [content]);

  // Recursively extract PDF links from JSON structure to show them inside visual high-end iframe wrappers
  const pdfFiles = useMemo(() => {
    if (!content || !content.content) return [];

    const files: { url: string; name: string }[] = [];

    const findPdfs = (nodes: any[]) => {
      nodes.forEach((node) => {
        if (node.marks) {
          const link = node.marks.find(
            (m: any) => m.type === "link" && m.attrs?.href?.endsWith(".pdf"),
          );
          if (link) {
            files.push({ url: link.attrs.href, name: node.text || "Document" });
          }
        }
        if (node.content) findPdfs(node.content);
      });
    };

    findPdfs(content.content);
    return files;
  }, [content]);

  return (
    <div className="space-y-8">
      {/* Main Content Render Box */}
      <div
        className="editorial-prose prose prose-slate dark:prose-invert max-w-none dark:text-slate-300"
        dangerouslySetInnerHTML={{ __html: output }}
      />

      {/* Embedded High-End PDF Viewer */}
      {pdfFiles.length > 0 && (
        <div className="space-y-6 border-t border-slate-150 dark:border-slate-900 pt-8 select-none">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
            📄 Lampiran Dokumen PDF
          </h3>
          {pdfFiles.map((pdf, index) => (
            <div
              key={index}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden shadow-xl dark:shadow-2xl transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700/80"
            >
              <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 text-xs font-semibold border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-700 dark:text-slate-300">{pdf.name}</span>
                <a
                  href={pdf.url}
                  target="_blank"
                  className="text-indigo-650 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors font-bold"
                >
                  Buka di Tab Baru
                </a>
              </div>
              <iframe
                src={`${pdf.url}#toolbar=0`} 
                className="w-full h-[600px] border-0"
                title={pdf.name}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
