/** @prose
 * # Terminal
 *
 * Help and rules print as Markdown, which an agent, a pipe and a file read as it's written. In a
 * terminal, `write` renders the same Markdown with styles in place of its marks.
 *
 * A heading is bold without its `#`s, code is cyan without its backticks, and a list item is
 * indented without its `-`. Each block wraps to the terminal's width, with a hanging indent. It
 * styles only what you type or fill in, so the syntax and the text stay in the terminal's own
 * colour. It uses the colours a theme maps, so they read on a light background and a dark one.
 * `styleText` leaves colour out where `NO_COLOR` is set, `TERM` is `dumb` or the stream isn't a
 * terminal. Then `write` prints the Markdown as it is, since the marks are all that sets code
 * apart.
 *
 * # Usage
 *
 * A command's usage, like `tool go [--fast] [<dir>]`, has a grammar of its own. The words before
 * anything else are the command. A flag starts with `-`, a value you fill in is written `<…>`,
 * and a bare word after a flag is the literal it takes, like `static` in `[--site static]`.
 * `[ ]`, `( )`, `|`, `...` and quotes are its syntax. A bare word anywhere else would be read
 * wrong, so `usage` fails on it, as on a bracket or a quote left open.
 */
import { styleText } from "node:util";
import { type NodeId, parse } from "./index";

/** A style a terminal can show in any theme. */
export type Format = "bold" | "italic" | "cyan" | "yellow" | "magenta";

/** Writes `text` in `format`, or as it is where there's no colour. */
export type Style = (format: Format | Format[], text: string) => string;

/** One part of a usage, by what it is. Every part's text, joined, is the usage. */
export interface Part {
  kind: "command" | "flag" | "value" | "literal" | "syntax" | "space";
  text: string;
}

const STYLES: Record<Part["kind"], Format[]> = {
  command: ["bold", "cyan"],
  flag: ["yellow"],
  value: ["italic", "magenta"],
  literal: ["yellow"],
  syntax: [],
  space: [],
};

const OPENS: Record<string, string> = { "]": "[", ")": "(" };

/** A command's usage, in parts. Throws on a usage it can't read for sure. */
export function usage(label: string): Part[] {
  const fail = (why: string): never => {
    throw new Error(`\`${label}\`: ${why}`);
  };
  const parts: Part[] = [];
  const open: string[] = [];
  const add = (kind: Part["kind"], text: string): void => {
    parts.push({ kind, text });
  };
  const closing = (char: string, from: number): number => {
    const end = label.indexOf(char, from);
    return end < 0 ? fail(`a \`${label[from - 1]}\` that never closes`) : end;
  };
  let command = true;
  let i = 0;
  while (i < label.length) {
    const char = label[i]!;
    if (char === " ") {
      let j = i;
      while (label[j] === " ") j++;
      add("space", label.slice(i, j));
      i = j;
      continue;
    }
    if (label.startsWith("...", i)) {
      add("syntax", "...");
      i += 3;
    } else if (char === "[" || char === "(") {
      open.push(char);
      add("syntax", char);
      i++;
    } else if (char === "]" || char === ")") {
      const top = open.pop();
      if (top !== OPENS[char]) {
        fail(
          top ? `a \`${char}\` that closes a \`${top}\`` : `a \`${char}\` with nothing to close`,
        );
      }
      add("syntax", char);
      i++;
    } else if (char === "|") {
      add("syntax", char);
      i++;
    } else if (char === "<") {
      const end = closing(">", i + 1);
      add("value", label.slice(i, end + 1));
      i = end + 1;
    } else if (char === '"') {
      const end = closing('"', i + 1);
      const inner = label.slice(i + 1, end);
      add("syntax", '"');
      add(inner.startsWith("<") && inner.endsWith(">") ? "value" : "literal", inner);
      add("syntax", '"');
      i = end + 1;
    } else {
      let j = i;
      while (j < label.length && !' []()|<"'.includes(label[j]!)) j++;
      const word = label.slice(i, j);
      const before = parts.findLast((p) => p.kind !== "space")?.kind;
      if (word.startsWith("-")) add("flag", word);
      else if (command) add("command", word);
      else if (before === "flag") add("literal", word);
      else fail(`\`${word}\` isn't a flag's value; write \`<${word}>\` for a value`);
      i = j;
    }
    // The command is the words before anything else.
    command &&= parts.at(-1)!.kind === "command";
  }
  if (open.length) fail(`a \`${open.at(-1)}\` that never closes`);
  return parts;
}

/** How to render: the width to wrap at, how to style, and the usages to read as usages. */
export interface Options {
  columns: number;
  style: Style;
  usages?: readonly string[];
}

// A stretch of text in one format.
interface Run {
  text: string;
  format: Format[];
}

/** Markdown for a terminal, with styles in place of its marks, wrapped to `columns`. */
export function terminal(markdown: string, { columns, style, usages = [] }: Options): string {
  const doc = parse(markdown);
  const source = (node: NodeId): string => markdown.slice(doc.start(node), doc.end(node));

  const inline = (node: NodeId, format: Format[] = []): Run[] =>
    [...doc.children(node)].flatMap((child): Run[] => {
      switch (doc.type(child)) {
        case "text":
          return [{ text: doc.data(child, "text").value, format }];
        case "inlineCode": {
          const { value } = doc.data(child, "inlineCode");
          if (!usages.includes(value)) return [{ text: value, format: [...format, "cyan"] }];
          return usage(value).map((p) => ({
            text: p.text,
            format: [...format, ...STYLES[p.kind]],
          }));
        }
        case "strong":
          return inline(child, [...format, "bold"]);
        case "emphasis":
          return inline(child, [...format, "italic"]);
        case "link": {
          const { destination, autolink } = doc.data(child, "link");
          const text = inline(child, format);
          return autolink ? text : [...text, { text: ` (${destination})`, format }];
        }
        case "element":
          return inline(child, format);
        case "break":
          return [{ text: "\n", format }];
        default:
          return [{ text: source(child), format }];
      }
    });

  // Words joined by spaces, wrapped at `columns`, the first line after `first` and the rest after
  // `rest`. A word is its runs, each styled on its own, so a line never breaks inside a style.
  const wrap = (runs: Run[], first: string, rest: string): string => {
    const words: Run[][] = [[]];
    for (const run of runs) {
      for (const piece of run.text.split(/( |\n)/)) {
        if (piece === " ") words.push([]);
        else if (piece === "\n") words.push([{ text: "\n", format: [] }], []);
        else if (piece) words.at(-1)!.push({ text: piece, format: run.format });
      }
    }
    const lines: string[] = [];
    let line = first;
    let width = first.length;
    let empty = true;
    for (const word of words.filter((w) => w.length)) {
      if (word[0]!.text === "\n") {
        lines.push(line);
        [line, width, empty] = [rest, rest.length, true];
        continue;
      }
      const length = word.reduce((n, r) => n + r.text.length, 0);
      if (!empty && width + 1 + length > columns) {
        lines.push(line);
        [line, width, empty] = [rest, rest.length, true];
      }
      if (!empty) [line, width] = [`${line} `, width + 1];
      line += word.map((r) => (r.format.length ? style(r.format, r.text) : r.text)).join("");
      width += length;
      empty = false;
    }
    return [...lines, line].join("\n");
  };

  const block = (node: NodeId, first: string, rest: string): string => {
    switch (doc.type(node)) {
      case "heading":
        return wrap(inline(node, ["bold"]), first, rest);
      case "paragraph":
        return wrap(inline(node), first, rest);
      case "list": {
        const between = doc.data(node, "list").tight ? "\n" : "\n\n";
        return [...doc.children(node)]
          .map((item) =>
            [...doc.children(item)]
              .map((child, i) => block(child, i === 0 ? `${rest}  ` : `${rest}    `, `${rest}    `))
              .join("\n\n"),
          )
          .join(between);
      }
      case "code":
        return doc
          .data(node, "code")
          .value.replace(/\n$/, "")
          .split("\n")
          .map((line) => `${rest}  ${line && style("cyan", line)}`)
          .join("\n");
      default:
        return `${first}${source(node)}`;
    }
  };

  const blocks = [...doc.children(doc.root)].map((node) => block(node, "", ""));
  return `${blocks.join("\n\n")}\n`;
}

/** Writes Markdown to `stream`, rendered for a terminal where it shows colour, or as it is. */
export function write(
  markdown: string,
  usages: readonly string[] = [],
  stream: NodeJS.WriteStream = process.stdout,
): void {
  const style: Style = (format, text) => styleText(format, text, { stream });
  const colour = style("bold", "x") !== "x";
  stream.write(
    colour ? terminal(markdown, { columns: stream.columns || 80, style, usages }) : markdown,
  );
}
