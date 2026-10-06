# Math blocks

```example 24
$$
x^2
$$
.
<pre><code class="language-math math-display">x^2
</code></pre>
```

```example 25
Mass and energy:
$$E=mc^2$$
.
<p>Mass and energy:</p>
<pre><code class="language-math math-display">E=mc^2
</code></pre>
```

On one line, the TeX must hold more than spaces.

```example 26 ambiguous math-one-line
$$x$$

$$ $$
.
<pre><code class="language-math math-display">x
</code></pre>
<p>$$ $$</p>
.
$$ $$
```

```example 27 unclosed
$$
x
.
<pre><code class="language-math math-display">x
</code></pre>
.
$$
```
