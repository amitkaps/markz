---
source: gfm
url: https://github.com/github/cmark-gfm/tree/499789b49373bfa045d0e7547e5ee63444c77bca/test/spec.txt
commit: 499789b49373bfa045d0e7547e5ee63444c77bca
checks: oracle
---

# GFM extensions

## Tables

```example 198
| foo | bar |
| --- | --- |
| baz | bim |

.
<table>
<thead>
<tr>
<th>foo</th>
<th>bar</th>
</tr>
</thead>
<tbody>
<tr>
<td>baz</td>
<td>bim</td>
</tr>
</tbody>
</table>

```

```example 199
| abc | defghi |
:-: | -----------:
bar | baz

.
<table>
<thead>
<tr>
<th align="center">abc</th>
<th align="right">defghi</th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">bar</td>
<td align="right">baz</td>
</tr>
</tbody>
</table>

```

```example 200
| f\|oo  |
| ------ |
| b `\|` az |
| b **\|** im |

.
<table>
<thead>
<tr>
<th>f|oo</th>
</tr>
</thead>
<tbody>
<tr>
<td>b <code>|</code> az</td>
</tr>
<tr>
<td>b <strong>|</strong> im</td>
</tr>
</tbody>
</table>

```

```example 201
| abc | def |
| --- | --- |
| bar | baz |
> bar

.
<table>
<thead>
<tr>
<th>abc</th>
<th>def</th>
</tr>
</thead>
<tbody>
<tr>
<td>bar</td>
<td>baz</td>
</tr>
</tbody>
</table>
<blockquote>
<p>bar</p>
</blockquote>

```

```example 202
| abc | def |
| --- | --- |
| bar | baz |
bar

bar

.
<table>
<thead>
<tr>
<th>abc</th>
<th>def</th>
</tr>
</thead>
<tbody>
<tr>
<td>bar</td>
<td>baz</td>
</tr>
<tr>
<td>bar</td>
<td></td>
</tr>
</tbody>
</table>
<p>bar</p>

```

```example 203
| abc | def |
| --- |
| bar |

.
<p>| abc | def |
| --- |
| bar |</p>

```

```example 204
| abc | def |
| --- | --- |
| bar |
| bar | baz | boo |

.
<table>
<thead>
<tr>
<th>abc</th>
<th>def</th>
</tr>
</thead>
<tbody>
<tr>
<td>bar</td>
<td></td>
</tr>
<tr>
<td>bar</td>
<td>baz</td>
</tr>
</tbody>
</table>

```

```example 205
| abc | def |
| --- | --- |

.
<table>
<thead>
<tr>
<th>abc</th>
<th>def</th>
</tr>
</thead>
</table>

```

## Task list items

```example 279
- [ ] foo
- [x] bar

.
<ul>
<li><input disabled="" type="checkbox"> foo</li>
<li><input checked="" disabled="" type="checkbox"> bar</li>
</ul>

```

```example 280
- [x] foo
  - [ ] bar
  - [x] baz
- [ ] bim

.
<ul>
<li><input checked="" disabled="" type="checkbox"> foo
<ul>
<li><input disabled="" type="checkbox"> bar</li>
<li><input checked="" disabled="" type="checkbox"> baz</li>
</ul>
</li>
<li><input disabled="" type="checkbox"> bim</li>
</ul>

```

## Strikethrough

```example 491
~~Hi~~ Hello, world!

.
<p><del>Hi</del> Hello, world!</p>

```

```example 492
This ~~has a

new paragraph~~.

.
<p>This ~~has a</p>
<p>new paragraph~~.</p>

```

## Autolinks

```example 621
www.commonmark.org

.
<p><a href="http://www.commonmark.org">www.commonmark.org</a></p>

```

```example 622
Visit www.commonmark.org/help for more information.

.
<p>Visit <a href="http://www.commonmark.org/help">www.commonmark.org/help</a> for more information.</p>

```

```example 623
Visit www.commonmark.org.

Visit www.commonmark.org/a.b.

.
<p>Visit <a href="http://www.commonmark.org">www.commonmark.org</a>.</p>
<p>Visit <a href="http://www.commonmark.org/a.b">www.commonmark.org/a.b</a>.</p>

```

```example 624
www.google.com/search?q=Markup+(business)

www.google.com/search?q=Markup+(business)))

(www.google.com/search?q=Markup+(business))

(www.google.com/search?q=Markup+(business)

.
<p><a href="http://www.google.com/search?q=Markup+(business)">www.google.com/search?q=Markup+(business)</a></p>
<p><a href="http://www.google.com/search?q=Markup+(business)">www.google.com/search?q=Markup+(business)</a>))</p>
<p>(<a href="http://www.google.com/search?q=Markup+(business)">www.google.com/search?q=Markup+(business)</a>)</p>
<p>(<a href="http://www.google.com/search?q=Markup+(business)">www.google.com/search?q=Markup+(business)</a></p>

```

```example 625
www.google.com/search?q=(business))+ok

.
<p><a href="http://www.google.com/search?q=(business))+ok">www.google.com/search?q=(business))+ok</a></p>

```

```example 626
www.google.com/search?q=commonmark&hl=en

www.google.com/search?q=commonmark&hl;

.
<p><a href="http://www.google.com/search?q=commonmark&amp;hl=en">www.google.com/search?q=commonmark&amp;hl=en</a></p>
<p><a href="http://www.google.com/search?q=commonmark">www.google.com/search?q=commonmark</a>&amp;hl;</p>

```

```example 627
www.commonmark.org/he<lp

.
<p><a href="http://www.commonmark.org/he">www.commonmark.org/he</a>&lt;lp</p>

```

```example 628
http://commonmark.org

(Visit https://encrypted.google.com/search?q=Markup+(business))

Anonymous FTP is available at ftp://foo.bar.baz.

.
<p><a href="http://commonmark.org">http://commonmark.org</a></p>
<p>(Visit <a href="https://encrypted.google.com/search?q=Markup+(business)">https://encrypted.google.com/search?q=Markup+(business)</a>)</p>
<p>Anonymous FTP is available at <a href="ftp://foo.bar.baz">ftp://foo.bar.baz</a>.</p>

```

```example 629
foo@bar.baz

.
<p><a href="mailto:foo@bar.baz">foo@bar.baz</a></p>

```

```example 630
hello@mail+xyz.example isn't valid, but hello+xyz@mail.example is.

.
<p>hello@mail+xyz.example isn't valid, but <a href="mailto:hello+xyz@mail.example">hello+xyz@mail.example</a> is.</p>

```

```example 631
a.b-c_d@a.b

a.b-c_d@a.b.

a.b-c_d@a.b-

a.b-c_d@a.b_

.
<p><a href="mailto:a.b-c_d@a.b">a.b-c_d@a.b</a></p>
<p><a href="mailto:a.b-c_d@a.b">a.b-c_d@a.b</a>.</p>
<p>a.b-c_d@a.b-</p>
<p>a.b-c_d@a.b_</p>

```

## Disallowed Raw HTML

```example 652
<strong> <title> <style> <em>

<blockquote>
  <xmp> is disallowed.  <XMP> is also disallowed.
</blockquote>

.
<p><strong> &lt;title> &lt;style> <em></p>
<blockquote>
  &lt;xmp> is disallowed.  &lt;XMP> is also disallowed.
</blockquote>

```
