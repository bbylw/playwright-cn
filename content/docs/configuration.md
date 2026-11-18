---
title: 测试配置
description: 用 defineConfig 设置 projects、use 选项、超时重试、reporter 与 webServer。
section: 配置
order: 1
slug: configuration
---

配置写在项目根目录的 `playwright.config.ts`。用 `defineConfig` 包裹可获得字段类型检查与自动补全，同时允许在运行时读取 `process.env.CI` 等环境变量做分支。

## 一份完整配置

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? '50%' : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  outputDir: './test-results',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, dependencies: ['setup'] },
    { name: 'api', testDir: './api-tests' },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 顶层选项

| 选项 | 默认值 | 说明 |
|---|---|---|
| `testDir` | 配置文件所在目录 | 搜索测试文件的根目录 |
| `testMatch` / `testIgnore` | 匹配 `*.spec.ts`、`*.test.ts` | 包含与排除模式，可用字符串或数组 |
| `globalSetup` / `globalTeardown` | 无 | 整套运行前后各执行一次的脚本路径 |
| `timeout` | 30000 | 单个用例的总时长上限，0 表示不限制 |
| `expect` | `{ timeout: 5000 }` | Web 优先断言的重试上限，可加 `toHaveScreenshot` 阈值 |
| `retries` | 0，CI 上建议 2 | 失败后重试次数 |
| `workers` | CPU 核数一半，CI 上为 2 | 并发数量，可写 `'50%'`；0 表示在当前进程内串行 |
| `fullyParallel` | false | 是否把同一文件内的用例也拆开并行 |
| `forbidOnly` | false | 为 true 时残留 `test.only` 会让运行失败，用于拦住误提交 |
| `outputDir` | `test-results` | 产物目录，可被 `--output` 覆盖 |
| `reporter` | `list` | 报告形式，见下文 |
| `use` / `projects` / `webServer` | 无 | 见下文三节 |

## projects

每个项目是一份独立配置，`--project=name` 选择运行对象，未配置 `projects` 时视为单个匿名项目。常见划分方式：

- 按浏览器：`use` 中展开 `devices['Desktop Chrome']` 等预设
- 按目录：为接口测试单独设置 `testDir`
- 按身份：配合 `dependencies` 与 `storageState`，见[认证](/docs/auth)
- 按范围：用 `testMatch` 拆出冒烟用例集，只在部署后运行

项目级 `use` 覆盖全局 `use`，未声明的字段沿用全局值：

```ts
export default defineConfig({
  use: { trace: 'off', viewport: { width: 1280, height: 720 } },
  projects: [
    { name: 'fast', use: { trace: 'on' } },
    { name: 'responsive', use: { viewport: { width: 375, height: 812 } } },
  ],
});
```

`devices` 中的机型参数包含 `viewport`、`userAgent`、`deviceScaleFactor`、`isMobile`、`hasTouch`，与 [Library 脚本](/docs/library)的设备模拟共用同一份定义。

## use 选项

`use` 的键即 fixture 名，测试代码里也能用 `test.use()` 按文件覆盖：

| 选项 | 说明 |
|---|---|
| `baseURL` | `goto()` 与 `request` 的相对路径前缀 |
| `viewport` / `deviceScaleFactor` | 视口尺寸与像素比，设为 `null` 跟随窗口 |
| `headless` | 无头开关，通常交给 CI 环境决定 |
| `channel` | 使用本机浏览器渠道，如 `chrome`、`msedge` |
| `trace` / `screenshot` / `video` | 产物保留策略，见[追踪查看器](/docs/trace-viewer) |
| `storageState` | 登录状态文件路径或对象，见[认证](/docs/auth) |
| `testIdAttribute` | `getByTestId` 读取的属性名，默认 `data-testid` |
| `actionTimeout` / `navigationTimeout` | 单次动作与导航的超时，默认 0（不限制），仍受用例 `timeout` 约束 |
| `ignoreHTTPSErrors` | 自签证书环境 |
| `extraHTTPHeaders` / `httpCredentials` / `proxy` | 请求头、Basic 认证与代理 |
| `permissions` / `geolocation` / `locale` / `timezoneId` / `colorScheme` | 运行环境模拟，另可配 `viewport` |
| `launchOptions` | 透传给 `browserType.launch()` 的底层参数，如 `args`、`env` |

## reporter

`reporter` 接受字符串或数组，数组形式可同时输出多种报告：

```ts
export default defineConfig({
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'results.xml' }],
    ['github'],
  ],
});
```

常用 reporter：`list`、`dot`、`line`、`github`（输出 Actions 注解）、`html`（本地报告）、`json`、`junit`、`blob`（多分片汇总）。分别用 `bunx playwright show-report` 与 `bunx playwright merge-reports` 查看和合并，见[持续集成](/docs/ci)。

## webServer

一条配置即可让本地复用已启动的服务、CI 干净启动：

```ts
export default defineConfig({
  webServer: [
    { command: 'bun run --hot src/server.ts', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI, stdout: 'pipe' },
    { command: 'bun run mock-api', url: 'http://localhost:4000/health', env: { NODE_ENV: 'test' } },
  ],
});
```

| 字段 | 说明 |
|---|---|
| `command` | 启动命令，字符串或参数数组 |
| `url` | 就绪探测地址，返回 2xx 或 3xx 视为启动完成 |
| `stdout` / `stderr` | `'pipe'` 透传日志，`'ignore'` 丢弃 |
| `cwd` / `env` | 工作目录与附加环境变量 |
| `reuseExistingServer` | 端口已被占用时是否复用现有服务，CI 上应为 false |
| `headers` | 就绪探测使用的请求头 |
| `timeout` | 等待就绪的超时时间 |

## 覆盖配置

命令行参数优先于配置文件，其余选项保留配置值：

```bash
bunx playwright test --workers=1 --retries=0 --reporter=line --output=tmp/artifacts
```

需要更复杂的分支时，直接在配置文件里用 JavaScript 计算项目列表：

```ts
const only = process.env.PW_PROJECT?.split(',') ?? [];

export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ].filter((project) => !only.length || only.includes(project.name)),
});
```
