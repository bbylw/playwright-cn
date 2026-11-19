---
title: Playwright CLI
description: 面向编码智能体的浏览器自动化命令行工具，命令式调用比 MCP 更节省上下文。
section: 工具
order: 1
slug: cli
---

Playwright CLI（`@playwright/cli`）是为编码智能体设计的浏览器命令行接口。它把浏览器控制拆成短小的子命令，智能体只需执行 `playwright-cli click e15` 这样的指令，不必把大型工具 schema 和完整可访问性树载入上下文，因此比 MCP 更节省 token。

## 安装

```bash
bun add -g @playwright/cli@latest
playwright-cli --help
```

npm 用户写作 `npm install -g @playwright/cli@latest`。若项目已安装 Playwright 1.59 或更新版本，也可以不全局安装，直接用本地命令：

```bash
bunx playwright cli --help
```

## 安装技能（skills）

Claude Code、GitHub Copilot 等智能体会自动读取本地已安装的 skill，智能体据此了解每个命令的用法与参数：

```bash
playwright-cli install --skills
```

没有安装 skill 也能工作 —— 在任务里让智能体先读帮助即可：

> 使用 playwright-cli 测试 https://demo.playwright.dev/todomvc 上的「添加待办」流程。
> 先运行 `playwright-cli --help` 了解可用命令，为成功和失败两种场景分别截图。

## 基本工作流

打开浏览器、按快照给出的元素引用交互、必要时截图：

```bash
playwright-cli open https://demo.playwright.dev/todomvc/ --headed
playwright-cli type "Buy groceries"
playwright-cli press Enter
playwright-cli snapshot --depth=4
playwright-cli check e21
playwright-cli click e35
playwright-cli screenshot --filename=after.png
```

命令默认无头运行，加 `--headed` 才会弹出窗口。除 `open` 外的命令都作用于当前会话的浏览器，进程间复用同一个实例。

## 定位元素

大多数命令接受三种目标写法：快照返回的元素引用、CSS 选择器，或 Playwright 定位器表达式。

```bash
playwright-cli click e15
playwright-cli click "#main > button.submit"
playwright-cli click "getByRole('button', { name: 'Submit' })"
playwright-cli fill e5 "user@example.com" --submit
playwright-cli find "Add to cart"
```

`snapshot` 每次都会随命令输出，也可主动调用；`find` 在快照中搜索文本或正则，只返回命中节点，比抓整棵树更省 token。

## 会话管理

同一时间可以并行多个浏览器实例，用 `-s=name` 指定会话；不带 `-s` 时使用默认会话。

```bash
playwright-cli open https://playwright.dev
playwright-cli -s=example open https://example.com --persistent
playwright-cli list
playwright-cli -s=example close
playwright-cli close-all
playwright-cli kill-all
```

配置文件默认保存在内存中，重启浏览器后 Cookie 与本地存储丢失；`--persistent` 会落盘保留。让智能体固定使用某个会话，可设置环境变量：

```bash
PLAYWRIGHT_CLI_SESSION=todo-app claude .
```

## 浏览器、设备与远程连接

```bash
playwright-cli open https://playwright.dev --browser=chrome
playwright-cli open https://playwright.dev --device="iPhone 15"
playwright-cli open https://playwright.dev --mobile
playwright-cli attach --cdp=chrome
playwright-cli attach --cdp=http://127.0.0.1:9222
playwright-cli detach
```

`attach` 可接管正在运行的 Chrome/Edge（按渠道或 CDP 端点），适合复现用户现场；`detach` 只解除控制，不关闭外部浏览器。

## 抓取结果与排查

```bash
playwright-cli screenshot --hires
playwright-cli pdf --filename=page.pdf
playwright-cli state-save auth.json
playwright-cli state-load auth.json
playwright-cli console error
playwright-cli requests
playwright-cli route "**/api/config" --status=500
playwright-cli eval "JSON.stringify(performance.timing)"
playwright-cli run-code "async page => { await page.setViewportSize({ width: 400, height: 800 }); }"
```

录制与回放现场同样可用：`tracing-start` / `tracing-stop` 生成 trace，`video-start` / `video-stop` 录像，`recording-start` / `recording-stop` 把手工操作导出为 Playwright 代码。

在脚本中串联命令时，全局 `--raw` 选项会去掉页面状态与生成代码，只保留结果值和错误：

```bash
playwright-cli --raw eval "JSON.stringify(performance.timing)" | jq '.loadEventEnd - .navigationStart'
```

## 可视化监控

`show` 打开仪表板，列出所有活动会话的实时画面，点击任意会话即可放大并接管鼠标键盘，按 Esc 释放控制权。编码智能体在后台跑自动化时，这是最直接的观察方式：

```bash
playwright-cli show
playwright-cli show --annotate
```

`--annotate` 模式专为界面评审设计，可在页面上标注问题并把反馈交回智能体。

## 命令速查

| 命令 | 作用 |
|---|---|
| `open [url]` | 启动浏览器，可选导航 |
| `goto <url>` / `reload` / `go-back` | 导航控制 |
| `snapshot` / `find` | 获取页面结构与搜索元素 |
| `click` / `dblclick` / `hover` / `drag` | 指针动作 |
| `type` / `fill` / `press` / `keydown` / `keyup` | 键盘输入 |
| `check` / `uncheck` / `select` / `upload` / `drop` | 表单交互 |
| `screenshot` / `pdf` | 导出画面与文档 |
| `state-save` / `state-load` / `cookie-*` / `localstorage-*` | 存储状态 |
| `route` / `requests` / `console` | 网络与日志 |
| `eval` / `run-code` | 执行任意脚本 |
| `tab-list` / `tab-new` / `tab-select` / `tab-close` | 标签页管理 |
| `show` / `list` / `close` / `close-all` | 会话与仪表板 |

完整列表始终可以通过 `playwright-cli --help` 查看。

## CLI 还是 MCP

| | Playwright CLI | Playwright MCP |
|---|---|---|
| 适合 | 高吞吐编码智能体，需在有限上下文中同时处理代码库与浏览器 | 需要持续内省、逐步推理页面结构的智能体循环 |
| token 成本 | 低，命令输出按需裁剪 | 较高，快照随工具响应进入上下文 |
| 集成方式 | shell 命令 + skills | MCP 工具协议 |
| 详见 | 本页 | [Playwright MCP](/docs/mcp) |

两者共享同一套 Playwright 引擎，可按任务混用。
