# Attributes

A bare key is one of HTML's boolean attributes.

```example 49
{@details open}
x
{/details}
.
<details open><p>x</p>
</details>
```

```example 50
{hidden .x}

para
.
<p class="x" hidden>para</p>
```

Bare keys alone count only after a link, image, span or element's name. On a line or after a
word they are prose, with no warning.

```example 51 ambiguous attribute-boolean
{year}

## Sets {a}
.
<p>{year}</p>
<h2 id="sets-a">Sets {a}</h2>
```

After a link, image or `[text]`, a `{…}` that doesn't parse stays text and is reported.

```example 52
[x]{@kbd type='bar'}
.
<p>[x]{@kbd type='bar'}</p>
.
{@kbd type='bar'}
```

```example 53
[docs](/d){target='_blank'}
.
<p><a href="/d">docs</a>{target='_blank'}</p>
.
{target='_blank'}
```

```example 54
{#pricing .center}

## Pricing
.
<h2 id="pricing" class="center">Pricing</h2>
```

```example 55 attribute-merge
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

```example 56
para
{.x}
.
<p>para
{.x}</p>
```

```example 57
> {.x}
.
<blockquote>
<p>{.x}</p>
</blockquote>
.
{.x}
```

An unclosed `{` is text, reported only when a later line closes it.

```example 58 unclosed
{.a
para
.
<p>{.a
para</p>
```

```example 59 attribute-places
{a, b} and {"json": 1}
.
<p>{a, b} and {&quot;json&quot;: 1}</p>
```

```example 60
{onclick=x href="javascript:alert(1)" src="data:image/png;base64,AA" ok=1}
para
.
<p src="data:image/png;base64,AA" ok="1">para</p>
```
