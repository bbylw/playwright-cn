/**
 * Nimbus 语法高亮 — 零依赖的顺序扫描分词器。
 * 支持 ts/js、bash、json、yaml、html，输出 <span class="tk-*">。
 */
import { escapeHtml } from "./core.ts";

interface Rule {
  re: RegExp;
  cls: string;
  when?: (prev: string) => boolean;
}

const r = (source: string, cls: string, when?: Rule["when"]): Rule => ({
  re: new RegExp(source, "y"),
  cls,
  when,
});

const STR = r(`'(?:\\\\.|[^'\\\\\\n])*'|"(?:\\\\.|[^"\\\\\\n])*"|` + "`(?:\\\\.|[^`\\\\])*`", "tk-str");
const NUM = r(String.raw`\b0x[0-9a-fA-F]+\b|\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?\b`, "tk-num");

const tsRules: Rule[] = [
  r(String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`, "tk-com"),
  STR,
  r(String.raw`\/(?![/*])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n])+\/[a-z]*`, "tk-str",
    (prev) => prev === "" || "(,=:[!&|?{};".includes(prev)),
  r(String.raw`\b(?:import|export|from|const|let|var|function|return|async|await|new|if|else|for|of|in|while|do|class|extends|implements|interface|type|enum|default|as|try|catch|finally|throw|switch|case|break|continue|typeof|instanceof|void|delete|yield|static|readonly|namespace|declare|satisfies|keyof|null|undefined|true|false|this|super)\b`, "tk-kw"),
  NUM,
  r(String.raw`[A-Za-z_$][\w$]*(?=\s*\()`, "tk-fn"),
  r(String.raw`(?<=\.)[A-Za-z_$][\w$]*`, "tk-prop"),
  r(String.raw`\b[A-Z][A-Za-z0-9_]*\b`, "tk-type"),
];

const bashRules: Rule[] = [
  STR,
  r(String.raw`(?<=^|\s)#[^\n]*`, "tk-com"),
  r(String.raw`\$\w+|\$\{[^}]*\}`, "tk-type"),
  r(String.raw`(?<=\s)--?[\w][\w-]*`, "tk-prop"),
  r(String.raw`\b(?:bunx|bun|npx|npm|pnpm|yarn|git|playwright-cli|playwright|claude|node|cd|mkdir|echo|curl|docker)\b`, "tk-fn"),
  r(String.raw`\b(?:test|install|add|create|run|show|codegen|open|type|press|click|screenshot|init|mcp|serve|build|dev|update|remove|list|report|merge|show-trace|show-report)\b`, "tk-kw"),
  NUM,
];

const jsonRules: Rule[] = [
  r(String.raw`"(?:\\.|[^"\\])*"(?=\s*:)`, "tk-prop"),
  STR,
  r(String.raw`\b(?:true|false|null)\b`, "tk-kw"),
  NUM,
];

const yamlRules: Rule[] = [
  r(String.raw`#[^\n]*`, "tk-com"),
  STR,
  r(String.raw`[\w.-]+(?=\s*:)`, "tk-prop"),
  r(String.raw`\b(?:true|false|null|yes|no|on|off)\b`, "tk-kw"),
  r(String.raw`\$\{\{[^}]*\}\}`, "tk-type"),
  NUM,
];

const htmlRules: Rule[] = [
  r(String.raw`<!--[\s\S]*?-->`, "tk-com"),
  STR,
  r(String.raw`<\/?[a-zA-Z][\w-]*|\/?>`, "tk-kw"),
  r(String.raw`[a-zA-Z-]+(?==)`, "tk-prop"),
];

const LANGS: Record<string, Rule[]> = {
  ts: tsRules, typescript: tsRules, js: tsRules, javascript: tsRules, tsx: tsRules, jsx: tsRules,
  bash: bashRules, sh: bashRules, shell: bashRules, console: bashRules,
  json: jsonRules, jsonc: jsonRules,
  yaml: yamlRules, yml: yamlRules,
  html: htmlRules, xml: htmlRules,
};

export function highlight(code: string, lang: string): string {
  const rules = LANGS[lang.toLowerCase()];
  if (!rules) return escapeHtml(code);

  let out = "";
  let plain = "";
  let pos = 0;
  let prev = "";

  const flush = () => {
    if (plain) {
      out += escapeHtml(plain);
      const trimmed = plain.trimEnd();
      if (trimmed) prev = trimmed[trimmed.length - 1];
      plain = "";
    }
  };

  while (pos < code.length) {
    let matched = false;
    for (const rule of rules) {
      if (rule.when && !rule.when(prev)) continue;
      rule.re.lastIndex = pos;
      const m = rule.re.exec(code);
      if (m && m[0].length > 0) {
        flush();
        out += `<span class="${rule.cls}">${escapeHtml(m[0])}</span>`;
        const trimmed = m[0].trimEnd();
        if (trimmed) prev = trimmed[trimmed.length - 1];
        pos += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      plain += code[pos];
      pos++;
    }
  }
  flush();
  return out;
}