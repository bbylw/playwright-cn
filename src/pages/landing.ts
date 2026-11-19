/** 落地页 — 由 Nimbus 组件渲染 */
import { html, raw, join, type Html } from "../../nimbus/core.ts";
import { codeBlock, commandBlock, pmCommand, icons } from "../../nimbus/components.ts";

/* ── 代码示例 ─────────────────────────────────────── */

const CODE_TEST = `import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await page
    .getByRole('link', { name: 'Get started' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Installation' })
  ).toBeVisible();
});`;

const CODE_AUTH = `// 保存登录状态
await page.context().storageState({ path: 'auth.json' });

// 跨测试复用
test.use({ storageState: 'auth.json' });`;

const CODE_LOCATORS = `page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByPlaceholder('Search...')
page.getByTestId('login-form')`;

const CODE_TRACE = `// playwright.config.ts
export default defineConfig({
  use: {
    trace: 'on-first-retry',
  },
});`;

const CODE_CLI = `playwright-cli open https://demo.playwright.dev/todomvc/ --headed
playwright-cli type "Buy groceries"
playwright-cli press Enter
playwright-cli screenshot`;

const CODE_MCP = `{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}`;

const CODE_SCREENSHOT = `import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://playwright.dev/');
await page.screenshot({ path: 'screenshot.png' });
await browser.close();`;

const CODE_PDF = `import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://playwright.dev/');
await page.pdf({ path: 'page.pdf', format: 'A4' });
await browser.close();`;

const CODE_MOBILE = `import { chromium, devices } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext(
  devices['iPhone 15']
);
const page = await context.newPage();
await page.goto('https://playwright.dev/');
await page.screenshot({ path: 'mobile.png' });
await browser.close();`;

const CODE_NETWORK = `import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.route('**/*.{png,jpg,jpeg}',
  route => route.abort()
);
await page.goto('https://playwright.dev/');
await browser.close();`;

/* ── 区块组件 ─────────────────────────────────────── */

function hero(): Html {
  return html`
  <section class="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div class="grid-line-v left-[20%] hidden lg:block"></div>
      <div class="grid-line-v left-[80%] hidden lg:block"></div>
      <div class="grid-line-h top-[40%]"></div>
    </div>
    <div class="relative max-w-[1400px] mx-auto px-5 sm:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-10 items-center">
        <div>
          <div class="reveal inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-surface/60 mb-8">
            <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
            <span class="text-txt-muted text-xs tracking-wide uppercase">开源 · 跨浏览器 · 高可靠性</span>
          </div>
          <h1 class="reveal font-display font-bold tracking-tighter leading-[1.02] mb-6">
            <span class="text-5xl sm:text-6xl lg:text-[4.6rem] block text-txt-primary" id="heroLine1" data-scramble>Web 自动化</span>
            <span class="text-5xl sm:text-6xl lg:text-[4.6rem] block gradient-text" id="heroLine2" data-scramble>与测试框架</span>
          </h1>
          <p class="reveal reveal-delay-1 text-lg sm:text-xl text-txt-secondary max-w-xl leading-relaxed mb-10">
            通过单一 API 驱动 <strong class="text-txt-primary font-medium">Chromium</strong>、<strong class="text-txt-primary font-medium">Firefox</strong> 和 <strong class="text-txt-primary font-medium">WebKit</strong>。适用于测试、脚本编写以及 AI Agent 工具。
          </p>
          <div class="reveal reveal-delay-2 flex flex-col sm:flex-row gap-3 mb-12">
            <a href="/docs/installation" class="magnetic-btn inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-accent hover:bg-accent-dim text-surface-dark font-display font-semibold rounded-xl transition-all shadow-lg shadow-accent/20 hover:shadow-accent/30">
              开始使用 ${icons.arrow}
            </a>
            <a href="/docs/intro" class="magnetic-btn inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-surface border border-border hover:border-border-light text-txt-primary font-display font-medium rounded-xl transition-all">
              阅读文档
            </a>
          </div>
          <div class="reveal reveal-delay-3 flex flex-wrap gap-2.5">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs">
              <span class="w-2 h-2 rounded-full bg-blue-400"></span>
              <span class="text-txt-muted">Chromium</span><span class="text-txt-secondary font-medium">147</span>
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs">
              <span class="w-2 h-2 rounded-full bg-orange-400"></span>
              <span class="text-txt-muted">Firefox</span><span class="text-txt-secondary font-medium">149</span>
            </span>
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs">
              <span class="w-2 h-2 rounded-full bg-cyan"></span>
              <span class="text-txt-muted">WebKit</span><span class="text-txt-secondary font-medium">26.4</span>
            </span>
          </div>
        </div>

        <!-- 终端演示 -->
        <div class="reveal reveal-delay-2">
          <div class="terminal glow-accent" id="heroTerminal" aria-label="安装演示终端">
            <div class="terminal-bar">
              <span class="terminal-dot bg-rose-400/80"></span>
              <span class="terminal-dot bg-amber-400/80"></span>
              <span class="terminal-dot bg-accent/80"></span>
              <span class="ml-3 text-txt-muted text-xs font-mono">~/my-app — bun</span>
            </div>
            <div class="terminal-body font-mono text-[12.5px] leading-[1.9]" id="terminalBody">
              <div class="term-line" data-term="cmd"><span class="text-accent">$</span> <span class="text-txt-primary" data-type>bun create playwright</span></div>
              <div class="term-line text-txt-secondary" data-term><span class="text-accent">✔</span> 语言：TypeScript · 测试目录：tests</div>
              <div class="term-line text-txt-secondary" data-term><span class="text-accent">✔</span> 添加 GitHub Actions 工作流</div>
              <div class="term-line text-txt-muted" data-term>Downloading Chromium 147.0.7727.49 …</div>
              <div class="term-line text-txt-secondary" data-term><span class="text-accent">✔</span> Chromium <span class="text-txt-muted">142.3 MiB</span> · Firefox <span class="text-txt-muted">98.1 MiB</span> · WebKit <span class="text-txt-muted">86.7 MiB</span></div>
              <div class="term-line text-txt-primary" data-term>Happy hacking!</div>
              <div class="term-line pt-2" data-term="cmd"><span class="text-accent">$</span> <span class="text-txt-primary" data-type>bunx playwright test</span></div>
              <div class="term-line text-txt-muted" data-term>Running 6 tests using 3 workers</div>
              <div class="term-line" data-term><span class="text-accent font-semibold">6 passed</span> <span class="text-txt-muted">(4.2s)</span><span class="term-caret" aria-hidden="true"></span></div>
            </div>
          </div>
          <p class="text-txt-muted text-xs mt-3 text-center">从零到通过测试，只需两条命令。</p>
        </div>
      </div>
    </div>
  </section>`;
}

function marquee(): Html {
  const words = ["CHROMIUM", "FIREFOX", "WEBKIT", "PLAYWRIGHT TEST", "PLAYWRIGHT MCP", "PLAYWRIGHT CLI"];
  const seq = join(words.map((w) => html`
    <span class="font-display text-2xl sm:text-3xl font-bold text-txt-muted/30 tracking-tight whitespace-nowrap">${w}</span>
    <span class="text-accent/25 text-2xl">·</span>`));
  return html`
  <section class="py-6 border-y border-border/50 overflow-hidden bg-surface/30" aria-hidden="true">
    <div class="marquee-track">${seq}${seq}</div>
  </section>`;
}

interface Feature { icon: Html; tone: string; title: string; desc: string; }

function features(): Html {
  const small = (f: Feature): Html => html`
    <div class="spotlight-card p-7">
      <div class="w-9 h-9 rounded-lg ${f.tone} flex items-center justify-center mb-4">${f.icon}</div>
      <h3 class="font-display text-base font-semibold text-txt-primary mb-2">${f.title}</h3>
      <p class="text-txt-secondary text-sm leading-relaxed">${f.desc}</p>
    </div>`;
  return html`
  <section id="features" class="py-24 sm:py-32 scroll-mt-20">
    <div class="max-w-[1400px] mx-auto px-5 sm:px-8">
      <div class="reveal mb-16">
        <span class="text-accent text-xs font-semibold tracking-widest uppercase">核心能力</span>
        <h2 class="font-display text-3xl sm:text-4xl font-bold text-txt-primary tracking-tight mt-3">为现代 Web 构建的<br>全方位自动化</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children" id="featureGrid">
        <div class="spotlight-card p-8 md:col-span-2 lg:row-span-2 flex flex-col justify-between min-h-[320px]">
          <div>
            <div class="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center mb-5">${icons.bolt}</div>
            <h3 class="font-display text-xl font-semibold text-txt-primary mb-3">自动等待与 Web 优先断言</h3>
            <p class="text-txt-secondary text-sm leading-relaxed max-w-md">无需人工超时。Playwright 等待元素可操作，断言自动重试直到条件满足。专为现代异步 Web 应用设计，彻底告别 flaky test。</p>
          </div>
          ${codeBlock("await expect(page.getByRole('button')).toBeEnabled();", "ts", { class: "mt-6" })}
        </div>
        ${small({ icon: icons.search, tone: "bg-cyan/10 border border-cyan/20 text-cyan", title: "弹性定位器", desc: "角色、标签、占位符、测试 ID —— 反映用户视角，告别脆弱选择器。" })}
        ${small({ icon: icons.lock, tone: "bg-accent/10 border border-accent/20 text-accent", title: "测试隔离", desc: "每个测试独立浏览器上下文，等同全新配置文件。认证状态一次保存，跨测试复用。" })}
        ${small({ icon: icons.chart, tone: "bg-violet-400/10 border border-violet-400/20 text-violet-400", title: "执行追踪", desc: "失败时捕获追踪、截图和视频。在 Trace Viewer 中检查每一步。" })}
        ${small({ icon: icons.refresh, tone: "bg-amber-400/10 border border-amber-400/20 text-amber-400", title: "并行执行", desc: "所有浏览器并行运行，全新上下文几乎零开销。" })}
        ${small({ icon: icons.code, tone: "bg-rose-400/10 border border-rose-400/20 text-rose-400", title: "多语言支持", desc: "Node.js、Python、.NET、Java —— 同一 API，跨语言一致。" })}
      </div>
    </div>
  </section>`;
}

function pmSwitcher(): Html {
  const btn = (pm: string): Html => html`
    <button type="button" class="pm-btn ${pm === "bun" ? "pm-btn-active" : ""}" data-pm="${pm}" role="tab" aria-selected="${pm === "bun" ? "true" : "false"}">${pm}</button>`;
  return html`
    <div class="pm-switch" role="tablist" aria-label="选择包管理器">
      ${btn("bun")}${btn("npm")}${btn("pnpm")}${btn("yarn")}
    </div>`;
}

function quickstart(): Html {
  interface Card { href: string; icon: Html; tone: string; hover: string; title: string; desc: string; cmd?: Html; external?: boolean; wide?: boolean; }
  const cards: Card[] = [
    { href: "#test", icon: icons.clipboard, tone: "bg-accent/10 border border-accent/20 text-accent", hover: "group-hover:text-accent", title: "Playwright Test", desc: "端到端测试运行器，专为 E2E 测试构建",
      cmd: pmCommand({ bun: "bun create playwright", npm: "npm init playwright@latest", pnpm: "pnpm create playwright", yarn: "yarn create playwright" }) },
    { href: "#cli", icon: icons.terminal, tone: "bg-cyan/10 border border-cyan/20 text-cyan", hover: "group-hover:text-cyan", title: "Playwright CLI", desc: "为编码Agent 设计的命令行接口",
      cmd: pmCommand({ bun: "bun add -g @playwright/cli@latest", npm: "npm i -g @playwright/cli@latest", pnpm: "pnpm add -g @playwright/cli@latest", yarn: "yarn global add @playwright/cli@latest" }) },
    { href: "#mcp", icon: icons.chip, tone: "bg-violet-400/10 border border-violet-400/20 text-violet-400", hover: "group-hover:text-violet-400", title: "Playwright MCP", desc: "AI Agent 和 LLM 驱动的自动化",
      cmd: pmCommand({ bun: "bunx @playwright/mcp@latest", npm: "npx @playwright/mcp@latest", pnpm: "pnpm dlx @playwright/mcp@latest", yarn: "yarn dlx @playwright/mcp@latest" }) },
    { href: "#library", icon: icons.code, tone: "bg-amber-400/10 border border-amber-400/20 text-amber-400", hover: "group-hover:text-amber-400", title: "Playwright Library", desc: "浏览器自动化脚本和编程控制",
      cmd: pmCommand({ bun: "bun add playwright", npm: "npm i playwright", pnpm: "pnpm add playwright", yarn: "yarn add playwright" }) },
    { href: "https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright", icon: icons.pen, tone: "bg-blue-400/10 border border-blue-400/20 text-blue-400", hover: "group-hover:text-blue-400", title: "VS Code 扩展", desc: "在 VS Code 中编写和调试测试。一键运行、CodeGen 录制、定位器选取、Trace Viewer 集成。", external: true, wide: true },
  ];
  return html`
  <section id="quickstart" class="py-24 sm:py-32 border-t border-border/50 scroll-mt-20">
    <div class="max-w-[1400px] mx-auto px-5 sm:px-8">
      <div class="reveal mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <span class="text-cyan text-xs font-semibold tracking-widest uppercase">快速开始</span>
          <h2 class="font-display text-3xl sm:text-4xl font-bold text-txt-primary tracking-tight mt-3">选择适合你的方式</h2>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-txt-muted text-xs">包管理器</span>
          ${pmSwitcher()}
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children" id="quickstartGrid">
        ${cards.map((c) => html`
        <div class="spotlight-card group p-7 flex flex-col ${c.wide ? "sm:col-span-2" : ""}">
          <a href="${c.href}" ${c.external ? raw('target="_blank" rel="noopener noreferrer"') : null} class="flex items-center gap-3 mb-4">
            <span class="w-9 h-9 rounded-lg ${c.tone} flex items-center justify-center">${c.icon}</span>
            <h3 class="font-display font-semibold text-txt-primary ${c.hover} transition-colors">${c.title}</h3>
          </a>
          <p class="text-txt-secondary text-sm mb-4 flex-1">${c.desc}</p>
          ${c.cmd ?? html`<a href="${c.href}" target="_blank" rel="noopener noreferrer" class="text-blue-400 text-xs font-mono bg-blue-400/5 border border-blue-400/10 px-3 py-1.5 rounded-lg self-start hover:bg-blue-400/10 transition-colors">从应用商店安装 →</a>`}
        </div>`)}
      </div>
    </div>
  </section>`;
}

function sectionHead(kicker: string, tone: string, title: Html, desc: string): Html {
  return html`
    <div class="reveal">
      <span class="${tone} text-xs font-semibold tracking-widest uppercase">${kicker}</span>
      <h2 class="font-display text-3xl sm:text-4xl font-bold text-txt-primary tracking-tight mt-3 mb-6">${title}</h2>
      <p class="text-txt-secondary leading-relaxed mb-8">${desc}</p>
    </div>`;
}

const h3label = (t: string, extra = ""): Html => html`
  <h3 class="font-display text-sm font-semibold text-txt-primary mb-3 uppercase tracking-wider ${extra}">${t}</h3>`;

function testSection(): Html {
  return html`
  <section id="test" class="py-24 sm:py-32 border-t border-border/50 scroll-mt-20">
    <div class="max-w-[1400px] mx-auto px-5 sm:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        <div>
          ${sectionHead("Playwright Test", "text-accent", html`功能齐全的<br>E2E 测试运行器`, "在 Chromium、Firefox 和 WebKit 上运行测试，具备完整的浏览器隔离、自动等待和 Web 优先断言。")}
          <div class="reveal reveal-delay-1 space-y-6">
            <div>
              ${h3label("安装")}
              ${pmCommand({ bun: "bun create playwright", npm: "npm init playwright@latest", pnpm: "pnpm create playwright", yarn: "yarn create playwright" })}
            </div>
            <div>
              ${h3label("运行测试")}
              ${pmCommand({ bun: "bunx playwright test", npm: "npx playwright test", pnpm: "pnpm exec playwright test", yarn: "yarn playwright test" })}
              <p class="text-txt-muted text-xs mt-3 leading-relaxed">无头模式 · 全浏览器并行 · 完全隔离 · 几乎零开销</p>
            </div>
            <div>
              ${h3label("认证状态复用")}
              ${codeBlock(CODE_AUTH, "ts")}
            </div>
            <a href="/docs/writing-tests" class="inline-flex items-center gap-2 text-accent text-sm font-medium hover:gap-3 transition-all">阅读测试编写指南 ${icons.arrow}</a>
          </div>
        </div>
        <div class="reveal reveal-delay-2">
          ${h3label("编写测试")}
          ${codeBlock(CODE_TEST, "ts", { head: "tests/example.spec.ts" })}
          ${h3label("弹性定位器", "mt-8")}
          ${codeBlock(CODE_LOCATORS, "ts")}
          ${h3label("追踪配置", "mt-8")}
          ${codeBlock(CODE_TRACE, "ts", { head: "playwright.config.ts" })}
        </div>
      </div>
    </div>
  </section>`;
}

function cliSection(): Html {
  return html`
  <section id="cli" class="py-24 sm:py-32 border-t border-border/50 bg-surface/30 scroll-mt-20">
    <div class="max-w-[1400px] mx-auto px-5 sm:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
        <div class="lg:col-span-2">
          ${sectionHead("Playwright CLI", "text-cyan", html`为编码Agent<br>设计的 CLI`, "比 MCP 更节省 token —— 命令避免将大型工具 schema 和可访问性树加载到模型上下文中。")}
          <div class="reveal reveal-delay-1 space-y-4">
            ${pmCommand({ bun: "bun add -g @playwright/cli@latest", npm: "npm install -g @playwright/cli@latest", pnpm: "pnpm add -g @playwright/cli@latest", yarn: "yarn global add @playwright/cli@latest" })}
            ${commandBlock("playwright-cli install --skills", "text-cyan")}
            <a href="/docs/cli" class="inline-flex items-center gap-2 text-cyan text-sm font-medium hover:gap-3 transition-all">查看 CLI 文档 ${icons.arrow}</a>
          </div>
        </div>
        <div class="lg:col-span-3">
          <div class="reveal reveal-delay-2">
            ${h3label("使用示例")}
            ${codeBlock(CODE_CLI, "bash")}
          </div>
          <div class="reveal reveal-delay-3 mt-8">
            ${h3label("会话监控")}
            <p class="text-txt-secondary text-sm mb-4">使用 <code class="inline-code">playwright-cli show</code> 打开可视化仪表板，实时预览所有运行中的浏览器会话。</p>
            ${commandBlock("playwright-cli show", "text-cyan")}
          </div>
          <div class="reveal reveal-delay-4 mt-8">
            ${h3label("Agent 任务指令")}
            <div class="code-block border-l-2 border-l-accent/40 p-5">
              <pre><code class="text-txt-muted">使用 playwright-cli 测试
https://demo.playwright.dev/todomvc
上的"添加待办"流程。
为所有成功和失败的场景截图。</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function mcpSection(): Html {
  const tree = `- heading "todos" [level=1]
- textbox "What needs to be done?" [ref=e5]
- listitem:
  - checkbox "Toggle Todo" [ref=e10]
  - text: "Buy groceries"`;
  const treeHtml = tree
    .split("\n")
    .map((line) => {
      const escaped = line.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      return escaped.replace(/\[ref=(e\d+)\]/g, '<span class="text-cyan">[ref=$1]</span>');
    })
    .join("\n");
  return html`
  <section id="mcp" class="py-24 sm:py-32 border-t border-border/50 scroll-mt-20">
    <div class="max-w-[1400px] mx-auto px-5 sm:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        <div>
          ${sectionHead("Playwright MCP", "text-violet-400", html`AI Agent 的<br>浏览器控制`, "通过模型上下文协议为 AI Agent 提供完整的浏览器控制。Agent 使用结构化的可访问性快照与页面交互 —— 无需视觉模型。")}
          <div class="reveal reveal-delay-1">
            ${h3label("MCP 客户端设置")}
            ${codeBlock(CODE_MCP, "json", { head: "mcp.json" })}
          </div>
          <div class="reveal reveal-delay-2 mt-6">
            ${h3label("Claude Code")}
            ${commandBlock("claude mcp add playwright npx @playwright/mcp@latest", "text-violet-400")}
            <a href="/docs/mcp" class="inline-flex items-center gap-2 text-violet-400 text-sm font-medium mt-4 hover:gap-3 transition-all">查看 MCP 文档 ${icons.arrow}</a>
          </div>
        </div>
        <div class="reveal reveal-delay-3">
          ${h3label("可访问性树视图")}
          <p class="text-txt-secondary text-sm mb-4">AI Agent 看到的是结构化的可访问性树，使用元素引用进行确定性交互：</p>
          <div class="code-block group/code p-5">
            <pre><code class="text-txt-secondary">${raw(treeHtml)}</code></pre>
          </div>
          <div class="mt-6 p-5 rounded-xl bg-surface border border-border">
            <p class="text-txt-secondary text-sm leading-relaxed">
              Agent 使用 <code class="inline-code">e5</code>、<code class="inline-code">e10</code> 等引用进行交互 —— <strong class="text-txt-primary">确定性强，无视觉歧义</strong>。涵盖导航、表单填写、截图、网络模拟、存储管理等。
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function librarySection(): Html {
  const tabs = [
    { id: "screenshot", label: "截图", code: CODE_SCREENSHOT },
    { id: "pdf", label: "生成 PDF", code: CODE_PDF },
    { id: "mobile", label: "移动设备", code: CODE_MOBILE },
    { id: "network", label: "网络拦截", code: CODE_NETWORK },
  ];
  return html`
  <section id="library" class="py-24 sm:py-32 border-t border-border/50 bg-surface/30 scroll-mt-20">
    <div class="max-w-[1400px] mx-auto px-5 sm:px-8">
      <div class="reveal mb-12">
        <span class="text-amber-400 text-xs font-semibold tracking-widest uppercase">Playwright Library</span>
        <h2 class="font-display text-3xl sm:text-4xl font-bold text-txt-primary tracking-tight mt-3 mb-6">浏览器自动化脚本</h2>
        <p class="text-txt-secondary max-w-2xl leading-relaxed">网页抓取、PDF 生成、截图捕获，以及任何需要程序化浏览器控制的工作流。</p>
      </div>
      <div class="reveal reveal-delay-1">
        <div class="flex gap-1 border-b border-border overflow-x-auto" role="tablist" aria-label="Library 示例">
          ${tabs.map((t, i) => html`
          <button type="button" class="tab-btn ${i === 0 ? "active" : ""} px-4 py-3 text-sm font-medium text-txt-muted border-b-2 border-transparent whitespace-nowrap" data-tab="${t.id}" role="tab" aria-selected="${i === 0 ? "true" : "false"}">${t.label}</button>`)}
        </div>
        ${tabs.map((t, i) => html`
        <div class="tab-panel ${i === 0 ? "active" : ""}" id="panel-${t.id}" role="tabpanel">
          ${codeBlock(t.code, "ts", { class: "rounded-t-none border-t-0" })}
        </div>`)}
      </div>
      <div class="reveal reveal-delay-2 mt-6 flex flex-wrap items-center gap-4">
        <div class="max-w-sm w-full sm:w-auto">
          ${pmCommand({ bun: "bun add playwright", npm: "npm i playwright", pnpm: "pnpm add playwright", yarn: "yarn add playwright" })}
        </div>
        <a href="/docs/library" class="inline-flex items-center gap-2 text-amber-400 text-sm font-medium hover:gap-3 transition-all">查看 Library 文档 ${icons.arrow}</a>
      </div>
    </div>
  </section>`;
}

function browsers(): Html {
  const check = html`<span class="inline-flex w-6 h-6 rounded-full bg-accent/10 border border-accent/25 items-center justify-center"><svg class="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M5 13l4 4L19 7"/></svg></span>`;
  const row = (name: string, dot: string, version: string): Html => html`
    <tr class="border-t border-border/50 hover:bg-surface-light/40 transition-colors">
      <td class="px-6 py-4">
        <span class="flex items-center gap-2.5">
          <span class="w-2.5 h-2.5 rounded-full ${dot}"></span>
          <span class="text-txt-primary text-sm font-medium">${name}</span>
          <span class="text-txt-muted text-xs font-mono">${version}</span>
        </span>
      </td>
      <td class="px-6 py-4 text-center">${check}</td>
      <td class="px-6 py-4 text-center">${check}</td>
      <td class="px-6 py-4 text-center">${check}</td>
    </tr>`;
  return html`
  <section id="browsers" class="py-24 sm:py-32 border-t border-border/50 scroll-mt-20">
    <div class="max-w-[1400px] mx-auto px-5 sm:px-8">
      <div class="reveal text-center mb-14">
        <span class="text-txt-muted text-xs font-semibold tracking-widest uppercase">跨浏览器</span>
        <h2 class="font-display text-3xl sm:text-4xl font-bold text-txt-primary tracking-tight mt-3">全面的浏览器支持</h2>
        <p class="text-txt-secondary mt-3">所有平台支持无头和有头模式</p>
      </div>
      <div class="reveal reveal-delay-1 max-w-2xl mx-auto">
        <div class="rounded-2xl border border-border overflow-hidden bg-surface/40">
          <table class="w-full">
            <thead>
              <tr class="bg-surface">
                <th class="px-6 py-4 text-left text-xs font-semibold text-txt-muted uppercase tracking-wider">引擎</th>
                <th class="px-6 py-4 text-center text-xs font-semibold text-txt-muted uppercase tracking-wider">Linux</th>
                <th class="px-6 py-4 text-center text-xs font-semibold text-txt-muted uppercase tracking-wider">macOS</th>
                <th class="px-6 py-4 text-center text-xs font-semibold text-txt-muted uppercase tracking-wider">Windows</th>
              </tr>
            </thead>
            <tbody>
              ${row("Chromium", "bg-blue-400", "147.0")}
              ${row("Firefox", "bg-orange-400", "149.0")}
              ${row("WebKit", "bg-cyan", "26.4")}
            </tbody>
          </table>
        </div>
        <p class="text-txt-muted text-xs text-center mt-4">同一套测试，三大引擎，所有桌面平台。</p>
      </div>
    </div>
  </section>`;
}

function docsBand(): Html {
  const cards = [
    { href: "/docs/intro", tone: "text-accent", hover: "group-hover:text-accent", border: "hover:border-accent/40", title: "入门", desc: "安装、编写并运行第一个测试", count: "5 篇" },
    { href: "/docs/locators", tone: "text-cyan", hover: "group-hover:text-cyan", border: "hover:border-cyan/40", title: "核心概念", desc: "定位器、断言、自动等待与认证", count: "5 篇" },
    { href: "/docs/cli", tone: "text-violet-400", hover: "group-hover:text-violet-400", border: "hover:border-violet-400/40", title: "工具", desc: "CLI、MCP 与 Library 脚本", count: "3 篇" },
    { href: "/docs/configuration", tone: "text-amber-400", hover: "group-hover:text-amber-400", border: "hover:border-amber-400/40", title: "配置", desc: "测试配置与持续集成", count: "2 篇" },
  ];
  return html`
  <section id="docs" class="py-24 sm:py-32 border-t border-border/50 relative overflow-hidden scroll-mt-20">
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-accent/5 rounded-full blur-[100px]"></div>
    </div>
    <div class="relative max-w-[1400px] mx-auto px-5 sm:px-8">
      <div class="reveal text-center mb-14">
        <span class="text-accent text-xs font-semibold tracking-widest uppercase">中文文档</span>
        <h2 class="font-display text-3xl sm:text-4xl font-bold text-txt-primary tracking-tight mt-3">深入文档，掌握每个细节</h2>
        <p class="text-txt-secondary mt-3 max-w-xl mx-auto">15 篇简体中文指南，覆盖从安装到 CI 的完整路径。支持全文搜索。</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        ${cards.map((c) => html`
        <a href="${c.href}" class="spotlight-card group p-7 ${c.border}">
          <span class="${c.tone} text-xs font-mono">${c.count}</span>
          <h3 class="font-display text-lg font-semibold text-txt-primary mt-2 mb-2 ${c.hover} transition-colors">${c.title}</h3>
          <p class="text-txt-secondary text-sm leading-relaxed mb-4">${c.desc}</p>
          <span class="${c.tone} text-sm inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">开始阅读 ${icons.arrow}</span>
        </a>`)}
      </div>
    </div>
  </section>`;
}

export function landingPage(): Html {
  return html`
  <main id="main">
    ${hero()}
    ${marquee()}
    ${features()}
    ${quickstart()}
    ${testSection()}
    ${cliSection()}
    ${mcpSection()}
    ${librarySection()}
    ${browsers()}
    ${docsBand()}
  </main>`;
}