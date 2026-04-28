# 🎭 Playwright

[![npm version](https://img.shields.io/npm/v/playwright.svg)](https://www.npmjs.com/package/playwright) <!-- GEN:chromium-version-badge -->[![Chromium version](https://img.shields.io/badge/chromium-147.0.7727.49-blue.svg?logo=google-chrome)](https://www.chromium.org/Home)<!-- GEN:stop --> <!-- GEN:firefox-version-badge -->[![Firefox version](https://img.shields.io/badge/firefox-149.0-blue.svg?logo=firefoxbrowser)](https://www.mozilla.org/en-US/firefox/new/)<!-- GEN:stop --> <!-- GEN:webkit-version-badge -->[![WebKit version](https://img.shields.io/badge/webkit-26.4-blue.svg?logo=safari)](https://webkit.org/)<!-- GEN:stop --> [![Join Discord](https://img.shields.io/badge/join-discord-informational)](https://aka.ms/playwright/discord)

## [文档](https://playwright.dev) | [API 参考](https://playwright.dev/docs/api/class-playwright)

Playwright 是一个用于 Web 自动化和测试的框架。它通过单一 API 驱动 Chromium、Firefox 和 WebKit —— 适用于测试、脚本以及 AI 代理工具。

## 快速开始

选择适合你工作流的方式：

| | 适用场景 | 安装方式 |
|---|---|---|
| **[Playwright Test](#playwright-test)** | 端到端测试 | `npm init playwright@latest` |
| **[Playwright CLI](#playwright-cli)** | 编码代理（Claude Code、Copilot） | `npm i -g @playwright/cli@latest` |
| **[Playwright MCP](#playwright-mcp)** | AI 代理和 LLM 驱动的自动化 | `npx @playwright/mcp@latest` |
| **[Playwright Library](#playwright-library)** | 浏览器自动化脚本 | `npm i playwright` |
| **[VS Code 扩展](#vs-code-扩展)** | 在 VS Code 中编写和调试测试 | [从应用商店安装](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) |

---

## Playwright Test

Playwright Test 是一个功能齐全的测试运行器，专为端到端测试而构建。它可在 Chromium、Firefox 和 WebKit 上运行测试，具备完整的浏览器隔离、自动等待和 Web 优先断言。

### 安装

```bash
npm init playwright@latest
```

或手动添加：

```bash
npm i -D @playwright/test
npx playwright install
```

### 编写测试

```TypeScript
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await page.getByRole('link', { name: 'Get started' }).click();
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
```

### 运行测试

```bash
npx playwright test
```

测试默认以无头模式在所有配置的浏览器上并行运行。每个测试都会获得一个全新的浏览器上下文 —— 完全隔离，几乎零开销。

### 核心能力

**自动等待和 Web 优先断言。** 无需人工超时。Playwright 等待元素可操作，断言会自动重试直到条件满足。

**定位器。** 使用反映用户视角的弹性定位器查找元素：

```TypeScript
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByPlaceholder('Search...')
page.getByTestId('login-form')
```

**测试隔离。** 每个测试在自己的浏览器上下文中运行 —— 等同于全新的浏览器配置文件。保存一次认证状态，跨测试复用：

```TypeScript
// 登录后保存状态
await page.context().storageState({ path: 'auth.json' });

// 在其他测试中复用
test.use({ storageState: 'auth.json' });
```

**追踪。** 在失败时捕获执行追踪、截图和视频。在 [Trace Viewer](https://playwright.dev/docs/trace-viewer) 中检查每个操作、DOM 快照、网络请求和控制台消息：

```TypeScript
// playwright.config.ts
export default defineConfig({
  use: {
    trace: 'on-first-retry',
  },
});
```

```bash
npx playwright show-trace trace.zip
```

<!-- TODO: screenshot of trace viewer -->

**并行执行。** 测试默认在所有配置的浏览器上并行运行。

[完整测试文档](https://playwright.dev/docs/intro)

---

## Playwright CLI

[Playwright CLI](https://github.com/microsoft/playwright-cli) 是为编码代理设计的浏览器自动化命令行接口。它比 MCP 更节省 token —— 命令避免将大型工具 schema 和可访问性树加载到模型上下文中。

### 安装

```bash
npm install -g @playwright/cli@latest
```

可选安装技能以获得更丰富的代理集成：

```bash
playwright-cli install --skills
```

### 使用

将编码代理指向任务：

```
使用 playwright-cli 测试 https://demo.playwright.dev/todomvc 上的"添加待办"流程。
为所有成功和失败的场景截图。
```

或直接运行命令：

```bash
playwright-cli open https://demo.playwright.dev/todomvc/ --headed
playwright-cli type "Buy groceries"
playwright-cli press Enter
playwright-cli screenshot
```

### 会话监控

使用 `playwright-cli show` 打开可视化仪表板，实时预览所有运行中的浏览器会话。点击任意会话可放大并进行远程控制。

```bash
playwright-cli show
```

<!-- TODO: screenshot of playwright-cli show dashboard -->

[完整 CLI 文档](https://playwright.dev/docs/cli-agent) | [GitHub](https://github.com/microsoft/playwright-cli)

---

## Playwright MCP

[Playwright MCP 服务器](https://github.com/microsoft/playwright-mcp) 通过 [模型上下文协议](https://modelcontextprotocol.io) 为 AI 代理提供完整的浏览器控制。代理使用结构化的可访问性快照与页面交互 —— 无需视觉模型或截图。

### 设置

添加到你的 MCP 客户端（VS Code、Cursor、Claude Desktop、Windsurf 等）：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**VS Code 一键安装：**

[<img src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20MCP%20Server&color=0098FF" alt="Install in VS Code" />](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522playwright%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522%2540playwright%252Fmcp%2540latest%2522%255D%257D)

**Claude Code：**

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

### 工作原理

让 AI 助手与任意网页交互：

```
导航到 https://demo.playwright.dev/todomvc 并添加几个待办事项。
```

代理将页面视为结构化的可访问性树：

```
- heading "todos" [level=1]
- textbox "What needs to be done?" [ref=e5]
- listitem:
  - checkbox "Toggle Todo" [ref=e10]
  - text: "Buy groceries"
```

它使用 `e5` 和 `e10` 等元素引用进行点击、输入和交互 —— 确定性强且无视觉歧义。工具涵盖导航、表单填写、截图、网络模拟、存储管理等。

[完整 MCP 文档](https://playwright.dev/docs/mcp) | [GitHub](https://github.com/microsoft/playwright-mcp)

---

## Playwright Library

使用 `playwright` 作为库编写浏览器自动化脚本 —— 网页抓取、PDF 生成、截图捕获，以及任何需要程序化浏览器控制而无需测试运行器的工作流。

### 安装

```bash
npm i playwright
```

### 示例

**截图：**

```TypeScript
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://playwright.dev/');
await page.screenshot({ path: 'screenshot.png' });
await browser.close();
```

**生成 PDF：**

```TypeScript
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://playwright.dev/');
await page.pdf({ path: 'page.pdf', format: 'A4' });
await browser.close();
```

**模拟移动设备：**

```TypeScript
import { chromium, devices } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext(devices['iPhone 15']);
const page = await context.newPage();
await page.goto('https://playwright.dev/');
await page.screenshot({ path: 'mobile.png' });
await browser.close();
```

**拦截网络请求：**

```TypeScript
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.route('**/*.{png,jpg,jpeg}', route => route.abort());
await page.goto('https://playwright.dev/');
await browser.close();
```

[库文档](https://playwright.dev/docs/library) | [API 参考](https://playwright.dev/docs/api/class-playwright)

---

## VS Code 扩展

[Playwright VS Code 扩展](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) 将测试运行、调试和代码生成直接集成到编辑器中。

<!-- TODO: hero screenshot of VS Code with Playwright sidebar -->

**运行和调试测试** —— 在编辑器中一键完成。设置断点、检查变量，并通过实时浏览器视图逐步执行测试。

**使用 CodeGen 生成测试。** 点击"录制新测试"打开浏览器 —— 导航并与应用交互，Playwright 为你编写测试代码。

**选取定位器。** 将鼠标悬停在浏览器中的任意元素上查看最佳可用定位器，然后点击复制到剪贴板。

**Trace Viewer 集成。** 在侧边栏中启用"显示 Trace Viewer"，每次测试运行后获取完整执行追踪 —— DOM 快照、网络请求、控制台日志和每一步的截图。

[安装扩展](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) | [VS Code 指南](https://playwright.dev/docs/getting-started-vscode)

---

## 跨浏览器支持

|          | Linux | macOS | Windows |
|   :---   | :---: | :---: | :---:   |
| Chromium<sup>1</sup> <!-- GEN:chromium-version -->147.0.7727.49<!-- GEN:stop --> | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| WebKit <!-- GEN:webkit-version -->26.4<!-- GEN:stop --> | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Firefox <!-- GEN:firefox-version -->149.0<!-- GEN:stop --> | :white_check_mark: | :white_check_mark: | :white_check_mark: |

所有平台支持无头和有头模式。<sup>1</sup> 默认使用 [Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing)。

## 其他语言

Playwright 也提供 [Python](https://playwright.dev/python/docs/intro)、[.NET](https://playwright.dev/dotnet/docs/intro) 和 [Java](https://playwright.dev/java/docs/intro) 版本。

## 资源

* [文档](https://playwright.dev)
* [API 参考](https://playwright.dev/docs/api/class-playwright)
* [MCP 服务器](https://github.com/microsoft/playwright-mcp)
* [编码代理 CLI](https://github.com/microsoft/playwright-cli)
* [VS Code 扩展](https://github.com/microsoft/playwright-vscode)
* [贡献指南](https://github.com/microsoft/playwright/blob/main/CONTRIBUTING.md)
* [更新日志](https://github.com/microsoft/playwright/releases)
* [Discord](https://aka.ms/playwright/discord)

---

> 本文档汉化自 [microsoft/playwright](https://github.com/microsoft/playwright)
