/** @prose
 * # Adversarial input
 *
 * Patterns that make a careless parser quadratic, one per way it can go wrong: an opener that
 * never closes and so scans to the end each time (`${`, `<!--`, `:span[`, `` ` ``), a structure
 * nested deeper on every line (`>`, list items, `:::`), and a repeat whose bookkeeping grows with
 * the count (heading ids, attribute lines). Each takes a count and returns input that grows in
 * proportion to it, so the test can hold the time to the same proportion. Every pattern here once
 * failed, or guards a scan that would.
 */
export const PATTERNS: Record<string, (n: number) => string> = {
  // Openers that never close.
  "unclosed ${": (n) => "${a ".repeat(n),
  "unclosed ${ in a link": (n) => "[a](${b ".repeat(n),
  "unclosed ${ in an attribute": (n) => ":span[a]{x=${ ".repeat(n),
  "unclosed string in ${": (n) => "${\\'".repeat(n),
  "unclosed comment in ${": (n) => "${/*".repeat(n),
  "unclosed template in ${": (n) => "${`".repeat(n),
  "unclosed code": (n) => "`a ".repeat(n),
  "unclosed code runs": (n) => "a`` `".repeat(n),
  "unclosed math": (n) => "$a ".repeat(n),
  "dollar runs": (n) =>
    Array.from({ length: n }, (_, i) => "$".repeat((i % 50) + 1) + "a").join(""),
  "code runs": (n) => Array.from({ length: n }, (_, i) => "`".repeat((i % 50) + 1) + "a").join(""),
  "unclosed link": (n) => "[a ".repeat(n),
  "unclosed destination": (n) => "[a](b ".repeat(n),
  "unclosed angle destination": (n) => "[a](<b ".repeat(n),
  "unclosed image": (n) => "![a ".repeat(n),
  "unclosed inline comment": (n) => "a <!-- ".repeat(n),
  "unclosed processing instruction": (n) => "<? ".repeat(n),
  "unclosed declaration": (n) => "<!a ".repeat(n),
  "unclosed CDATA": (n) => "<![CDATA[ ".repeat(n),
  "unclosed tag": (n) => "<a b ".repeat(n),
  "unclosed autolink": (n) => "<http://a ".repeat(n),
  "unclosed label": (n) => ":span[a ".repeat(n),
  "nested labels": (n) => ":span[".repeat(n),
  "unclosed attributes": (n) => ":span[a]{.b ".repeat(n),
  "unclosed attribute lines": (n) => "- {.a\n".repeat(n) + "}",
  "unclosed block comment": (n) => "<!--\n" + "a\n".repeat(n),
  "unclosed fence": (n) => "```\n" + "a\n".repeat(n),
  // Emphasis and links.
  "emphasis openers": (n) => "_a **b ".repeat(n),
  "strikethrough openers": (n) => "~~a ".repeat(n),
  "nested emphasis": (n) => "_a ".repeat(n) + "_".repeat(n),
  "quotes among markers": (n) => "a_\"'~~*".repeat(n) + "_".repeat(n) + '"'.repeat(n),
  "nested brackets": (n) => "[".repeat(n) + "a" + "]".repeat(n),
  "links in links": (n) => "[a ".repeat(n) + "](".repeat(n),
  "bare URLs": (n) => "www.a ".repeat(n),
  // Depth.
  "nested blockquotes": (n) => ">".repeat(n) + " a\n",
  "nested list items": (n) => "- ".repeat(n) + "a\n",
  "blank lines in nested items": (n) => "- ".repeat(n) + "a\n" + "\n".repeat(n),
  "continuation of nested items": (n) => "- ".repeat(n) + "a\n" + " ".repeat(2 * n) + "b\n",
  "blank quote lines around items": (n) => "> " + "- ".repeat(n) + "a\n" + ">\n".repeat(n),
  "unclosed containers": (n) => ":::div\n".repeat(n),
  "unclosed containers with blank lines": (n) => ":::div\n\n".repeat(n),
  "closing inner containers": (n) => "::::::::::div\n".repeat(n) + ":::div\n:::\n".repeat(n),
  // Repeats.
  headings: (n) => "# a\n".repeat(n),
  "attribute lines": (n) => "{.a}\n".repeat(n),
  "orphan attribute lines": (n) => "{.a\n\n".repeat(n),
  "table rows": (n) => "| a | b |\n| - | - |\n" + "| c | d |\n".repeat(n),
  "wide table": (n) => "|" + " a |".repeat(n) + "\n|" + " - |".repeat(n) + "\n",
  "reference definitions": (n) => "[a]: b\n".repeat(n),
  "metadata lines": (n) => "---\n" + "a: [b\n".repeat(n),
  "CRLF lines": (n) => "a\r\n".repeat(n),
  "CR lines": (n) => "a\r".repeat(n),
};
