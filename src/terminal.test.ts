/** @prose
 * # Terminal tests
 *
 * What a person sees in a terminal is the Markdown an agent reads, with styles in place of its
 * marks. So the plain rendering, with no styles, is held word for word, and the styled one is held
 * to it with its colours taken out.
 */
import { stripVTControlCharacters, styleText } from "node:util";
import { describe, expect, it } from "vite-plus/test";
import { type Style, terminal, usage } from "./terminal";

const plain: Style = (_format, text) => text;
const tags: Style = (format, text) => `<${[format].flat().join("+")}>${text}</>`;
const ansi: Style = (format, text) => styleText(format, text, { validateStream: false });

describe("a usage", () => {
  it("parts into the command, flags, values, literals and syntax", () => {
    const parts = usage('tool go (<a> | --b "<c>") [--d e] [<f> ...]').filter(
      (p) => p.kind !== "space",
    );
    expect(parts.map((p) => `${p.kind}:${p.text}`)).toEqual([
      "command:tool",
      "command:go",
      "syntax:(",
      "value:<a>",
      "syntax:|",
      "flag:--b",
      'syntax:"',
      "value:<c>",
      'syntax:"',
      "syntax:)",
      "syntax:[",
      "flag:--d",
      "literal:e",
      "syntax:]",
      "syntax:[",
      "value:<f>",
      "syntax:...",
      "syntax:]",
    ]);
    expect(
      usage("tool go")
        .map((p) => p.text)
        .join(""),
    ).toBe("tool go");
  });

  it("fails on what it can't be sure of", () => {
    expect(() => usage("tool [dir]")).toThrow("`dir` isn't a flag's value; write `<dir>`");
    expect(() => usage("tool <dir")).toThrow("a `<` that never closes");
    expect(() => usage('tool --a "<b>')).toThrow('a `"` that never closes');
    expect(() => usage("tool [--a")).toThrow("a `[` that never closes");
    expect(() => usage("tool (--a]")).toThrow("a `]` that closes a `(`");
  });
});

describe("the terminal", () => {
  const md = [
    "## Pull requests",
    "",
    "- `tool go [--fast] [<dir>]`: goes to the folder, and comes back again when it's done there.",
    "",
    "```sh",
    "pnpm tool go   # go",
    "```",
    "",
    "Run `go` with **care**.",
    "",
  ].join("\n");
  const usages = ["tool go [--fast] [<dir>]"];

  it("drops the marks, and wraps with a hanging indent", () => {
    expect(terminal(md, { columns: 40, style: plain, usages })).toBe(
      [
        "Pull requests",
        "",
        "  tool go [--fast] [<dir>]: goes to the",
        "    folder, and comes back again when",
        "    it's done there.",
        "",
        "  pnpm tool go   # go",
        "",
        "Run go with care.",
        "",
      ].join("\n"),
    );
  });

  it("styles what you type or fill in, and leaves the syntax and text plain", () => {
    const out = terminal(md, { columns: 200, style: tags, usages });
    expect(out).toContain("<bold>Pull</> <bold>requests</>");
    expect(out).toContain(
      "<bold+cyan>tool</> <bold+cyan>go</> [<yellow>--fast</>] [<italic+magenta><dir></>]: goes",
    );
    expect(out).toContain("  <cyan>pnpm tool go   # go</>");
    expect(out).toContain("Run <cyan>go</> with <bold>care</>.");
  });

  it("reads the same with its colours taken out", () => {
    for (const columns of [30, 80]) {
      const styled = terminal(md, { columns, style: ansi, usages });
      expect(styled).not.toBe(terminal(md, { columns, style: plain, usages }));
      expect(stripVTControlCharacters(styled)).toBe(
        terminal(md, { columns, style: plain, usages }),
      );
    }
  });
});
