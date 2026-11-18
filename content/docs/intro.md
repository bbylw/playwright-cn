---
title: 简介
description: Playwright 端到端测试框架的核心能力、快速上手路径与跨浏览器支持范围。
section: 入门
order: 1
slug: intro
---

Playwright 是微软开源的 Web 端到端测试框架。它用一套 API 驱动 Chromium、Firefox 和 WebKit 三个引擎，在本地和 CI 上以并行、隔离的方式运行测试，并自带自动等待断言、代码录制、执行追踪和测试报告。

测试运行器以 `@playwright/test` 包发布，浏览器自动化能力则由 [Library](/docs/library) 单独提供。

## 核心能力

**跨浏览器。** 同一份测试代码在 Chromium、Firefox 和 WebKit 上运行，无需为 Safari 准备一台 macOS 机器 —— WebKit 由 Playwright 自带。

**自动等待。** 操作和断言都会等待元素满足条件，超时才失败。代码里不需要 `sleep` 或轮询：

```ts
await page.getByRole('button', { name: '提交' }).click();
await expect(page.getByRole('status')).toHaveText('保存成功');
```

**Web 优先断言。** `expect(...)` 配合定位器会自动重试直到断言成立，并在失败时打印重试过程与页面对比信息。

**全新浏览器上下文。** 每个测试都在独立的 [浏览器上下文](https://playwright.dev/docs/auth#basic-shared-account-in-all-tests) 中运行，等同于全新的浏览器配置文件，Cookie、本地存储和缓存互不污染，成本却远低于重启浏览器。

**弹性定位器。** 优先使用用户视角的语义定位方式，详见[定位器](/docs/locators)：

```ts
page.getByRole('button', { name: '提交' });
page.getByLabel('邮箱');
page.getByPlaceholder('搜索…');
page.getByTestId('login-form');
```

**完整的调试工具链。** 失败时自动捕获[追踪](/docs/trace-viewer)、截图和视频；在 Trace Viewer 中逐步检查每个操作、DOM 快照、网络请求和控制台输出。

**并行与分片。** 测试文件默认并行执行，CI 中可按分片水平扩展，详见[持续集成](/docs/ci)。

## 快速开始

### 创建新项目

在项目目录中运行脚手架，它会询问测试目录、浏览器和是否接入 CI，然后自动安装依赖与浏览器：

```bash
bun create playwright
```

使用 npm 时对应 `npm init playwright@latest`。

### 加入已有项目

```bash
bun add -D @playwright/test
bunx playwright install
```

`bunx` 等价于 npm 生态的 `npx`。`bunx playwright install` 只下载浏览器二进制，详见[安装](/docs/installation)。

## 第一个测试

创建 `tests/example.spec.ts`：

```ts
import { test, expect } from '@playwright/test';

test('页面标题正确', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

test('可以进入安装文档', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await page.getByRole('link', { name: 'Get started' }).click();
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
```

运行：

```bash
bunx playwright test
```

测试默认以无头模式在所有已配置的浏览器上并行执行。

## 浏览器支持

| 引擎 | 版本 | Linux | macOS | Windows |
|---|---|---|---|---|
| Chromium | 147 | 支持 | 支持 | 支持 |
| Firefox | 149 | 支持 | 支持 | 支持 |
| WebKit | 26.4 | 支持 | 支持 | 支持 |

所有引擎同时支持无头和有头模式。Chromium 默认使用 [Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing) 构建，也可以选择安装后通过 `channel: 'chrome'` 使用本机 Chrome，见[测试配置](/docs/configuration)。

> [!NOTE]
> Playwright 使用与系统浏览器版本解耦的专用构建，因此每次升级 Playwright 才会更新引擎，测试结果在同一次发布内保持稳定。

## 下一步

- [安装](/docs/installation)：安装浏览器、系统依赖与版本管理
- [编写测试](/docs/writing-tests)：用例、钩子、fixture 与参数化
- [运行测试](/docs/running-tests)：过滤、调试、并行和报告
- [定位器](/docs/locators) 与 [断言](/docs/assertions)：测试代码的两个基本构件
- [认证](/docs/auth)：复用登录状态，跳过重复登录
- [持续集成](/docs/ci)：GitHub Actions、缓存与分片

## 更多资源

- [API 参考](https://playwright.dev/docs/api/class-playwright)
- [GitHub 仓库](https://github.com/microsoft/playwright)
- [更新日志](https://github.com/microsoft/playwright/releases)

Playwright 还提供 [Python](https://playwright.dev/python/docs/intro)、[Java](https://playwright.dev/java/docs/intro) 和 [.NET](https://playwright.dev/dotnet/docs/intro) 版本。
