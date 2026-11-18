---
title: 认证
description: 通过 setup project 与 storageState 复用登录状态，避免每个用例重复走登录流程。
section: 核心概念
order: 4
slug: auth
---

每个测试都在全新的浏览器上下文中运行，Cookie、localStorage 和 sessionStorage 默认是空的。认证的目标是只做一次登录（或干脆绕过 UI 登录），把状态保存成文件，让所有用例直接以已登录身份开始。

## 方案选择

| 方案 | 适用场景 | 成本 |
|---|---|---|
| setup project + `storageState` | UI 登录是测试对象之一，或只有 Cookie 会话 | 每个浏览器一次真实登录 |
| API 请求登录 + `storageState` | 有可用的登录接口，UI 登录不需要覆盖 | 毫秒级，最稳定 |
| `globalSetup` + 固定 token | 整个套件共享一个身份 | 需要自行处理过期 |

## 使用 setup project

`tests/auth.setup.ts` 是一个普通测试文件，用 `test as setup` 引入，靠文件名模式与主配置区分：

```ts
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('作为管理员登录', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('用户名').fill(process.env.TEST_ADMIN_USERNAME ?? 'admin');
  await page.getByLabel('密码').fill(process.env.TEST_ADMIN_PASSWORD ?? '');
  await page.getByRole('button', { name: '登录' }).click();

  await expect(page.getByRole('menuitem', { name: '头像' })).toBeVisible();
  await page.context().storageState({ path: authFile });
});
```

在 `playwright.config.ts` 中声明 setup 项目，并让它成为其他项目的前置依赖：

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

这样 setup 项目在每个 worker 组开始前执行一次，后续项目的每个用例都拿到已登录的上下文。

## 通过 API 登录

绕过 UI 直接换取会话，再用 `request` fixture 保存状态：

```ts
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('通过接口登录', async ({ request }) => {
  const response = await request.post('/api/login', {
    data: { username: process.env.TEST_USERNAME, password: process.env.TEST_PASSWORD },
  });
  expect(response.ok()).toBeTruthy();
  await request.storageState({ path: authFile });
});
```

`request` fixture 已带上配置的 `baseURL` 与 `extraHTTPHeaders`，保存出的 `storageState` 会包含接口下发的 Cookie。

## 多种身份

为不同角色准备多个 setup 文件，各自保存独立的状态文件：

```ts
import { test as setup, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function logInAs(page: Page, role: 'buyer' | 'seller') {
  await page.goto('/login');
  await page.getByLabel('用户名').fill(process.env[`TEST_${role.toUpperCase()}_USERNAME`] ?? '');
  await page.getByLabel('密码').fill(process.env[`TEST_${role.toUpperCase()}_PASSWORD`] ?? '');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page.getByRole('banner').getByLabel(role)).toBeVisible();
}

setup('作为买家登录', async ({ page }) => {
  await logInAs(page, 'buyer');
  await page.context().storageState({ path: 'playwright/.auth/buyer.json' });
});

setup('作为卖家登录', async ({ page }) => {
  await logInAs(page, 'seller');
  await page.context().storageState({ path: 'playwright/.auth/seller.json' });
});
```

再把角色拆成项目，每个项目引用自己的状态文件：

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    { name: 'buyer', dependencies: ['setup'], use: { storageState: 'playwright/.auth/buyer.json' } },
    { name: 'seller', dependencies: ['setup'], use: { storageState: 'playwright/.auth/seller.json' } },
  ],
});
```

也可以不新建项目，在单个文件里切换身份：

```ts
import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/seller.json' });

test('卖家可以看到结算入口', async ({ page }) => {
  await page.goto('/orders');
  await expect(page.getByRole('button', { name: '结算' })).toBeVisible();
});
```

## 调试认证

怀疑状态文件有问题时，单独重跑 setup 项目，或直接观察登录过程：

```bash
bunx playwright test --project=setup
bunx playwright test --headed --debug -g "登录"
```

也可以在单个文件里清空状态，确认问题与登录无关：

```ts
test.use({ storageState: { cookies: [], origins: [] } });
```

或用 `bunx playwright codegen --save-storage=auth.json` 手工生成状态文件，逐个比对 Cookie 与本地存储项。

> [!WARNING]
> `storageState` 文件包含 Cookie 与 localStorage 中的会话令牌。把 `playwright/.auth` 目录加入 `.gitignore`，不要在 CI 日志里打印其内容，凭证一律通过环境变量或密钥管理注入。

## 状态过期与刷新

`storageState` 是登录时刻的快照，过期后所有用例都会失败。常见处理方式：

- 缩短 setup 与用例之间的时间差，让 CI 每次运行都重新登录

`--project=setup` 可以单独重跑登录步骤，验证凭证是否仍然有效。

## 下一步

- [测试配置](/docs/configuration)：`projects`、`dependencies` 与 `use` 的作用域
- [追踪查看器](/docs/trace-viewer)：确认 setup 是否真的执行过
