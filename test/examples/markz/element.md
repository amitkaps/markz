# Elements

```example 38
{@div .chart data=sales type="bar" /}
.
<div class="chart" data="sales" type="bar"></div>
```

```example 39
[Sales]{@chart-view type=bar /}
.
<chart-view type="bar">Sales</chart-view>
```

```example 40
{@call-out .important}
Body
{/call-out}
.
<call-out class="important"><p>Body</p>
</call-out>
```

What HTML puts in a child element is written as one.

```example 41
{@details}
[Show the proof]{@summary /}
Body
{/details}
.
<details><summary>Show the proof</summary>
<p>Body</p>
</details>
```

A leaf can interrupt a paragraph, since a line ending in `/}` can't be prose.

```example 42
{@figure}
![chart](c.png)
[Sales by month]{@figcaption /}
{/figure}
.
<figure><p><img src="c.png" alt="chart" /></p>
<figcaption>Sales by month</figcaption>
</figure>
```

An opening line can't: there it is text, and so its closing line has nothing to close.

```example 149 ambiguous element-interrupts
para
{@div}
x
{/div}
.
<p>para
{@div}
x
{/div}</p>
.
{/div}
```

```example 45 ambiguous element-close
{@div}
{@div}
x
{/div}
y
{/div}
.
<div><div><p>x</p>
</div>
<p>y</p>
</div>
```

A closing line with another name closes nothing.

```example 150 ambiguous element-close
{@div}
x
{/aside}
{/div}
.
<div><p>x
{/aside}</p>
</div>
.
{/aside}
```

A closing line is read at its element's own level, before a list inside takes the line.

```example 151 ambiguous element-close
{@aside}
- a
  {/aside}
b
.
<aside><ul>
<li>a</li>
</ul>
</aside>
<p>b</p>
```

```example 46 unclosed
{@div}
{@div}
x
{/div}
y
.
<div><div><p>x</p>
</div>
<p>y</p>
</div>
.
{@div}
```

```example 47
{@dl}
[Term]{@dt /}
[What it means]{@dd /}
{/dl}
.
<dl><dt>Term</dt>
<dd>What it means</dd>
</dl>
```

A leaf's shape in the middle of a line is text, and reported.

```example 48
x [y]{@div /} z
.
<p>x [y]{@div /} z</p>
.
{@div /}
```
