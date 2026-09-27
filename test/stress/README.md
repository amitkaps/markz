# stress

Upstream examples that curation keeps off the Conformance page: sweeps of a character class and
variants of a form markz cuts or doesn't read, written by
[`scripts/vendor.ts`](../../scripts/vendor.ts) next to the curated file in `../spec/`, from the
same pinned commit. They aren't filed or given a status. [`stress.test.ts`](../stress.test.ts)
only holds markz to what must hold for any input: it finishes quickly, doesn't throw, builds a
valid tree, and, for URLs, warns wherever GFM links.

- `gfm-autolink-literal.json`: the fixtures that sweep `http://` and `www.` before each ASCII
  punctuation character, each character before a URL, and character references in a domain or
  path (14). Their sweep found a hang, `www._`.
- `yaml.json`: yaml-test-suite tests beyond the first example of each YAML feature (130).
