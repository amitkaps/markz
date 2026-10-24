/** @prose
 * # Rules, read and printed
 *
 * What the rules subpath promises. Every markz code is linked from exactly one rule, so no code
 * ships without a rule saying what to write, and every rule's link to Syntax lands on a code.
 * The reader takes both forms the repositories write, ``[`id`]{#id}:`` and `[**Name.**]{#id}`,
 * and a finding drops the parts it wasn't given.
 *
 * markz's commands are read the same way, from under their own heading, so none is read as a
 * rule. The commands cli.ts runs have to be the ones usage states, both ways.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { WARNINGS } from "./index";
import {
  codesOf,
  commands,
  compose,
  finding,
  markz,
  printHelp,
  printOne,
  printRules,
  readCommands,
  readRules,
} from "./rules";

const SYNTAX = "https://markz.amitkaps.com/docs/syntax.md#";

describe("markz's rules", () => {
  it("link every code from exactly one rule", () => {
    const serving = Object.keys(WARNINGS).map((code) => ({
      code,
      rules: markz.rules.filter((r) => r.links.includes(SYNTAX + code)).map((r) => r.id),
    }));
    expect(serving.filter((s) => s.rules.length !== 1)).toEqual([]);
  });

  it("link to Syntax only for a code", () => {
    const links = markz.rules.flatMap((r) => r.links).filter((l) => l.startsWith(SYNTAX));
    expect(links.filter((l) => !Object.hasOwn(WARNINGS, l.slice(SYNTAX.length)))).toEqual([]);
  });

  it("are ids in kebab case, apart from every code", () => {
    const ids = markz.rules.map((r) => r.id);
    expect(ids.filter((id) => !/^[a-z]+(-[a-z]+)*$/.test(id))).toEqual([]);
    expect(ids.filter((id) => Object.hasOwn(WARNINGS, id))).toEqual([]);
  });

  it("print each rule under its group, with the codes that check it", () => {
    const printed = printRules([markz]);
    expect(printed).toMatch(/^## Metadata\n\n- `metadata-block`: /);
    expect(printed).toContain(
      "\n  Checked by `star-emphasis`, `underscore-strong` and `single-tilde`.\n",
    );
  });
});

describe("readRules", () => {
  const url = "https://example.com/docs/usage.md";

  it("reads both forms, under the nearest heading", () => {
    const doc = [
      "# Usage",
      "",
      "## Writing",
      "",
      "- [`one-rule`]{#one-rule}: Say it once.",
      "- [**Plain words.**]{#plain-words} Write plainly.",
      "- [`not-first`]{#x} would be, but [`later`]{#later} isn't first.",
      "",
      "### Checking",
      "",
      "- Not a rule, [`inside`]{#inside}.",
      "- [`check`]{#check}: Run the check.",
      "",
    ].join("\n");
    expect(
      readRules(doc, url).map(({ id, label, text, group }) => ({ id, label, text, group })),
    ).toEqual([
      { id: "one-rule", label: "one-rule", text: "Say it once.", group: "Writing" },
      { id: "plain-words", label: "Plain words.", text: "Write plainly.", group: "Writing" },
      {
        id: "x",
        label: "not-first",
        text: "would be, but [`later`]{#later} isn't first.",
        group: "Writing",
      },
      { id: "check", label: "check", text: "Run the check.", group: "Checking" },
    ]);
  });

  it("resolves each link against the doc's address", () => {
    const [rule] = readRules(
      "- [`a`]{#a}: See [b](syntax.md#b), [_c_](#c) and [d](https://d.dev).\n",
      url,
    );
    expect(rule!.text).toBe(
      "See [b](https://example.com/docs/syntax.md#b), [_c_](https://example.com/docs/usage.md#c) and [d](https://d.dev/).",
    );
    expect(rule!.links).toEqual([
      "https://example.com/docs/syntax.md#b",
      "https://example.com/docs/usage.md#c",
      "https://d.dev/",
    ]);
    expect(rule!.url).toBe(`${url}#a`);
  });
});

describe("commands", () => {
  const url = "https://example.com/docs/usage.md";
  const doc = [
    "## Commands",
    "",
    "See [syntax](syntax.md).",
    "",
    "- [`tool go [dir]`]{#go}: goes.",
    "",
    "## For agents",
    "",
    "- [`a-rule`]{#a-rule}: Say it once.",
    "",
  ].join("\n");

  it("are read from under their heading, apart from the rules", () => {
    expect(readRules(doc, url, "for-agents").map((r) => r.id)).toEqual(["a-rule"]);
    expect(readCommands("tool", doc, url, "commands").commands.map((c) => c.id)).toEqual(["go"]);
    expect(() => readRules(doc, url, "nowhere")).toThrow("no heading `nowhere`");
  });

  it("print as help, or one's section with its links resolved", () => {
    const tool = readCommands("tool", doc, url, "commands");
    expect(printHelp(tool)).toBe(
      "Usage: tool <command>, and tool help <command> says more\n\n  tool go [dir]\n      goes.\n",
    );
    expect(printHelp(tool, "go")).toBe(
      "## Commands\n\nSee [syntax](https://example.com/docs/syntax.md).\n\n- [`tool go [dir]`]{#go}: goes.\n\nhttps://example.com/docs/usage.md#go\n",
    );
    expect(printHelp(tool, "stop")).toBeUndefined();
  });

  it("are the ones cli.ts runs", () => {
    const cli = readFileSync(new URL("cli.ts", import.meta.url), "utf8");
    const run = [...cli.matchAll(/case "([a-z]+)":/g)].map((m) => m[1]);
    expect(new Set(run)).toEqual(new Set(commands.commands.map((c) => c.id)));
  });
});

describe("composing", () => {
  const tool = {
    tool: "tool",
    rules: readRules(
      "## Own\n\n- [`own-rule`]{#own-rule}: Own ([`star-emphasis`](syntax.md#star-emphasis)).\n",
      "https://markz.amitkaps.com/docs/x.md",
    ),
    codes: [],
  };

  it("fails on an id two sets state", () => {
    const clash = { tool: "clash", rules: [], codes: [{ ...markz.codes[0]!, url: "x" }] };
    expect(() => compose(markz, clash)).toThrow(
      `clash states \`toml-metadata\`, which markz states too`,
    );
  });

  it("finds a rule or a code in any set, and the codes a rule links to across them", () => {
    const sets = compose(markz, tool);
    expect(codesOf(sets, tool.rules[0]!).map((c) => c.code)).toEqual(["star-emphasis"]);
    expect(printRules(sets)).toMatch(
      /^# markz\n\n## Metadata\n[^]*\n# tool\n\n## Own\n\n- `own-rule`: /,
    );
    expect(printOne(sets, "own-rule")).toContain("https://markz.amitkaps.com/docs/x.md#own-rule\n");
    expect(printOne(sets, "star-emphasis")).toMatch(
      /^star-emphasis \(warning\): `\*emphasis\*`; write `_emphasis_`\n  \S+#star-emphasis\n\n- `emphasis-underscore`: [^]*\n- `own-rule`: /,
    );
    expect(printOne(sets, "nothing")).toBeUndefined();
  });
});

describe("finding", () => {
  it("is one line, without the parts it wasn't given", () => {
    expect(
      finding({
        tool: "markz",
        level: "warning",
        file: "a.md",
        line: 3,
        column: 6,
        code: "star-emphasis",
        message: "m",
        instead: "i",
      }),
    ).toBe("markz: warning: a.md:3:6: star-emphasis: m; write i");
    expect(
      finding({
        tool: "craftz",
        level: "warning",
        file: "dir",
        code: "c",
        message: "m",
        held: "why",
      }),
    ).toBe("craftz: warning: dir: c: m; held: why");
    expect(finding({ tool: "markz", level: "error", message: "no command" })).toBe(
      "markz: error: no command",
    );
  });
});
