---
source: frontmatter
url: https://github.com/micromark/micromark-extension-frontmatter/tree/f05bf24461d31041f37f4562fd48877af4dcc67b/test
commit: f05bf24461d31041f37f4562fd48877af4dcc67b
checks: oracle
---

# micromark-extension-frontmatter

## frontmatter › should not support a single yaml fence (thematic break)

```example 1
---
.
<hr />
```

## frontmatter › should support empty yaml

```example 2
---
---
```

## frontmatter › should support yaml w/ content

```example 3
---
a

b
---
```

## frontmatter › should support content after yaml

```example 4
---
a

b
---
# Heading
***
    code
.
<h1>Heading</h1>
<hr />
<pre><code>code
</code></pre>
```

## frontmatter › should not support a prefix (indent) before a yaml opening fence

```example 5
 ---
---
.
<hr />
<hr />
```

## frontmatter › should not support a prefix (indent) before a yaml closing fence

```example 6
---
 ---
.
<hr />
<hr />
```

## frontmatter › should parse an arbitrary suffix after the opening and closing fence of yaml

```example 7
---␣␣
---→␣
```

## frontmatter › should not support other characters after the suffix on the opening fence of yaml

```example 8
--- --
---
.
<hr />
<hr />
```

## frontmatter › should not support other characters after the suffix on the closing fence of yaml

```example 9
---
--- x
.
<hr />
<p>--- x</p>
```

## frontmatter › should not support an opening yaml fence of more than 3 characters

```example 10
----
---
.
<hr />
<hr />
```

## frontmatter › should not support a closing yaml fence of more than 3 characters

```example 11
---
----
.
<hr />
<hr />
```

## frontmatter › should not support an opening yaml fence of less than 3 characters

```example 12
--
---
.
<h2>--</h2>
```

## frontmatter › should not support a closing yaml fence of less than 3 characters

```example 13
---
--
.
<hr />
<p>--</p>
```

## frontmatter › should support content in yaml

```example 14
---
a
b
---
```

## frontmatter › should not support yaml frontmatter in the middle

```example 15
# Hello
---
a

b
---
+++
.
<h1>Hello</h1>
<hr />
<p>a</p>
<h2>b</h2>
<p>+++</p>
```

## frontmatter › should not support frontmatter w/o closing

```example 16
---
asd
.
<hr />
<p>asd</p>
```

## frontmatter › should not support frontmatter in a container (list)

```example 17
* ---
  asd
  ---
.
<ul>
<li>
<hr />
<h2>asd</h2>
</li>
</ul>
```

## frontmatter › should not support frontmatter in a container (block quote)

```example 18
> ---
  asd
  ---
.
<blockquote>
<hr />
</blockquote>
<h2>asd</h2>
```
