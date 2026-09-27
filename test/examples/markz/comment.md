# Comments

```example 61
<!-- one -->

<!-- two
lines -->
para
.
<p>para</p>
```

```example 62
<!-- a --> b
.
<p>&lt;!-- a --&gt; b</p>
.
<!-- a -->
```

```example 63 ambiguous comment-close
<!-- a
b --> c
.

.
 c
```

```example 64 unclosed
<!-- a

b
.

```

```example 65
{.note}
<!-- a -->
b
.
<p>{.note}</p>
<p>b</p>
.
{.note}
```
