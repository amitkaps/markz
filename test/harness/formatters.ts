/** @prose
 * # Formatters
 *
 * The Markdown formatters `syntax.md` makes its claims about, run on documents. They are oxfmt,
 * with this repository's settings, and Prettier, set to the same `proseWrap: "never"` that craftz
 * sets (syntax: Formatters).
 *
 * Each formatter takes every document at once and gives them back by name, since oxfmt runs as
 * one process for all of them. Prettier runs in this one.
 */
import * as prettier from "prettier";
import { format } from "./corpus";

/** Documents by file name, each ending in `.md`, to the same documents formatted. */
export type Formatter = (docs: Map<string, string>) => Promise<Map<string, string>>;

export const formatters: Record<string, Formatter> = {
  oxfmt: async (docs) => format(docs),
  prettier: async (docs) =>
    new Map(
      await Promise.all(
        [...docs].map(
          async ([name, text]) =>
            [
              name,
              await prettier.format(text, { parser: "markdown", proseWrap: "never" }),
            ] as const,
        ),
      ),
    ),
};
