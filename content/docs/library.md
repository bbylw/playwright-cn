---
title: Library 脚本
description: 把 playwright 作为库编写浏览器自动化脚本，涵盖截图、PDF、设备模拟与网络拦截。
section: 工具
order: 3
slug: library
---

`playwright` 包提供浏览器自动化 API 本身：启动浏览器、打开页面、定位元素、执行脚本。不需要测试运行器、断言和报告时，用它编写网页抓取、PDF 生成、截图批量导出等脚本更直接。

## 安装

```bash
bun add playwright
bunx playwright install chromium
```

`@playwright/test` 已经依赖 `playwright`，因此测试项目不需要再单独安装。两者区别见文末对照表。

## 第一个脚本

创建 `scripts/capture.ts`，用 Bun 直接运行（Bun 与 ESM 均支持顶层 `await`）：

```ts
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://playwright.dev/');
await page.screenshot({ path: 'screenshot.png' });
await browser.close();
```

```bash
bun run scripts/capture.ts
```

## 浏览器与上下文

`chromium`、`firefox`、`webkit` 三个入口共享同一套 API。浏览器实例昂贵，上下文便宜 —— 需要彼此隔离的会话时创建多个上下文，而不是重启浏览器：

```ts
const browser = await chromium.launch({ headless: false, slowMo: 100 });
const anonymous = await browser.newContext();
const signedIn = await browser.newContext({ storageState: 'auth.json' });

await Promise.all([anonymous.close(), signedIn.close()]);
await browser.close();
```

启动选项常用 `headless`、`channel`、`executablePath`、`args`、`proxy`；上下文选项常用 `viewport`、`deviceScaleFactor`、`locale`、`timezoneId`、`geolocation`、`permissions`、`ignoreHTTPSErrors`。若不本地启动浏览器，`chromium.connect(endpoint)` 可连接 `bunx playwright run-server` 的服务端，`chromium.connectOverCDP('http://127.0.0.1:9222')` 可接管以 `--remote-debugging-port` 启动的 Chrome，返回的同样是 `Browser` 对象。

## 定位与操作

库使用的定位器、动作与自动等待规则与测试完全一致，见[定位器](/docs/locators)和[操作与自动等待](/docs/actions)：

```ts
const page = await browser.newPage();
await page.goto('https://demo.playwright.dev/todomvc');
await page.getByPlaceholder('What needs to be done?').fill('Buy groceries');
await page.getByPlaceholder('What needs to be done?').press('Enter');
console.log(await page.getByRole('listitem').allInnerTexts());
```

区别是没有 `expect` 的自动重试：读取状态前用 `locator.waitFor()` 或 `page.waitForResponse()` 显式等待。库脚本同样可以使用 `page.getByRole` 等语义定位器。

## 截图

```ts
await page.screenshot({ path: 'viewport.png' });
await page.screenshot({ path: 'full.png', fullPage: true });
await page.locator('header').screenshot({ path: 'header.png' });
await page.screenshot({ path: 'clip.png', clip: { x: 0, y: 0, width: 800, height: 600 }, scale: 'device' });
```

不带 `path` 时 `screenshot()` 返回 `Buffer`；`type` 可选 `png` 或 `jpeg`，`quality` 仅对 JPEG 生效。

## 生成 PDF

PDF 只在 Chromium 无头模式下可用，输出遵循页面打印样式：

```ts
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://playwright.dev/docs/pdf', { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: 'docs.pdf', format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm' } });
await browser.close();
```

## 模拟移动设备

`devices` 内置常见机型参数（视口、UA、`isMobile`、`hasTouch`）：

```ts
import { chromium, devices } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext(devices['iPhone 15']);
const page = await context.newPage();
await page.goto('https://playwright.dev/');
await page.screenshot({ path: 'mobile.png', fullPage: true });
await context.close();
await browser.close();
```

需要自行组合时传入 `viewport`、`userAgent`、`deviceScaleFactor`、`isMobile`、`hasTouch`，`page.tap()` 依赖 `hasTouch`。

## 拦截网络

```ts
await page.route('**/*.{png,jpg,jpeg,svg}', (route) => route.abort());

await page.route('**/api/config', (route) =>
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ featureFlags: { newCheckout: true } }),
  }),
);

await page.route('**/api/session', async (route) => {
  const response = await route.fetch();
  await route.fulfill({ response });
});
await page.goto('https://example.com');
```

`route.abort()` 中断、`route.continue()` 放行、`route.fulfill()` 伪造响应、`route.fetch()` 发起真实请求后再改写。观察流量而不改写时用事件：

```ts
page.on('response', (response) => {
  if (response.url().includes('/api/')) console.log(response.status(), response.url());
});

const ticket = await page.waitForResponse((r) => r.url().endsWith('/api/tickets') && r.status() === 200);
console.log(await ticket.json());
```

`page.route()` 只作用于当前页面，`context.route()` 覆盖该上下文内的所有页面与新标签页。

## 记录追踪与录像

```ts
const context = await browser.newContext({ recordVideo: { dir: 'videos/', size: { width: 1280, height: 720 } } });
await context.tracing.start({ name: 'session', screenshots: true, snapshots: true });

const page = await context.newPage();
await page.goto('https://playwright.dev/');

await context.tracing.stop({ path: 'trace.zip' });
await context.close();
await page.video()?.saveAs('videos/session.webm');
```

## 与测试运行器的区别

| | `playwright`（Library） | `@playwright/test`（Test） |
|---|---|---|
| 用途 | 抓取、生成产物、集成脚本 | 端到端测试 |
| 断言 | 无，需自行判断 | Web 优先自动重试断言 |
| 并行与重试 | 自行实现 | `workers`、`retries` 内置 |
| 报告 | 无 | HTML、list、junit 等 reporter |
| 代码组织 | 任意脚本 | `test`、fixture、钩子 |
