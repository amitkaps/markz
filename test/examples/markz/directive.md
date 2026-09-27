# Directives

```example 38
::div{.chart data=sales type="bar"}
.
<div class="chart" data="sales" type="bar"></div>
```

```example 39
::chart-view[Sales]{type=bar}
.
<chart-view type="bar">Sales</chart-view>
```

A custom element's label comes first, for its component to read.

```example 40
:::call-out[Warn \*x]{.important}
Body
:::
.
<call-out class="important"><div class="directive-label">Warn *x</div>
<p>Body</p>
</call-out>
```

```example 41
:::details[Show the proof]
Body
:::
.
<details><summary>Show the proof</summary>
<p>Body</p>
</details>
```

```example 42
:::figure[Sales by month]
![chart](c.png)
:::
.
<figure><figcaption>Sales by month</figcaption>
<p><img src="c.png" alt="chart" /></p>
</figure>
```

Any other block has no place for a label, so it is reported and not written.

```example 43
:::section[Intro]{.x}
Body
:::
.
<section class="x"><p>Body</p>
</section>
.
[Intro]
```

An empty label writes no label element, and isn't reported.

```example 44
:::aside[]
x
:::
.
<aside><p>x</p>
</aside>
```

```example 45 ambiguous directive-close
::::div
:::div
x
:::
y
::::
.
<div><div><p>x</p>
</div>
<p>y</p>
</div>
```

```example 46 unclosed
:::div
:::div
x
:::
y
.
<div><div><p>x</p>
</div>
</div>
<p>y</p>
```

```example 47
:::dl
::dt[Term]
::dd[What it means]
:::
.
<dl><dt>Term</dt>
<dd>What it means</dd>
</dl>
```

A leaf or container shape in the middle of a line is text, with no report.

```example 48
::div[x]{.y} z
.
<p>::div[x]{.y} z</p>
```
