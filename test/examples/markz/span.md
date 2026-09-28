# Spans

```example 83
[x]{.y} and []{=badge-count n=3}
.
<p><span class="y">x</span> and <badge-count n="3"></badge-count></p>
```

```example 84
H[2]{=sub}O and x[2]{=sup} and [HTML]{=abbr title="HyperText"}
.
<p>H<sub>2</sub>O and x<sup>2</sup> and <abbr title="HyperText">HTML</abbr></p>
```

```example 85
[Ctrl]{=kbd} [a _b_]{=mark} [hi]{=q} [today]{=time datetime=2026-09-27}
.
<p><kbd>Ctrl</kbd> <mark>a <em>b</em></mark> <q>hi</q> <time datetime="2026-09-27">today</time></p>
```

```example 86
[open]{hidden}
.
<p><span hidden>open</span></p>
```

```example 87
hello :world at 10:30, localhost:8000 [sic]
.
<p>hello :world at 10:30, localhost:8000 [sic]</p>
```

A span may hold a link, and `![…]{…}` is a `!` before a span.

```example 152
[see [docs](/d)]{.a} and ![alt]{.x}
.
<p><span class="a">see <a href="/d">docs</a></span> and !<span class="x">alt</span></p>
```

`span` isn't a name, and neither is a block element.

```example 88 ambiguous inline-element-name
x [y]{=span} and [z]{=div}
.
<p>x [y]{=span} and [z]{=div}</p>
.
[y]{=span}
[z]{=div}
```

An unclosed bracket is text, and the span after it still opens.

```example 89 unclosed
[HTML and [b]{.x}
.
<p>[HTML and <span class="x">b</span></p>
```
