# Inline code

```example 71 ambiguous code-run
`a` and `` b ` c `` and `${a}`
.
<p><code>a</code> and <code>b ` c</code> and <code>${a}</code></p>
```

```example 72 unclosed
`a and ``b`
.
<p><code>a and ``b</code></p>
```
