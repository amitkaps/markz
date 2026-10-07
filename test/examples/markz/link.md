# Links and images

```example 73
[docs](/docs){target=_blank} and ![hero](h.png){.wide width=600}
.
<p><a href="/docs" target="_blank">docs</a> and <img src="h.png" alt="hero" class="wide" width="600" /></p>
```

```example 74
[docs](/docs) {.x}
.
<p><a href="/docs">docs</a> {.x}</p>
```

```example 75
[x](javascript:alert(1)) and ![x](data:image/png;base64,AA)
.
<p><a href="">x</a> and <img src="data:image/png;base64,AA" alt="x" /></p>
```

```example 76
[sic] and [x] and <https://a.com> and <me@example.com>
.
<p>[sic] and [x] and <a href="https://a.com">https://a.com</a> and <a href="mailto:me@example.com">me@example.com</a></p>
```

```example 77
[https://a.com](https://a.com) and ![www.a.com](a.png)
.
<p><a href="https://a.com">https://a.com</a> and <img src="a.png" alt="www.a.com" /></p>
```

```example 78
[x](/u/${id}/edit)
.
<p><a href="/u/$%7Bid%7D/edit">x</a></p>
```

```example 79
Not links in GFM: www.a_b.com, react@0.14.1, xhttp://a.com, [see https://a.com
.
<p>Not links in GFM: www.a_b.com, react@0.14.1, xhttp://a.com, [see https://a.com</p>
```

```example 80
[a](b "") ![c](d "")
.
<p><a href="b">a</a> <img src="d" alt="c" /></p>
```

A link's text holds no link, so the inner one wins.

```example 81 ambiguous link-text
[a [b](c) d](e)
.
<p>[a <a href="c">b</a> d](e)</p>
```

At the start of a line, `<?` opens no HTML block, since markz has none.

```example 166 ambiguous autolink-start
<?a@b.c>
.
<p><a href="mailto:?a@b.c">?a@b.c</a></p>
```

```example 82 unclosed
[a](b and [c
.
<p>[a](b and [c</p>
```
