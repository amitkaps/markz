# Thematic breaks

```example 36
a

---

b
.
<p>a</p>
<hr />
<p>b</p>
```

A thematic break is tried before a list item.

```example 37 ambiguous block-order
- - -
.
<hr />
```

A formatter writes `***` for a rule on a document's first line, where `---` would open metadata.

```example 173
***

# Hi
.
<hr />
<h1 id="hi">Hi</h1>
```
