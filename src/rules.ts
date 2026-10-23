/** @prose
 * # Rules
 *
 * `@amitkaps/markz/rules`: what a tool's users are asked to write, worded once in its docs, and
 * the codes that check it. It's a subpath for Node, so the browser bundle and its budget don't
 * change. Every tool built on markz reads its rules with it, prints them, and prints its findings
 * in one line.
 *
 * A rule is a list item that opens with a span holding its id, like ``[`emphasis-underscore`]{#…}``
 * or `[**Name.**]{#id}`, under a heading for its group. The rest of the item's first paragraph is
 * its text. It's read with `ids`, so no tool keeps a regex for its own layout. A rule serves a
 * code when it links to the code's page, so the doc holds the map, and `WARNINGS` stays as small
 * as the browser needs it ([usage](../docs/usage.md#for-agents)).
 *
 * # Composing
 *
 * A tool's rules come after those of the packages it builds on, so pagez prints markz's rules
 * with its own. `rules <id>` searches every set, so an id is unique across what composes, and
 * `compose` fails on one stated twice.
 */
import { headings, ids, parse, walk, WARNINGS } from "./index";
import usage from "../docs/usage.md?raw";

/** How much a finding matters. An `error` always fails, a `warning` fails `check` unless the
 *  rule is held, and a `note` never fails. */
export type Level = "error" | "warning" | "note";

/** A rule: its id, the label its span shows, its text as Markdown, its group and its address. */
export interface Rule {
  id: string;
  label: string;
  text: string;
  group: string;
  url: string;
  /** Every link in the text, resolved against the doc's address. */
  links: string[];
}

/** A code a tool gives: its level, its message, what to write instead and its address. */
export interface Code {
  code: string;
  level: Level;
  message: string;
  instead: string;
  url: string;
}

/** A tool's rules and codes. */
export interface Rules {
  tool: string;
  rules: Rule[];
  codes: Code[];
}

/** The rules in a doc, in order. Relative links are resolved against `url`, the doc's address. */
export function readRules(source: string, url: string): Rule[] {
  const doc = parse(source);
  const outline = headings(doc);
  const out: Rule[] = [];
  for (const { id, node, written, label } of ids(doc)) {
    const paragraph = doc.parent(node);
    const item = doc.parent(paragraph);
    if (
      !written ||
      doc.type(node) !== "element" ||
      doc.type(paragraph) !== "paragraph" ||
      doc.firstChild(paragraph) !== node ||
      doc.type(item) !== "listItem" ||
      doc.firstChild(item) !== paragraph
    ) {
      continue;
    }
    const links: string[] = [];
    let text = "";
    let at = doc.end(node);
    // The paragraph's source after the span, with each link's destination resolved in place.
    walk(
      doc,
      {
        enter(child) {
          if (doc.type(child) !== "link" || doc.start(child) < at) return true;
          const { destination } = doc.data(child, "link");
          const resolved = new URL(destination, url).href;
          const link = source.slice(doc.start(child), doc.end(child));
          links.push(resolved);
          text +=
            source.slice(at, doc.start(child)) + link.replace(`](${destination}`, `](${resolved}`);
          at = doc.end(child);
          return false;
        },
      },
      paragraph,
    );
    text = (text + source.slice(at, doc.end(paragraph))).replace(/^:?\s*/, "");
    const group = outline.findLast((h) => doc.start(h.node) < doc.start(item))?.label ?? "";
    out.push({ id, label: label ?? id, text, group, url: `${url}#${id}`, links });
  }
  return out;
}

/** The sets in order, after checking that no id is stated twice across them. */
export function compose(...sets: Rules[]): Rules[] {
  const seen = new Map<string, string>();
  for (const { tool, rules, codes } of sets) {
    for (const id of [...rules.map((r) => r.id), ...codes.map((c) => c.code)]) {
      const first = seen.get(id);
      if (first) throw new Error(`${tool} states \`${id}\`, which ${first} states too`);
      seen.set(id, tool);
    }
  }
  return sets;
}

const SITE = "https://markz.amitkaps.com/docs/";

/** markz's own rules, from its usage doc, and its codes, each a warning. */
export const markz: Rules = {
  tool: "markz",
  rules: readRules(usage, `${SITE}usage.md`),
  codes: Object.entries(WARNINGS).map(([code, { message, instead }]) => ({
    code,
    level: "warning",
    message,
    instead,
    url: `${SITE}syntax.md#${code}`,
  })),
};

/** The codes in any set that a rule links to, in the order it links them. */
export function codesOf(sets: Rules[], rule: Rule): Code[] {
  const codes = sets.flatMap((s) => s.codes);
  return rule.links.flatMap((link) => codes.filter((c) => c.url === link));
}

// One rule as a list item, with the codes that check it on the line below.
function printRule(sets: Rules[], rule: Rule): string {
  const codes = codesOf(sets, rule).map((c) => `\`${c.code}\``);
  const by = codes.length ? `\n  Checked by ${list(codes)}.` : "";
  const name = rule.label === rule.id ? `\`${rule.id}\`:` : `**${rule.label}**`;
  return `- ${name} ${rule.text}${by}\n`;
}

function list(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/** Every rule under its group's heading, each with the codes that check it. With more than one
 *  set, each set opens with its tool's name. */
export function printRules(sets: Rules[]): string {
  let out = "";
  for (const set of sets) {
    if (sets.length > 1) out += `${out ? "\n" : ""}# ${set.tool}\n`;
    let group: string | undefined;
    for (const rule of set.rules) {
      if (rule.group !== group) out += `${out ? "\n" : ""}## ${(group = rule.group)}\n\n`;
      out += printRule(sets, rule);
    }
  }
  return out;
}

/** One rule by its id, or one code with the rule it serves, from any of the sets. `undefined`
 *  when no set states the id. */
export function printOne(sets: Rules[], id: string): string | undefined {
  for (const set of sets) {
    const rule = set.rules.find((r) => r.id === id);
    if (rule) return `${printRule(sets, rule)}  ${rule.url}\n`;
    const code = set.codes.find((c) => c.code === id);
    if (code) {
      const serving = sets
        .flatMap((s) => s.rules)
        .filter((r) => r.links.includes(code.url))
        .map((r) => `\n${printRule(sets, r)}`)
        .join("");
      return `${code.code} (${code.level}): ${code.message}; write ${code.instead}\n  ${code.url}\n${serving}`;
    }
  }
  return undefined;
}

/** What a tool found, for `finding`. Each part but the tool, the level and the message is
 *  optional, and a missing one is left out of the line. */
export interface Finding {
  tool: string;
  level: Level;
  file?: string;
  /** 1-based, as editors count. */
  line?: number;
  /** 1-based, as editors count. */
  column?: number;
  code?: string;
  message: string;
  instead?: string;
  /** Why the repository holds the rule, which turns a failing warning into a passing one. */
  held?: string;
}

/** One finding as a line:
 *  `<tool>: <level>: <file>:<line>:<col>: <code>: <message>; write <instead>; held: <reason>`. */
export function finding(f: Finding): string {
  const where = f.file && [f.file, f.line, f.line && f.column].filter(Boolean).join(":");
  return [
    `${f.tool}: ${f.level}: `,
    where ? `${where}: ` : "",
    f.code ? `${f.code}: ` : "",
    f.message,
    f.instead ? `; write ${f.instead}` : "",
    f.held ? `; held: ${f.held}` : "",
  ].join("");
}
