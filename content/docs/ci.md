---
title: 持续集成
description: 在 GitHub Actions 中安装缓存浏览器、分片并行运行，并上传报告与失败产物。
section: 配置
order: 2
slug: ci
---

CI 上的 Playwright 要解决三件事：浏览器装得快、跑得完、失败时能拿到证据。下面以 GitHub Actions 为例，其他平台（GitLab CI、Jenkins、Azure Pipelines）思路相同。

## 基本工作流

`.github/workflows/e2e.yml`：

```yaml
name: e2e
on:
  push:
    branches: [main]
  pull_request:
jobs:
  playwright:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-${{ hashFiles('**/bun.lock') }}
          restore-keys: ${{ runner.os }}-playwright-
      - name: Install dependencies
        run: bun install
      - name: Install browsers
        run: bunx playwright install --with-deps
      - name: Run tests
        run: bunx playwright test
        env:
          CI: true
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

`timeout-minutes` 要大于整套测试的实际耗时，否则任务被强行终止且看不到失败原因。`CI: true` 让配置中的 `retries`、`forbidOnly`、`workers` 分支生效。缓存命中时 `playwright install` 几乎是空操作，但覆盖新增引擎或版本变更的情况，所以无条件执行。

## 缓存浏览器

浏览器下载是 CI 上最慢的一步。缓存路径由 `PLAYWRIGHT_BROWSERS_PATH` 决定，默认位置：

| 平台 | 路径 |
|---|---|
| Linux | `~/.cache/ms-playwright` |
| macOS | `~/Library/Caches/ms-playwright` |
| Windows | `%LOCALAPPDATA%\ms-playwright` |

缓存键同时锁定运行器与锁文件即可：Playwright 版本随 `bun.lock` 变化，旧缓存自然失效。若自定义了 `PLAYWRIGHT_BROWSERS_PATH`，`actions/cache` 的 `path` 必须使用同一目录，否则缓存永远不会命中。

## Linux 系统依赖

纯净 runner 缺少字体与共享库，`--with-deps` 会调用 `apt` 一并安装：

```bash
bunx playwright install --with-deps chromium
bunx playwright install-deps
```

`install-deps` 只支持 Debian/Ubuntu 系。在 Alpine、RHEL 或自建镜像中，需要手动安装 `libnss3`、`libgbm1`、`libatk-bridge2.0-0`、`fonts-noto-color-emoji` 等包，或直接使用官方镜像。

## 使用官方镜像

镜像内已含浏览器与全部依赖，省去安装步骤，版本可复现性最好：

```yaml
jobs:
  playwright:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.59.0-noble
      options: --user 1001
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bunx playwright test
```

镜像标签中的版本号必须与 `package.json` 里的 Playwright 版本一致，否则运行时仍会重新下载浏览器；`-noble`、`-jammy`、`-focal` 对应不同 Ubuntu 版本。

## 分片并行

用例规模变大后，用 `--shard=i/n` 把一次运行切成多份并行执行。每个分片看到相同的用例全集，但只运行自己那一份：

```yaml
    strategy:
      fail-fast: false
      matrix:
        shard: ['1/4', '2/4', '3/4', '4/4']
    steps:
      - run: bunx playwright test --shard=${{ matrix.shard }} --reporter=blob
```

矩阵规模乘以浏览器项目数不应超过账号可用的并发任务数。`blob` reporter 会为每个分片产出可合并的部分报告。

## 汇总多分片报告

上传各分片的 blob 报告，再由一个合并任务生成完整 HTML：

```yaml
      - uses: actions/upload-artifact@v4
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report
          retention-days: 1
  merge-reports:
    needs: playwright
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true
      - run: bunx playwright merge-reports --reporter html ./all-blob-reports
      - uses: actions/upload-artifact@v4
        with:
          name: html-report
          path: playwright-report
```

`merge-reports` 依赖测试文件与配置文件位于相同路径，因此合并任务同样需要 `checkout`，产物目录配置也应保持一致。

## 上传失败证据

除 HTML 报告外，把 trace、截图、视频一起上传，排查时无需重跑：

```yaml
      - uses: actions/upload-artifact@v4
        if: ${{ failure() }}
        with:
          name: test-results
          path: |
            test-results/*/trace.zip
            test-results/**/*.png
            test-results/**/*.webm
```

配合配置中的 `trace: 'on-first-retry'` 与 `video: 'retain-on-failure'`，产物体积可控。下载 `trace.zip` 后用 `bunx playwright show-trace trace.zip` 在本地打开现场，详见[追踪查看器](/docs/trace-viewer)。

## 常见问题

| 现象 | 处理方式 |
|---|---|
| 本地通过、CI 上超时 | 降低 `workers`；CI 机器核数通常远少于本机 |
| 报错缺少共享库或截图白屏 | 使用 `--with-deps` 或官方镜像 |
| `browsers weren't installed` | 缓存路径与 `PLAYWRIGHT_BROWSERS_PATH` 不一致，或安装步骤被条件跳过 |
| 偶发失败难以复现 | `trace: 'on-first-retry'` 保留现场，必要时 `--repeat-each` 放大 |
| 找不到被测服务 | 用 `webServer` 声明依赖服务与就绪探测地址，见[测试配置](/docs/configuration) |

> [!WARNING]
> 不要把 `storageState` 文件、测试账号密码写进仓库或工作流文件。通过 Secrets 注入环境变量，在 `playwright.config.ts` 或 setup 用例中读取，见[认证](/docs/auth)。
