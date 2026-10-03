/** @prose
 * # Vendoring an upstream suite
 *
 * Turns an upstream project's own tests into examples for `test/examples/upstream/`, in the fence
 * format `test/harness/fences.ts` reads and writes, from a local clone at the
 * commit its README pins: a micromark extension's, the yaml-test-suite or github-slugger's (below). What markz is held to is the input: every example is compared with
 * markz's oracle, not with the HTML the suite expected, so a test that only configures the HTML
 * side (a directive handler, `allowDangerousHtml`) keeps its input. A test whose options change the
 * syntax (`disable`, `singleTilde`, a frontmatter preset or custom matter) is dropped, as is anything whose input isn't a literal.
 *
 * `node scripts/vendor.ts gfm-table ../micromark-extension-gfm-table` writes
 * `test/examples/upstream/gfm-table.md` and prints what it kept and dropped. Each file's metadata
 * names the suite's repo at the clone's commit and what its examples are checked by (`SUITES`).
 * CommonMark and GFM's spec examples were converted once, and aren't written here.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseSync } from "vite-plus";
import YAML from "yaml";
import { writeFences } from "../test/harness/fences.ts";

/** Each suite's title, its GitHub repo and the path its tests are in, and what checks them. */
const SUITES: Record<string, [title: string, repo: string, path: string, checks: string]> = {
  "gfm-table": [
    "micromark-extension-gfm-table",
    "micromark/micromark-extension-gfm-table",
    "test",
    "oracle",
  ],
  "gfm-strikethrough": [
    "micromark-extension-gfm-strikethrough",
    "micromark/micromark-extension-gfm-strikethrough",
    "test",
    "oracle",
  ],
  "gfm-autolink-literal": [
    "micromark-extension-gfm-autolink-literal",
    "micromark/micromark-extension-gfm-autolink-literal",
    "test",
    "oracle",
  ],
  "gfm-footnote": [
    "micromark-extension-gfm-footnote",
    "micromark/micromark-extension-gfm-footnote",
    "test",
    "oracle",
  ],
  directive: [
    "micromark-extension-directive",
    "micromark/micromark-extension-directive",
    "test",
    "oracle",
  ],
  frontmatter: [
    "micromark-extension-frontmatter",
    "micromark/micromark-extension-frontmatter",
    "test",
    "oracle",
  ],
  math: ["micromark-extension-math", "micromark/micromark-extension-math", "test", "math"],
  yaml: ["yaml-test-suite", "yaml/yaml-test-suite", "src", "yaml"],
  slugger: ["github-slugger", "Flet/github-slugger", "test", "slug"],
};

export interface Vendored {
  example: number;
  /**
   * `<test group> › <test title>` from `index.js`, or `<fixture file> › <heading>`, or the file
   * alone for a fixture's untitled start.
   */
  section: string;
  markdown: string;
  /**
   * What the suite expected, which may be another renderer's or handler's HTML. For YAML, the
   * test's JSON, or `error` when the YAML is invalid.
   */
  html: string;
}

/** Options that change what micromark parses, so the suite's input no longer means the same. */
const SYNTAX_OPTIONS = /\bdisable\b|singleTilde|frontmatter\([^)]/;

/** @prose
 * ## Fixtures
 *
 * A fixture is a whole document of headed sections, rendered by GitHub. Each section becomes an
 * example, heading included, with the matching slice of the HTML. Large `*.offline.md` stress
 * documents are left to step 16.
 */
function fixtures(dir: string): Vendored[] {
  const out: Vendored[] = [];
  const base = join(dir, "test/fixtures");
  if (!existsSync(base)) return out;
  for (const file of readdirSync(base).sort()) {
    if (!file.endsWith(".md") || file.endsWith(".offline.md")) continue;
    const md = sections(readFileSync(join(base, file), "utf8"));
    const html = htmlSections(readFileSync(join(base, file.replace(/\.md$/, ".html")), "utf8"), md);
    for (const [i, [title, markdown]] of md.entries()) {
      // A heading with nothing under it tests nothing.
      if (!markdown.replace(/^#.*\n?/, "").trim()) continue;
      out.push({
        example: 0,
        section: title ? `${file} › ${title}` : file,
        markdown,
        html: html[i]!,
      });
    }
  }
  return out;
}

/** Splits a document before each ATX heading outside a fence. */
function sections(text: string): [title: string, markdown: string][] {
  const out: [string, string][] = [];
  let fence = "";
  for (const line of text.split(/(?<=\n)/)) {
    const ticks = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      if (
        ticks &&
        ticks[0] === fence[0] &&
        ticks.length >= fence.length &&
        !line.trim().slice(ticks.length)
      )
        fence = "";
    } else if (ticks) fence = ticks;
    const heading = !fence && /^#{1,6} (.*)/.exec(line);
    if (heading || !out.length) out.push([heading ? heading[1]!.trim() : "", ""]);
    out.at(-1)![1] += line;
  }
  return out.filter(([, md]) => md.trim());
}

/**
 * The HTML under each Markdown section, found by heading text rather than by count, since a
 * section can hold a setext heading of its own. Where a heading can't be found, the section's HTML
 * is left empty and the oracle isn't checked against it.
 */
function htmlSections(html: string, md: [string, string][]): string[] {
  const starts: number[] = [];
  let from = 0;
  for (const [title] of md) {
    let at = -1;
    for (const m of html.slice(from).matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g)) {
      if (m[2]!.replace(/<[^>]+>/g, "").trim() === title) {
        at = from + m.index;
        break;
      }
    }
    starts.push(title ? at : 0);
    if (at >= 0) from = at + 1;
  }
  return starts.map((start, i) => {
    if (start < 0) return "";
    const next = starts.slice(i + 1).find((s) => s > start);
    return html.slice(start, next ?? html.length);
  });
}

/** @prose
 * ## Inline tests
 *
 * `test/index.js` asserts `micromark(input, options)` against an expected string. oxc's parser (`parseSync`, which comes with vite-plus) reads the file, so a case is found by its shape, not by a regex over the source, and a
 * string input is taken as the engine would see it, escapes and concatenation resolved. The
 * expected HTML is kept only when the options are written out in place: a helper such as the
 * directive suite's `options({'*': h})` installs handlers whose HTML isn't the oracle's.
 */
function inline(dir: string, dropped: string[]): Vendored[] {
  const file = join(dir, "test/index.js");
  const text = readFileSync(file, "utf8");
  const text_ = (node: Node) => text.slice(node.start, node.end);
  const out: Vendored[] = [];
  const visit = (node: Node, parents: Node[], title: string) => {
    if (node.type === "CallExpression") {
      const call = node as CallNode;
      const callee = text_(call.callee);
      const name = call.arguments[0];
      if (/(^|\.)test$/.test(callee) && name && stringOf(name) !== null) {
        // `test(group)` holds `t.test(title)`s.
        title =
          callee === "test" ? stringOf(name)! : `${title.split(" › ")[0]} › ${stringOf(name)!}`;
      }
      if (callee === "micromark") {
        const input = literal(call.arguments[0], parents);
        const options = call.arguments[1] ? text_(call.arguments[1]) : "";
        const line = text.slice(0, call.start).split("\n").length;
        if (input === null) dropped.push(`index.js:${line} input is not a literal`);
        else if (SYNTAX_OPTIONS.test(options))
          dropped.push(`index.js:${line} ${title}: options change the syntax`);
        else
          out.push({
            example: 0,
            section: title,
            markdown: input,
            html: call.arguments[1]?.type === "ObjectExpression" ? expected(call, parents) : "",
          });
      }
    }
    for (const child of children(node)) visit(child, [...parents, node], title);
  };
  visit(parseSync(file, text).program as unknown as Node, [], "");
  return out;
}

/** An oxc ESTree node, as far as this script reads one. */
interface Node {
  type: string;
  start: number;
  end: number;
}
interface CallNode extends Node {
  callee: Node;
  arguments: Node[];
}

/** The nodes directly under `node`, in source order. */
function children(node: Node): Node[] {
  const out: Node[] = [];
  for (const value of Object.values(node)) {
    for (const v of Array.isArray(value) ? value : [value]) {
      if (v && typeof v === "object" && typeof (v as Node).type === "string") out.push(v as Node);
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

/** The value of a string literal or a template with no substitutions, else `null`. */
function stringOf(node: Node): string | null {
  const n = node as Node & { value?: unknown; quasis?: { value: { cooked: string } }[] };
  if (n.type === "Literal" && typeof n.value === "string") return n.value;
  if (n.type === "TemplateLiteral" && n.quasis?.length === 1) return n.quasis[0]!.value.cooked;
  return null;
}

function literal(node: Node | undefined, parents: Node[]): string | null {
  if (!node) return null;
  const string = stringOf(node);
  if (string !== null) return string;
  const n = node as Node & Record<string, unknown>;
  if (n.type === "ParenthesizedExpression") return literal(n.expression as Node, parents);
  if (n.type === "Identifier")
    return literal(binding(n as unknown as Node & { name: string }, parents), parents);
  // `['a', 'b'].join('\n\n')`
  if (n.type === "CallExpression") {
    const { callee, arguments: args } = n as unknown as CallNode;
    const member = callee as Node & { object: Node; property: { name: string }; computed: boolean };
    if (
      member.type === "MemberExpression" &&
      !member.computed &&
      member.property.name === "join" &&
      member.object.type === "ArrayExpression"
    ) {
      const elements = (member.object as Node & { elements: Node[] }).elements;
      const items = elements.map((e) => literal(e, parents));
      const separator = args.length ? literal(args[0], parents) : ",";
      return separator === null || items.includes(null) ? null : items.join(separator);
    }
    return null;
  }
  if (n.type === "BinaryExpression" && n.operator === "+") {
    const [a, b] = [literal(n.left as Node, parents), literal(n.right as Node, parents)];
    return a === null || b === null ? null : a + b;
  }
  return null;
}

/** The initializer of the nearest enclosing `const` of that name. */
function binding(name: Node & { name: string }, parents: Node[]): Node | undefined {
  for (const scope of [...parents].reverse()) {
    if (scope.type !== "BlockStatement" && scope.type !== "Program") continue;
    for (const statement of (scope as Node & { body: Node[] }).body) {
      if (statement.type !== "VariableDeclaration") continue;
      const declaration = statement as Node & {
        kind: string;
        declarations: { id: Node & { name?: string }; init: Node | null }[];
      };
      if (declaration.kind !== "const") continue;
      for (const d of declaration.declarations) {
        if (d.id.type === "Identifier" && d.id.name === name.name) return d.init ?? undefined;
      }
    }
  }
  return undefined;
}

/** The string `assert.equal(micromark(…), expected)` holds the call to, when it is a literal. */
function expected(call: Node, parents: Node[]): string {
  const parent = parents.at(-1) as CallNode | undefined;
  if (parent?.type !== "CallExpression" || parent.arguments[0] !== call) return "";
  return literal(parent.arguments[1], parents.slice(0, -1)) ?? "";
}

/** @prose
 * ## yaml-test-suite
 *
 * Each test in `src/*.yaml`, with its variants, becomes a metadata block: the test's YAML between
 * `---` fences. What markz is held to is the `yaml` package's reading, so the suite is kept to
 * what that oracle reads as a mapping, or rejects: a top-level sequence or scalar is not metadata
 * in any tool. A document marker, `...` or `%` directive line can't sit inside the fences, so
 * those tests are left out. The suite's own JSON, or its `fail`, checks the oracle.
 */
function yamlSuite(dir: string, dropped: string[]): Vendored[] {
  const out: Vendored[] = [];
  const base = join(dir, "src");
  for (const file of readdirSync(base).sort()) {
    if (!file.endsWith(".yaml")) continue;
    const id = file.slice(0, -5);
    let name = "";
    let tags = "";
    for (const [i, test] of (
      YAML.parse(readFileSync(join(base, file), "utf8"), { logLevel: "error" }) as Test[]
    ).entries()) {
      name = test.name ?? name;
      tags = test.tags ?? tags;
      if (test.yaml === undefined) continue;
      const label = `${id}${i ? `:${i}` : ""}`;
      const text = visible(test.yaml);
      if (/^(?:---|\.\.\.)(?:\s|$)|^%/m.test(text) || text.includes("\uFEFF")) {
        dropped.push(`${label} ${name}: document markers`);
        continue;
      }
      let shape = "error";
      try {
        const value = YAML.parse(text, { logLevel: "error" });
        shape =
          value === null || typeof value !== "object"
            ? "scalar"
            : Array.isArray(value)
              ? "sequence"
              : "mapping";
      } catch {}
      if (shape !== "mapping" && shape !== "error") {
        dropped.push(`${label} ${name}: a ${shape}, not a mapping`);
        continue;
      }
      out.push({
        example: 0,
        section: `${label} › ${name} (${tags})`,
        markdown: `---\n${text}${text.endsWith("\n") ? "" : "\n"}---\n`,
        html: test.fail ? "error" : (test.json ?? ""),
      });
    }
  }
  return out;
}

interface Test {
  name?: string;
  tags?: string;
  yaml?: string;
  json?: string;
  fail?: boolean;
}

/** The suite writes invisible characters visibly: `␣` a space, `—»` a tab, `←` a CR, `∎` no final newline. */
function visible(text: string): string {
  return text
    .replace(/␣/g, " ")
    .replace(/—*»/g, "\t")
    .replace(/←/g, "\r")
    .replace(/↵/g, "")
    .replace(/⇔/g, "\uFEFF")
    .replace(/∎\n?$/, "");
}

/** @prose
 * ## github-slugger
 *
 * `test/fixtures.json` is one run of a slugger over plain strings, so a repeat is numbered from the
 * ones before it. markz slugs a heading's text, so each fixture becomes a heading, with ASCII
 * punctuation backslash-escaped so the text is the input exactly, and its HTML is the id it should
 * get. The harness puts each after the ones before it, as one document. A heading's text is
 * trimmed, so an input that starts or ends with whitespace can't be written as one.
 */
function sluggerSuite(dir: string, dropped: string[]): Vendored[] {
  const fixtures = JSON.parse(readFileSync(join(dir, "test/fixtures.json"), "utf8")) as {
    name: string;
    input: string;
    expected: string;
  }[];
  const out: Vendored[] = [];
  for (const f of fixtures) {
    if (f.input !== f.input.trim() || /[\r\n]/.test(f.input)) {
      dropped.push(`${f.name}: ${JSON.stringify(f.input)} can't be a heading's text`);
      continue;
    }
    const markdown = `# ${f.input.replace(/[!-/:-@[-`{-~]/g, "\\$&")}\n`;
    out.push({ example: 0, section: f.name, markdown, html: f.expected });
  }
  return out;
}

/** @prose
 * ## Curation
 *
 * A suite is vendored for the decisions markz makes, not for its size. Most of an extension's
 * suite exercises a form markz supports and is kept whole; where a suite enumerates variants of a
 * form markz cuts or doesn't read, a few of each stand for the rest. What curation leaves out goes
 * to `test/examples/upstream/stress/`, where it is only checked not to hang, throw or lose a link silently, and stays
 * off the Conformance page.
 *
 * - **gfm-autolink-literal:** the fixtures that sweep a character class (`http://` before each
 *   ASCII punctuation, each character before a URL, character references in a domain) go to
 *   stress; the hand-written fixtures and every inline test stay.
 * - **directive:** the attribute grammar and the name and label rules are shared by all three
 *   kinds, and the suite tests them in each. A test whose title an earlier group already used
 *   stays only the first time, as does one that differs only in the character it names, and the
 *   `content` group's repeats of attribute syntax (line breaks in `{…}`, `.a.b` shortcuts, single
 *   quotes) go too. A directive before or after a block form markz cuts
 *   (setext, indented code, definitions, HTML, `***`) tests that form, which its own row does.
 * - **gfm-footnote:** footnotes are cut, so what markz decides is that `[^x]` and `[^x]:` warn,
 *   that `[^x]` is told apart from links, images and references, and that `^[x]` is text. The
 *   fixtures on those and the inline tests stay (not the ones for the HTML's options); the ones on
 *   a footnote's own content (blank lines, prefixes, nesting, continuation) go.
 * - **yaml:** valid YAML that looks like plain metadata (`key: value` lines, blanks, comments) stays,
 *   and of the rest, a test stays while one of its feature tags (`anchor`, `flow`, `literal`, …)
 *   has none yet. Tags that say where a test comes from (`spec`, `1.3-err`) or what every
 *   test has (`mapping`, `whitespace`) don't count.
 */
const YAML_FEATURES = new Set([
  "alias",
  "anchor",
  "tag",
  "local-tag",
  "unknown-tag",
  "flow",
  "sequence",
  "literal",
  "folded",
  "explicit-key",
  "complex-key",
  "empty-key",
  "duplicate-key",
  "double",
  "single",
  "comment",
  "indent",
  "error",
]);
const CUT_NEIGHBOUR =
  /(?:code \(indented\)|a definition|heading \(setext\)|html|thematic break) (?:before|after) a/;
const ATTRIBUTE_REPEAT =
  /^content › should (?:not )?support (?:EOLs? .*|.*shortcuts.*|.*single(?: quoted)? attribute values)$/;

const FOOTNOTE =
  /^(?:bang-caret|images-or-footnotes|links-or-footnotes|references-and-definitions|calls|definitions|inline-notes-pandoc)\.md|^micromark-extension-gfm-footnote › (?!should support `options)/;

const SWEEPS = /^(?:http|www)-(?:domain|path)-|-character-reference-like-|^previous-complex/;

function curate(suite: string, examples: Vendored[]): [kept: Vendored[], stress: Vendored[]] {
  const kept: Vendored[] = [];
  const stress: Vendored[] = [];
  const seen = new Map<string, number>();
  for (const e of examples) {
    let keep = true;
    if (suite === "gfm-autolink-literal") keep = !SWEEPS.test(e.section);
    if (suite === "gfm-footnote") keep = FOOTNOTE.test(e.section);
    if (suite === "directive") {
      // Variants that differ only in one character (`an empty shortcut (\`.\`)`) are one test.
      const title = e.section
        .split(" › ")
        .at(-1)!
        .replace(/ \(`[^`]*`\)$/, "");
      keep = !seen.has(title) && !CUT_NEIGHBOUR.test(title) && !ATTRIBUTE_REPEAT.test(e.section);
      seen.set(title, 1);
    }
    if (suite === "yaml") {
      const body = e.markdown.slice(4, -4);
      const tags = (/\(([^)]*)\)$/.exec(e.section)?.[1]?.split(" ") ?? []).filter((t) =>
        YAML_FEATURES.has(t),
      );
      keep =
        (e.html !== "error" &&
          body.split("\n").every((l) => /^(?:[\w-]+:(?: .*)?|\s*(?:#.*)?)$/.test(l))) ||
        tags.some((t) => !seen.has(t));
      if (keep) for (const t of tags) seen.set(t, (seen.get(t) ?? 0) + 1);
    }
    (keep ? kept : stress).push(e);
  }
  return [kept, stress];
}

const [suite, dir] = process.argv.slice(2);
if (!suite || !dir || !SUITES[suite]) {
  throw new Error(`usage: node scripts/vendor.ts <${Object.keys(SUITES).join("|")}> <clone>`);
}
const dropped: string[] = [];
const examples =
  suite === "yaml"
    ? yamlSuite(dir, dropped)
    : suite === "slugger"
      ? sluggerSuite(dir, dropped)
      : [...fixtures(dir), ...inline(dir, dropped)];
// Upstream sometimes asserts the same input twice, under different options.
const seen = new Set<string>();
// A slugger fixture repeats its input on purpose.
const kept =
  suite === "slugger"
    ? examples
    : examples.filter((e) => !seen.has(e.markdown) && seen.add(e.markdown));
const [conformance, stress] = curate(suite, kept);
conformance.forEach((e, i) => (e.example = i + 1));
stress.forEach((e, i) => (e.example = i + 1));
const commit = execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const [title, repo, path, checks] = SUITES[suite]!;
const write = (file: string, list: Vendored[], checkedBy: string) => {
  const meta = {
    source: suite,
    url: `https://github.com/${repo}/tree/${commit}/${path}`,
    commit,
    checks: checkedBy,
  };
  const fences = list.map((e) => ({
    section: e.section,
    number: e.example,
    category: null,
    rule: null,
    markdown: e.markdown,
    expected: e.html,
    warnings: [],
  }));
  writeFileSync(file, writeFences(title, meta, fences));
};
write(`test/examples/upstream/${suite}.md`, conformance, checks);
if (stress.length) write(`test/examples/upstream/stress/${suite}.md`, stress, "sound");
console.log(
  `${suite} at ${commit}: ${conformance.length} examples, ${stress.length} to stress, ${examples.length - kept.length} duplicate inputs`,
);
for (const d of dropped) console.log(`  dropped ${d}`);
