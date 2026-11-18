/** Nimbus 文档布局 — 侧边栏、正文、TOC、翻页、搜索弹层 */
import { html, raw, type Html } from "./core.ts";
import type { DocMeta, RenderedDoc } from "./markdown.ts";

export interface DocsSection {
  name: string;
  pages: DocMeta[];
}

export interface DocsData {
  sections: DocsSection[];
  flat: DocMeta[];
}

const SECTION_ICONS: Record<string, Html> = {
  入门: html`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
  核心概念: html`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>`,
  工具: html`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
  配置: html`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`,
};

function sidebar(data: DocsData, current: DocMeta): Html {
  return html`
  <aside id="docsSidebar" class="docs-sidebar" aria-label="文档目录">
    <div class="lg:hidden flex items-center justify-between px-4 pb-3 mb-2 border-b border-border">
      <span class="font-display font-semibold text-sm text-txt-primary">文档目录</span>
      <button type="button" id="sidebarClose" class="w-8 h-8 flex items-center justify-center rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-surface border border-border transition-colors" aria-label="关闭目录">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="docs-sidebar-inner">
      ${data.sections.map((section) => html`
      <div class="mb-7">
        <div class="flex items-center gap-2 px-3 mb-2 text-txt-muted">
          ${SECTION_ICONS[section.name] ?? null}
          <span class="font-display text-xs font-semibold uppercase tracking-widest">${section.name}</span>
        </div>
        <ul class="space-y-0.5">
          ${section.pages.map((page) => html`
          <li>
            <a href="/docs/${page.slug}" class="docs-side-link ${page.slug === current.slug ? "docs-side-link-active" : ""}" ${page.slug === current.slug ? raw('aria-current="page"') : null}>${page.title}</a>
          </li>`)}
        </ul>
      </div>`)}
      <div class="px-3 pt-4 border-t border-border/50">
        <a href="https://playwright.dev/docs/api/class-playwright" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1.5 text-txt-muted hover:text-accent text-xs transition-colors">
          完整 API 参考（英文）
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
      </div>
    </div>
  </aside>
  <div id="sidebarBackdrop" class="sidebar-backdrop" aria-hidden="true"></div>`;
}

function toc(doc: RenderedDoc): Html {
  if (doc.toc.length === 0) return html``;
  return html`
  <aside class="docs-toc hidden xl:block" aria-label="本页目录">
    <div class="sticky top-24">
      <h4 class="font-display text-xs font-semibold text-txt-muted uppercase tracking-widest mb-3">本页内容</h4>
      <ul class="space-y-1 border-l border-border">
        ${doc.toc.map((entry) => html`
        <li>
          <a href="#${entry.id}" class="toc-link ${entry.depth === 3 ? "toc-link-sub" : ""}" data-toc="${entry.id}">${entry.text}</a>
        </li>`)}
      </ul>
    </div>
  </aside>`;
}

function pager(data: DocsData, current: DocMeta): Html {
  const idx = data.flat.findIndex((p) => p.slug === current.slug);
  const prev = idx > 0 ? data.flat[idx - 1] : null;
  const next = idx >= 0 && idx < data.flat.length - 1 ? data.flat[idx + 1] : null;
  const card = (page: DocMeta, dir: "prev" | "next"): Html => html`
    <a href="/docs/${page.slug}" class="pager-card group ${dir === "next" ? "text-right" : ""}">
      <span class="text-txt-muted text-xs mb-1 block">${dir === "prev" ? "← 上一篇" : "下一篇 →"}</span>
      <span class="font-display font-semibold text-txt-primary group-hover:text-accent transition-colors">${page.title}</span>
    </a>`;
  return html`
  <nav class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-14" aria-label="翻页">
    ${prev ? card(prev, "prev") : html`<span class="hidden sm:block"></span>`}
    ${next ? card(next, "next") : html`<span class="hidden sm:block"></span>`}
  </nav>`;
}

function searchModal(): Html {
  return html`
  <div id="searchModal" class="search-modal" role="dialog" aria-modal="true" aria-label="搜索文档" hidden>
    <div class="search-panel">
      <div class="flex items-center gap-3 px-4 border-b border-border">
        <svg class="w-4 h-4 text-txt-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input id="searchInput" type="search" placeholder="搜索文档、API、命令…" class="w-full bg-transparent py-3.5 text-sm text-txt-primary placeholder:text-txt-muted outline-none" autocomplete="off" spellcheck="false">
        <kbd class="kbd shrink-0">Esc</kbd>
      </div>
      <ul id="searchResults" class="search-results" role="listbox"></ul>
      <div id="searchEmpty" class="px-4 py-8 text-center text-txt-muted text-sm">输入关键词开始搜索，例如「定位器」「storageState」「shard」</div>
      <div class="flex items-center gap-4 px-4 py-2.5 border-t border-border text-txt-muted text-xs">
        <span><kbd class="kbd">↑</kbd> <kbd class="kbd">↓</kbd> 导航</span>
        <span><kbd class="kbd">Enter</kbd> 打开</span>
        <span class="ml-auto" id="searchCount"></span>
      </div>
    </div>
  </div>`;
}

export function docsLayout(doc: RenderedDoc, data: DocsData): Html {
  const { meta } = doc;
  return html`
  <div class="docs-shell max-w-[1400px] mx-auto px-5 sm:px-8 pt-16">
    ${sidebar(data, meta)}
    <main class="docs-main min-w-0">
      <button type="button" id="sidebarToggle" class="lg:hidden inline-flex items-center gap-2 mt-6 mb-2 px-3 py-1.5 rounded-lg bg-surface border border-border text-txt-secondary text-sm hover:border-border-light transition-colors" aria-expanded="false" aria-controls="docsSidebar">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M4 6h16M4 12h10M4 18h16"/></svg>
        文档目录
      </button>
      <nav class="flex items-center gap-2 text-xs text-txt-muted mt-6 lg:mt-10 mb-4" aria-label="面包屑">
        <a href="/docs/intro" class="hover:text-accent transition-colors">文档</a>
        <span aria-hidden="true">›</span>
        <span>${meta.section}</span>
        <span aria-hidden="true">›</span>
        <span class="text-txt-secondary">${meta.title}</span>
      </nav>
      <header class="mb-10 pb-8 border-b border-border/50">
        <h1 class="font-display text-3xl sm:text-4xl font-bold text-txt-primary tracking-tight mb-3">${meta.title}</h1>
        <p class="text-txt-secondary leading-relaxed">${meta.description}</p>
      </header>
      <article class="prose-docs" id="docContent">
        ${raw(doc.body)}
      </article>
      <div class="feedback-widget mt-12 p-5 rounded-xl bg-surface border border-border" data-feedback="${meta.slug}">
        <p class="text-sm text-txt-secondary mb-3" data-feedback-question>这篇文档对你有帮助吗？</p>
        <div class="flex gap-2" data-feedback-actions>
          <button type="button" class="feedback-btn" data-feedback-value="up"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>有帮助</button>
          <button type="button" class="feedback-btn" data-feedback-value="down"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5 6h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2.5"/></svg>待改进</button>
        </div>
      </div>
      ${pager(data, meta)}
    </main>
    ${toc(doc)}
  </div>
  ${searchModal()}`;
}