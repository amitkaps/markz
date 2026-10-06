# stress

Upstream examples that curation keeps off the Conformance page: sweeps of a character class and
variants of a form markz cuts or doesn't read, written by
[`test/vendor.ts`](../../../vendor.ts) next to the curated file in `../`, from the
same pinned commit. They aren't filed or given a status. [`stress.test.ts`](../../../stress.test.ts)
only holds markz to what must hold for any input: it finishes quickly, doesn't throw, builds a
valid tree, and warns over every bare URL GFM links and every footnote it reads.

- `directive.md`: micromark-extension-directive tests that repeat a rule already kept: the
  shared name, label and attribute rules again for leaf and container directives, variants that
  differ in one character, the `content` group's repeats of attribute syntax, and a directive
  next to a block form markz cuts (95).
- `gfm-autolink-literal.md`: the fixtures that sweep `http://` and `www.` before each ASCII
  punctuation character, each character before a URL, and character references in a domain or
  path (14). Their sweep found a hang, `www._`.
- `gfm-footnote.md`: fixtures on what a footnote holds (blank lines, prefixes, nesting,
  continuation, constructs inside) (29).
- `yaml.md`: yaml-test-suite tests beyond the first example of each YAML feature (130).
