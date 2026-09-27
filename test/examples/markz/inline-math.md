# Inline math

```example 90
$x^2$ and $a$
.
<p><code class="language-math math-inline">x^2</code> and <code class="language-math math-inline">a</code></p>
```

```example 91 ambiguous math-end
costs $5 and $10
.
<p>costs $5 and $10</p>
```

```example 92 unclosed
a $, $$b and $a $b$
.
<p>a $, $$b and $a <code class="language-math math-inline">b</code></p>
```
