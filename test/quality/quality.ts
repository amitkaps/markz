/** @prose
 * # Quality page
 *
 * Writes the Quality page as one HTML file: what markz is held to, what it costs to ship and hold,
 * and how long it takes, all measured on this commit when it is generated. The page is the test
 * suite made browsable, and a standalone reference: it has no dependencies, its stylesheet and
 * script are inlined, and the data it browses is a JSON block in the page.
 *
 * `prose build` writes the rest of the site and this adds one file to it, so run it after:
 * `pnpm quality [file]`, by default `.prose/quality.html`. The cards and every construct's
 * row are plain HTML; `<markz-quality>` ([element.ts](element.ts)) adds the filters and the examples.
 * The page's own text goes through markz, so the page is a check on this commit's parser too.
 *
 * The page isn't one of prose's, so it keeps its own look. Its header is only a breadcrumb back
 * to the home page. A copy of the docs' links was dropped, because it drifted from prose's bar.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { dirname, join } from "node:path";
import { createServer } from "vite-plus";
import type { Quality, Row, Status } from "./data.ts";

// The harness reads its examples with Vite's `import.meta.glob`, so it is loaded through Vite's
// module loader rather than by Node.
const vite = await createServer({
  configFile: false,
  logLevel: "silent",
  appType: "custom",
  server: { middlewareMode: true, watch: null },
});
const { html, parse } = (await vite.ssrLoadModule(
  "/src/index.ts",
)) as typeof import("../../src/index.ts");
const { PARTS, STATUSES, conformance, constructEdges, quality } = (await vite.ssrLoadModule(
  "/test/quality/data.ts",
)) as typeof import("./data.ts");

const REPO = "https://github.com/amitkaps/markz";
const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();

const WHAT: Record<Status, string> = {
  match: "gives the oracle’s output, or markz’s own expected HTML",
  warn: "holds because markz warned: a form the dialect cuts, or metadata it doesn’t read",
  differ: "a construct markz keeps under its own rule, by design",
  fail: "markz does something else",
};

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const markz = (markdown: string) => html(parse(markdown));
const kb = (bytes: number, digits = 1) => (bytes / 1024).toFixed(digits);
const ms = (n: number) => (n < 10 ? n.toFixed(1) : n.toFixed(0));
const range = (low: number, high: number) =>
  ms(low) === ms(high) ? ms(low) : `${ms(low)}–${ms(high)}`;

type Tally = Record<Status, number>;
function tally(rows: Row[]): Tally {
  const t: Tally = { match: 0, warn: 0, differ: 0, fail: 0 };
  for (const r of rows) t[r.status]++;
  return t;
}

const bar = (t: Tally, n: number) =>
  `<div class="bar" role="img" aria-label="${STATUSES.map((s) => `${t[s]} ${s}`).join(", ")}">${STATUSES.filter(
    (s) => t[s],
  )
    .map((s) => `<span class="${s}" style="width: ${(100 * t[s]) / n}%"></span>`)
    .join("")}</div>`;
const counts = (t: Tally) =>
  STATUSES.map((s) => `<span class="num ${s}${t[s] ? "" : " zero"}">${t[s]}</span>`).join("");

const INTRO = `
What markz is held to, what it costs to ship and hold, and how long it takes. Everything here is
measured on this commit when the page is generated.

**Conformance.** The grammar is tested as a language: every example markz is held to, filed as
\`syntax.md\` is. Upstream suites are checked against an oracle:
[micromark](https://github.com/micromark/micromark) for CommonMark, GFM and frontmatter, after
whitespace and smart punctuation are normalized; [yaml](https://eemeli.org/yaml/) for metadata
values; and [github-slugger](https://github.com/Flet/github-slugger) for heading ids. markz's own
examples carry their expected output. This page runs the same code as \`pnpm test\`.
`;

function part(part: (typeof PARTS)[number], rows: Row[]): string {
  const constructs = new Map<string, Row[]>();
  for (const r of rows) {
    if (r.part !== part) continue;
    constructs.set(r.section, [...(constructs.get(r.section) ?? []), r]);
  }
  const noun = part === "Not supported" ? "row" : "construct";
  const items = [...constructs].map(([name, all]) => {
    const sources = [...new Set(all.map((r) => r.source))];
    return `<details class="construct" id="${escape(name)}">
<summary class="grid row"><span class="name"><span class="caret" aria-hidden="true"></span>${escape(all[0]!.title)}${sources
      .map((s) => `<span class="suite">${escape(s)}</span>`)
      .join(
        "",
      )}</span><span class="bar-cell">${bar(tally(all), all.length)}</span>${counts(tally(all))}</summary>
<div class="list"></div>
</details>`;
  });
  return `<section class="part">
<h2>${part}</h2>
<div class="grid head"><span>${part === "Not supported" ? "Row" : "Construct"}</span><span class="bar-cell"></span>${STATUSES.map(
    (s) => `<span class="num ${s}">${s}</span>`,
  ).join("")}</div>
${items.join("\n")}
<div class="grid total"><span>${constructs.size} ${noun}${constructs.size === 1 ? "" : "s"}</span><span class="bar-cell"></span>${counts(tally(rows.filter((r) => r.part === part)))}</div>
</section>`;
}

function cards(rows: Row[], q: Quality): string {
  const totals = tally(rows);
  return `<section class="cards" aria-label="Summary">
<div class="card">
<h2>Conformance</h2>
<p class="headline"><span class="n">${rows.length - totals.fail}</span> of ${rows.length} examples hold${totals.fail ? `, <span class="fail-n">${totals.fail} fail</span>` : ""}</p>
${bar(totals, rows.length)}
<div class="stats">
${STATUSES.map(
  (s) =>
    `<button type="button" class="stat ${s}" data-status="${s}" aria-pressed="true"><span class="n">${totals[s]}</span> <span class="label">${s}</span> <span class="what">${escape(WHAT[s])}</span></button>`,
).join("\n")}
</div>
</div>
<div class="card-row">
<div class="card">
<h2>Size</h2>
<p class="line"><span class="n">${kb(q.size.gzip)}</span> KB gzip to ship, of a ${kb(q.size.budget, 0)} KB budget</p>
<div class="bars"><span class="bar-label">used</span><span class="bar-track"><span class="bar-fill" style="width: ${(q.size.gzip / q.size.budget) * 100}%"></span></span><span class="bar-value">${kb(q.size.budget - q.size.gzip)} KB to spare</span></div>
<p class="line"><span class="n">${kb(q.size.held, 0)}</span> KB to hold the CommonMark spec's tree, a ${kb(q.size.source, 0)} KB document</p>
<p class="what">One package with no dependencies: parser, tree and HTML, bundled and minified. The tree is flat typed arrays with offsets into the source, which it shares rather than copies.</p>
</div>
<div class="card">
<h2>Speed</h2>
<table class="runs"><tbody>
${q.speed.map((r) => `<tr><th scope="row">${escape(r.label)} <span class="what">${kb(r.bytes, 0)} KB</span></th><td>${range(r.low, r.high)} ms</td></tr>`).join("\n")}
</tbody></table>
<p class="what">Parse + HTML, once the parser is warm. One pass, no backtracking, so time grows in step with the text: twice the text takes about twice as long. Measured on ${escape(q.machine)}.</p>
</div>
</div>
</section>`;
}

/** The element's source, as the JavaScript a browser runs. */
function script(): string {
  const source = readFileSync(join(import.meta.dirname, "element.ts"), "utf8");
  return stripTypeScriptTypes(source);
}

/** Data goes in a script block, where only `</script` can end it. */
const json = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

export async function page(): Promise<string> {
  const rows = conformance();
  const q = await quality();
  const css = readFileSync(join(import.meta.dirname, "style.css"), "utf8");
  const built = new Date().toUTCString();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Quality · markz</title>
<meta name="description" content="Every example markz is held to, filed by the dialect: CommonMark, GFM, YAML and heading ids against their oracles, and markz's own. And what markz costs in size and speed.">
<style>
${css}</style>
</head>
<body>
<div class="shell">
<header>
<nav class="crumbs" aria-label="Breadcrumb"><a href="/" class="brand">markz</a><span aria-hidden="true">/</span><span aria-current="page">Quality</span></nav>
</header>
<main>
<markz-quality>
<header class="intro">
<h1>Quality</h1>
${markz(INTRO)}
<p class="meta">${rows.length} examples · built ${built}</p>
</header>
${cards(rows, q)}
<div class="filters">
<input type="search" placeholder="Search Markdown, a warning code, or #232" aria-label="Search">
<button type="button" class="chip clear" hidden></button>
</div>
<p class="empty none" hidden>No examples match these filters.</p>
<noscript><p class="empty">The filters and each construct’s examples need JavaScript.</p></noscript>
${PARTS.map((p) => part(p, rows)).join("\n")}
</markz-quality>
</main>
<footer>
<span>Rendered by markz, built from <a href="${REPO}/commit/${commit}"><code>${commit.slice(0, 7)}</code></a></span>
<a href="${REPO}">github.com/amitkaps/markz</a>
</footer>
</div>
<script type="application/json" id="quality-data">${json({ rows, edges: constructEdges() })}</script>
<script type="module">
${script()}</script>
</body>
</html>
`;
}

if (import.meta.main) {
  const out = process.argv[2] ?? join(import.meta.dirname, "../../.prose/quality.html");
  mkdirSync(dirname(out), { recursive: true });
  const text = await page();
  writeFileSync(out, text);
  await vite.close();
  console.log(`quality: ${out} (${kb(text.length, 0)} KB)`);
}
