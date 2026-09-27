# Not supported

Each form `prose/syntax.md` cuts, under its warning code. The text stays, and every warning an example raises has that code.

## raw-html

```example 103
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

```example 104
a <b>c</b> and <!-- x -->
.
<p>a &lt;b&gt;c&lt;/b&gt; and &lt;!-- x --&gt;</p>
.
<b>
</b>
<!-- x -->
```

```example 105
</about>
.
<p>&lt;/about&gt;</p>
.
</about>
```

`<!-->` and `<!--->` are whole comments, as in CommonMark, so they are raw HTML too.

```example 106 near-miss
<!-->b and a <!---> c
.
<p>&lt;!--&gt;b and a &lt;!---&gt; c</p>
.
<!-->
<!--->
```

## setext-heading

```example 107
Title
===
.
<p>Title
===</p>
.
===
```

```example 108
Title
---
.
<p>Title
—</p>
.
---
```

## indented-code

```example 109
    code
.
<p>code</p>
.
code
```

```example 110
para

    more
.
<p>para</p>
<p>more</p>
.
more
```

## tilde-fence

```example 111
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

## rule-marker

```example 112
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

## trailing-heading-attributes

```example 113
## Title {#id}
.
<h2 id="title-id">Title {#id}</h2>
.
{#id}
```

## directive-name

A name that isn't an element leaves the whole directive as text, nothing in it read as other
syntax.

```example 114
::chart[Sales]{type=bar}
.
<p>::chart[Sales]{type=bar}</p>
.
::chart[Sales]{type=bar}
```

For a container, only the fence lines are text; the body is still Markdown.

```example 115
:::note
- a _b_
:::
.
<p>:::note</p>
<ul>
<li>a <em>b</em></li>
</ul>
<p>:::</p>
.
:::note
```

```example 116
A :note[**x**]{.y} here
.
<p>A :note[**x**]{.y} here</p>
.
:note[**x**]{.y}
```

Elements Markdown already writes, and anything that could run code, aren't names.

```example 117
:em[x] and :script[x]
.
<p>:em[x] and :script[x]</p>
.
:em[x]
:script[x]
```

Inline and block elements don't mix.

```example 118
:div[x] and

::span[y]
.
<p>:div[x] and</p>
<p>::span[y]</p>
.
:div[x]
::span[y]
```

## multiline-attributes

```example 119
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

## lazy-line

```example 120
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

```example 121
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

````example 122
> a
```b`c
.
<blockquote>
<p>a</p>
</blockquote>
<p>```b`c</p>
.
```b`c
````

## reference-link

```example 123
[x][y] and [z][]
.
<p>[x][y] and [z][]</p>
.
[x][y]
[z][]
```

```example 124
[y]: /url
.
<p>[y]: /url</p>
.
[y]:
```

## footnote

```example 125
a claim[^1].
.
<p>a claim[^1].</p>
.
[^1]
```

```example 126
[^1]: the note
.
<p>[^1]: the note</p>
.
[^1]:
```

```example 127
Wow![^1]
[^1]: a note that interrupts the paragraph
.
<p>Wow![^1]
[^1]: a note that interrupts the paragraph</p>
.
[^1]
[^1]
```

## bare-url

```example 128
see https://a.com/x_(y). ok
.
<p>see https://a.com/x_(y). ok</p>
.
https://a.com/x_(y)
```

```example 129
or www.a.com, and http://b.io
.
<p>or www.a.com, and http://b.io</p>
.
www.a.com
http://b.io
```

```example 130
mail me@example.com.
.
<p>mail me@example.com.</p>
.
me@example.com
```

```example 131
_at https://a.com_
.
<p><em>at https://a.com</em></p>
.
https://a.com
```

```example 132
WWW.A.COM and 0https://b.io
.
<p>WWW.A.COM and 0https://b.io</p>
.
WWW.A.COM
https://b.io
```

```example 133
at www._ it stops
.
<p>at www._ it stops</p>
.
www.
```

## relative-autolink

```example 134
go </docs/intro>
.
<p>go &lt;/docs/intro&gt;</p>
.
</docs/intro>
```

## named-reference

```example 135
&copy; &amp; &nbsp;
.
<p>&amp;copy; &amp;amp; &amp;nbsp;</p>
.
&copy;
&amp;
&nbsp;
```

In an attribute value too, the reference stays as written.

```example 136
:abbr[x]{title="a&apos;b"}
.
<p><abbr title="a&amp;apos;b">x</abbr></p>
.
&apos;
```

## trailing-spaces

```example 137
a␣␣
b
.
<p>a
b</p>
.
␣␣
```

```example 138
a→␣␣
b
.
<p>a
b</p>
.
␣␣
```

## underscore-strong

```example 139
__b__
.
<p>__b__</p>
.
__b__
```

## star-emphasis

```example 140
*a* and *b*
.
<p>*a* and *b*</p>
.
*a*
*b*
```

## single-tilde

```example 141
~a~
.
<p>~a~</p>
.
~a~
```

## inline-attributes

```example 142
word{.x}
.
<p>word{.x}</p>
.
{.x}
```

```example 143
`c`{.x} _e_{#y}
.
<p><code>c</code>{.x} <em>e</em>{#y}</p>
.
{.x}
{#y}
```

```example 144
[text]{.x}
.
<p>[text]{.x}</p>
.
{.x}
```

## math-delimiter

```example 145
The energy is $$E = mc^2$$ here.
.
<p>The energy is $$E = mc^2$$ here.</p>
.
$$E = mc^2$$
```

```example 146
the $`x^2`$ form
.
<p>the $`x^2`$ form</p>
.
$`x^2`$
```

## jsx

```example 147
<Chart data="x" /> and </Chart>
.
<p>&lt;Chart data=&quot;x&quot; /&gt; and &lt;/Chart&gt;</p>
.
<Chart data="x" />
</Chart>
```

## toml-metadata

```example 148
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
