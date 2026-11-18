/**
 * Nimbus Markdown 管线 — frontmatter 解析、marked 渲染、
 * 语法高亮、GitHub 风格提示块、TOC 提取、搜索纯文本。
 */
import { Marked } from "marked";
import { escapeHtml } from "./core.ts";
import { highlight } from "./highlight.ts";

export interface DocMeta {
  title: string;
  description: string;
  section: string;
  order: number;
  slug: string;
}

export interface TocEntry {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface RenderedDoc {
  meta: DocMeta;
  body: string;
  toc: TocEntry[];
  plainText: string;
}

export function parseFrontmatter(source: string): { meta: DocMeta; content: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(source);
  if (!m) throw new Error("缺少 frontmatter");
  const fields: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  }
  const meta: DocMeta = {
    title: fields.title ?? "",
    description: fields.description ?? "",
    section: fields.section ?? "",
    order: Number(fields.order ?? 0),
    slug: fields.slug ?? "",
  };
  if (!meta.title || !meta.slug || !meta.section) throw new Error(`frontmatter 不完整: ${JSON.stringify(fields)}`);
  return { meta, content: source.slice(m[0].length) };
}

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-") || "section";

const ALERTS: Record<string, { title: string; cls: string; icon: string }> = {
  NOTE: {
    title: "注意",
    cls: "callout-note",
    icon: '<svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  },
  TIP: {
    title: "提示",
    cls: "callout-tip",
    icon: '<svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>',
  },
  WARNING: {
    title: "警告",
    cls: "callout-warning",
    icon: '<svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
  },
};

const LANG_LABELS: Record<string, string> = {
  ts: "TypeScript", typescript: "TypeScript", js: "JavaScript", javascript: "JavaScript",
  bash: "终端", sh: "终端", shell: "终端", console: "终端",
  json: "JSON", jsonc: "JSON", yaml: "YAML", yml: "YAML", html: "HTML", xml: "XML",
};

const COPY_BTN =
  '<button type="button" class="copy-btn" data-copy aria-label="复制代码" title="复制">' +
  '<svg class="icon-copy w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2" stroke-width="1.6"/><path stroke-width="1.6" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>' +
  '<svg class="icon-check w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' +
  '<span class="copy-label">复制</span></button>';

export function renderMarkdown(source: string): RenderedDoc {
  const { meta, content } = parseFrontmatter(source);
  const toc: TocEntry[] = [];
  const usedIds = new Map<string, number>();

  const uniqueId = (text: string): string => {
    const base = slugify(text);
    const n = usedIds.get(base) ?? 0;
    usedIds.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  };

  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      heading(text: string, level: number): string {
        const plain = text.replace(/<[^>]*>/g, "");
        if (level === 2 || level === 3) {
          const id = uniqueId(plain);
          toc.push({ id, text: plain, depth: level as 2 | 3 });
          return `<h${level} id="${id}"><a class="heading-anchor" href="#${id}" aria-label="锚点：${escapeHtml(plain)}">#</a>${text}</h${level}>\n`;
        }
        return `<h${level}>${text}</h${level}>\n`;
      },
      code(code: string, infostring: string | undefined): string {
        const lang = (infostring ?? "").trim().split(/\s+/)[0] || "text";
        const label = LANG_LABELS[lang.toLowerCase()] ?? lang.toUpperCase();
        const body = highlight(code.replace(/\n+$/, ""), lang);
        return (
          `<div class="code-block group/code"><div class="code-head">` +
          `<span class="code-lang">${escapeHtml(label)}</span>${COPY_BTN}</div>` +
          `<pre><code>${body}</code></pre></div>\n`
        );
      },
      blockquote(quote: string): string {
        const m = /^\s*<p>\[!(NOTE|TIP|WARNING)\]\s*(?:<br>)?\n?/.exec(quote);
        if (m) {
          const alert = ALERTS[m[1]];
          const inner = quote.slice(m[0].length).replace(/^<\/p>\s*$/, "");
          const contentHtml = inner.trim() ? `<p>${inner}</p>` : "";
          return (
            `<div class="callout ${alert.cls}"><div class="callout-title">${alert.icon}` +
            `<span>${alert.title}</span></div><div class="callout-body">${contentHtml}</div></div>\n`
          );
        }
        return `<blockquote>${quote}</blockquote>\n`;
      },
      link(href: string, title: string | null | undefined, text: string): string {
        const t = title ? ` title="${escapeHtml(title)}"` : "";
        if (/^https?:\/\//.test(href)) {
          return `<a href="${escapeHtml(href)}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`;
        }
        return `<a href="${escapeHtml(href)}"${t}>${text}</a>`;
      },
      table(header: string, body: string): string {
        return `<div class="table-wrap"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>\n`;
      },
    },
  });

  const body = marked.parse(content, { async: false }) as string;
  const plainText = body
    .replace(/<button[\s\S]*?<\/button>/g, " ")
    .replace(/<a class="heading-anchor"[^>]*>#<\/a>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  return { meta, body, toc, plainText };
}