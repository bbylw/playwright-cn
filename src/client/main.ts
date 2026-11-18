/** 落地页交互：标题扰动、聚光卡片、磁性按钮、选项卡、终端演示 */
import { initShared, prefersReducedMotion, finePointer } from "./shared.ts";

/* 标题字符扰动入场 */
function initScramble(): void {
  const pool = "!<>-_\\/[]{}=+*^?#";
  document.querySelectorAll<HTMLElement>("[data-scramble]").forEach((el, idx) => {
    const target = el.textContent ?? "";
    el.setAttribute("aria-label", target);
    if (prefersReducedMotion) return;
    const chars = Array.from(target);
    const duration = 700;
    const start = performance.now() + 200 + idx * 260;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      const settled = Math.floor(t * chars.length);
      let out = "";
      for (let i = 0; i < chars.length; i++) {
        if (i < settled || chars[i] === " ") out += chars[i];
        else out += pool[Math.floor(Math.random() * pool.length)];
      }
      el.textContent = out;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    };
    requestAnimationFrame(tick);
  });
}

/* 聚光边框跟随指针 */
function initSpotlight(): void {
  if (!finePointer) return;
  document.querySelectorAll<HTMLElement>(".spotlight-card").forEach((card) => {
    let raf = 0;
    card.addEventListener("pointermove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      });
    });
  });
}

/* 磁性按钮 */
function initMagnetic(): void {
  if (!finePointer || prefersReducedMotion) return;
  document.querySelectorAll<HTMLElement>(".magnetic-btn").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const rect = btn.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const dy = (e.clientY - rect.top - rect.height / 2) / rect.height;
      btn.style.transform = `translate(${dx * 8}px, ${dy * 6}px)`;
    });
    btn.addEventListener("pointerleave", () => {
      btn.style.transform = "";
    });
  });
}

/* Library 示例选项卡 */
function initTabs(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-tab]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.tab;
      buttons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("active", active);
        b.setAttribute("aria-selected", String(active));
      });
      document.querySelectorAll(".tab-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === `panel-${id}`);
      });
    });
  });
}

/* Hero 终端打字演示（只播放一次） */
function initTerminal(): void {
  const body = document.getElementById("terminalBody");
  if (!body || prefersReducedMotion) return;
  const lines = Array.from(body.querySelectorAll<HTMLElement>(".term-line"));
  if (lines.length === 0) return;

  const typeTargets = new Map<HTMLElement, string>();
  lines.forEach((line) => {
    const t = line.querySelector<HTMLElement>("[data-type]");
    if (t) {
      typeTargets.set(line, t.textContent ?? "");
      t.textContent = "";
    }
  });
  body.classList.add("term-pending");

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let played = false;

  const play = async () => {
    if (played) return;
    played = true;
    await sleep(400);
    for (const line of lines) {
      line.classList.add("term-show");
      const text = typeTargets.get(line);
      if (text !== undefined) {
        const t = line.querySelector<HTMLElement>("[data-type]")!;
        for (let i = 0; i <= text.length; i++) {
          t.textContent = text.slice(0, i);
          await sleep(28);
        }
        await sleep(320);
      } else {
        await sleep(line.textContent?.startsWith("Downloading") ? 620 : 240);
      }
    }
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void play();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(body);
  } else {
    void play();
  }
}

initShared();
initScramble();
initSpotlight();
initMagnetic();
initTabs();
initTerminal();