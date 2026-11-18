/** 共享交互：导航、回到顶部、复制按钮、入场动画、包管理器切换 */

export const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export function initNav(): void {
  const nav = document.getElementById("siteNav");
  const backToTop = document.getElementById("backToTop");
  const onScroll = () => {
    const y = window.scrollY;
    nav?.classList.toggle("nav-scrolled", y > 8);
    backToTop?.classList.toggle("show", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  backToTop?.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })
  );

  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (menuBtn && mobileMenu) {
    if ("popover" in HTMLElement.prototype) {
      // 原生 Popover：开合、light-dismiss、Esc 均由浏览器处理
      mobileMenu.addEventListener("toggle", (e) => {
        menuBtn.setAttribute("aria-expanded", String((e as ToggleEvent).newState === "open"));
      });
      mobileMenu.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => mobileMenu.hidePopover())
      );
    } else {
      // 旧浏览器回退：class 切换
      menuBtn.addEventListener("click", () => {
        const open = mobileMenu.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", String(open));
      });
      mobileMenu.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => {
          mobileMenu.classList.remove("open");
          menuBtn.setAttribute("aria-expanded", "false");
        })
      );
    }
  }
}

export function initReveal(): void {
  const targets = Array.from(document.querySelectorAll<HTMLElement>(".reveal, .stagger-children"));
  if (prefersReducedMotion) {
    targets.forEach((el) => el.classList.add("visible"));
    return;
  }
  // 支持滚动驱动动画时交给合成器线程（CSS animation-timeline: view()）
  if (CSS.supports("(animation-timeline: view()) and (animation-range: entry)")) {
    document.documentElement.classList.add("sda");
    return;
  }
  // 滚动位置检查（rAF 节流）：进入视口或已被跳过的元素都显示，
  // 不依赖 IO 阈值采样，快速滚动/锚点跳转不会遗漏。
  let pending = targets;
  let raf = 0;
  const check = () => {
    raf = 0;
    const vh = window.innerHeight;
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top < vh - 40) {
        el.classList.add("visible");
        return false;
      }
      return true;
    });
    if (pending.length === 0) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    }
  };
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(check);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  check();
}

async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
}

export function initCopyButtons(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    btn.addEventListener("click", async () => {
      const code = btn.closest(".code-block")?.querySelector("pre code");
      if (!code) return;
      const clone = code.cloneNode(true) as HTMLElement;
      clone.querySelectorAll(".cmd-prompt, .pm-variant:not(.pm-active)").forEach((n) => n.remove());
      const text = (clone.textContent ?? "").trim();
      try {
        await writeClipboard(text);
      } catch {
        return;
      }
      const label = btn.querySelector(".copy-label");
      btn.classList.add("copied");
      if (label) label.textContent = "已复制";
      clearTimeout(timer);
      timer = setTimeout(() => {
        btn.classList.remove("copied");
        if (label) label.textContent = "复制";
      }, 1600);
    });
  });
}

const PM_KEY = "playwright-cn-pm";

export function applyPm(pm: string): void {
  document.querySelectorAll<HTMLElement>(".pm-variant").forEach((el) => {
    el.classList.toggle("pm-active", el.dataset.pmVariant === pm);
  });
  document.querySelectorAll<HTMLButtonElement>(".pm-btn").forEach((btn) => {
    const active = btn.dataset.pm === pm;
    btn.classList.toggle("pm-btn-active", active);
    btn.setAttribute("aria-selected", String(active));
  });
}

export function initPmSwitcher(): void {
  let stored = "bun";
  try {
    stored = localStorage.getItem(PM_KEY) ?? "bun";
  } catch { /* 隐私模式 */ }
  if (!["bun", "npm", "pnpm", "yarn"].includes(stored)) stored = "bun";
  applyPm(stored);
  document.querySelectorAll<HTMLButtonElement>(".pm-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pm = btn.dataset.pm ?? "bun";
      applyPm(pm);
      try {
        localStorage.setItem(PM_KEY, pm);
      } catch { /* 忽略 */ }
    });
  });
}

export function initShared(): void {
  initNav();
  initReveal();
  initCopyButtons();
  initPmSwitcher();
}