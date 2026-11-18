/**
 * Nimbus + Bun 静态构建
 * 输出到 dist/（GitHub Actions 上传为 Pages artifact）：
 *   index.html · docs/<slug>/index.html · 404.html · assets/* · CNAME
 */
import { copyFileSync, cpSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderDocument, html } from "../nimbus/core.ts";
import { shell } from "../nimbus/layout.ts";
import { docsLayout } from "../nimbus/docs.ts";
import { landingPage } from "../src/pages/landing.ts";
import { loadDocs } from "../src/pages/docs.ts";

const ROOT = join(import.meta.dir, "..");
const OUT = join(ROOT, "dist");
const t0 = performance.now();

function write(rel: string, content: string): void {
  const path = join(OUT, rel);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, content);
}

/* 1. Tailwind v4 本地编译（替代 CDN 运行时） */
mkdirSync(join(OUT, "assets"), { recursive: true });
const tw = Bun.spawnSync(
  [process.execPath, "x", "@tailwindcss/cli", "-i", "src/styles/app.css", "-o", "dist/assets/app.css", "--minify"],
  { cwd: ROOT, stdout: "pipe", stderr: "pipe" }
);
if (tw.exitCode !== 0) {
  console.error(tw.stderr.toString());
  throw new Error("Tailwind 编译失败");
}

/* 2. 客户端脚本打包 */
const bundle = await Bun.build({
  entrypoints: [join(ROOT, "src/client/main.ts"), join(ROOT, "src/client/docs.ts")],
  outdir: join(OUT, "assets"),
  target: "browser",
  minify: true,
  naming: "[name].js",
});
if (!bundle.success) {
  for (const log of bundle.logs) console.error(log);
  throw new Error("客户端脚本打包失败");
}

/* 3. 落地页 */
write(
  "index.html",
  renderDocument(
    shell({
      title: "Playwright 中文 — Web 自动化与测试框架",
      description: "通过单一 API 驱动 Chromium、Firefox 和 WebKit。Playwright 中文落地页与文档：测试、脚本以及 AI 代理工具。",
      path: "/",
      active: "home",
      body: landingPage(),
      script: "/assets/main.js",
    })
  )
);

/* 4. 文档页 + 搜索索引 */
const { docs, data } = loadDocs();
const searchIndex: { slug: string; title: string; section: string; description: string; text: string }[] = [];
for (const doc of docs) {
  write(
    `docs/${doc.meta.slug}/index.html`,
    renderDocument(
      shell({
        title: `${doc.meta.title} — Playwright 中文文档`,
        description: doc.meta.description,
        path: `/docs/${doc.meta.slug}`,
        active: "docs",
        body: docsLayout(doc, data),
        script: "/assets/docs.js",
      })
    )
  );
  searchIndex.push({
    slug: doc.meta.slug,
    title: doc.meta.title,
    section: doc.meta.section,
    description: doc.meta.description,
    text: doc.plainText.slice(0, 6000),
  });
}
write("assets/search-index.json", JSON.stringify(searchIndex));

/* /docs → 入门简介 */
write(
  "docs/index.html",
  `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=/docs/intro"><link rel="canonical" href="/docs/intro"><title>Playwright 中文文档</title></head><body><a href="/docs/intro">前往文档简介 →</a></body></html>`
);

/* 5. 404 页 */
const notFoundBody = html`
  <main class="relative min-h-[70vh] flex items-center justify-center px-5 pt-16">
    <div class="text-center py-24">
      <p class="font-mono text-txt-muted text-sm mb-4">net::ERR_PAGE_NOT_FOUND</p>
      <h1 class="font-display font-bold text-7xl sm:text-8xl tracking-tighter gradient-text mb-6">404</h1>
      <p class="text-txt-secondary mb-2">这个页面没有被定位到。</p>
      <p class="font-mono text-xs text-txt-muted mb-10">await expect(page).toHaveURL(?) — 重试超时</p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <a href="/" class="inline-flex items-center justify-center px-6 py-3 bg-accent hover:bg-accent-dim text-surface-dark font-display font-semibold rounded-xl transition-colors">返回首页</a>
        <a href="/docs/intro" class="inline-flex items-center justify-center px-6 py-3 bg-surface border border-border hover:border-border-light text-txt-primary font-display font-medium rounded-xl transition-colors">浏览文档</a>
      </div>
    </div>
  </main>`;
write(
  "404.html",
  renderDocument(
    shell({
      title: "404 — Playwright 中文",
      description: "页面未找到",
      path: "/404",
      active: "home",
      body: notFoundBody,
      script: "/assets/main.js",
    })
  )
);

/* 6. 静态资源（自托管字体）与自定义域名（Pages artifact 需包含 CNAME） */
cpSync(join(ROOT, "public"), OUT, { recursive: true });
copyFileSync(join(ROOT, "CNAME"), join(OUT, "CNAME"));

const ms = Math.round(performance.now() - t0);
console.log(`✔ 构建完成：1 落地页 + ${docs.length} 文档页 + 404 + 搜索索引 → dist/（${ms}ms）`);