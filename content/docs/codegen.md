---
title: 生成测试
description: 用 CodeGen 录制浏览器操作自动生成测试代码，并介绍断言与定位器选取。
section: 入门
order: 5
slug: codegen
---

Playwright 自带测试录制器 CodeGen：打开浏览器，正常点击和输入，操作被实时翻译成 TypeScript 测试代码。它适合快速搭起用例骨架、探索陌生页面，但生成结果仍需手工整理断言与结构。

## 开始录制

```bash
bunx playwright codegen
```

直接指定起始地址：

```bash
bunx playwright codegen https://demo.playwright.dev/todomvc
```

录制窗口有两种模式：

- **Record**：默认状态，操作即时生成代码
- **Paused**：暂停录制，配合 **Step** 按钮逐条执行并检查元素

工具栏还提供 **Assert visibility**、**Assert text**、**Assert value**（在页面上点选元素生成对应断言）、**Pick locator**（只生成定位器表达式）和 **Reload**。点击录制窗口右上角的复制按钮可把当前代码复制到剪贴板，关闭窗口时生成的代码写入 `-o` 指定的文件。

## 常用录制选项

| 选项 | 作用 |
|---|---|
| `-o=file.spec.ts` | 把录制的代码写入文件 |
| `--target=playwright-test` | 生成目标语言/测试框架，默认 `playwright-test` |
| `--browser=firefox` | 用指定引擎录制，可选 `chromium`、`firefox`、`webkit` |
| `--viewport-size=1280,720` | 固定视口尺寸 |
| `--device="iPhone 13"` | 模拟设备录制，生成 `devices` 相关配置 |
| `--load-storage=auth.json` | 载入已有登录状态，跳过重复登录 |
| `--save-storage=auth.json` | 录制结束时保存 Cookie 与本地存储 |
| `--channel=chrome` | 使用本机安装的浏览器渠道 |
| `--timeout=0` | 关闭操作超时，便于慢速手工演示 |

把录制结果直接写进测试文件：

```bash
bunx playwright codegen https://demo.playwright.dev/todomvc -o tests/todomvc.spec.ts
```

录制登录后再写后续用例：

```bash
bunx playwright codegen --save-storage=auth.json https://example.com/login
bunx playwright codegen --load-storage=auth.json https://example.com/orders
```

`--load-storage` 与 `--save-storage` 配合[认证](/docs/auth)中的 `storageState` 使用，是录制受保护页面的标准流程。

## 生成的代码

录制待办应用后通常得到：

```ts
import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://demo.playwright.dev/todomvc/');
  await page.getByPlaceholder('What needs to be done?').click();
  await page.getByPlaceholder('What needs to be done?').fill('Buy groceries');
  await page.getByPlaceholder('What needs to be done?').press('Enter');
  await expect(page.getByRole('listitem')).toHaveCount(1);
});
```

录制器倾向选择语义定位器（角色、标签、占位符、文本），必要时才使用 CSS。生成后建议做三件事：

1. 给用例和步骤取有业务含义的标题，替换默认的 `test('test', ...)`
2. 用 `test.step` 或 fixture 拆分准备逻辑，去掉重复的 `.click()` 前置动作
3. 补齐断言 —— 录制器无法推断你关心的结果，只会在你主动使用断言按钮时写入

> [!WARNING]
> 若录制结果里出现依赖随机 class、内联样式或时间戳 id 的 CSS 选择器，下次运行就会失效。应改用[定位器](/docs/locators)中的语义方法，必要时为元素补充可访问性名称或测试标识属性。

## 在编辑器中录制

VS Code 的 Playwright 扩展在测试文件顶部为每个用例提供 **Record new** / **Record at cursor** / **Show browser** 代码 Lens，录制内容直接写入光标位置，无需切换终端。也可从命令面板执行 Playwright: Record New。

## 让定位器更稳定

录制质量取决于页面本身。为关键元素补充可访问性名称（`aria-label`、`role`、`label`）或测试标识属性，生成结果会更接近可长期维护的代码。

自定义测试标识属性名，例如从默认的 `data-testid` 改为 `data-qa`：

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    testIdAttribute: 'data-qa',
  },
});
```

对应的标记写法：

```html
<button data-qa="submit-order">提交订单</button>
```

设置后 `page.getByTestId('submit-order')` 与录制输出都会读取 `data-qa`。

## 下一步

- [定位器](/docs/locators)：整理录制结果
- [断言](/docs/assertions)：补充录制缺失的检查
- [认证](/docs/auth)：用 `storageState` 跳过登录步骤
