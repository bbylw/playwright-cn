---
title: Playwright MCP
description: 通过模型上下文协议让 AI Agent 以可访问性快照驱动浏览器，覆盖工具与能力配置。
section: 工具
order: 2
slug: mcp
---

Playwright MCP（`@playwright/mcp`）把浏览器控制暴露为 [模型上下文协议](https://modelcontextprotocol.io) 工具。Agent 读取页面的结构化可访问性快照，用元素引用点击和输入 —— 不依赖视觉模型，也不靠像素坐标猜测，行为确定且可回放。

## 快速配置

在 MCP 客户端（VS Code、Cursor、Claude Desktop、Windsurf 等）的配置中加入：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "bunx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

若使用 npm 生态，把 `command` 换成 `npx`。VS Code 也可从 [MCP 目录](https://github.com/microsoft/playwright-mcp) 一键安装。

Claude Code 用命令行添加：

```bash
claude mcp add playwright bunx @playwright/mcp@latest
```

##Agent 看到什么

页面在Agent 眼中是一棵带引用的可访问性树，而不是截图。典型输出（TodoMVC）包含以下节点：

- `heading "todos" [level=1]`
- `textbox "What needs to be done?" [ref=e5]`
- `listitem` 下有 `checkbox "Toggle Todo" [ref=e10]` 与 `text: "Buy groceries"`

Agent 随后调用 `browser_click`、`browser_type` 等工具，把 `e5`、`e10` 这类引用作为目标参数。引用来自最近一次快照，页面重新渲染后需要再次获取快照 —— 这也是 MCP 需要持续内省的原因，见[定位器](/docs/locators)了解人类编写的等价写法。

## 核心工具

| 工具 | 作用 |
|---|---|
| `browser_navigate` / `browser_navigate_back` | 导航与后退 |
| `browser_snapshot` | 获取可访问性快照，可用 `depth`、`boxes` 控制体积 |
| `browser_find` | 在快照中按文本或正则搜索，只返回命中节点 |
| `browser_click` / `browser_hover` / `browser_drag` | 指针动作，目标为快照引用 |
| `browser_type` / `browser_fill_form` / `browser_press_key` | 输入、批量填表、按键 |
| `browser_select_option` / `browser_file_upload` / `browser_handle_dialog` | 表单与对话框 |
| `browser_take_screenshot` | 截图，仅在需要视觉证据时使用 |
| `browser_evaluate` / `browser_run_code_unsafe` | 执行页面脚本或 Playwright 代码 |
| `browser_wait_for` | 等待文本出现/消失或固定时长 |
| `browser_console_messages` / `browser_network_requests` | 日志与请求列表 |
| `browser_tabs` | 列出、新建、切换、关闭标签页 |
| `browser_storage_state` / `browser_set_storage_state` | 保存与恢复登录状态 |

`browser_run_code_unsafe` 会在服务端进程中执行任意代码，等同于远程代码执行，只应在受信环境启用。

## 能力开关

默认只启用核心浏览器工具，其他能力按需打开，可减少暴露给模型的工具数量与 token 开销。在 `args` 中加入 `--caps` 即可，多个能力用逗号分隔：

```bash
bunx @playwright/mcp@latest --caps=vision,pdf,testing
```

| 能力 | 追加的工具 |
|---|---|
| `vision` | 按坐标点击、拖拽、滚轮（`browser_mouse_*`） |
| `pdf` | `browser_pdf_save` |
| `testing` | `browser_verify_*`、`browser_generate_locator` |
| `network` | `browser_route`、`browser_network_state_set` 等请求拦截 |
| `storage` | Cookie、localStorage、sessionStorage 读写 |
| `devtools` | 高亮、trace、录像、逐步调试 |

## 浏览器与运行环境

常用命令行参数：

| 参数 | 作用 |
|---|---|
| `--browser=firefox` | 指定引擎或渠道：`chromium`、`chrome`、`firefox`、`webkit`、`msedge` |
| `--headless` | 无头运行（默认即为无头，需要界面时省略） |
| `--isolated` | 配置文件只保存在内存中，会话结束即销毁 |
| `--device="iPhone 15"` | 模拟设备视口、UA 与触摸 |
| `--viewport-size=1280x720` | 固定视口 |
| `--storage-state=auth.json` | 以已登录状态启动 |
| `--grant-permissions=geolocation` | 预先授予权限 |
| `--proxy-server=http://host:3128` | 走代理 |
| `--allowed-origins` / `--blocked-origins` | 限制浏览器可访问的来源 |
| `--test-id-attribute=data-qa` | 自定义测试标识属性 |

也可以连接到已经在跑的浏览器，复用真实登录与扩展环境：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "bunx",
      "args": ["@playwright/mcp@latest", "--cdp-endpoint=http://127.0.0.1:9222"]
    }
  }
}
```

## 配置文件与环境变量

参数较多时改用 JSON 配置文件，避免每次修改客户端配置：

```json
{
  "browser": {
    "browserName": "chromium",
    "isolated": true,
    "contextOptions": { "viewport": { "width": 1280, "height": 720 } }
  },
  "capabilities": ["vision", "testing"],
  "outputDir": ".playwright-mcp",
  "testIdAttribute": "data-qa",
  "network": { "allowedOrigins": ["http://localhost:3000"] },
  "timeouts": { "action": 10000, "navigation": 60000 }
}
```

```bash
bunx @playwright/mcp@latest --config=playwright-mcp.json
```

`--help` 会列出全部参数，每一项都有对应的 `PLAYWRIGHT_MCP_*` 环境变量，适合在容器或 CI 中注入。

## 作为远程服务运行

在没有图形显示的机器或 IDE 的 worker 进程中，先把服务端单独跑起来并开启 HTTP 传输，再让客户端连接 URL：

```bash
bunx @playwright/mcp@latest --port 8931
```

```json
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:8931/mcp"
    }
  }
}
```

## MCP 还是 CLI

| | Playwright MCP | Playwright CLI |
|---|---|---|
| 上下文成本 | 快照与工具 schema 进入模型上下文 | 命令输出按需裁剪，更省 token |
| 适合 | 探索式自动化、自愈测试、长时间自主任务 | 高吞吐编码Agent，同时处理代码库与浏览器 |
| 交互粒度 | 逐步内省页面结构 | 单条 shell 指令 |
| 详见 | 本页 | [Playwright CLI](/docs/cli) |

> [!WARNING]
> Playwright MCP 不是安全边界。Agent 获得的是真实浏览器控制权，请以最小能力集启动、用 `allowedOrigins` 收窄可访问来源，并在客户端审阅所有进入模型的响应内容。凭证与令牌应放进 `secrets` 参数，而不是写进页面或提示词。
