/** @prose
 * # Other parsers
 *
 * What `pnpm bench --compare` times markz beside, for our own insight and never published:
 * markdown-exit, the fastest JavaScript parser; marked, a regex lexer; and micromark with GFM,
 * the spec-exact state machine that is also the tests' oracle. Each gives its parse to HTML, set
 * up with GFM where it has it, and each is imported only when it's loaded, so a process that times
 * one parser never pays for another's startup. They read the common variant of each document
 * (`corpus.ts`), the blocks every parser reads alike, so none is slower only because it does more.
 */

export const OTHERS = ["markdown-exit", "marked", "micromark"];

export async function load(name: string): Promise<(text: string) => string> {
  switch (name) {
    case "markz": {
      const { parse, html } = await import("../../src/index");
      return (s) => html(parse(s));
    }
    case "markdown-exit": {
      const md = new (await import("markdown-exit")).MarkdownExit();
      return (s) => md.render(s);
    }
    case "marked": {
      const { Marked } = await import("marked");
      const marked = new Marked({ gfm: true, async: false });
      return (s) => marked.parse(s) as string;
    }
    case "micromark": {
      const { micromark } = await import("micromark");
      const { gfm, gfmHtml } = await import("micromark-extension-gfm");
      const options = { extensions: [gfm()], htmlExtensions: [gfmHtml()] };
      return (s) => micromark(s, options);
    }
  }
  throw new Error(`unknown parser ${name}`);
}
