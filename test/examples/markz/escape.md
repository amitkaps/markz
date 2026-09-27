# Escapes and references

```example 97 ambiguous escape-binds
\*a\* 10\ km &#169; &#x2014; &#0;
.
<p>*a* 10 km © — �</p>
```

```example 98
a & b, a@b, x.y
.
<p>a &amp; b, a@b, x.y</p>
```

```example 99
&#8; &#x9F; &#xFFFF; &#65;
.
<p>� � � A</p>
```

```example 100 unclosed
&#12345678; and &#65 and \
.
<p>&amp;#12345678; and &amp;#65 and \</p>
```
