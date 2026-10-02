/** @prose
 * # Metadata
 *
 * The `---` block at the top of a document, read by syntax.md's JSON-like rule: one `key: value`
 * per line, where a value is null, a boolean, a number, a quoted string, a one-line `[…]` list, or
 * otherwise a string as written, and a dotted key (`deploy.name`) puts it in a nested object. It
 * is not a YAML parser, but it never disagrees with one: expand a block's dotted keys and it is
 * the object YAML gives. A value YAML 1.2 would read as something else (`True`, `~`, `1e3`) is a
 * warning, and so is anything YAML has that the rule doesn't (indented lines, `|`, `{a: b}`,
 * anchors). A line in error skips its key; the rest of the block is still read.
 */
import { type Builder, type MetadataObject, type MetadataScalar } from "./ast";
import { type WarningCode } from "./warnings";

/** The object as it is built; `MetadataObject` is how it is handed out. */
interface Tree {
  [key: string]: MetadataScalar | MetadataScalar[] | Tree;
}

/** Reads the lines between `start` and `end` (the fences excluded). */
export function parseMetadata(
  source: string,
  start: number,
  end: number,
  b: Pick<Builder, "warn">,
): MetadataObject {
  const value: Tree = {};
  // What the previous line added, so a line that continues its value can skip it.
  let last: Entry | null = null;
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
      skip(last);
      last = null;
    } else if (line[0] !== "#") {
      const match = /^([A-Za-z_][\w-]*(?:\.[A-Za-z_][\w-]*)*):(?:[ \t]+|$)/.exec(line);
      // Not a key line: part of the value before it (`one:` over `- 2`), or an error.
      if (!match) skip(last);
      last = null;
      const path = match ? match[1]!.split(".") : null;
      if (!match || !path) fail("metadata-line");
      // Setting `__proto__` on an object changes its prototype instead of adding a key.
      else if (path.includes("__proto__"))
        fail("metadata-line", "`__proto__` is not a metadata key");
      else {
        const clash = conflict(value, path);
        if (clash !== null) fail("metadata-duplicate-key", clash);
        else {
          const result = parseValue(stripComment(line.slice(match[0].length)));
          if (typeof result === "string") fail("metadata-value", result.slice(1));
          else last = insert(value, path, result.value);
        }
      }
    }
    at = lineEnd;
    if (source[at] === "\r") at++;
    if (source[at] === "\n") at++;
  }
  return value;
}

/** The first entry a line added: the key itself, or the outermost object it had to make. */
interface Entry {
  parent: Tree;
  key: string;
}

/** Removes what a line added, once a following line shows it was only part of a value. */
function skip(entry: Entry | null): void {
  if (entry) delete entry.parent[entry.key];
}

/** Why `path` can't be set in `tree`, or `null`: a key is once a value or once an object. */
function conflict(tree: Tree, path: string[]): string | null {
  let at = tree;
  for (let i = 0; i < path.length; i++) {
    const key = path[i]!;
    // `hasOwn`, not `in`: `constructor` is not a key until a block sets it.
    if (!Object.hasOwn(at, key)) return null;
    const found = at[key]!;
    const name = `\`${path.slice(0, i + 1).join(".")}\``;
    const wins = "; the first one wins";
    if (i === path.length - 1) {
      return (
        (isTree(found) ? `${name} is already an object` : `duplicate metadata key ${name}`) + wins
      );
    }
    if (!isTree(found)) return `${name} is already a value, not an object${wins}`;
    at = found;
  }
  return null;
}

/** Sets `path`, making the objects on the way; `conflict` has already said it fits. */
function insert(tree: Tree, path: string[], value: MetadataScalar | MetadataScalar[]): Entry {
  let at = tree;
  let first: Entry | null = null;
  for (const key of path.slice(0, -1)) {
    if (!Object.hasOwn(at, key)) {
      const next: Tree = {};
      at[key] = next;
      first ??= { parent: at, key };
      at = next;
    } else at = at[key] as Tree;
  }
  const key = path.at(-1)!;
  at[key] = value;
  return first ?? { parent: at, key };
}

function isTree(value: Tree[string]): value is Tree {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** How many more `{` and `[` than `}` and `]` a line has. */
function brackets(line: string): number {
  let n = 0;
  for (const c of line) n += c === "{" || c === "[" ? 1 : c === "}" || c === "]" ? -1 : 0;
  return n;
}

/** A value, or a `!message` string when it is rejected. */
function parseValue(text: string): { value: MetadataScalar | MetadataScalar[] } | string {
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
