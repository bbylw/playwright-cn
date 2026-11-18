---
title: 操作与自动等待
description: 点击、输入、选择等动作执行前的可操作性检查，以及超时与强制操作。
section: 核心概念
order: 3
slug: actions
---

所有作用于定位器的动作 —— `click()`、`fill()`、`check()`、`hover()` 等 —— 都遵循同一套流程：先等待元素满足可操作性条件，再滚动到视口内，最后派发真实事件。条件不满足时动作会持续等待，直到单个动作的 `actionTimeout`（默认 0，即不限制）或用例总 `timeout`（默认 30 秒）到期而报超时错误；错误信息会列出卡在哪一项检查上。

## 可操作性检查

| 条件 | 含义 |
|---|---|
| Visible | 元素具有非空 bounding box，且 `visibility` 不是 `hidden`；祖先为 `hidden` 同样判定不可见 |
| Enabled | 表单控件不存在 `disabled` 属性，且没有 `aria-disabled` |
| Editable | 仅 `fill()`、`tap()` 等输入类动作要求：非 `readonly` 且未禁用 |
| Stable | 元素在不小于两次连续请求动画帧之间位置与尺寸不变，即没有正在进行的动画 |
| Receives events | 元素不被其他节点遮挡，命中的是最上层目标（`pointer-events` 不为 `none`） |

```ts
await page.getByRole('button', { name: '保存草稿' }).click();
```

上面这一行隐含了「等到按钮可见、启用、不被 toast 遮挡、位置稳定，再滚动并点击」的全部逻辑，因此不需要额外补写等待。

> [!WARNING]
> 不要用 `await page.waitForTimeout(2000)` 或 `page.waitForNavigation()` 之类的固定等待掩盖问题。它们要么不足、要么浪费时间；正确做法是断言你真正关心的状态，见[断言](/docs/assertions)。

## 常用动作

```ts
// 点击：可选按键、点击次数、修饰键、相对位置
await page.getByRole('button', { name: '删除' }).click();
await page.getByText('订单详情').click({ button: 'right' });
await page.getByRole('link', { name: '详情' }).click({ modifiers: ['ControlOrMeta'] });
await page.locator('canvas').click({ position: { x: 120, y: 40 }, clickCount: 2 });

// 输入与清空
await page.getByLabel('标题').fill('季度报告');
await page.getByLabel('备注').fill('');
await page.getByLabel('正文').pressSequentially('第一段', { delay: 50 });

// 键盘
await page.getByPlaceholder('搜索').press('Enter');
await page.getByRole('textbox').press('ControlOrMeta+a');
await page.keyboard.type('快速输入');

// 勾选与下拉
await page.getByRole('checkbox', { name: '同意条款' }).check();
await page.getByRole('radio', { name: '快递' }).check();
await page.getByLabel('城市').selectOption('hangzhou');
await page.getByLabel('标签').selectOption(['工作', '重要']);

// 悬停、拖拽、滚动
await page.getByRole('link', { name: '更多' }).hover();
await page.getByTestId('task-1').dragTo(page.getByTestId('column-done'));
await page.getByRole('list').evaluate((el) => el.scrollIntoView());

// 文件
await page.getByLabel('附件').setInputFiles('receipt.pdf');
await page.getByLabel('附件').setInputFiles(['a.pdf', 'b.pdf']);

const buffer = await readFile('fixtures/avatar.png');
await page.getByLabel('头像').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer });
```

其中 `readFile` 来自 `node:fs/promises`。`fill()` 会一次性写入整个值并触发 `input` 事件，是输入的首选；只有页面依赖逐字符按键（自动补全、快捷键统计）时才使用 `pressSequentially()`。

## 动作选项

每个动作都接受同一组通用选项：

| 选项 | 作用 |
|---|---|
| `timeout` | 覆盖本次动作的超时（毫秒），传 `0` 表示不超时 |
| `force` | 跳过可操作性检查直接派发事件 |
| `trial` | 只执行检查不派发事件，用于验证定位器（仅 `click()`） |
| `noWaitAfter` | 不等待动作触发的页面变化完成 |
| `position` | 相对元素左上角的点击偏移 |
| `modifiers` | 按住 `Alt`、`Control`、`ControlOrMeta`、`Shift`、`Meta` |
| `button` / `clickCount` | 鼠标按键与点击次数 |

```ts
await page.getByRole('button', { name: '确认' }).click({ force: true });
await page.getByRole('button', { name: '确认' }).click({ trial: true, timeout: 2000 });
await page.getByRole('link', { name: '外链' }).click({ noWaitAfter: true });
```

> [!TIP]
> `force: true` 会跳过遮挡与稳定性检查，只在确认页面行为异常（例如动画永不结束、覆盖层有意保留）时使用。若必须频繁使用，通常是产品端有真实的可用性问题。

## 导航与等待

```ts
await page.goto('/dashboard', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: '下一步' }).click();
await expect(page).toHaveURL(/\/step-2/);
await page.waitForURL('**/step-2');

await page.reload();
await page.goBack();
await page.goForward();
```

`goto()` 默认等待 `load` 事件；`waitUntil` 可选 `'domcontentloaded'`、`'load'`、`'networkidle'`、`'commit'`。点击后发生跳转时用 `expect(page).toHaveURL(...)` 或 `waitForURL()` 显式描述结果，而不是等待固定时长。

## 对话框、新页面与文件选择器

这些由页面外部机制触发的交互需要先注册处理器：

```ts
page.once('dialog', (dialog) => dialog.accept('确认删除'));

page.once('popup', async (popup) => {
  await expect(popup).toHaveURL(/oauth/);
});

page.once('filechooser', async (fileChooser) => {
  await fileChooser.setFiles('invoice.pdf');
});

await page.getByRole('button', { name: '打开新窗口' }).click();
```

## 底层输入

需要精确指针轨迹时使用 `page.mouse` 与 `page.keyboard`，它们不会做任何自动等待：

```ts
await page.mouse.move(100, 200);
await page.mouse.down();
await page.mouse.up();
await page.mouse.wheel(0, 300);
await page.keyboard.down('Shift');
await page.keyboard.insertText('大写输入');
```

## 下一步

- [认证](/docs/auth)：把重复登录换成 `storageState`
- [追踪查看器](/docs/trace-viewer)：查看动作卡在哪一项检查上
