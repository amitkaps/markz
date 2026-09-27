# Metadata

Examples of markz's dialect, in the CommonMark spec's format (see `../examples.ts`). Each `##` is a construct id from `test/grammar.ts`, set by the `{#id}` line above its heading in `prose/syntax.md`, and the tests fail if one isn't.

## metadata

A closed block of `key:` lines is metadata, which `html()` doesn't write. Anything else is read as ordinary Markdown.

```example
---
title: Sales Report
summary: 'Make it yours: fast.'
order: 2
tags: [svelte, vite]
---
# Report
.
<h1 id="report">Report</h1>
```

A closed block at the start is metadata whatever it holds, so a page can't open with a rule.
Lines it can't read are reported, but a `#` line is a YAML comment.

```example
---

## foo

---
.

```

```example
---
hello
title: x
---
# Doc
.
<h1 id="doc">Doc</h1>
.
hello
```

Without a closing line, the first is a rule, reported when the block looks like metadata.

```example
---
title: x
.
<hr />
<p>title: x</p>
.
---
```

```example
---
flag: True
---
.

.
flag: True
```

```example
---
author:
  name: A
---
.

.
  name: A
```
