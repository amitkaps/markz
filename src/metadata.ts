/** @prose
 * # Metadata
 *
 * The `---` block at the top of a document, read by syntax.md's JSON-like rule: one `key: value`
 * per line, where a value is null, a boolean, a number, a quoted string, a one-line `[…]` list, or
 * otherwise a string as written. It is not a YAML parser, but it never disagrees with one: a value
 * YAML 1.2 would read as something else (`True`, `~`, `1e3`) is a warning, and so is anything
 * YAML has that the rule doesn't (indented lines, `|`, `{a: b}`, anchors). A line in error skips its
 * key; the rest of the block is still read.
 */
import { type Builder, type MetadataScalar, type MetadataValue } from "./ast";
import { type WarningCode } from "./warnings";

/** Reads the lines between `start` and `end` (the fences excluded). */
export function parseMetadata(
  source: string,
  start: number,
  end: number,
  b: Pick<Builder, "warn">,
): Record<string, MetadataValue> {
  const value: Record<string, MetadataValue> = {};
  // The key the previous line set, so a line that continues its value can skip it.
  let last: string | null = null;
  // Brackets a rejected line left open (`{`, `a: [1,`): the lines until they close are inside it.
  let open = 0;
  for (let at = start; at < end;) {
    let lineEnd = at;
    while (lineEnd < end && source[lineEnd] !== "\n" && source[lineEnd] !== "\r") lineEnd++;
    const line = source.slice(at, lineEnd);
    const fail = (code: WarningCode, message?: string) => {
      b.warn(code, at, lineEnd, message);
      open = Math.max(0, open + brackets(line));
    };

    if (line.trim() === "") {
      // A blank line keeps the key: YAML allows one before a value's next line.
    } else if (open > 0) {
      fail("metadata-line");
    } else if (/^[ \t]/.test(line)) {
      fail("metadata-indented");
      if (last !== null) delete value[last];
      last = null;
    } else if (line[0] !== "#") {
      const match = /^([A-Za-z_][\w-]*):(?:[ \t]+|$)/.exec(line);
      // Not a key line: part of the value before it (`one:` over `- 2`), or an error.
      if (!match && last !== null) delete value[last];
      last = null;
      if (!match) fail("metadata-line");
      // Assigning `__proto__` on a plain object sets its prototype instead of adding a key.
      else if (match[1] === "__proto__") fail("metadata-line", "`__proto__` is not a metadata key");
      else if (Object.hasOwn(value, match[1]!)) {
        fail(
          "metadata-duplicate-key",
          `duplicate metadata key \`${match[1]}\`; the first one wins`,
        );
      } else {
        const result = parseValue(stripComment(line.slice(match[0].length)));
        if (typeof result === "string" && result.startsWith("!"))
          fail("metadata-value", result.slice(1));
        else {
          value[match[1]!] = (result as { value: MetadataValue }).value;
          last = match[1]!;
        }
      }
    }
    at = lineEnd;
    if (source[at] === "\r") at++;
    if (source[at] === "\n") at++;
  }
  return value;
}

/** How many more `{` and `[` than `}` and `]` a line has. */
function brackets(line: string): number {
  let n = 0;
  for (const c of line) n += c === "{" || c === "[" ? 1 : c === "}" || c === "]" ? -1 : 0;
  return n;
}

/** A value, or a `!message` string when it is rejected. */
function parseValue(text: string): { value: MetadataValue } | string {
  if (text.startsWith("[")) {
    if (!text.endsWith("]")) return "!a list must close on its line";
    const inner = text.slice(1, -1).trim();
    if (inner === "") return { value: [] };
    const items: MetadataScalar[] = [];
    for (const item of splitList(inner)) {
      if (item === null) return "!unbalanced quotes in a list";
      const trimmed = item.trim();
      if (trimmed === "") return "!empty list item";
      if (/^[[\]{]/.test(trimmed) || /[[\]{}]/.test(unquotedPart(trimmed))) {
        return "!nested lists and maps are not supported";
      }
      const scalar = parseScalar(trimmed);
      if (typeof scalar === "string") return scalar;
      items.push(scalar.value);
    }
    return { value: items };
  }
  return parseScalar(text);
}

function parseScalar(text: string): { value: MetadataScalar } | string {
  if (text === "" || text === "null") return { value: null };
  if (text === "true") return { value: true };
  if (text === "false") return { value: false };
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(text)) return { value: Number(text) };
  if (text[0] === '"') {
    if (!/^"(?:[^"\\]|\\.)*"$/.test(text)) return "!a double-quoted value must close at the end";
    try {
      return { value: JSON.parse(text) as string };
    } catch {
      return "!not a valid JSON string";
    }
  }
  if (text[0] === "'") {
    if (!/^'(?:[^']|'')*'$/.test(text)) return "!a single-quoted value must close at the end";
    return { value: text.slice(1, -1).replaceAll("''", "'") };
  }
  if (LOOKALIKE.test(text)) return `!\`${text}\` reads as a different type in YAML`;
  if (/^[{&*!|>%@`,#\]}]|^[-?:](?:[ \t]|$)/.test(text)) {
    return `!\`${text[0]}\` at the start of a value is YAML syntax`;
  }
  if (/:(?:[ \t]|$)/.test(text)) return "!`: ` inside a value is YAML syntax";
  return { value: text };
}

/**
 * Plain values YAML 1.2's core schema reads as null, a boolean or a number, other than the
 * canonical forms `parseScalar` has already taken.
 */
const LOOKALIKE =
  /^(?:~|null|Null|NULL|true|True|TRUE|false|False|FALSE|[-+]?\d+|0o[0-7]+|0x[\da-fA-F]+|[-+]?(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][-+]?\d+)?|[-+]?\.(?:inf|Inf|INF)|\.(?:nan|NaN|NAN))$/;

/** Drops a ` #` comment that is outside quotes. */
function stripComment(text: string): string {
  let quote = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quote) {
      if (c === "\\" && quote === '"') i++;
      else if (c === quote) quote = "";
    } else if (c === '"' || c === "'") {
      if (i === 0 || /[\s[,]/.test(text[i - 1]!)) quote = c;
    } else if (c === "#" && (i === 0 || /[ \t]/.test(text[i - 1]!))) return text.slice(0, i).trim();
  }
  return text.trim();
}

/** Splits on commas outside quotes; `null` for an unclosed quote. */
function splitList(text: string): (string | null)[] {
  const items: (string | null)[] = [];
  let quote = "";
  let from = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quote) {
      if (c === "\\" && quote === '"') i++;
      else if (c === quote) quote = "";
    } else if ((c === '"' || c === "'") && text.slice(from, i).trim() === "") quote = c;
    else if (c === ",") {
      items.push(text.slice(from, i));
      from = i + 1;
    }
  }
  items.push(quote ? null : text.slice(from));
  return items;
}

function unquotedPart(text: string): string {
  return text[0] === '"' || text[0] === "'" ? "" : text;
}
