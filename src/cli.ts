#!/usr/bin/env node
/** @prose
 * # `markz`
 *
 * The command, for Node: `markz check <files>` prints every warning and fails on one,
 * `markz html [file]` writes a document's HTML, `markz rules [id]` prints the rules, and
 * `markz help [command]` prints the commands. Each is stated once, in
 * [usage](../docs/usage.md#on-the-command-line), which `help` prints from, and a test holds each
 * command below to it. Each finding is one line, which
 * [rules.ts](rules.ts) formats for every tool.
 *
 * `html` is a build, so it prints its warnings on stderr and carries on, while `check` fails on
 * them. A file that can't be read is an error, which fails both.
 */
import { readFileSync } from "node:fs";
import { html, parse, position } from "./index";
import { commands, finding, markz, printHelp, printOne, printRules } from "./rules";

const say = (line: string) => process.stderr.write(`${line}\n`);

// The document's warnings as findings, on stderr. True when there was one.
function warn(file: string, source: string): boolean {
  const doc = parse(source);
  const at = position(source);
  for (const w of doc.warnings) {
    const { line, column } = at(w.start);
    say(finding({ tool: "markz", level: "warning", file, line, column: column + 1, ...w }));
  }
  return doc.warnings.length > 0;
}

// The file's text, or an error that fails the command.
function read(file: string): string | undefined {
  try {
    return readFileSync(file === "-" ? 0 : file, "utf8");
  } catch (error) {
    say(finding({ tool: "markz", level: "error", file, message: (error as Error).message }));
    process.exitCode = 1;
    return undefined;
  }
}

const [command, ...args] = process.argv.slice(2);
switch (command) {
  case "check":
    for (const file of args) {
      const source = read(file);
      if (source !== undefined && warn(file, source)) process.exitCode = 1;
    }
    break;
  case "html": {
    const file = args[0] ?? "-";
    const source = read(file);
    if (source !== undefined) {
      warn(file === "-" ? "<stdin>" : file, source);
      process.stdout.write(html(source));
    }
    break;
  }
  case "rules": {
    const printed = args[0] ? printOne([markz], args[0]) : printRules([markz]);
    if (printed) process.stdout.write(printed);
    else {
      say(finding({ tool: "markz", level: "error", message: `markz states no \`${args[0]}\`` }));
      process.exitCode = 1;
    }
    break;
  }
  case "help": {
    const printed = printHelp(commands, args[0]);
    if (printed) process.stdout.write(printed);
    else {
      say(finding({ tool: "markz", level: "error", message: `no command \`${args[0]}\`` }));
      process.exitCode = 1;
    }
    break;
  }
  default:
    say(
      finding({
        tool: "markz",
        level: "error",
        message: command ? `no command \`${command}\`` : "no command",
        instead: "a command `markz help` lists",
      }),
    );
    process.exitCode = 1;
}
