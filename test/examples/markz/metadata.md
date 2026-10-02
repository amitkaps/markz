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

`__proto__` is not a key: it would set the metadata object's prototype rather than add an entry.
The line is reported and the rest of the block is still read.

```example 157
---
__proto__: x
title: Report
---
.

.
__proto__: x
```

A `.` in a key nests: keys that start the same share an object, and `html()` still writes nothing.

```example 158
---
title: My Site
deploy.provider: cloudflare
deploy.name: my-site
---
# Hi
.
<h1 id="hi">Hi</h1>
```

A path is a value or an object, never both. The first one wins and the clashing line is reported.

```example 159
---
a: 1
a.b: 2
---
.

.
a.b: 2
```

```example 160
---
a.b.c: 1
a.b: 2
---
.

.
a.b: 2
```

A path that isn't a run of keys joined by `.` isn't a key line, so it is reported and skipped.

```example 161
---
a..b: 1
---
.

.
a..b: 1
```
