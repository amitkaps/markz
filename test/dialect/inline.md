# Inline

Examples of markz's dialect, in the CommonMark spec's format (see `../examples.ts`). Each `##` is a construct id from `test/grammar.ts`, set by the `{#id}` line above its heading in `prose/syntax.md`, and the tests fail if one isn't.

## emphasis

```example
_a_ **b** ~~c~~
.
<p><em>a</em> <strong>b</strong> <del>c</del></p>
```

```example ambiguous star-places
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

```example unclosed
_a and **b
.
<p>_a and **b</p>
```

## inline-code

```example ambiguous code-run
`a` and `` b ` c `` and `${a}`
.
<p><code>a</code> and <code>b ` c</code> and <code>${a}</code></p>
```

```example unclosed
`a and ``b`
.
<p><code>a and ``b</code></p>
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

```example
Not links in GFM: www.a_b.com, react@0.14.1, xhttp://a.com, [see https://a.com
.
<p>Not links in GFM: www.a_b.com, react@0.14.1, xhttp://a.com, [see https://a.com</p>
```

```example
[a](b "") ![c](d "")
.
<p><a href="b">a</a> <img src="d" alt="c" /></p>
```

A link's text holds no link, so the inner one wins.

```example ambiguous link-text
[a [b](c) d](e)
.
<p>[a <a href="c">b</a> d](e)</p>
```

```example unclosed
[a](b and :span[c
.
<p>[a](b and :span[c</p>
```

## text-directive

```example
:span[x]{.y} and :badge-count{n=3}
.
<p><span class="y">x</span> and <badge-count n="3"></badge-count></p>
```

```example
H:sub[2]O and x:sup[2] and :abbr[HTML]{title="HyperText"}
.
<p>H<sub>2</sub>O and x<sup>2</sup> and <abbr title="HyperText">HTML</abbr></p>
```

```example
:kbd[Ctrl] :mark[a _b_] :q[hi] :time[today]{datetime=2026-09-27}
.
<p><kbd>Ctrl</kbd> <mark>a <em>b</em></mark> <q>hi</q> <time datetime="2026-09-27">today</time></p>
```

```example
:span[open]{hidden}
.
<p><span hidden>open</span></p>
```

```example
hello :world at 10:30, localhost:8000
.
<p>hello :world at 10:30, localhost:8000</p>
```

```example ambiguous inline-element-name
x ::span[y] and :span[z]
.
<p>x ::span[y] and <span>z</span></p>
```

An unclosed label leaves its directive text, and the one after it still opens.

```example unclosed
:abbr[HTML and :span[b]
.
<p>:abbr[HTML and <span>b</span></p>
```

## inline-math

```example
$x^2$ and $a$
.
<p><code class="language-math math-inline">x^2</code> and <code class="language-math math-inline">a</code></p>
```

```example ambiguous math-end
costs $5 and $10
.
<p>costs $5 and $10</p>
```

```example unclosed
a $, $$b and $a $b$
.
<p>a $, $$b and $a <code class="language-math math-inline">b</code></p>
```

## expression

```example ambiguous brace-depth
${f("}", `${"}"}`, /* } */ {a: 1})} after
.
<p>${f(&quot;}&quot;, `${&quot;}&quot;}`, /* } */ {a: 1})} after</p>
```

```example unclosed
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

```example ambiguous trailing-backslash
a\␣
b
.
<p>a<br />
b</p>
```

## escape

```example ambiguous escape-binds
\*a\* 10\ km &#169; &#x2014; &#0;
.
<p>*a* 10 km © — �</p>
```

```example
a & b, a@b, x.y
.
<p>a &amp; b, a@b, x.y</p>
```

```example
&#8; &#x9F; &#xFFFF; &#65;
.
<p>� � � A</p>
```

```example unclosed
&#12345678; and &#65 and \
.
<p>&amp;#12345678; and &amp;#65 and \</p>
```

## smart-punctuation

```example ambiguous quote-side
"Hi," she said -- it's 1990--2000... --- done
.
<p>“Hi,” she said – it’s 1990–2000… — done</p>
```

```example
\"a\" \-\-
.
<p>&quot;a&quot; --</p>
```
