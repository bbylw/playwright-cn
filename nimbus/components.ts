/** Nimbus 共享 UI 组件 */
import { html, raw, type Html } from "./core.ts";
import { highlight } from "./highlight.ts";

const copyIcon = html`<svg class="icon-copy w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2" stroke-width="1.6"/><path stroke-width="1.6" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
const checkIcon = html`<svg class="icon-check w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;

export const copyButton = (extra = ""): Html => html`
  <button type="button" class="copy-btn ${extra}" data-copy aria-label="复制代码" title="复制">
    ${copyIcon}${checkIcon}<span class="copy-label">复制</span>
  </button>`;

export interface CodeBlockOpts {
  /** 头部标题；提供后显示带语言标签的头部栏 */
  head?: string;
  /** 额外容器类名 */
  class?: string;
}

/** 带高亮与复制按钮的代码块 */
export function codeBlock(code: string, lang: string, opts: CodeBlockOpts = {}): Html {
  const trimmed = code.replace(/\n+$/, "");
  const label = opts.head ?? lang;
  return html`
    <div class="code-block group/code ${opts.class ?? ""}">
      <div class="code-head">
        <span class="code-lang">${label}</span>
        ${copyButton()}
      </div>
      <pre role="region" aria-label="${label} 代码" tabindex="0"><code>${raw(highlight(trimmed, lang))}</code></pre>
    </div>`;
}

/** 单行命令（浮动复制按钮） */
export function commandBlock(command: string, accent = "text-accent"): Html {
  return html`
    <div class="code-block code-cmd group/code ${accent}">
      <pre role="region" aria-label="终端命令" tabindex="0"><code><span class="cmd-prompt">$</span> ${raw(highlight(command, "bash"))}</code></pre>
      ${copyButton("copy-float")}
    </div>`;
}

/** 包管理器可切换命令：bun / npm / pnpm / yarn（四种变体预渲染，客户端切换） */
export function pmCommand(cmds: { bun: string; npm: string; pnpm: string; yarn: string }): Html {
  const variant = (pm: keyof typeof cmds): Html =>
    html`<span class="pm-variant ${pm === "bun" ? "pm-active" : ""}" data-pm-variant="${pm}">${raw(highlight(cmds[pm], "bash"))}</span>`;
  return html`
    <div class="code-block code-cmd group/code">
      <pre role="region" aria-label="终端命令" tabindex="0"><code><span class="cmd-prompt">$</span> ${variant("bun")}${variant("npm")}${variant("pnpm")}${variant("yarn")}</code></pre>
      ${copyButton("copy-float")}
    </div>`;
}

export const icons = {
  bolt: html`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
  search: html`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>`,
  lock: html`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>`,
  chart: html`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  refresh: html`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>`,
  code: html`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>`,
  clipboard: html`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
  terminal: html`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`,
  chip: html`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
  pen: html`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  arrow: html`<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>`,
  book: html`<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
};