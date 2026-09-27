# Blockquotes

```example 13
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

A line without `>` ends the blockquote when it opens a block of its own.

```example 14 ambiguous quote-lines
> a
- b
.
<blockquote>
<p>a</p>
</blockquote>
<ul>
<li>b</li>
</ul>
```
