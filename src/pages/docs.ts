/** 文档页装配 — 读取 content/docs/*.md 并生成路由数据 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderMarkdown, type RenderedDoc } from "../../nimbus/markdown.ts";
import type { DocsData } from "../../nimbus/docs.ts";

const SECTION_ORDER = ["入门", "核心概念", "工具", "配置"];
const ROOT = join(import.meta.dir, "..", "..");

export function loadDocs(): { docs: RenderedDoc[]; data: DocsData } {
  const dir = join(ROOT, "content", "docs");
  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  const docs = files.map((file) => {
    const doc = renderMarkdown(readFileSync(join(dir, file), "utf8"));
    if (doc.meta.slug !== file.replace(/\.md$/, "")) {
      throw new Error(`slug 与文件名不一致: ${file} → ${doc.meta.slug}`);
    }
    return doc;
  });

  const sections = SECTION_ORDER.map((name) => ({
    name,
    pages: docs
      .filter((d) => d.meta.section === name)
      .sort((a, b) => a.meta.order - b.meta.order)
      .map((d) => d.meta),
  })).filter((s) => s.pages.length > 0);

  const known = new Set(SECTION_ORDER);
  for (const doc of docs) {
    if (!known.has(doc.meta.section)) throw new Error(`未知文档分区: ${doc.meta.section} (${doc.meta.slug})`);
  }

  return { docs, data: { sections, flat: sections.flatMap((s) => s.pages) } };
}