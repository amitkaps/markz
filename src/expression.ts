/** @prose
 * # Expressions
 *
 * Where a `${…}` ends. markz never evaluates or validates the JavaScript inside; it only finds the
 * `}` that matches the opening brace, skipping strings, template literals (with their own nested
 * `${}`) and comments, so a brace inside any of them doesn't count (grammar: `brace-depth`).
 * Regex literals aren't recognised, which is the documented limit. The same scanner serves inline
 * expressions, link destinations and attribute values.
 */

/** @prose
 * ## Remembering a scan
 *
 * A scan that fails costs the rest of the range, so a paragraph of unclosed `${` would be
 * quadratic if each one scanned again. It needn't be: a later `${` that the scan read as code
 * starts in the state the scan was in there, so it closes exactly where the scan's depth first
 * fell back below that brace, and fails if it never did. Every scan records, for each `{` it
 * counted, where that brace closed or that it didn't. Two failures carry over the same way: with
 * no end of a block comment before the range's end, no later comment closes, and a string that ran to its line's end
 * without a closing quote swallowed every later quote of its kind before that as an escape, so a
 * string opened at one of them reads the same pairs and fails too. The caller keeps the record,
 * one per text and range, for as long as those hold. A `${` the scan saw inside a string or
 * comment, or never reached, scans afresh.
 */
export interface Memo {
  /** Where each counted `{` closed, just past its `}`, or -1. */
  closes: Map<number, number>;
  /** Where a block comment that never ends opened. */
  comment: number;
  /** By quote character, the last string that didn't close: its quote and where it failed. */
  strings: Map<number, [from: number, to: number]>;
}

export const memo = (): Memo => ({ closes: new Map(), comment: Infinity, strings: new Map() });

/**
 * `source[at]` is the `$` of a `${`. Returns the offset just past the matching `}`, or -1 when it
 * doesn't close before `end`. `record` is what earlier scans of the same text and `end` found.
 */
export function scanExpression(
  source: string,
  at: number,
  end: number,
  record: Memo = memo(),
): number {
  const known = record.closes.get(at + 1);
  if (known !== undefined) return known;
  // Where each `{` still open was, innermost last.
  const braces = [at + 1];
  const result = scan(source, at + 2, end, braces, record);
  for (const b of braces) record.closes.set(b, -1);
  return result;
}

function scan(source: string, from: number, end: number, braces: number[], record: Memo): number {
  // One entry per open context: a brace depth for code, TEMPLATE inside a template literal.
  const stack = [1];
  let i = from;
  while (i < end) {
    const c = source.charCodeAt(i);
    const top = stack.length - 1;
    if (stack[top] === TEMPLATE) {
      if (c === BACKSLASH) i += 2;
      else if (c === BACKTICK) {
        stack.pop();
        i++;
      } else if (c === DOLLAR && source.charCodeAt(i + 1) === OPEN) {
        stack.push(1);
        braces.push(i + 1);
        i += 2;
      } else i++;
    } else if (c === QUOTE || c === APOSTROPHE) {
      i = skipString(source, i, end, record);
      if (i < 0) return -1;
    } else if (c === BACKTICK) {
      stack.push(TEMPLATE);
      i++;
    } else if (c === SLASH && source.charCodeAt(i + 1) === SLASH) {
      i = lineEnd(source, i, end);
    } else if (c === SLASH && source.charCodeAt(i + 1) === STAR) {
      if (i >= record.comment) return -1;
      const close = source.indexOf("*/", i + 2);
      if (close < 0 || close + 2 > end) {
        record.comment = i;
        return -1;
      }
      i = close + 2;
    } else if (c === OPEN) {
      stack[top]!++;
      braces.push(i);
      i++;
    } else if (c === CLOSE) {
      i++;
      record.closes.set(braces.pop()!, i);
      if (--stack[top]! === 0) {
        stack.pop();
        if (stack.length === 0) return i;
      }
    } else i++;
  }
  return -1;
}

/** @prose
 * ## A `}` that closed too early
 *
 * The usual reason a `${…}` closes early is a `}` that markz can't see is inside something, such
 * as a regex (`${s.replace(/}/g, '')}`). The code then ends with a `(` or `[` still open, which
 * finished code never does. So a closed expression whose code leaves one open is reported
 * (grammar: `expression-bracket`). Strings, template literals and comments are skipped, as
 * the scan skips them, so a bracket inside one doesn't count. This runs once, on the code of a
 * closed expression, so it adds a constant per character.
 */
export function unclosedBracket(code: string): boolean {
  let depth = 0;
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    if (c === QUOTE || c === APOSTROPHE || c === BACKTICK) {
      // Skip to the matching quote. A template literal's own `${…}` is skipped with it.
      for (i++; i < code.length && code.charCodeAt(i) !== c; i++) {
        if (code.charCodeAt(i) === BACKSLASH) i++;
      }
    } else if (c === SLASH && code.charCodeAt(i + 1) === SLASH) {
      i = lineEnd(code, i, code.length);
    } else if (c === SLASH && code.charCodeAt(i + 1) === STAR) {
      const close = code.indexOf("*/", i + 2);
      i = close < 0 ? code.length : close + 1;
    } else if (c === PAREN || c === BRACKET) depth++;
    else if ((c === PAREN_CLOSE || c === BRACKET_CLOSE) && depth > 0) depth--;
  }
  return depth > 0;
}

function skipString(source: string, at: number, end: number, record: Memo): number {
  const quote = source.charCodeAt(at);
  const failed = record.strings.get(quote);
  if (failed && at > failed[0] && at < failed[1]) return -1;
  let i = at + 1;
  for (; i < end; i++) {
    const c = source.charCodeAt(i);
    if (c === BACKSLASH) i++;
    else if (c === quote) return i + 1;
    else if (c === NEWLINE || c === RETURN) break;
  }
  record.strings.set(quote, [at, i]);
  return -1;
}

function lineEnd(source: string, at: number, end: number): number {
  let i = at;
  while (i < end && source.charCodeAt(i) !== NEWLINE && source.charCodeAt(i) !== RETURN) i++;
  return i;
}

const TEMPLATE = -1;
const NEWLINE = 10;
const RETURN = 13;
const QUOTE = 34;
const DOLLAR = 36;
const APOSTROPHE = 39;
const PAREN = 40;
const PAREN_CLOSE = 41;
const STAR = 42;
const SLASH = 47;
const BRACKET = 91;
const BACKSLASH = 92;
const BRACKET_CLOSE = 93;
const BACKTICK = 96;
const OPEN = 123;
const CLOSE = 125;
