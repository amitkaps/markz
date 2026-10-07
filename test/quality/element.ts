/** @prose
 * # The Quality page's browser half
 *
 * One custom element, `<markz-quality>`, that turns the generated page into a browser for the
 * examples. The page arrives complete: the cards, and every construct as a closed row with its
 * counts. The element adds what needs the data: the status filters and the search, and a
 * construct's examples, built when it is opened rather than all 1,300 up front, fifty at a time.
 *
 * It reads the rows from a JSON script tag and builds everything with `textContent`, so an
 * example's Markdown and HTML are shown as text, never parsed. It has no dependencies; the
 * generator strips its types and inlines it, so the page is one file.
 */
/// <reference lib="dom" />
import type { Edges, Row, Status } from "./data";

interface Data {
  rows: Row[];
  edges: Record<string, Edges>;
}

const STATUSES: Status[] = ["match", "warn", "differ", "fail"];
const PAGE = 50;

type Child = Node | string | null | false;

function h(tag: string, props: Record<string, string> = {}, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(props)) el.setAttribute(name, value);
  for (const child of children) if (child) el.append(child);
  return el;
}

/** Markdown split into text and visible whitespace: tabs as `→` and trailing spaces as `·`. */
function visible(markdown: string): Child[] {
  const out: Child[] = [];
  const ws = (text: string) => h("span", { class: "ws" }, text);
  for (const line of markdown.split("\n")) {
    const [, body = "", trailing = ""] = /^(.*?)([ \t]*)$/.exec(line) ?? [];
    for (const piece of body.split(/(\t)/)) if (piece) out.push(piece === "\t" ? ws("→\t") : piece);
    if (trailing) out.push(ws(trailing.replace(/ /g, "·").replace(/\t/g, "→\t")));
    out.push("\n");
  }
  return out;
}

/** The part of `a` that `b` shares from the start, and the rest, marked. */
function marked(a: string, b: string): Child[] {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return [a.slice(0, i), h("mark", {}, a.slice(i))];
}

function pane(title: string, ...content: Child[]): HTMLElement {
  return h("div", { class: "pane" }, h("h3", {}, title), ...content);
}

/** What each oracle's output is, for the panes' headings. */
const OUTPUT: Record<string, string> = {
  yaml: "metadata",
  "github-slugger": "id",
  "micromark-extension-math": "math",
};

function example(r: Row): HTMLElement {
  const output = OUTPUT[r.oracle] ?? "HTML";
  const panes = [
    pane("Markdown", h("pre", {}, ...visible(r.markdown))),
    pane(
      r.oracle === "markz" ? `Expected ${output}` : `${r.oracle}’s ${output}`,
      h("pre", {}, r.expected),
    ),
    pane(`markz’s ${output}`, h("pre", {}, r.markz)),
    r.metadata && pane("Metadata", h("pre", {}, r.metadata)),
  ];
  const [expected, markz] = r.normalized ?? [];
  return h(
    "details",
    { class: `ex ${r.status}` },
    h(
      "summary",
      {},
      h("span", { class: "num-label" }, `#${r.number}`),
      h(
        "span",
        { class: "status" },
        h("span", { class: "pill" }, r.status),
        r.detail && h("code", { class: "detail" }, r.detail),
      ),
      h("span", { class: "suite" }, r.source),
      r.category && h("span", { class: "edge" }, r.category + (r.rule ? ` · ${r.rule}` : "")),
      h("span", { class: "preview" }, r.markdown.replace(/\n/g, "⏎ ")),
    ),
    h(
      "div",
      { class: "body" },
      h("div", { class: "panes" }, ...panes),
      expected !== undefined &&
        markz !== undefined &&
        h(
          "div",
          { class: "panes" },
          pane("Expected, normalized", h("pre", { class: "wrap" }, ...marked(expected, markz))),
          pane("markz, normalized", h("pre", { class: "wrap" }, ...marked(markz, expected))),
        ),
      r.warnings.length > 0 &&
        pane("Warnings", h("ul", { class: "warnings" }, ...r.warnings.map((w) => h("li", {}, w)))),
    ),
  );
}

/** @prose
 * A construct's edges in one line: each count with one case of its kind, so the reader sees what
 * is counted. The terms are the Edges card's. Its ambiguous and unclosed examples are rows below,
 * so the line only says why a construct has none.
 */
function edgesOf(e: Edges): HTMLElement {
  const count = (
    n: number,
    one: string,
    many: string,
    sample: string | null | undefined,
  ): Child[] => [
    h("b", {}, n.toLocaleString("en")),
    ` ${n === 1 ? one : many}`,
    sample != null && " like ",
    sample != null && h("code", {}, sample.replace(/\r\n|\n/g, "⏎").replace(/\r/g, "␍")),
  ];
  const none = (["ambiguous", "unclosed"] as const).flatMap((k) =>
    e.none[k] ? [h("p", {}, `No ${k} example. `, h("span", { class: "why" }, e.none[k]!))] : [],
  );
  return h(
    "div",
    { class: "edges" },
    h(
      "p",
      {},
      "Edges: ",
      ...count(e.valid, "valid", "valid", e.sample?.valid),
      ", ",
      ...count(e.boundary, "boundary", "boundary", e.sample?.boundary),
      ", ",
      ...count(e["near-miss"], "near miss", "near misses", e.sample?.["near-miss"]),
      e.unsettled > 0 && h("span", { class: "fail-n" }, `, ${e.unsettled} unsettled`),
      ".",
    ),
    ...none,
  );
}

class MarkzQuality extends HTMLElement {
  #data!: Data;
  #bySection = new Map<string, Row[]>();
  #shown = new Set<Status>(STATUSES);
  #search = "";
  /** How many of each open construct's examples are listed. */
  #limit = new Map<string, number>();

  connectedCallback(): void {
    this.#data = JSON.parse(document.getElementById("quality-data")!.textContent!) as Data;
    for (const r of this.#data.rows) {
      const list = this.#bySection.get(r.section) ?? [];
      list.push(r);
      this.#bySection.set(r.section, list);
    }
    for (const button of this.querySelectorAll<HTMLButtonElement>("button.stat")) {
      button.addEventListener("click", () => {
        const status = button.dataset.status as Status;
        if (!this.#shown.delete(status)) this.#shown.add(status);
        this.#update();
      });
    }
    this.querySelector("input[type=search]")!.addEventListener("input", (event) => {
      this.#search = (event.target as HTMLInputElement).value;
      this.#update();
    });
    this.querySelector(".clear")!.addEventListener("click", () => {
      this.#shown = new Set(STATUSES);
      this.#search = "";
      this.querySelector<HTMLInputElement>("input[type=search]")!.value = "";
      this.#update();
    });
    for (const el of this.querySelectorAll<HTMLDetailsElement>("details.construct")) {
      el.addEventListener("toggle", () => {
        if (!el.open) return;
        this.#fill(el);
        history.replaceState(null, "", `#${el.id}`);
      });
    }
    // A link to `#construct-id` opens it.
    const name = decodeURIComponent(location.hash.slice(1));
    const target = name
      ? this.querySelector<HTMLDetailsElement>(`details.construct[id="${CSS.escape(name)}"]`)
      : null;
    if (target) {
      target.open = true;
      requestAnimationFrame(() => target.scrollIntoView());
    }
  }

  get #filtering(): boolean {
    return this.#search.trim() !== "" || this.#shown.size < STATUSES.length;
  }

  #matches(r: Row): boolean {
    if (!this.#shown.has(r.status)) return false;
    const q = this.#search.trim().toLowerCase();
    if (!q) return true;
    const number = /^#?(\d+)$/.exec(q)?.[1];
    return number
      ? String(r.number) === number
      : r.markdown.toLowerCase().includes(q) ||
          r.detail.toLowerCase().includes(q) ||
          r.codes.includes(q) ||
          r.category === q ||
          r.rule === q;
  }

  #rows(name: string): Row[] {
    const rows = (this.#bySection.get(name) ?? []).filter((r) => this.#matches(r));
    return rows.sort((a, b) => +(b.status === "fail") - +(a.status === "fail"));
  }

  /** Lists an open construct's examples that pass the filters. */
  #fill(el: HTMLDetailsElement): void {
    const name = el.id;
    const list = el.querySelector(".list")!;
    const rows = this.#rows(name);
    const limit = this.#limit.get(name) ?? PAGE;
    const children: Child[] = [];
    const edges = this.#data.edges[name];
    if (edges) children.push(edgesOf(edges));
    if (!rows.length) children.push(h("p", { class: "empty" }, "No examples match these filters."));
    for (const r of rows.slice(0, limit)) children.push(example(r));
    if (rows.length > limit) {
      const more = h(
        "button",
        { type: "button", class: "chip more" },
        `Show ${Math.min(PAGE, rows.length - limit)} more`,
      );
      more.addEventListener("click", () => {
        this.#limit.set(name, limit + PAGE);
        this.#fill(el);
      });
      children.push(more);
    }
    list.replaceChildren(...children.filter((c): c is Node | string => !!c));
  }

  #update(): void {
    const filtering = this.#filtering;
    for (const button of this.querySelectorAll<HTMLButtonElement>("button.stat")) {
      button.setAttribute("aria-pressed", String(this.#shown.has(button.dataset.status as Status)));
    }
    let total = 0;
    let any = false;
    for (const el of this.querySelectorAll<HTMLDetailsElement>("details.construct")) {
      const n = this.#rows(el.id).length;
      total += n;
      el.hidden = filtering && n === 0;
      any ||= !el.hidden;
      this.#limit.delete(el.id);
      // A search opens every construct it matches; the rest stay as they were.
      if (this.#search.trim() && !el.hidden) el.open = true;
      if (el.open) this.#fill(el);
    }
    const clear = this.querySelector<HTMLElement>(".clear")!;
    clear.hidden = !filtering;
    clear.textContent = `Clear · ${total} shown`;
    this.querySelector<HTMLElement>(".none")!.hidden = !(filtering && !any);
  }
}

customElements.define("markz-quality", MarkzQuality);
