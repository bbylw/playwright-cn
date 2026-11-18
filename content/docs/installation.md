---
title: 安装
description: 安装 Playwright Test、浏览器二进制与系统依赖，并管理版本、渠道与离线环境。
section: 入门
order: 2
slug: installation
---

本页介绍如何把 Playwright 装进项目、如何下载浏览器，以及在内网或 CI 环境中安装时需要注意的事项。

## 环境要求

- Bun 1.0 及以上（或使用 Node.js 18 及以上配 npm/pnpm/yarn）
- Linux（Ubuntu 20.04+）、macOS 12+ 或 Windows 10+
- 约 1 GB 磁盘空间用于三个浏览器引擎

## 安装 Playwright Test

### 已有项目

```bash
bun add -D @playwright/test
```

npm 等价命令：

```bash
npm install -D @playwright/test
```

`@playwright/test` 包含测试运行器、Web 优先断言库，并依赖 `playwright` 核心包。若只需要浏览器自动化脚本而没有测试运行器，安装 `playwright` 即可，见 [Library 脚本](/docs/library)。

### 全新项目

```bash
bun create playwright
```

脚手架会依次询问测试目录（默认 `tests`）、GitHub Actions 集成、是否安装浏览器，然后写好配置文件。

## 安装浏览器

Playwright 不会复用系统里已安装的浏览器，而是下载经过充分测试的专用构建：

```bash
bunx playwright install
```

只安装部分引擎可以节省时间：

```bash
bunx playwright install chromium
bunx playwright install chromium firefox
```

在 CI 或首次运行时，连同 Linux 系统依赖一起安装：

```bash
bunx playwright install --with-deps
```

`--with-deps` 会调用系统包管理器安装字体、编解码器等库，需要 root 权限；非 Debian/Ubuntu 系统请先手动安装依赖，或使用官方 Docker 镜像（见[持续集成](/docs/ci)）。

浏览器下载后缓存在全局目录中，多个项目共享同一份副本，因此重复安装几乎不占额外空间：

- Linux：`~/.cache/ms-playwright`
- macOS：`~/Library/Caches/ms-playwright`
- Windows：`%LOCALAPPDATA%\ms-playwright`

## 选择浏览器渠道

除自带构建外，还可以指向系统安装的浏览器发行版。渠道在安装时不需要下载浏览器，但会牺牲版本可复现性，建议只在调试本机问题时使用：

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'msedge', use: { ...devices['Desktop Edge'], channel: 'msedge' } },
  ],
});
```

常用渠道值：`chrome`、`chrome-beta`、`msedge`、`msedge-beta`、`chromium`、`firefox`、`webkit`。

## 更新

升级 Playwright 会同时切换浏览器版本，务必重新执行安装命令：

```bash
bun add -D @playwright/test@latest
bunx playwright install
```

查看当前版本：

```bash
bunx playwright --version
```

> [!TIP]
> 把 `@playwright/test` 固定为精确版本而不是范围版本，可以让 CI 上的引擎版本可预测，减少偶发的浏览器行为差异。

## 内网与离线环境

浏览器下载走 CDN，可通过环境变量调整：

| 变量 | 作用 |
|---|---|
| `PLAYWRIGHT_BROWSERS_PATH` | 自定义浏览器缓存目录，设为 `0` 时安装到 `node_modules/playwright-core` 内 |
| `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` | 设为 `1` 跳过下载，后续手动安装 |
| `PLAYWRIGHT_DOWNLOAD_HOST` | 指向内部镜像服务器 |
| `HTTPS_PROXY` | 通过代理下载 |

示例：

```bash
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers bunx playwright install
```

在同一条 CI 任务里设置该变量，并在缓存步骤中使用相同路径，否则缓存不会命中。

## 验证安装

创建最小用例并运行：

```ts
import { test, expect } from '@playwright/test';

test('浏览器可以启动', async ({ page }) => {
  await page.goto('about:blank');
  expect(page.url()).toBe('about:blank');
});
```

```bash
bunx playwright test --project=chromium
```

若报错 `browserType.launch: Executable doesn't exist`，说明浏览器未安装或版本与当前 Playwright 不匹配，重新运行 `bunx playwright install` 即可。若报错缺少共享库，运行 `bunx playwright install-deps` 查看并安装缺失项。

## 常见目录

安装完成后项目里会出现以下结构：

- `playwright.config.ts` —— 全局配置，见[测试配置](/docs/configuration)
- `tests/example.spec.ts` —— 测试文件，默认可写成 `.spec.ts` 或 `.test.ts`
- `test-results/` —— 每次运行的产物：截图、视频、trace
- `playwright-report/` —— HTML 报告，用 `bunx playwright show-report` 打开

`test-results/` 与 `playwright-report/` 属于生成物，应加入 `.gitignore`。
