---
title: 断言
description: Web 优先断言自动重试直到条件满足，覆盖状态、文本、属性与 API 检查。
section: 核心概念
order: 2
slug: assertions
---

Playwright 的断言分两类：`expect(locator)` 与 `expect(page)` 是 Web 优先断言，会自动重试直到通过或超时；`expect(value)` 及其他通用断言只检查当前值一次，适合纯数据比较。

```ts
import { test, expect } from '@playwright/test';

test('提交后出现状态提示', async ({ page }) => {
  await page.getByRole('button', { name: '提交' }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('保存成功');
});
```

上面的 `toHaveText` 会轮询元素内容，最长等待 `expect.timeout`（默认 5 秒），因此无需为异步渲染补写等待逻辑。

## 常用 matcher

| 分类 | matcher | 说明 |
|---|---|---|
| 状态 | `toBeVisible()` / `toBeHidden()` | 元素有非空 bounding box 且 `visibility` 非 `hidden`；不可见包含不存在 |
| 状态 | `toBeAttached()` | 元素出现在 DOM 中，不要求可见 |
| 状态 | `toBeEnabled()` / `toBeDisabled()` | 非禁用且无 `aria-disabled` |
| 状态 | `toBeEditable()` | 输入框可编辑（非 `readonly`、非禁用） |
| 状态 | `toBeChecked()` / `toBeUnchecked()` | 复选框状态，兼容 `indeterminate` |
| 状态 | `toBeFocused()` | 元素持有焦点 |
| 状态 | `toBeInViewport()` | 元素进入视口，可选 `ratio` |
| 状态 | `toBeEmpty()` | 无子元素与文本 |
| 文本 | `toHaveText(text)` | 完整文本匹配，支持字符串、正则、数组（逐项） |
| 文本 | `toContainText(text)` | 部分文本匹配 |
| 值 | `toHaveValue(value)` | 输入框、`textarea`、`select` 的当前值 |
| 值 | `toHaveValues(values)` | 多选 `select` 的全部选中值 |
| 属性 | `toHaveAttribute(name, value)` | 属性值，值可为正则 |
| 属性 | `toHaveClass(classes)` / `toHaveCSS(name, value)` | class 列表与计算后样式 |
| 属性 | `toHaveId(id)` / `toHaveAccessibleName(name)` / `toHaveAccessibleDescription(desc)` | id 与可访问性信息 |
| 数量 | `toHaveCount(n)` | 定位器匹配的元素个数 |
| 页面 | `expect(page).toHaveTitle(t)` / `toHaveURL(u)` | 标题与地址，支持正则 |
| 截图 | `toHaveScreenshot(name, options)` | 视觉基线对比，`--update-snapshots` 更新基线 |
| 网络 | `expect(response).toBeOK()` | API 返回 2xx |

## 反向与多次断言

每个 matcher 都有对应的 `not` 形式：

```ts
await expect(page.getByRole('alert')).not.toBeVisible();
await expect(draft).not.toHaveText('');
```

对同一元素连续断言时，Web 优先断言会持续重试；若页面在断言之间发生变化，可把断言放进步骤中分批执行。

## 列表断言

`toHaveCount` 与逐项 matcher 配合使用，能可靠覆盖异步加载的列表：

```ts
const rows = page.getByRole('row');
await expect(rows).toHaveCount(3);
await expect(rows).toHaveText(['名称', '数量', '价格']);
await expect(rows.filter({ hasText: '键盘' })).toHaveCount(1);
```

## 轮询非 DOM 数据

`expect.poll` 对任意异步函数重试，直到返回满足 matcher 的值，适合轮询后端接口或页面内状态：

```ts
await expect
  .poll(async () => {
    const response = await page.request.get('/api/jobs/42');
    return response.status();
  }, {
    timeout: 15000,
    message: '等待后台任务完成',
  })
  .toBe(200);
```

也可以直接读取页面变量，逐次比较返回值：

```ts
const queueSize = () => page.evaluate(() => (window as any).ticketQueue.length);

await expect.poll(queueSize).toBeGreaterThan(1);
```

## 软断言

`expect.soft` 记录失败但不立刻中断用例，适合一个流程里检查多个独立字段：

```ts
await expect.soft(page.getByTestId('status')).toHaveText('提交成功');
await expect.soft(page.getByTestId('orderId')).toBeVisible();
await expect.soft(page).toHaveURL(/\/orders\/\d+/);
```

软断言失败仍会使用例最终判为失败，只是中间的 `click`、`fill` 等步骤会继续执行。也可用 `expect.configure` 让一段代码内的断言默认软化或调整超时：

```ts
const expectInSoftMode = expect.configure({ soft: true, timeout: 10000 });
await expectInSoftMode(page.getByRole('alert')).toBeVisible();
```

## 自定义 matcher

`expect.extend` 用于扩展通用断言，适合校验纯数据结果：

```ts
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () => `期望值在 ${floor} 到 ${ceiling} 之间，实际为 ${received}`,
      pass,
    };
  },
});

expect(Date.now()).toBeWithinRange(start, start + 5000);
```

> [!NOTE]
> 自定义 matcher 只支持同步逻辑；需要重试语义时把轮询放在 `expect.poll` 中。

## 调整超时与重试

Web 优先断言的重试上限由配置项 `expect: { timeout }` 控制，可在单个用例或 `expect.poll` 调用中覆盖：

```ts
import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 60000 });

test('慢接口返回后渲染', async ({ page }) => {
  await page.goto('/reports');
  await expect.poll(async () => (await page.request.get('/api/report')).json(), { timeout: 30000 })
    .toHaveProperty('status', 'ready');
});
```

失败输出包含 matcher 名称、期望值、重试期间的实际值序列和元素快照；打开[追踪查看器](/docs/trace-viewer)可以看到每次重试对应的 DOM 快照。

## 下一步

- [定位器](/docs/locators)：断言的目标如何描述
- [操作与自动等待](/docs/actions)：动作前的可操作性检查
