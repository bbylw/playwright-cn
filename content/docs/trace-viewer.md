---
title: 追踪查看器
description: 记录测试执行全过程，在 Trace Viewer 中检查动作、DOM 快照、网络与控制台。
section: 核心概念
order: 5
slug: trace-viewer
---

Trace 是一次测试运行的完整记录：每个动作及其起止时间、动作前后的 DOM 快照与截图、网络请求、控制台输出、源码和测试步骤，全部打包成单个 `trace.zip` 文件。它把「失败后无法复现」变成可以直接回放的现场。

## 开启追踪

在 `playwright.config.ts` 的 `use` 中配置：

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    trace: 'on-first-retry',
  },
});
```

| 取值 | 行为 |
|---|---|
| `off` | 不记录（默认，配合 `--trace=on` 临时打开） |
| `on` | 每次运行都记录，保留最近一次 |
| `retain-on-failure` | 全部记录，只保留失败用例的 trace |
| `on-first-retry` | 首次尝试不记录，重试时记录 —— CI 上最常用的折中 |
| `on-all-retries` / `retain-on-first-failure` / `retain-on-failure-and-retries` | 更细的保留策略，用于排查偶发失败 |

也可按项目或按文件覆盖：

```ts
export default defineConfig({
  projects: [
    { name: 'stable', use: { trace: 'retain-on-failure' } },
    { name: 'flaky-check', use: { trace: 'on' } },
  ],
});
```

```ts
import { test } from '@playwright/test';

test.use({ trace: 'on' });
```

## 记录内容

细粒度控制在 `use.trace` 传入对象时使用，例如保留源码与快照但关闭截图以减小体积：

```ts
export default defineConfig({
  use: {
    trace: {
      mode: 'retain-on-failure',
      screenshots: false,
      snapshots: true,
      sources: true,
      attachments: true,
    },
  },
});
```

| 选项 | 默认 | 说明 |
|---|---|---|
| `mode` | `off` | 与字符串取值一致的保留策略 |
| `screenshots` | 是 | 每个动作时捕获视口截图 |
| `snapshots` | 是 | 记录 DOM 快照，可在界面里以不同版本浏览 |
| `sources` | 是 | 内联测试源码，失败步骤可直接看到代码 |
| `attachments` | 是 | 是否包含 `test.info().attach` 附加的数据 |

## 打开 trace

```bash
bunx playwright show-trace test-results/example-chromium/trace.zip
bunx playwright show-trace trace.zip remote-trace.zip
```

多个 trace 会作为独立用例并列显示，便于跨浏览器对比。运行 HTML 报告时，失败用例的操作时间线里也直接内嵌 Trace 链接，无需手工找文件：

```bash
bunx playwright show-report
```

> [!NOTE]
> `show-trace` 会启动本地服务并在浏览器中打开 Trace Viewer。远程可访问的 trace 也可以直接传 URL，例如 CI 上传的产物地址。

## 界面导览

- **时间线（左上）**：按时间排列的动作、断言、控制台与网络事件；选中区间可只观察某一段，两种模式分别对应「动作起始」与「动作结束」
- **快照（左下）**：动作前后的 DOM 树，可切换渲染视图与 DOM 视图，支持按可访问性名称查找元素
- **调用（Call / Log 标签页）**：动作的参数、返回值、重试次数和完整堆栈，可直接复制定位器
- **Console / Network**：该步骤所在时刻的日志与请求；Network 标签可查看请求头、响应体和耗时
- **Attachments**：`test.step` 与 `attach` 产生的文件，包括截图、视频和自定义数据
- **Source**：定位器解析出的元素会被高亮；点击任一动作可在页面截图中看到命中范围

在时间线上勾选多个动作后点击 **Start** / **End** 图标，可以把视图锁定到指定时间范围，用来观察某个异步流程的演变。

## 在代码中制造线索

```ts
import { test, expect } from '@playwright/test';

test('导出报表', async ({ page }, testInfo) => {
  await page.goto('/reports');
  await page.getByRole('button', { name: '导出' }).click();

  await testInfo.attach('report.csv', {
    path: 'tmp/report.csv',
    contentType: 'text/csv',
  });

  await expect(page.getByRole('status')).toHaveText('导出完成');
});
```

`testInfo.attach` 的内容会出现在 trace 的 Attachments 中；`test.step` 则把动作分组，让时间线与用例叙述一致。

## 在 Library 中记录

不依赖测试运行器时，通过 `browserContext.tracing` 手工开始与停止：

```ts
import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext();

await context.tracing.start({ name: 'checkout', screenshots: true, snapshots: true });
const page = await context.newPage();
await page.goto('https://demo.playwright.dev/todomvc');
await context.tracing.stop({ path: 'trace.zip' });

await browser.close();
```

`tracing.stop({ path })` 把当前内容写入文件；`tracing.startChunk()` 与 `tracing.stopChunk({ path })` 配合，可以把一次长会话切成多份 trace 分别保存。

## 体积与保留策略

一份包含截图和 DOM 快照的 trace 通常在几百 KB 到几 MB 之间。控制体积的做法：

- CI 上使用 `retain-on-failure` 或 `on-first-retry`，只在需要时保留
- 关闭 `screenshots` 可显著减小体积，代价是看不到视觉现场
- 对静态资源密集的页面设置 `sources: false` 或用 `testInfo.attach` 精确挑选证据
- 用 `--output` 指定产物目录，把 trace 纳入 CI 缓存排除列表

## 下一步

- [运行测试](/docs/running-tests)：临时用 `--trace=on` 排查偶发失败
- [持续集成](/docs/ci)：把 trace 与 HTML 报告作为构建产物上传
