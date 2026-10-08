# Expressions

```example 93 ambiguous brace-depth
${f("}", `${"}"}`, /* } */ {a: 1})} after
.
<p><code class="language-js expression">f(&quot;}&quot;, `${&quot;}&quot;}`, /* } */ {a: 1})</code> after</p>
```

```example 94 unclosed
${a and \${b}
.
<p>${a and ${b}</p>
```

```example 170 ambiguous expression-bracket
${s.replace(/}/g, "")}
.
<p><code class="language-js expression">s.replace(/</code>/g, ““)}</p>
.
${s.replace(/}
```
