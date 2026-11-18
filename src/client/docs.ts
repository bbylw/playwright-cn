/** 文档页交互：侧边栏抽屉、TOC 滚动监听、全文搜索、反馈组件 */
import { initShared } from "./shared.ts";

/* 移动端侧边栏抽屉 */
function initSidebar(): void {
  const sidebar = document.getElementById("docsSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  const toggle = document.getElementById("sidebarToggle");
  if (!sidebar || !backdrop || !toggle) return;

  const setOpen = (open: boolean) => {
    sidebar.classList.toggle("open", open);
    backdrop.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () => setOpen(!sidebar.classList.contains("open")));
  backdrop.addEventListener("click", () => setOpen(false));
  document.getElementById("sidebarClose")?.addEventListener("click", () => setOpen(false));
  sidebar.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("open")) setOpen(false);
  });
}

/* TOC 滚动高亮 */
function initTocSpy(): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-toc]"));
  if (links.length === 0 || !("IntersectionObserver" in window)) return;
  const headings = Array.from(document.querySelectorAll<HTMLElement>(".prose-docs h2[id], .prose-docs h3[id]"));
  let activeId = "";
  const setActive = (id: string) => {
    if (id === activeId) return;
    activeId = id;
    links.forEach((l) => l.classList.toggle("toc-active", l.dataset.toc === id));
  };
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length > 0) setActive((visible[0].target as HTMLElement).id);
    },
    { rootMargin: "-80px 0px -65% 0px", threshold: 0 }
  );
  headings.forEach((h) => io.observe(h));
  links.forEach((l) => l.addEventListener("click", () => setActive(l.dataset.toc!)));
  if (headings[0]) setActive(headings[0].id);
}

/* ── 全文搜索 ─────────────────────────────────────── */

interface SearchEntry {
  slug: string;
  title: string;
  section: string;
  description: string;
  text: string;
}

interface Hit {
  entry: SearchEntry;
  score: number;
  snippet: string;
}

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function markTerms(text: string, terms: string[]): string {
  let out = escapeHtml(text);
  for (const term of terms) {
    if (!term) continue;
    const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    out = out.replace(re, "<mark>$1</mark>");
  }
  return out;
}

function search(index: SearchEntry[], query: string): Hit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const hits: Hit[] = [];
  for (const entry of index) {
    const title = entry.title.toLowerCase();
    const desc = entry.description.toLowerCase();
    const text = entry.text.toLowerCase();
    let score = 0;
    let firstPos = -1;
    for (const term of terms) {
      if (title.includes(term)) score += 10;
      if (desc.includes(term)) score += 4;
      const pos = text.indexOf(term);
      if (pos !== -1) {
        score += 2;
        if (firstPos === -1 || pos < firstPos) firstPos = pos;
      }
    }
    if (score === 0) continue;
    let snippet = entry.description;
    if (firstPos !== -1) {
      const start = Math.max(0, firstPos - 40);
      snippet = (start > 0 ? "…" : "") + entry.text.slice(start, start + 130) + "…";
    }
    hits.push({ entry, score, snippet });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 8);
}

function initSearch(): void {
  const modal = document.getElementById("searchModal") as HTMLDialogElement | null;
  const input = document.getElementById("searchInput") as HTMLInputElement | null;
  const resultsEl = document.getElementById("searchResults");
  const emptyEl = document.getElementById("searchEmpty");
  const countEl = document.getElementById("searchCount");
  if (!modal || !input || !resultsEl || !emptyEl || !countEl) return;

  let index: SearchEntry[] | null = null;
  let loading: Promise<void> | null = null;
  let hits: Hit[] = [];
  let active = 0;

  const loadIndex = () => {
    loading ??= fetch("/assets/search-index.json")
      .then((r) => r.json())
      .then((data: SearchEntry[]) => {
        index = data;
      })
      .catch(() => {
        emptyEl.textContent = "搜索索引加载失败，请刷新重试。";
      });
    return loading;
  };

  const render = () => {
    const query = input.value.trim();
    if (!query) {
      hits = [];
      resultsEl.innerHTML = "";
      emptyEl.hidden = false;
      emptyEl.textContent = "输入关键词开始搜索，例如「定位器」「storageState」「shard」";
      countEl.textContent = "";
      return;
    }
    if (!index) {
      emptyEl.hidden = false;
      emptyEl.textContent = "正在加载索引…";
      void loadIndex().then(render);
      return;
    }
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    hits = search(index, query);
    active = 0;
    if (hits.length === 0) {
      resultsEl.innerHTML = "";
      emptyEl.hidden = false;
      emptyEl.textContent = `没有找到与「${query}」相关的内容`;
      countEl.textContent = "0 条结果";
      return;
    }
    emptyEl.hidden = true;
    countEl.textContent = `${hits.length} 条结果`;
    resultsEl.innerHTML = hits
      .map(
        (hit, i) => `
      <li class="${i === active ? "search-hit-active" : ""}" role="option" aria-selected="${i === active}">
        <a href="/docs/${hit.entry.slug}">
          <span class="flex items-center justify-between gap-3">
            <span class="search-hit-title">${markTerms(hit.entry.title, terms)}</span>
            <span class="search-hit-section">${escapeHtml(hit.entry.section)}</span>
          </span>
          <span class="search-hit-snippet">${markTerms(hit.snippet, terms)}</span>
        </a>
      </li>`
      )
      .join("");
    resultsEl.querySelectorAll("li").forEach((li, i) => {
      li.addEventListener("pointerenter", () => setActive(i));
    });
  };

  const setActive = (i: number) => {
    active = i;
    resultsEl.querySelectorAll("li").forEach((li, j) => {
      li.classList.toggle("search-hit-active", j === i);
      li.setAttribute("aria-selected", String(j === i));
    });
    resultsEl.querySelectorAll("li")[i]?.scrollIntoView({ block: "nearest" });
  };

  const open = () => {
    if (modal.open) return;
    modal.showModal();
    input.value = "";
    render();
    input.focus();
    void loadIndex();
  };
  const close = () => {
    if (modal.open) modal.close();
  };

  document.getElementById("searchTrigger")?.addEventListener("click", open);
  document.getElementById("searchTriggerMobile")?.addEventListener("click", open);
  document.getElementById("searchClose")?.addEventListener("click", close);
  // closedby="any" 的轻量回退（Safari 等）：按下与抬起都在面板外才关闭
  if (!("closedBy" in HTMLDialogElement.prototype)) {
    const outside = (e: PointerEvent) => {
      const r = modal.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    modal.addEventListener("pointerdown", (e) => { pressedOutside = outside(e); });
    modal.addEventListener("pointerup", (e) => { if (pressedOutside && outside(e)) close(); });
  }
  input.addEventListener("input", render);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && hits.length) {
      e.preventDefault();
      setActive((active + 1) % hits.length);
    } else if (e.key === "ArrowUp" && hits.length) {
      e.preventDefault();
      setActive((active - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter" && hits.length) {
      e.preventDefault();
      window.location.href = `/docs/${hits[active].entry.slug}`;
    } else if (e.key === "Escape") {
      // type="search" 会原生吞掉 Esc 用于清空输入，这里改为直接关闭弹层
      e.preventDefault();
      close();
    }
  });
  document.addEventListener("keydown", (e) => {
    const tag = (document.activeElement?.tagName ?? "").toLowerCase();
    const typing = tag === "input" || tag === "textarea" || (document.activeElement as HTMLElement)?.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      modal.open ? close() : open();
    } else if (e.key === "/" && !typing && !modal.open) {
      e.preventDefault();
      open();
    }
  });
}

/* 页面反馈（本地存储） */
function initFeedback(): void {
  const widget = document.querySelector<HTMLElement>("[data-feedback]");
  if (!widget) return;
  const slug = widget.dataset.feedback!;
  const key = `playwright-cn-fb-${slug}`;
  const question = widget.querySelector<HTMLElement>("[data-feedback-question]");
  const actions = widget.querySelector<HTMLElement>("[data-feedback-actions]");
  if (!question || !actions) return;

  const thanks = () => {
    question.textContent = "感谢反馈！我们会持续改进这篇文档。";
    actions.remove();
  };
  try {
    if (localStorage.getItem(key)) thanks();
  } catch { /* 忽略 */ }
  actions.querySelectorAll<HTMLButtonElement>("[data-feedback-value]").forEach((btn) => {
    btn.addEventListener("click", () => {
      try {
        localStorage.setItem(key, btn.dataset.feedbackValue ?? "up");
      } catch { /* 忽略 */ }
      thanks();
    });
  });
}

initShared();
initSidebar();
initTocSpy();
initSearch();
initFeedback();