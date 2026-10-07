/** @prose
 * # HTML
 *
 * `html()` is a fold over the document into a string, the output prose and base consume (design:
 * HTML output). It never touches the DOM, so it runs the same in Node, Workers and the browser.
 * The markup is micromark's for everything markz shares with GFM, so the oracle can compare them,
 * and syntax.md's shapes for the rest.
 *
 * A node type it has no case for is an error rather than silent output, so a new node type can't
 * reach a page unwritten.
 */
import { NONE, type Attributes, type Document, type NodeId } from "./ast";
import { element } from "./elements";
import { parse } from "./parse";
import { walk } from "./walk";

/** Renders a document, or Markdown source, as HTML. */
export function html(input: string | Document): string {
  const doc = typeof input === "string" ? parse(input) : input;
  const state: State = { out: "", column: 0 };
  walk(doc, {
    enter: (node) => open(doc, node, state),
    exit: (node) => close(doc, node, state),
  });
  return state.out;
}

/** The output so far, and the column of the next table cell. */
interface State {
  out: string;
  column: number;
}

/** @prose
 * ## Nodes
 *
 * One case per node type, split in two: `open` writes what comes before a node's children and
 * `close` what comes after, and `walk` calls them in document order. Rendering never recurses, so
 * a document nested as deep as the parser accepts renders too.
 *
 * A paragraph directly in an item of a tight list is written without its `<p>`, as GFM does, and
 * a task item's checkbox goes at the start of its first paragraph. Comments and metadata write
 * nothing, and a raw block writes its content only when its format is `html`. `open` returns
 * `false` for a node whose children it has written itself or must not write.
 *
 * The checkbox is GFM's, disabled and without a label, so the output matches the oracle. An
 * accessibility checker reports the missing label, and that report is accepted. A disabled box
 * is skipped by Tab, and a screen reader reads the item's text right after it. An `aria-label`
 * of its state (`Done`, `To do`) would repeat what "checked" already says. A `<label>` around the
 * item would put its links inside another control. Both are ruled out.
 */
function open(doc: Document, node: NodeId, state: State): boolean {
  const type = doc.type(node);
  const a = doc.attributes(node);
  let out = "";
  switch (type) {
    case "document":
      break;
    case "metadata":
    case "comment":
      return false;
    case "paragraph": {
      const parent = doc.parent(node);
      if (doc.type(parent) === "listItem") {
        const { checked } = doc.data(parent, "listItem");
        if (!tight(doc, node)) out = `<p${attributes(a)}>`;
        if (checked !== null && doc.firstChild(parent) === node) {
          out += `<input type="checkbox" disabled=""${checked ? ' checked=""' : ""} /> `;
        }
      } else out = `<p${attributes(a)}>`;
      break;
    }
    case "heading": {
      const { depth, id } = doc.data(node, "heading");
      const idAttribute = id ? ` id="${escape(id)}"` : "";
      out = `<h${depth}${idAttribute}${attributes(a, true)}>`;
      break;
    }
    case "text":
      out = escape(doc.data(node, "text").value);
      break;
    case "blockquote":
      out = `<blockquote${attributes(a)}>\n`;
      break;
    case "list": {
      const { ordered, start } = doc.data(node, "list");
      const startAttribute = ordered && start !== 1 ? ` start="${start}"` : "";
      out = `<${ordered ? "ol" : "ul"}${startAttribute}${attributes(a)}>\n`;
      break;
    }
    case "listItem":
      out = `<li${attributes(a)}>`;
      break;
    case "thematicBreak":
      out = `<hr${attributes(a)} />\n`;
      break;
    case "code": {
      const { lang, value } = doc.data(node, "code");
      const cls = lang ? ` class="language-${escape(lang)}"` : "";
      out = `<pre${attributes(a)}><code${cls}>${escape(value)}</code></pre>\n`;
      break;
    }
    case "raw": {
      const { format, value } = doc.data(node, "raw");
      out = format === "html" ? value : "";
      break;
    }
    case "math": {
      const { block, value } = doc.data(node, "math");
      out = block
        ? `<pre${attributes(a)}><code class="language-math math-display">${escape(value)}</code></pre>\n`
        : `<code class="language-math math-inline">${escape(value)}</code>`;
      break;
    }
    case "emphasis":
      out = "<em>";
      break;
    case "strong":
      out = "<strong>";
      break;
    case "delete":
      out = "<del>";
      break;
    case "inlineCode":
      out = `<code>${escape(doc.data(node, "inlineCode").value)}</code>`;
      break;
    case "break":
      out = "<br />\n";
      break;
    case "expression":
      out = `<code class="language-js expression">${escape(doc.data(node, "expression").code)}</code>`;
      break;
    case "link": {
      const { destination, title } = doc.data(node, "link");
      out = `<a href="${url(destination)}"${titled(title)}${attributes(a)}>`;
      break;
    }
    case "image": {
      const { destination, title, alt } = doc.data(node, "image");
      out = `<img src="${url(destination, true)}" alt="${escape(alt)}"${titled(title)}${attributes(a)} />`;
      break;
    }
    case "table":
      out = `<table${attributes(a)}>\n`;
      break;
    case "tableRow":
      state.column = 0;
      out = (head(doc, node) ? "<thead>\n" : "") + "<tr>\n";
      break;
    case "tableCell":
      out = `<${cell(doc, node)}${alignment(doc, node, state.column++)}>`;
      break;
    case "element": {
      const { kind, name } = doc.data(node, "element");
      out = `<${tag(name, kind === "inline")}${attributes(a)}>`;
      break;
    }
    default:
      throw new Error(`html: no output for ${String(type)} yet`);
  }
  state.out += out;
  return true;
}

function close(doc: Document, node: NodeId, state: State): void {
  let out = "";
  switch (doc.type(node)) {
    case "paragraph":
      if (!tight(doc, node)) out = "</p>\n";
      break;
    case "heading":
      out = `</h${doc.data(node, "heading").depth}>\n`;
      break;
    case "blockquote":
      out = "</blockquote>\n";
      break;
    case "list":
      out = `</${doc.data(node, "list").ordered ? "ol" : "ul"}>\n`;
      break;
    case "listItem":
      out = "</li>\n";
      break;
    case "emphasis":
      out = "</em>";
      break;
    case "strong":
      out = "</strong>";
      break;
    case "delete":
      out = "</del>";
      break;
    case "link":
      out = "</a>";
      break;
    case "table":
      out = "</table>\n";
      break;
    case "tableRow": {
      // Pad a short body row to the header's width.
      const { align } = doc.data(doc.parent(node), "table");
      const tag = cell(doc, node);
      for (; state.column < align.length; state.column++) {
        out += `<${tag}${alignment(doc, node, state.column)}></${tag}>\n`;
      }
      out += "</tr>\n";
      const last = doc.nextSibling(node) === NONE;
      if (head(doc, node)) out += "</thead>\n" + (last ? "" : "<tbody>\n");
      else if (last) out += "</tbody>\n";
      break;
    }
    case "tableCell":
      out = `</${cell(doc, node)}>\n`;
      break;
    case "element": {
      const { kind, name } = doc.data(node, "element");
      const inline = kind === "inline";
      out = `</${tag(name, inline)}>` + (inline ? "" : "\n");
      break;
    }
  }
  state.out += out;
}

/** A paragraph directly in an item of a tight list, written without its `<p>`. */
function tight(doc: Document, paragraph: NodeId): boolean {
  const item = doc.parent(paragraph);
  return doc.type(item) === "listItem" && doc.data(doc.parent(item), "list").tight;
}

/** @prose
 * ## Tables
 *
 * The first row is the header. Body rows are padded with empty cells to the header's width, and
 * every cell carries its column's alignment.
 */
const head = (doc: Document, row: NodeId) => doc.firstChild(doc.parent(row)) === row;

/** `th` or `td`, for a row or a cell. */
function cell(doc: Document, node: NodeId): "th" | "td" {
  const row = doc.type(node) === "tableRow" ? node : doc.parent(node);
  return head(doc, row) ? "th" : "td";
}

function alignment(doc: Document, node: NodeId, column: number): string {
  let table = doc.parent(node);
  if (doc.type(table) !== "table") table = doc.parent(table);
  const align = doc.data(table, "table").align[column];
  return align ? ` align="${align}"` : "";
}

/** @prose
 * ## Elements
 *
 * The name is the tag: the parser only makes elements whose name is on an allowlist or a custom
 * element ([`elements.ts`](elements.ts)). A document built by hand could hold any name, so one off
 * the allowlists is written as a `div` or `span`, and a name can never become `script`. A plain
 * span is named `span`, which is on no list, so it is written by the same rule.
 */
const tag = (name: string, inline: boolean) =>
  element(name, inline) ? name : inline ? "span" : "div";

/** @prose
 * ## Attributes
 *
 * Classes accumulate, and for any other key the later value wins, in the order keys first
 * appear. `class` is written first, and a bare key is written bare (`open`, not `open=""`), since
 * a boolean attribute is on whenever it is present. Event handlers (`on*`) are dropped, and so is any value with
 * an unsafe scheme: `javascript:`, `vbscript:`, and `data:` other than a raster image (design:
 * Security). A heading's id comes from its data, so an `id` item is skipped there.
 */
function attributes(a: Attributes | undefined, skipId = false): string {
  if (!a) return "";
  const cls: string[] = [];
  const other = new Map<string, string | null>();
  for (const { key, value, start, end } of a.items) {
    if (key === "class") cls.push(value);
    else if (!(skipId && key === "id"))
      other.set(key, value === "" && end - start === key.length ? null : value);
  }
  let out = cls.length > 0 ? ` class="${escape(cls.join(" "))}"` : "";
  for (const [key, value] of other) {
    if (/^on/i.test(key) || unsafe(value ?? "")) continue;
    out += value === null ? ` ${key}` : ` ${key}="${escape(value)}"`;
  }
  return out;
}

/** @prose
 * ## URLs
 *
 * A destination is written percent-encoded, as micromark writes it: ASCII that is safe in a URL
 * stays, an existing `%XX` stays, and everything else is UTF-8 encoded. An unsafe scheme writes
 * an empty URL, so the element keeps its content and loses only the link.
 */
function url(value: string, image = false): string {
  if (unsafe(value, image)) return "";
  // Most destinations need no encoding: one test instead of one per character.
  if (SAFE_URL.test(value)) return escape(value);
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const c = value[i]!;
    const code = value.charCodeAt(i);
    if (c === "%" && /^[\da-fA-F]{2}$/.test(value.slice(i + 1, i + 3))) out += c;
    else if (code < 128) out += /[!#$&-;=?-Z_a-z~]/.test(c) ? c : encodeURIComponent(c);
    else if (code >= 0xd800 && code <= 0xdbff && /[\udc00-\udfff]/.test(value[i + 1] ?? "")) {
      out += encodeURIComponent(c + value[++i]);
    } else if (code >= 0xd800 && code <= 0xdfff) out += "%EF%BF%BD";
    else out += encodeURIComponent(c);
  }
  return escape(out);
}

/** A destination made only of characters written as they are, with no `%` to check. */
const SAFE_URL = /^[!#$&-;=?-Z_a-z~]*$/;

// An empty title (`[a](b "")`) writes none, as micromark and cmark do.
const titled = (title: string | null) => (title ? ` title="${escape(title)}"` : "");

function unsafe(value: string, image = true): boolean {
  // Browsers ignore whitespace and control characters inside a scheme.
  // eslint-disable-next-line no-control-regex
  const v = value.replace(/[\u0000- ]/g, "").toLowerCase();
  return (
    /^(?:javascript|vbscript):/.test(v) ||
    (v.startsWith("data:") &&
      !(image && /^data:image\/(?:png|gif|jpe?g|webp|avif|bmp)[;,]/.test(v)))
  );
}

/** @prose
 * `escape` is the one place text becomes safe to write into HTML, so every string from the
 * document passes through it. The parser marks nothing as already safe. Faster versions and a
 * parser flag were measured and ruled out ([Lessons](../docs/lessons.md#speed)).
 */
function escape(text: string): string {
  return /[&<>"]/.test(text) ? text.replace(/[&<>"]/g, (c) => ESCAPES[c]!) : text;
}

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
