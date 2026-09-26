# Not supported

Each form `prose/syntax.md` cuts, under the start of its row. The text stays, and each listed warning's `instead` is the row's "Write instead" cell.

## Raw HTML blocks and inline tags

```example
<div>
hi
</div>
.
<p>&lt;div&gt;
hi
&lt;/div&gt;</p>
.
<div>
</div>
```

```example
a <b>c</b> and <!-- x -->
.
<p>a &lt;b&gt;c&lt;/b&gt; and &lt;!-- x --&gt;</p>
.
<b>
</b>
<!-- x -->
```

```example
</about>
.
<p>&lt;/about&gt;</p>
.
</about>
```

## Setext headings

```example
Title
===
.
<p>Title
===</p>
.
===
```

```example
Title
---
.
<p>Title
—</p>
.
---
```

## Indented code blocks

```example
    code
.
<p>code</p>
.
code
```

```example
para

    more
.
<p>para</p>
<p>more</p>
.
more
```

## `~~~` fences

```example
~~~
x
~~~
.
<p>~~~
x
~~~</p>
.
~~~
~~~
```

## `***`, `___`, `* * *` rules

```example
***

___

* * *
.
<p>***</p>
<p>___</p>
<p>* * *</p>
.
***
___
* * *
```

## Trailing heading attributes

```example
## Title {#id}
.
<h2 id="title-id">Title {#id}</h2>
.
{#id}
```

## Multi-line attributes

```example
{.a
.b}
# x
.
<p>{.a
.b}</p>
<h1 id="x">x</h1>
.
{.a⏎.b}
```

## Lazy continuation lines

```example
> a
b
.
<blockquote>
<p>a</p>
</blockquote>
<p>b</p>
.
b
```

```example
- a
b
.
<ul>
<li>a</li>
</ul>
<p>b</p>
.
b
```

## Reference links

```example
[x][y] and [z][]
.
<p>[x][y] and [z][]</p>
.
[x][y]
[z][]
```

```example
[y]: /url
.
<p>[y]: /url</p>
.
[y]:
```

## Footnotes

```example
a claim[^1].
.
<p>a claim[^1].</p>
.
[^1]
```

```example
[^1]: the note
.
<p>[^1]: the note</p>
.
[^1]:
```

## Bare URLs

```example
see https://a.com/x_(y). ok
.
<p>see https://a.com/x_(y). ok</p>
.
https://a.com/x_(y)
```

```example
or www.a.com, and http://b.io
.
<p>or www.a.com, and http://b.io</p>
.
www.a.com
http://b.io
```

```example
mail me@example.com.
.
<p>mail me@example.com.</p>
.
me@example.com
```

```example
_at https://a.com_
.
<p><em>at https://a.com</em></p>
.
https://a.com
```

## Relative autolinks

```example
go </docs/intro>
.
<p>go &lt;/docs/intro&gt;</p>
.
</docs/intro>
```

## Named character references

```example
&copy; &amp; &nbsp;
.
<p>&amp;copy; &amp;amp; &amp;nbsp;</p>
.
&copy;
&amp;
&nbsp;
```

## Two trailing spaces as a line break

```example
a␣␣
b
.
<p>a
b</p>
.
␣␣
```

## `__strong__`

```example
__b__
.
<p>__b__</p>
.
__b__
```

## `*emphasis*`

```example
*a* and *b*
.
<p>*a* and *b*</p>
.
*a*
*b*
```

## `~single~` strikethrough

```example
~a~
.
<p>~a~</p>
.
~a~
```

## Attributes after words

```example
word{.x}
.
<p>word{.x}</p>
.
{.x}
```

```example
`c`{.x} _e_{#y}
.
<p><code>c</code>{.x} <em>e</em>{#y}</p>
.
{.x}
{#y}
```

```example
[text]{.x}
.
<p>[text]{.x}</p>
.
{.x}
```

## MDX

```example
<Chart data="x" /> and </Chart>
.
<p>&lt;Chart data=&quot;x&quot; /&gt; and &lt;/Chart&gt;</p>
.
<Chart data="x" />
</Chart>
```

## TOML metadata

```example
+++
title = "x"
+++
# t
.
<p>+++
title = “x”
+++</p>
<h1 id="t">t</h1>
.
+++⏎title = "x"⏎+++
```
