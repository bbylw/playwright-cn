/**
 * Nimbus — 极小的类型安全 HTML 组件层。
 * 组件即函数，返回 Html 值；`html` 标签模板自动转义插值，
 * 只有显式 raw()/html() 的结果才会原样注入。
 */

export interface Html {
  readonly __html: string;
}

export const raw = (value: string): Html => ({ __html: value });

export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });

const isHtml = (value: unknown): value is Html =>
  typeof value === "object" && value !== null && "__html" in value;

const render = (value: unknown): string => {
  if (value === null || value === undefined || value === false) return "";
  if (Array.isArray(value)) return value.map(render).join("");
  if (isHtml(value)) return value.__html;
  return escapeHtml(String(value));
};

export function html(strings: TemplateStringsArray, ...values: unknown[]): Html {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
  return { __html: out };
}

/** 拼接多个 Html 片段 */
export const join = (parts: Html[], sep = ""): Html => raw(parts.map((p) => p.__html).join(sep));

/** 序列化为完整文档 */
export const renderDocument = (body: Html): string => "<!DOCTYPE html>\n" + body.__html;