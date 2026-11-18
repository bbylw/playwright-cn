---
title: 定位器
description: 用角色、标签、文本与测试标识等语义方式描述元素，并支持过滤、链式与列表。
section: 核心概念
order: 1
slug: locators
---

定位器（Locator）是页面上某个或某组元素的惰性描述。`page.getByRole('button', { name: '提交' })` 不会立即查询 DOM，只有执行操作或断言时才解析，因此能安全应对重新渲染和页面切换。同一个定位器可重复使用，也可持续改进。

## 语义定位器

优先使用反映用户视角的方法，它们与实现细节（class、id 结构）解耦：

| 方法 | 匹配依据 |
|---|---|
| `page.getByRole(role, options)` | ARIA 角色与可访问名称，`name` 支持字符串、正则、`exact` |
| `page.getByLabel(text)` | 表单控件关联的 `label` 或 `aria-label` |
| `page.getByPlaceholder(text)` | 输入框 `placeholder` |
| `page.getByText(text)` | 元素的文本内容，`{ exact: true }` 要求大小写与空白完全一致 |
| `page.getByTitle(text)` | `title` 属性 |
| `page.getByAltText(text)` | 图片 `alt` 属性 |
| `page.getByTestId(text)` | 测试标识属性，默认 `data-testid` |

```ts
await page.getByRole('button', { name: '提交' }).click();
await page.getByLabel('邮箱').fill('user@example.com');
await page.getByPlaceholder('搜索商品').fill('键盘');
await page.getByRole('link', { name: '购物车', exact: true }).click();
await page.getByText('暂无订单', { exact: true }).isVisible();
await page.getByTestId('order-summary').textContent();
await page.getByRole('img', { name: '商品图片' }).screenshot();
```

`getByRole` 覆盖的角色来自 ARIA 规范，例如 `button`、`link`、`heading`、`textbox`、`checkbox`、`listitem`、`table`、`tab`。可访问名称由 `aria-label`、关联 `label`、可见文本等推导，具体可在浏览器开发者工具的可访问性面板核对。

> [!TIP]
> 在 UI Mode 或 Trace Viewer 中把鼠标悬停在动作上，可以看到 Playwright 建议的定位器；VS Code 扩展的 **Pick locator** 可直接复制最佳定位器。

## 必要时使用 CSS 或 XPath

语义方法不足以描述元素时，退回到 `page.locator()`：

```ts
const card = page.locator('article.product-card');
const input = page.locator('input[name="coupon"]');
const row = page.locator('tr').filter({ hasText: /订单 #\d+/ });
```

`page.locator()` 同样会在执行操作时重新解析并自动等待，区别只在于 CSS 更易受样式重构影响。XPath 可通过 `page.locator('xpath=...')` 使用，仅作最后手段。

## 链式与改进

定位器可以链式扩展，从粗到细描述目标：

```ts
const dialog = page.getByRole('dialog');
await dialog.getByRole('heading', { name: '新增地址' }).waitFor();
await dialog.getByLabel('邮政编码').fill('200000');
await dialog.getByRole('button', { name: '保存' }).click();
```

改进已有定位器使用 `locator.and()`、`locator.or()` 与 `locator.filter()`：

```ts
const products = page.locator('article.product-card');

await products.filter({ hasText: '键盘' }).click();
await products.filter({ has: page.getByRole('button', { name: '加入购物车' }) }).first().click();
await products.filter({ hasNot: page.locator('.sold-out') }).count();
await page.getByText(/订单|Order/).first().isVisible();
```

## 列表与严格模式

定位器可能匹配多个元素。执行动作时 Playwright 要求唯一命中，否则会抛出严格模式错误并列出候选元素：

```ts
const rows = page.getByRole('row');
await expect(rows).toHaveCount(4);
await expect(rows).toHaveText(['表头', '订单 A', '订单 B', '订单 C']);

await rows.nth(1).getByRole('button', { name: '取消' }).click();
await rows.last().click();
await rows.first().isVisible();

const titles = await page.getByRole('heading').allInnerTexts();
for (const item of await page.getByRole('listitem').all()) {
  await expect(item).toBeVisible();
}
```

`count()` 立即返回当前匹配数量且不等待；需要等待数量变化时用 `expect(...).toHaveCount()`。

## 框架与组件内定位

表格行、列表项等重复结构应先定位到容器再取子元素，避免整页范围内歧义：

```ts
const cart = page.getByRole('region', { name: '购物车' });
await expect(cart.getByRole('listitem')).toHaveCount(2);
await cart.getByRole('spinbutton', { name: '数量' }).fill('3');
```

## 内嵌文档（iframe）

```ts
const frame = page.frameLocator('iframe#payment');
await frame.getByLabel('卡号').fill('4242424242424242');
await frame.getByRole('button', { name: '支付' }).click();
```

`frameLocator()` 可继续链式使用语义定位器，也可嵌套调用。若需要直接拿到 `Frame` 对象，可用 `page.frame({ name })` 或 `page.frameLocator()` 配合 `frameLocator.locator()`。

## 从定位器拿元素信息

```ts
const locator = page.getByRole('button', { name: '提交' });

await locator.isVisible();
await locator.isEnabled();
await locator.textContent();
await locator.getAttribute('aria-disabled');
await locator.boundingBox();
await locator.screenshot({ path: 'button.png' });
```

> [!WARNING]
> 不要通过 `locator.evaluate()` 绕过操作失败。若某个动作总是超时，通常是元素被遮挡、需要滚动或存在多层同名元素，应先用[追踪](/docs/trace-viewer)确认定位器命中的是用户真正看到的那个节点。

## 下一步

- [操作与自动等待](/docs/actions)：定位器如何触发可操作性检查
- [断言](/docs/assertions)：自动重试的 Web 优先断言
