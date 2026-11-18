---
title: 编写测试
description: 从测试文件、用例分组、钩子到 fixture，组织可维护的端到端测试代码。
section: 入门
order: 3
slug: writing-tests
---

一个测试文件由若干测试用例组成，每个用例拿到一份干净的浏览器上下文。本页说明如何组织用例、复用准备逻辑和控制执行行为。

## 测试文件

测试文件放在配置项 `testDir` 指定的目录中，默认匹配 `**/*.spec.ts`。用例由 `test(title, callback)` 声明，回调参数解构出的即为 fixture：

```ts
import { test, expect } from '@playwright/test';

test('待办列表可用', async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc');
  await page.getByPlaceholder('What needs to be done?').fill('Buy groceries');
  await page.getByPlaceholder('What needs to be done?').press('Enter');
  await expect(page.getByRole('listitem')).toHaveCount(1);
});
```

运行时可用 `-g` 按标题过滤用例，见[运行测试](/docs/running-tests)。

## 用例分组

`test.describe` 只影响组织结构和配置作用域，不会创建新的浏览器上下文：

```ts
test.describe('购物车', () => {
  test('可以加入商品', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
  });

  test.describe('结算', () => {
    test('未登录时提示登录', async ({ page }) => {
      await page.goto('/checkout');
      await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    });
  });
});
```

> [!TIP]
> 用 `test.describe.configure({ mode: 'serial' })` 让一组用例串行执行并共享状态；默认模式为 `mode: 'parallel'`。

## 跳过与标记

| API | 行为 |
|---|---|
| `test.skip()` | 用例体内调用时无条件跳过 |
| `test.skip(condition, description)` | 条件成立时跳过 |
| `test.fixme()` | 标记为待修复，执行到该处即停止 |
| `test.fail()` | 声明预期失败：失败视为通过，通过视为未预期成功 |
| `test.slow()` | 超时时间放宽为三倍 |
| `test.setTimeout(ms)` | 覆盖当前用例的超时 |
| `test.info().annotations` | 向报告附加标注，例如已知缺陷链接 |

```ts
test('Chromium 专有行为', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', '仅覆盖 Chromium');
  await page.goto('/devtools');
});
```

## 参数化

用普通循环生成用例，标题通过模板字符串保持唯一：

```ts
for (const os of ['Windows', 'macOS', 'Linux']) {
  test(`下载 ${os} 版本`, async ({ page }) => {
    await page.goto('/download');
    await page.getByRole('tab', { name: os }).click();
    await expect(page.getByRole('link', { name: 'Download' })).toBeVisible();
  });
}
```

## 钩子

```ts
test.describe('文章编辑', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/admin/login');
    await page.getByLabel('密码').fill(process.env.ADMIN_PASSWORD ?? '');
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/posts');
  });

  test('可以新建文章', async ({ page }) => {
    await page.getByRole('button', { name: 'New post' }).click();
  });
});
```

`beforeAll` 和 `afterAll` 在文件内只执行一次，不能访问 `page` fixture —— 需要浏览器时用 `browser` 自行创建页面。`beforeEach` 和 `afterEach` 在每个用例前后各执行一次。

## 步骤与超时

```ts
test('下单流程', async ({ page }) => {
  test.slow();
  await test.step('加入商品', async () => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add to cart' }).click();
  });

  await test.step('提交订单', async () => {
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page.getByText('Order placed')).toBeVisible();
  });
});
```

## 内置 fixture

用例参数即为 fixture，最常用的是 `page`：

```ts
test('直接操作上下文', async ({ context, page, request, browserName }) => {
  await context.grantPermissions(['geolocation']);
  await page.goto('/');
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();
  expect(browserName).toBe('chromium');
});
```

| fixture | 作用 |
|---|---|
| `page` | 当前页面的 `Page`，配置 `baseURL` 后可用相对路径导航 |
| `context` | `page` 所属的 `BrowserContext`，可再创建页面 |
| `browser` | 已启动的 `Browser`，多数用例无需直接使用 |
| `request` | 独立于浏览器的 API 请求上下文 |
| `browserName` | 当前引擎名：`chromium`、`firefox` 或 `webkit` |
| `headless` | 是否无头运行，常用于跳过需要人工观察的用例 |
| `playwright` | 用于创建额外浏览器或请求上下文 |

## 自定义 fixture

把重复的登录、数据准备逻辑抽成 fixture 文件，在同目录下的 `fixtures.ts` 中导出：

```ts
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  loggedInPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.getByLabel('用户名').fill('admin');
    await page.getByLabel('密码').fill('secret');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page.getByRole('heading', { name: '控制台' })).toBeVisible();
    await use();
  },
});

export { expect };
```

其它文件改为从 `./fixtures` 导入 `test` 与 `expect`，即可在参数列表中解构 `loggedInPage`。登录类准备逻辑更推荐用 `storageState` 复用，见[认证](/docs/auth)。
