/** @prose
 * # Element names
 *
 * An element's `@name` is the element it writes ([Design](../docs/design.md#element-names)): an HTML
 * element on the allowlist for its kind, or a custom element. The lists leave out what Markdown
 * already writes (`em`, `a`, `pre`, …) and `span`, which `[text]{.x}` writes, so each element has
 * one way in, and anything active
 * (`script`, `iframe`, form controls, media), so a name can never run code. Inline and block are
 * separate, so a block element never lands inside a paragraph.
 *
 * A custom-element name is lowercase ASCII letters, digits and `-`, starts with a letter and has a
 * `-`, less the few names HTML reserves. It fits either kind.
 */
export const INLINE: ReadonlySet<string> = new Set(
  "abbr b i u s small cite q dfn time data var samp kbd mark sub sup ins bdi bdo ruby rt rp".split(
    " ",
  ),
);
export const BLOCK: ReadonlySet<string> = new Set(
  "div section article aside header footer nav main address hgroup search details summary figure figcaption dl dt dd".split(
    " ",
  ),
);
const RESERVED = new Set(
  "annotation-xml color-profile font-face font-face-src font-face-uri font-face-format font-face-name missing-glyph".split(
    " ",
  ),
);

export function custom(name: string): boolean {
  return /^[a-z][a-z\d]*-[a-z\d-]*$/.test(name) && !RESERVED.has(name);
}

/** Whether `name` is an element of this kind: inline for a span, block for a leaf or container. */
export function element(name: string, inline: boolean): boolean {
  return (inline ? INLINE : BLOCK).has(name) || custom(name);
}

/** @prose
 * What a name that isn't an element should be instead, in the writer's own words: a class of
 * that name, or a custom element made from it. A name a hyphen would fix gets `my-` in front, so
 * `{@note}` suggests `{@div .note}` or `{@my-note}`. The suggestion is the warning's `instead`.
 */
export function insteadOf(name: string, inline: boolean): string {
  const word = name.toLowerCase();
  const tag = custom(word) ? word : `my-${word}`;
  return inline
    ? `a span with a class (\`[text]{.${name}}\`), or a custom element (\`[text]{@${tag}}\`)`
    : `a \`div\` with a class (\`{@div .${name}}\`), or a custom element (\`{@${tag}}\`)`;
}
