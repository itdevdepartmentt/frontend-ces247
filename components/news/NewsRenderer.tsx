// components/news/NewsRenderer.tsx
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import { Extension, Mark, mergeAttributes } from "@tiptap/core";
import { useMemo, useEffect, useRef } from "react";

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
                style: `text-align: ${attributes.textAlign} !important;`,
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

const FontSize = Mark.create({
  name: "fontSize",

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
import { Node as TiptapNode } from "@tiptap/core";

const PdfEmbed = TiptapNode.create({
  name: "pdfEmbed",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      fileName: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-pdf-embed]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // Render as hidden element — PDF viewer is shown separately
    return ["div", { "data-pdf-embed": "", style: "display:none;", ...HTMLAttributes }];
  },
});

export function NewsRenderer({ content }: { content: any }) {
  const containerRef = useRef<HTMLDivElement>(null);

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
      FontSize,
      TextColor,
      CustomLink,
      PdfEmbed,
    ]);

    // Clean up standard XML namespaces that prevent clean rendering
    html = html.replace(/xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g, "");

    // Remove PDF link text from article body (PDFs are shown in the dedicated viewer below)
    // Remove <p> tags that only contain a PDF link (with optional emoji/whitespace)
    html = html.replace(/<p[^>]*>\s*(?:📄\s*)?<a[^>]*href="[^"]*\.pdf"[^>]*>[^<]*<\/a>\s*<\/p>/gi, "");
    // Remove standalone PDF links not wrapped in <p>
    html = html.replace(/(?:📄\s*)?<a[^>]*href="[^"]*\.pdf"[^>]*>[^<]*<\/a>/gi, "");
    // Remove hidden-pdf-text spans
    html = html.replace(/<span[^>]*class="hidden-pdf-text"[^>]*>[^<]*<\/span>/gi, "");

    // Fix broken images from hardcoded localhost or relative paths in DB
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const apiOrigin = apiUrl.replace(/\/api$/, "");
    
    html = html.replace(/src="http:\/\/localhost:\d+\/api\/uploads/g, `src="${apiOrigin}/api/uploads`);
    html = html.replace(/src="\/api\/uploads/g, `src="${apiOrigin}/api/uploads`);

    console.log("DEBUG_HTML_OUTPUT:", html);
    return html;
  }, [content]);

  // Recursively extract PDF links from JSON structure to show them inside visual high-end iframe wrappers
  const pdfFiles = useMemo(() => {
    if (!content || !content.content) return [];

    const files: { url: string; name: string }[] = [];

    const findPdfs = (nodes: any[]) => {
      nodes.forEach((node) => {
        // Detect legacy pdfEmbed nodes
        if (node.type === "pdfEmbed" && node.attrs?.src) {
          files.push({ url: node.attrs.src, name: node.attrs.fileName || "Document" });
        }
        if (node.marks) {
          const link = node.marks.find(
            (m: any) => (m.type === "link" || m.type === "customLink") && m.attrs?.href?.endsWith(".pdf"),
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

  // Foolproof fallback to guarantee styles are applied (bypasses CSP HTML parser blocks and CSS specificity wars)
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // Force Font Size
    const fontElements = container.querySelectorAll('[data-font-size]');
    fontElements.forEach(el => {
      const size = el.getAttribute('data-font-size');
      if (size) {
        (el as HTMLElement).style.setProperty('font-size', size, 'important');
      }
    });

    // Force Text Align
    const alignElements = container.querySelectorAll('[data-text-align]');
    alignElements.forEach(el => {
      const align = el.getAttribute('data-text-align');
      if (align) {
        (el as HTMLElement).style.setProperty('text-align', align, 'important');
      }
    });

    // Force Text Color
    const colorElements = container.querySelectorAll('[data-text-color]');
    colorElements.forEach(el => {
      const color = el.getAttribute('data-text-color');
      if (color) {
        (el as HTMLElement).style.setProperty('color', color, 'important');
      }
    });
  }, [output]);

  return (
    <div className="space-y-8">
      {/* Main Content Render Box */}
      <div
        ref={containerRef}
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
