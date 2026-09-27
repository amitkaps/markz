# Metadata

A closed block of `key:` lines is metadata, which `html()` doesn't write. Anything else is read as ordinary Markdown.

```example 1
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

```example 2 ambiguous metadata-start
---

## foo

---
.

```

```example 3
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

```example 4 unclosed
---
title: x
.
<hr />
<p>title: x</p>
.
---
```

```example 5
---
flag: True
---
.

.
flag: True
```

```example 6
---
author:
  name: A
---
.

.
  name: A
```
