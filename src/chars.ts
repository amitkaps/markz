/** @prose
 * # Characters
 *
 * The character classes both passes share, and backslash-escape decoding for the plain-text
 * values the block pass stores itself (a fence's info string, an attribute value). Text inside paragraphs is the inline pass's job.
 */

export const isSpace = (c: number): boolean => c === 32 || c === 9;

/** `\` before ASCII punctuation drops; every other backslash stays. */
export function unescape(text: string): string {
  return text.includes("\\") ? text.replace(/\\([!-/:-@[-`{-~])/g, "$1") : text;
}

/** A named character reference, which markz keeps as written and reports (syntax.md). */
export const NAMED = /&[A-Za-z][A-Za-z\d]{1,31};/g;
