# Block

Examples of markz's dialect, in the CommonMark spec's format (see `../examples.ts`). Each `##` is a construct id from `test/grammar.ts`, set by the `{#id}` line above its heading in `prose/syntax.md`, and the tests fail if one isn't.

## paragraph

```example
{.verse}
Moko kahan
Main to
.
<p class="verse">Moko kahan
Main to</p>
```

## heading

Every heading gets an id: `{#id}` on the line above, or GitHub's slug numbered past the ids already used.

```example
## Foo

## Foo

## Foo 1
.
<h2 id="foo">Foo</h2>
<h2 id="foo-1">Foo</h2>
<h2 id="foo-1-1">Foo 1</h2>
```

```example
{#top}
# A

# Pricing

{#pricing}
# B
.
<h1 id="top">A</h1>
<h1 id="pricing">Pricing</h1>
<h1 id="pricing">B</h1>
.
#pricing
```

```example
## Hello _world_ #
.
<h2 id="hello-world">Hello <em>world</em></h2>
```

## blockquote

```example
> a
> b
>
> c
.
<blockquote>
<p>a
b</p>
<p>c</p>
</blockquote>
```

## list

```example
- [x] done
- [ ] todo
.
<ul>
<li><input type="checkbox" disabled="" checked="" /> done</li>
<li><input type="checkbox" disabled="" /> todo</li>
</ul>
```

```example
- a

- b
.
<ul>
<li><p>a</p>
</li>
<li><p>b</p>
</li>
</ul>
```

```example
1) one
2) two

* x
.
<ol>
<li>one</li>
<li>two</li>
</ol>
<ul>
<li>x</li>
</ul>
```

## code-block

`````example
````md
```js
x
```
````
.
<pre><code class="language-md">```js
x
```
</code></pre>
`````

````example
> ```
> a
b
.
<blockquote>
<pre><code>a
</code></pre>
</blockquote>
<p>b</p>
````

`````example
````
<div>&copy;</div>
    code
***
````
.
<pre><code>&lt;div&gt;&amp;copy;&lt;/div&gt;
    code
***
</code></pre>
`````

````example
```a&#65;b
```
.
<pre><code class="language-aAb"></code></pre>
````

## raw-block

````example
```=html
<b>hi</b>
```

```=latex
\x
```
.
<b>hi</b>
````

## math-block

```example
$$
x^2
$$
.
<pre><code class="language-math math-display">x^2
</code></pre>
```

```example
Mass and energy:
$$E=mc^2$$
.
<p>Mass and energy:</p>
<pre><code class="language-math math-display">E=mc^2
</code></pre>
```

## table

```example
intro
| a | b |
| :- | -: |
| 1 |
.
<p>intro</p>
<table>
<thead>
<tr>
<th align="left">a</th>
<th align="right">b</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">1</td>
<td align="right"></td>
</tr>
</tbody>
</table>
```

```example
| a \| b | c |
| - | - |
.
<table>
<thead>
<tr>
<th>a | b</th>
<th>c</th>
</tr>
</thead>
</table>
```

A delimiter row with a colon needs no pipe, since it can't be a setext underline.

```example
a
:-:
.
<table>
<thead>
<tr>
<th align="center">a</th>
</tr>
</thead>
</table>
```

A row indented four columns ends the table, and under a paragraph it is never a delimiter row.

```example
| a |
| - |
    | b |
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
<p>| b |</p>
.
| b |
```

```example
| a |
    | - |
.
<p>| a |
| - |</p>
```

```example
|
-|
.
<p>|
-|</p>
```

```example
a
    b
-|
.
<p>a
b
-|</p>
```

## thematic-break

```example
a

---

b
.
<p>a</p>
<hr />
<p>b</p>
```

## directive

```example
::div{.chart data=sales type="bar"}
.
<div class="chart" data="sales" type="bar"></div>
```

```example
::chart-view[Sales]{type=bar}
.
<chart-view type="bar">Sales</chart-view>
```

A custom element's label comes first, for its component to read.

```example
:::call-out[Warn \*x]{.important}
Body
:::
.
<call-out class="important"><div class="directive-label">Warn *x</div>
<p>Body</p>
</call-out>
```

```example
:::details[Show the proof]
Body
:::
.
<details><summary>Show the proof</summary>
<p>Body</p>
</details>
```

```example
:::figure[Sales by month]
![chart](c.png)
:::
.
<figure><figcaption>Sales by month</figcaption>
<p><img src="c.png" alt="chart" /></p>
</figure>
```

Any other block has no place for a label, so it is reported and not written.

```example
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

```example
:::aside[]
x
:::
.
<aside><p>x</p>
</aside>
```

```example
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

```example
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

```example
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

```example
::div[x]{.y} z
.
<p>::div[x]{.y} z</p>
```

## attributes

A bare key is one of HTML's boolean attributes.

```example
:::details{open}
x
:::
.
<details open><p>x</p>
</details>
```

```example
{hidden .x}

para
.
<p class="x" hidden>para</p>
```

Bare keys alone count only after a directive, link or image. On a line or after a word they are
prose, with no warning.

```example
{year}

## Sets {a}
.
<p>{year}</p>
<h2 id="sets-a">Sets {a}</h2>
```

After a directive, link or image, a `{…}` that doesn't parse stays text and is reported.

```example
::div{type='bar'}
.
<p>::div{type=’bar’}</p>
.
{type='bar'}
```

```example
[docs](/d){target='_blank'}
.
<p><a href="/d">docs</a>{target=’_blank’}</p>
.
{target='_blank'}
```

```example
{#pricing .center}

## Pricing
.
<h2 id="pricing" class="center">Pricing</h2>
```

```example
{.a key=1}
{.b key=2}
| x |
| - |
.
<table class="a b" key="2">
<thead>
<tr>
<th>x</th>
</tr>
</thead>
</table>
```

```example
para
{.x}
.
<p>para
{.x}</p>
```

```example
> {.x}
.
<blockquote>
<p>{.x}</p>
</blockquote>
.
{.x}
```

```example
{a, b} and {"json": 1}
.
<p>{a, b} and {“json”: 1}</p>
```

```example
{onclick=x href="javascript:alert(1)" src="data:image/png;base64,AA" ok=1}
para
.
<p src="data:image/png;base64,AA" ok="1">para</p>
```

## comment

```example
<!-- one -->

<!-- two
lines -->
para
.
<p>para</p>
```

```example
<!-- a --> b
.
<p>&lt;!-- a --&gt; b</p>
.
<!-- a -->
```

```example
<!-- a
b --> c
.

.
 c
```

```example
{.note}
<!-- a -->
b
.
<p>{.note}</p>
<p>b</p>
.
{.note}
```
