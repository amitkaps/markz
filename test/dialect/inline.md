# Inline

Examples of markz's dialect, in the CommonMark spec's format (see `../examples.ts`). Each `##` is a construct id from `test/grammar.ts`, set by the `{#id}` line above its heading in `prose/syntax.md`, and the tests fail if one isn't.

## emphasis

```example
_a_ **b** ~~c~~
.
<p><em>a</em> <strong>b</strong> <del>c</del></p>
```

```example
_foo *bar* baz_ and a*b*c
.
<p><em>foo <em>bar</em> baz</em> and a<em>b</em>c</p>
```

```example
snake_case_name
.
<p>snake_case_name</p>
```

```example
_a ${x * y} b_
.
<p><em>a ${x * y} b</em></p>
```

## inline-code

```example
`a` and `` b ` c `` and `${a}`
.
<p><code>a</code> and <code>b ` c</code> and <code>${a}</code></p>
```

## link

```example
[docs](/docs){target=_blank} and ![hero](h.png){.wide width=600}
.
<p><a href="/docs" target="_blank">docs</a> and <img src="h.png" alt="hero" class="wide" width="600" /></p>
```

```example
[docs](/docs) {.x}
.
<p><a href="/docs">docs</a> {.x}</p>
```

```example
[x](javascript:alert(1)) and ![x](data:image/png;base64,AA)
.
<p><a href="">x</a> and <img src="data:image/png;base64,AA" alt="x" /></p>
```

```example
[sic] and [x] and <https://a.com> and <me@example.com>
.
<p>[sic] and [x] and <a href="https://a.com">https://a.com</a> and <a href="mailto:me@example.com">me@example.com</a></p>
```

```example
[https://a.com](https://a.com) and ![www.a.com](a.png)
.
<p><a href="https://a.com">https://a.com</a> and <img src="a.png" alt="www.a.com" /></p>
```

```example
[x](/u/${id}/edit)
.
<p><a href="/u/$%7Bid%7D/edit">x</a></p>
```

## text-directive

```example
:span[x]{.y} and :badge{n=3}
.
<p><span class="span y">x</span> and <span class="badge" n="3"></span></p>
```

```example
H:sub[2]O and x:sup[2] and :abbr[HTML]{title="HyperText"}
.
<p>H<sub>2</sub>O and x<sup>2</sup> and <abbr title="HyperText">HTML</abbr></p>
```

```example
:note[a _b_]
.
<p><span class="note">a <em>b</em></span></p>
```

```example
hello :world at 10:30, localhost:8000
.
<p>hello :world at 10:30, localhost:8000</p>
```

## inline-math

```example
$x^2$ and $a$
.
<p><code class="language-math math-inline">x^2</code> and <code class="language-math math-inline">a</code></p>
```

```example
costs $5 and $10
.
<p>costs $5 and $10</p>
```

## expression

```example
${f("}", `${"}"}`, /* } */ {a: 1})} after
.
<p>${f(&quot;}&quot;, `${&quot;}&quot;}`, /* } */ {a: 1})} after</p>
```

```example
${a and \${b}
.
<p>${a and ${b}</p>
```

## line-break

```example
a\
b
c
.
<p>a<br />
b
c</p>
```

## escape

```example
\*a\* 10\ km &#169; &#x2014; &#0;
.
<p>*a* 10 km © — �</p>
```

```example
a & b, a@b, x.y
.
<p>a &amp; b, a@b, x.y</p>
```

## smart-punctuation

```example
"Hi," she said -- it's 1990--2000... --- done
.
<p>“Hi,” she said – it’s 1990–2000… — done</p>
```

```example
\"a\" \-\-
.
<p>&quot;a&quot; --</p>
```
