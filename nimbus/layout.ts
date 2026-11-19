/** Nimbus 站点外壳 — head、固定导航、页脚、氛围层 */
import { html, raw, type Html } from "./core.ts";

export interface ShellOpts {
  title: string;
  description: string;
  path: string;
  active: "home" | "docs";
  body: Html;
  script: string;
  bodyClass?: string;
}

const ghIcon = html`<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.04 11.04 0 015.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .31.21.67.8.55A11.51 11.51 0 0023.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>`;

function nav(active: "home" | "docs"): Html {
  const link = (href: string, label: string, isActive = false): Html =>
    html`<a href="${href}" class="nav-link ${isActive ? "nav-link-active" : ""}" ${isActive ? raw('aria-current="page"') : null}>${label}</a>`;
  return html`
  <nav id="siteNav" class="fixed top-0 w-full z-50 nav-blur bg-surface-dark/70 border-b border-border/50">
    <div class="max-w-[1400px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
      <a href="/" class="flex items-center gap-2.5 shrink-0" aria-label="Playwright 首页">
        <img src="/favicon.svg" alt="" width="32" height="32" class="w-8 h-8 rounded-lg shadow-lg shadow-accent/20">
        <span class="font-display font-bold text-lg text-txt-primary tracking-tight">Playwright</span>
      </a>
      <div class="hidden md:flex items-center gap-6">
        ${link("/#features", "功能")}
        ${link("/#quickstart", "快速开始")}
        ${link("/docs/intro", "文档", active === "docs")}
        ${link("/#mcp", "MCP")}
        ${link("/#browsers", "浏览器")}
      </div>
      <div class="flex items-center gap-2.5">
        ${active === "docs" ? html`
        <button type="button" id="searchTrigger" class="search-trigger hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-border-light text-txt-muted text-sm transition-colors" aria-label="搜索文档">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <span>搜索文档</span>
          <kbd class="kbd">Ctrl K</kbd>
        </button>` : html`
        <a href="/docs/installation" class="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent hover:bg-accent-dim text-surface-dark text-sm font-display font-semibold transition-colors shadow-md shadow-accent/20">开始使用</a>`}
        <a href="https://github.com/microsoft/playwright" target="_blank" rel="noopener noreferrer" class="w-9 h-9 flex items-center justify-center rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-surface border border-transparent hover:border-border transition-colors" aria-label="GitHub 仓库">${ghIcon}</a>
        <button type="button" id="menuBtn" class="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-txt-secondary hover:text-txt-primary hover:bg-surface border border-border transition-colors" aria-label="打开菜单" aria-expanded="false" popovertarget="mobileMenu">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>
    <div id="mobileMenu" class="mobile-menu flex-col gap-1 md:hidden" popover="auto">
      <a href="/#features" class="text-txt-secondary hover:text-txt-primary py-2.5 text-sm">功能</a>
      <a href="/#quickstart" class="text-txt-secondary hover:text-txt-primary py-2.5 text-sm">快速开始</a>
      <a href="/docs/intro" class="text-txt-secondary hover:text-txt-primary py-2.5 text-sm">文档</a>
      <a href="/#mcp" class="text-txt-secondary hover:text-txt-primary py-2.5 text-sm">MCP</a>
      <a href="/#browsers" class="text-txt-secondary hover:text-txt-primary py-2.5 text-sm">浏览器</a>
      ${active === "docs" ? html`<button type="button" id="searchTriggerMobile" class="text-left text-accent font-semibold py-2.5 text-sm">搜索文档 ⌘K</button>` : html`<a href="/docs/installation" class="text-accent font-semibold py-2.5 text-sm">开始使用 →</a>`}
    </div>
  </nav>`;
}

function footer(): Html {
  const col = (title: string, links: Html): Html => html`
    <div>
      <h4 class="font-display text-xs font-semibold text-txt-muted uppercase tracking-widest mb-4">${title}</h4>
      <ul class="space-y-2.5">${links}</ul>
    </div>`;
  const li = (href: string, label: string, external = false): Html => html`
    <li><a href="${href}" ${external ? raw('target="_blank" rel="noopener noreferrer"') : null} class="text-txt-secondary hover:text-accent text-sm transition-colors">${label}</a></li>`;
  return html`
  <footer class="border-t border-border/50 bg-surface-dark/60 relative">
    <div class="max-w-[1400px] mx-auto px-5 sm:px-8 py-14">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-10">
        <div class="col-span-2">
          <a href="/" class="flex items-center gap-2.5 mb-4">
            <img src="/favicon.svg" alt="" width="32" height="32" class="w-8 h-8 rounded-lg">
            <span class="font-display font-bold text-lg text-txt-primary tracking-tight">Playwright</span>
          </a>
          <p class="text-txt-secondary text-sm leading-relaxed max-w-xs mb-5">通过单一 API 驱动 Chromium、Firefox 和 WebKit 的 Web 自动化与测试框架。非官方站点。</p>
          <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-xs text-txt-muted">
            <svg class="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            由 <span class="text-txt-secondary font-medium">Nimbus + Bun</span> 构建
          </span>
        </div>
        ${col("产品", html`${li("/#test", "Playwright Test")}${li("/#cli", "Playwright CLI")}${li("/#mcp", "Playwright MCP")}${li("/#library", "Playwright Library")}`)}
        ${col("文档", html`${li("/docs/intro", "简介")}${li("/docs/installation", "安装")}${li("/docs/locators", "定位器")}${li("/docs/assertions", "断言")}${li("/docs/configuration", "测试配置")}`)}
        ${col("社区", html`${li("https://github.com/microsoft/playwright", "GitHub", true)}${li("https://aka.ms/playwright/discord", "Discord", true)}${li("https://playwright.dev", "官方文档", true)}${li("https://www.npmjs.com/package/playwright", "npm", true)}`)}
      </div>
      <div class="mt-12 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p class="text-txt-muted text-xs">© 2026 Playwright · 采用 Apache-2.0 许可证</p>
        <p class="text-txt-muted text-xs">Chromium 147 · Firefox 149 · WebKit 26.4</p>
      </div>
    </div>
  </footer>`;
}

export function shell(opts: ShellOpts): Html {
  const canonical = `https://playwright.ndjp.net${opts.path}`;
  return html`<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
  <meta name="description" content="${opts.description}">
  <meta name="theme-color" content="#0a0d0b">
  <meta name="color-scheme" content="dark">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${opts.title}">
  <meta property="og:description" content="${opts.description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:locale" content="zh_CN">
  <meta name="twitter:card" content="summary">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="preload" href="/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap"></noscript>
  <link rel="stylesheet" href="/assets/app.css">
  <script>document.documentElement.classList.add('js');</script>
  <script defer src="${opts.script}"></script>
  <script type="speculationrules">
  {
    "prefetch": [{ "where": { "href_matches": "/*" }, "eagerness": "moderate" }],
    "prerender": [{ "where": { "and": [{ "href_matches": "/*" }, { "not": { "selector_matches": "[rel~=nofollow]" } }] }, "eagerness": "conservative" }]
  }
  </script>
</head>
<body class="antialiased ${opts.bodyClass ?? ""}" data-page="${opts.active}" data-path="${opts.path}">
  <a href="#main" class="skip-link">跳到主要内容</a>
  <div class="aurora-bg" aria-hidden="true">
    <div class="aurora aurora-1"></div>
    <div class="aurora aurora-2"></div>
    <div class="aurora aurora-3"></div>
  </div>
  ${nav(opts.active)}
  ${opts.body}
  ${footer()}
  <button type="button" id="backToTop" class="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-xl bg-surface border border-border hover:border-accent/40 text-txt-secondary hover:text-accent flex items-center justify-center shadow-xl shadow-black/40 transition-colors" aria-label="回到顶部">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
  </button>
</body>
</html>`;
}