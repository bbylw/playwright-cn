/**
 * Bun 开发 / 预览服务器
 *   bun run server.ts --dev   构建 + 监听源码自动重建
 *   bun run server.ts         仅静态服务已构建产物
 */
import { watch } from "node:fs";
import { join, normalize } from "node:path";

const ROOT = import.meta.dir;
const PORT = Number(process.env.PORT ?? 3000);
const DEV = process.argv.includes("--dev");

function runBuild(): boolean {
  const result = Bun.spawnSync([process.execPath, "run", "scripts/build.ts"], {
    cwd: ROOT,
    stdout: "inherit",
    stderr: "inherit",
  });
  return result.exitCode === 0;
}

if (DEV) {
  if (!runBuild()) console.error("首次构建失败，修复后保存任意源文件即可重试。");
  let timer: ReturnType<typeof setTimeout> | undefined;
  let building = false;
  let queued = false;
  const rebuild = () => {
    if (building) {
      queued = true;
      return;
    }
    building = true;
    runBuild();
    building = false;
    if (queued) {
      queued = false;
      rebuild();
    }
  };
  for (const dir of ["src", "nimbus", "content", "scripts"]) {
    watch(join(ROOT, dir), { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(rebuild, 250);
    });
  }
  console.log(`✔ 开发模式：监听 src/ nimbus/ content/ scripts/`);
}

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    let pathname: string;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return new Response("Bad Request", { status: 400 });
    }
    if (pathname.includes("..")) return new Response("Bad Request", { status: 400 });
    if (pathname.endsWith("/")) pathname += "index.html";

    const candidates = [pathname];
    if (!pathname.includes(".")) {
      candidates.push(`${pathname}/index.html`, `${pathname}.html`);
    }
    for (const candidate of candidates) {
      const path = normalize(join(ROOT, candidate));
      if (!path.startsWith(ROOT)) continue;
      const file = Bun.file(path);
      if (await file.exists()) {
        return new Response(file, {
          headers: { "Cache-Control": DEV ? "no-cache" : "public, max-age=300" },
        });
      }
    }
    const notFound = Bun.file(join(ROOT, "404.html"));
    if (await notFound.exists()) {
      return new Response(notFound, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`✔ Playwright 中文站点：http://localhost:${server.port}`);