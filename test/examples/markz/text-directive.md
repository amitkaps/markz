# Text directives

```example 83
:span[x]{.y} and :badge-count{n=3}
.
<p><span class="y">x</span> and <badge-count n="3"></badge-count></p>
```

```example 84
H:sub[2]O and x:sup[2] and :abbr[HTML]{title="HyperText"}
.
<p>H<sub>2</sub>O and x<sup>2</sup> and <abbr title="HyperText">HTML</abbr></p>
```

```example 85
:kbd[Ctrl] :mark[a _b_] :q[hi] :time[today]{datetime=2026-09-27}
.
<p><kbd>Ctrl</kbd> <mark>a <em>b</em></mark> <q>hi</q> <time datetime="2026-09-27">today</time></p>
```

```example 86
:span[open]{hidden}
.
<p><span hidden>open</span></p>
```

```example 87
hello :world at 10:30, localhost:8000
.
<p>hello :world at 10:30, localhost:8000</p>
```

```example 88 ambiguous inline-element-name
x ::span[y] and :span[z]
.
<p>x ::span[y] and <span>z</span></p>
```

An unclosed label leaves its directive text, and the one after it still opens.

```example 89 unclosed
:abbr[HTML and :span[b]
.
<p>:abbr[HTML and <span>b</span></p>
```
