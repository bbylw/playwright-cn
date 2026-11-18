---
title: 运行测试
description: 用命令行筛选、调试、并行执行测试，并选择 reporters 查看运行结果。
section: 入门
order: 4
slug: running-tests
---

所有运行入口都是 `bunx playwright test`（npm 用户写作 `npx playwright test`）。默认行为：并行执行 `testDir` 下所有匹配的文件，在每个配置的项目（浏览器）上各跑一遍，无头模式，失败按配置重试。

## 选择要运行的测试

```bash
bunx playwright test
bunx playwright test tests/example.spec.ts
bunx playwright test tests/example.spec.ts:12
bunx playwright test tests/auth tests/cart
```

按标题过滤使用 `-g`，它接受字符串或正则表达式；`--grep-invert` 排除匹配项：

```bash
bunx playwright test -g "待办"
bunx playwright test -g "/登录|注册/"
bunx playwright test --grep-invert "慢用例"
```

按项目（浏览器）过滤：

```bash
bunx playwright test --project=chromium
bunx playwright test --project=chromium --project=firefox
bunx playwright test --list
```

`--list` 只打印将被执行的用例清单，用于确认过滤条件是否命中，不启动浏览器。项目定义见[测试配置](/docs/configuration)。

## 常用命令行选项

| 选项 | 作用 |
|---|---|
| `--project=name` | 只运行指定项目 |
| `-g=pattern` | 按标题正则过滤 |
| `--headed` | 显示浏览器窗口 |
| `--debug` | 打开 Playwright Inspector 单步调试 |
| `--ui` | 打开 UI Mode 界面 |
| `--watch` | 配合 `--ui` 监听文件变化自动重跑 |
| `--workers=n` | 覆盖并发 worker 数 |
| `--shard=i/n` | 只运行第 i 份分片，见[持续集成](/docs/ci) |
| `--retries=n` | 覆盖重试次数 |
| `--repeat-each=n` | 每个用例重复运行 n 次，用于排查不稳定 |
| `--max-failures=n` | 达到失败数量后提前结束，`-x` 等价于 1 |
| `--last-failed` | 只重跑上次失败的用例 |
| `--trace=on` / `--video=on` | 临时覆盖追踪与录像策略 |
| `--reporter=list` | 临时覆盖 reporter |
| `--update-snapshots` | 更新快照断言的基线 |
| `--output=dir` | 覆盖产物输出目录 |

## 有头模式与调试

```bash
bunx playwright test --headed
bunx playwright test --debug
```

`--debug` 会在 Playwright Inspector 中暂停，可以逐步执行、查看每步选择器的命中情况，并在界面上高亮元素。要只调试关心的那一段，在用例中插入 `await page.pause();`，或用 `await page.debugger.pause()` / `await page.debugger.resume()` 精确控制暂停位置。

> [!TIP]
> UI Mode 是本地开发的首选：`bunx playwright test --ui` 打开侧边栏界面，可按文件树选择用例、查看每一步的时间线、追踪和定位器高亮。加 `--watch` 后文件保存即自动重跑受影响用例。

## 失败重跑

```bash
bunx playwright test --last-failed
bunx playwright test --until-failed
```

`--last-failed` 依据上一次运行结果只重跑失败用例；`--until-failed` 反复运行同一批用例直到出现一次失败，是复现偶发问题的最直接手段。配置中的 `retries` 用于在 CI 上自动重试，见[测试配置](/docs/configuration)。

## 并行执行

并发度由 `workers`（可同时运行多少个测试文件）与 `fullyParallel`（同一文件内的用例是否也拆开并行）共同决定：

```bash
bunx playwright test --workers=4
bunx playwright test --workers=0   # 在同一进程中顺序执行，便于排查
```

同一文件内用例默认串行共享 `beforeAll` 等准备逻辑；设置 `fullyParallel: true` 后文件内用例也会被拆到不同 worker。用例之间应保持独立，不要依赖执行顺序，必要时用 `test.describe.configure({ mode: 'serial' })` 显式声明串行组。

## 查看结果

```bash
bunx playwright show-report
bunx playwright show-report dist/report
bunx playwright merge-reports --reporter=html ./blob-reports
```

默认 reporter 为 `list`，并在 HTML reporter 启用时把报告写入 `playwright-report/`。失败用例的输出包含期望值、实际值、重试次数和堆栈；若配置了 `trace: 'on-first-retry'`，失败产物位于 `test-results/` 中，可直接打开：

```bash
bunx playwright show-trace test-results/example-待办-chromium/trace.zip
```

reporter 配置与产物保留策略见[测试配置](/docs/configuration)和[追踪查看器](/docs/trace-viewer)。

## 环境变量

配置文件中读取环境变量是控制运行行为的标准做法：

```bash
CI=true bunx playwright test
PWDEBUG=1 bunx playwright test          # 等价于 --debug
DEBUG=pw:browser bunx playwright test   # 打印浏览器进程日志
```

在 `playwright.config.ts` 中可用 `process.env.CI` 区分本地与 CI，例如 CI 上强制 `retries: 2` 与 `forbidOnly: true`，详见[测试配置](/docs/configuration)。

## 下一步

- [生成测试](/docs/codegen)：录制界面操作生成初始代码
- [定位器](/docs/locators)：写出稳定的选择条件
- [追踪查看器](/docs/trace-viewer)：分析失败原因
