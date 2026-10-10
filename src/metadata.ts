/** @prose
 * # Metadata
 *
 * The `---` block at the top of a document, read by syntax.md's rule: one `key: value` per line,
 * where a value is null, a boolean, a number, a quoted string, a `[…]` list, or otherwise a
 * string as written. A list may wrap onto the indented lines after its key, the way a formatter
 * writes a long one. Keys are flat, and a `.` in one is an ordinary character, as YAML
 * reads it. The rule warns on the mistakes writers make, not on every corner of YAML. A value
 * YAML would read as another type (`no`, `1.10`, `1e3`) or as structure (a leading `*` or `{`) is
 * a warning, and its key is skipped, since any guess could be wrong. A value holding `: ` or ` #`
 * is a warning too, but markz keeps it as written. Skipping it would lose a title like
 * `Issue #42`, which YAML cuts short. A line that isn't `key: value` skips its key, and the rest
 * of the block is still read.
 */
import { type Builder, type MetadataObject, type MetadataScalar } from "./ast";

/** Reads the lines between `start` and `end` (the fences excluded). */
export function parseMetadata(
  source: string,
  start: number,
  end: number,
  b: Pick<Builder, "warn">,
): MetadataObject {
  const value: Record<string, MetadataScalar | MetadataScalar[]> = {};
  // The key the previous line set, so a line that continues its value can skip it.
  let last: string | null = null;
  for (let at = start; at < end;) {
    let lineEnd = at;
    while (lineEnd < end && source[lineEnd] !== "\n" && source[lineEnd] !== "\r") lineEnd++;
    const line = source.slice(at, lineEnd);

    // A blank line keeps the key: YAML allows one before a value's next line.
    if (line.trim() !== "" && line[0] !== "#") {
      const match = /^([A-Za-z_][\w.-]*):(?:[ \t]+|$)/.exec(line);
      if (!match) {
        // Not a key line: part of the value before it (`tags:` over `  - a`), so that goes too.
        if (last !== null) delete value[last];
        b.warn("metadata-line", at, lineEnd);
      } else {
        const key = match[1]!;
        // Setting `__proto__` on an object changes its prototype instead of adding a key.
        if (key === "__proto__") {
          b.warn("metadata-line", at, lineEnd, "`__proto__` is not a metadata key");
        } else if (Object.hasOwn(value, key)) {
          b.warn("metadata-duplicate-key", at, lineEnd);
        } else {
          let text = line.slice(match[0].length).trim();
          // A long list wraps, as oxfmt writes it: `nav:`, then `  [`, an item a line, `  ]`.
          if (text === "" || (text.startsWith("[") && !text.endsWith("]"))) {
            const wrapped = indented(source, lineEnd, end);
            if (wrapped && `${text}${wrapped.text}`.startsWith("[")) {
              text = `${text} ${wrapped.text}`.trim();
              lineEnd = wrapped.end;
            }
          }
          const result = parseValue(text);
          if (typeof result === "string") b.warn("metadata-value", at, lineEnd, result);
          else {
            value[key] = result.value;
            if (result.warn) b.warn("metadata-value", at, lineEnd, result.warn);
          }
        }
      }
      last = match ? match[1]! : null;
    }
    at = lineEnd;
    if (source[at] === "\r") at++;
    if (source[at] === "\n") at++;
  }
  return value;
}

/** The indented lines after `from`, joined, and where the last one ends; `null` when there are none. */
function indented(source: string, from: number, end: number): { text: string; end: number } | null {
  const parts: string[] = [];
  let last = from;
  let at = from;
  for (;;) {
    if (source[at] === "\r") at++;
    if (source[at] === "\n") at++;
    if (at >= end || (source[at] !== " " && source[at] !== "\t")) break;
    let lineEnd = at;
    while (lineEnd < end && source[lineEnd] !== "\n" && source[lineEnd] !== "\r") lineEnd++;
    const part = source.slice(at, lineEnd).trim();
    if (part === "") break;
    parts.push(part);
    last = lineEnd;
    at = lineEnd;
  }
  return parts.length ? { text: parts.join(" "), end: last } : null;
}

/** A value, kept with a message or not; or the message when it is rejected. */
type Parsed<T> = { value: T; warn?: string } | string;

function parseValue(text: string): Parsed<MetadataScalar | MetadataScalar[]> {
  if (!text.startsWith("[")) return parseScalar(text);
  if (!text.endsWith("]")) return "a list must close with `]`";
  const inner = text.slice(1, -1).trim();
  if (inner === "") return { value: [] };
  const items: MetadataScalar[] = [];
  let warn: string | undefined;
  const parts = splitList(inner);
  // A comma after the last item, which a formatter adds to a wrapped list.
  if (parts.length > 1 && parts.at(-1)?.trim() === "") parts.pop();
  for (const item of parts) {
    if (item === null) return "unbalanced quotes in a list";
    const trimmed = item.trim();
    if (trimmed === "") return "empty list item";
    if (/^[[{]/.test(trimmed) || (!/^["']/.test(trimmed) && /[[\]{}]/.test(trimmed))) {
      return "nested lists and maps are not supported";
    }
    const scalar = parseScalar(trimmed);
    if (typeof scalar === "string") return scalar;
    items.push(scalar.value);
    warn ??= scalar.warn;
  }
  return { value: items, warn };
}

function parseScalar(text: string): Parsed<MetadataScalar> {
  if (text === "" || text === "null") return { value: null };
  if (text === "true") return { value: true };
  if (text === "false") return { value: false };
  // A number that keeps every digit it was written with.
  if (/^-?(?:0|[1-9]\d*)(?:\.\d*[1-9])?$/.test(text)) return { value: Number(text) };
  if (text[0] === '"') {
    if (!/^"(?:[^"\\]|\\.)*"$/.test(text)) return "a double-quoted value must close at the end";
    try {
      return { value: JSON.parse(text) as string };
    } catch {
      return "not a valid JSON string";
    }
  }
  if (text[0] === "'") {
    if (!/^'(?:[^']|'')*'$/.test(text)) return "a single-quoted value must close at the end";
    return { value: text.slice(1, -1).replaceAll("''", "'") };
  }
  if (/^(?:true|false|null|yes|no|on|off|~)$/i.test(text)) {
    return `\`${text}\` reads as true, false or null in YAML: quote it, or write \`true\`, \`false\` or \`null\``;
  }
  // Every number form YAML 1.2 reads, so a hash like `1e3456` isn't quietly Infinity elsewhere.
  if (
    /^[-+]?(?:(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?|\.inf|\.nan)$|^0x[\da-f]+$|^0o[0-7]+$/i.test(text)
  ) {
    const n = Number(text);
    return `\`${text}\` reads as a number in YAML: quote it${Number.isNaN(n) ? "" : `, or write it as \`${n}\``}`;
  }
  if (/^[{&*!|>%@`,#\]}]|^[-?:](?:[ \t]|$)/.test(text)) {
    return `\`${text[0]}\` at the start of a value is YAML syntax: quote the value`;
  }
  if (/:(?:[ \t]|$)/.test(text)) {
    return { value: text, warn: "`: ` inside a value is YAML syntax: quote the value" };
  }
  if (/[ \t]#/.test(text)) {
    return {
      value: text,
      warn: "` #` starts a comment in YAML, which drops the rest: quote the value",
    };
  }
  return { value: text };
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
