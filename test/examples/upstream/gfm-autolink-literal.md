---
source: gfm-autolink-literal
url: https://github.com/micromark/micromark-extension-gfm-autolink-literal/tree/618170c86639742036ecf666d975a6ebac5aac50/test
commit: 618170c86639742036ecf666d975a6ebac5aac50
checks: oracle
---

# micromark-extension-gfm-autolink-literal

## base.md › WWW autolinks

```example 1
## WWW autolinks

w.commonmark.org

ww.commonmark.org

www.commonmark.org

Www.commonmark.org

wWw.commonmark.org

wwW.commonmark.org

WWW.COMMONMARK.ORG

Visit www.commonmark.org/help for more information.

Visit www.commonmark.org.

Visit www.commonmark.org/a.b.

www.aaa.bbb.ccc_ccc

www.aaa_bbb.ccc

www.aaa.bbb.ccc.ddd_ddd

www.aaa.bbb.ccc_ccc.ddd

www.aaa.bbb_bbb.ccc.ddd

www.aaa_aaa.bbb.ccc.ddd

Visit www.commonmark.org.

Visit www.commonmark.org/a.b.

www.google.com/search?q=Markup+(business)

www.google.com/search?q=Markup+(business)))

(www.google.com/search?q=Markup+(business))

(www.google.com/search?q=Markup+(business)

www.google.com/search?q=(business))+ok

www.google.com/search?q=commonmark&hl=en

www.google.com/search?q=commonmark&hl;en

www.google.com/search?q=commonmark&hl;

www.commonmark.org/he<lp


.
<h2>WWW autolinks</h2>
<p>w.commonmark.org</p>
<p>ww.commonmark.org</p>
<p><a href="http://www.commonmark.org">www.commonmark.org</a></p>
<p><a href="http://Www.commonmark.org">Www.commonmark.org</a></p>
<p><a href="http://wWw.commonmark.org">wWw.commonmark.org</a></p>
<p><a href="http://wwW.commonmark.org">wwW.commonmark.org</a></p>
<p><a href="http://WWW.COMMONMARK.ORG">WWW.COMMONMARK.ORG</a></p>
<p>Visit <a href="http://www.commonmark.org/help">www.commonmark.org/help</a> for more information.</p>
<p>Visit <a href="http://www.commonmark.org">www.commonmark.org</a>.</p>
<p>Visit <a href="http://www.commonmark.org/a.b">www.commonmark.org/a.b</a>.</p>
<p>www.aaa.bbb.ccc_ccc</p>
<p>www.aaa_bbb.ccc</p>
<p>www.aaa.bbb.ccc.ddd_ddd</p>
<p>www.aaa.bbb.ccc_ccc.ddd</p>
<p><a href="http://www.aaa.bbb_bbb.ccc.ddd">www.aaa.bbb_bbb.ccc.ddd</a></p>
<p><a href="http://www.aaa_aaa.bbb.ccc.ddd">www.aaa_aaa.bbb.ccc.ddd</a></p>
<p>Visit <a href="http://www.commonmark.org">www.commonmark.org</a>.</p>
<p>Visit <a href="http://www.commonmark.org/a.b">www.commonmark.org/a.b</a>.</p>
<p><a href="http://www.google.com/search?q=Markup+(business)">www.google.com/search?q=Markup+(business)</a></p>
<p><a href="http://www.google.com/search?q=Markup+(business)">www.google.com/search?q=Markup+(business)</a>))</p>
<p>(<a href="http://www.google.com/search?q=Markup+(business)">www.google.com/search?q=Markup+(business)</a>)</p>
<p>(<a href="http://www.google.com/search?q=Markup+(business)">www.google.com/search?q=Markup+(business)</a></p>
<p><a href="http://www.google.com/search?q=(business))+ok">www.google.com/search?q=(business))+ok</a></p>
<p><a href="http://www.google.com/search?q=commonmark&#x26;hl=en">www.google.com/search?q=commonmark&#x26;hl=en</a></p>
<p><a href="http://www.google.com/search?q=commonmark&#x26;hl;en">www.google.com/search?q=commonmark&#x26;hl;en</a></p>
<p><a href="http://www.google.com/search?q=commonmark">www.google.com/search?q=commonmark</a>&#x26;hl;</p>
<p><a href="http://www.commonmark.org/he">www.commonmark.org/he</a>&#x3C;lp</p>

```

## base.md › HTTP autolinks

```example 2
## HTTP autolinks

hexample.com

htexample.com

httexample.com

httpexample.com

http:example.com

http:/example.com

https:/example.com

http://example.com

https://example.com

https://example

http://commonmark.org

(Visit https://encrypted.google.com/search?q=Markup+(business))


.
<h2>HTTP autolinks</h2>
<p>hexample.com</p>
<p>htexample.com</p>
<p>httexample.com</p>
<p>httpexample.com</p>
<p>http:example.com</p>
<p>http:/example.com</p>
<p>https:/example.com</p>
<p><a href="http://example.com">http://example.com</a></p>
<p><a href="https://example.com">https://example.com</a></p>
<p><a href="https://example">https://example</a></p>
<p><a href="http://commonmark.org">http://commonmark.org</a></p>
<p>(Visit <a href="https://encrypted.google.com/search?q=Markup+(business)">https://encrypted.google.com/search?q=Markup+(business)</a>)</p>

```

## base.md › Email autolinks

```example 3
## Email autolinks

No dot: foo@barbaz

No dot: foo@barbaz.

foo@bar.baz

hello@mail+xyz.example isn’t valid, but hello+xyz@mail.example is.

a.b-c_d@a.b

a.b-c_d@a.b.

a.b-c_d@a.b-

a.b-c_d@a.b_

a@a_b.c

a@a-b.c

Can’t end in an underscore followed by a period: aaa@a.b_.

Can contain an underscore followed by a period: aaa@a.b_.c


.
<h2>Email autolinks</h2>
<p>No dot: foo@barbaz</p>
<p>No dot: foo@barbaz.</p>
<p><a href="mailto:foo@bar.baz">foo@bar.baz</a></p>
<p>hello@mail+xyz.example isn’t valid, but <a href="mailto:hello+xyz@mail.example">hello+xyz@mail.example</a> is.</p>
<p><a href="mailto:a.b-c_d@a.b">a.b-c_d@a.b</a></p>
<p><a href="mailto:a.b-c_d@a.b">a.b-c_d@a.b</a>.</p>
<p>a.b-c_d@a.b-</p>
<p>a.b-c_d@a.b_</p>
<p><a href="mailto:a@a_b.c">a@a_b.c</a></p>
<p><a href="mailto:a@a-b.c">a@a-b.c</a></p>
<p>Can’t end in an underscore followed by a period: aaa@a.b_.</p>
<p>Can contain an underscore followed by a period: <a href="mailto:aaa@a.b_.c">aaa@a.b_.c</a></p>

```

## base.md › Link text should not be expanded

```example 4
## Link text should not be expanded

[Visit www.example.com](http://www.example.com) please.

[Visit http://www.example.com](http://www.example.com) please.

[Mail example@example.com](mailto:example@example.com) please.

[link]() <http://autolink> should still be expanded.

.
<h2>Link text should not be expanded</h2>
<p><a href="http://www.example.com">Visit www.example.com</a> please.</p>
<p><a href="http://www.example.com">Visit http://www.example.com</a> please.</p>
<p><a href="mailto:example@example.com">Mail example@example.com</a> please.</p>
<p><a href="">link</a> <a href="http://autolink">http://autolink</a> should still be expanded.</p>

```

## brackets.comment.md

```example 5
H0.

[https://a.com&copy;b

[www.a.com&copy;b

H1.

[]https://a.com&copy;b

[]www.a.com&copy;b

H2.

[] https://a.com&copy;b

[] www.a.com&copy;b

H3.

[[https://a.com&copy;b

[[www.a.com&copy;b

H4.

[[]https://a.com&copy;b

[[]www.a.com&copy;b

H5.

[[]]https://a.com&copy;b

[[]]www.a.com&copy;b

.
<p>H0.</p>
<p>[https://a.com©b</p>
<p>[www.a.com©b</p>
<p>H1.</p>
<p>[]<a href="https://a.com&#x26;copy;b">https://a.com&#x26;copy;b</a></p>
<p>[]www.a.com©b</p>
<p>H2.</p>
<p>[] <a href="https://a.com&#x26;copy;b">https://a.com&#x26;copy;b</a></p>
<p>[] <a href="http://www.a.com&#x26;copy;b">www.a.com&#x26;copy;b</a></p>
<p>H3.</p>
<p>[[https://a.com©b</p>
<p>[[www.a.com©b</p>
<p>H4.</p>
<p>[[]https://a.com©b</p>
<p>[[]www.a.com©b</p>
<p>H5.</p>
<p>[[]]<a href="https://a.com&#x26;copy;b">https://a.com&#x26;copy;b</a></p>
<p>[[]]www.a.com©b</p>

```

## combined-with-images.comment.md

```example 6
Image start.

![https://a.com

![http://a.com

![www.a.com

![a@b.c

Image start and label end.

![https://a.com]

![http://a.com]

![www.a.com]

![a@b.c]

Image label with reference (note: GH cleans hashes here, but we keep them in).

![https://a.com][x]

![http://a.com][x]

![www.a.com][x]

![a@b.c][x]

[x]: #

Image label with resource.

![https://a.com]()

![http://a.com]()

![www.a.com]()

![a@b.c]()

Autolink literal after image.

![a]() https://a.com

![a]() http://a.com

![a]() www.a.com

![a]() a@b.c

.
<p>Image start.</p>
<p>![https://a.com</p>
<p>![http://a.com</p>
<p>![www.a.com</p>
<p>![<a href="mailto:a@b.c">a@b.c</a></p>
<p>Image start and label end.</p>
<p>![https://a.com]</p>
<p>![http://a.com]</p>
<p>![www.a.com]</p>
<p>![<a href="mailto:a@b.c">a@b.c</a>]</p>
<p>Image label with reference (note: GH cleans hashes here, but we keep them in).</p>
<p><img src="" alt="https://a.com"></p>
<p><img src="" alt="http://a.com"></p>
<p><img src="" alt="www.a.com"></p>
<p><img src="" alt="a@b.c"></p>
<p>Image label with resource.</p>
<p><img src="" alt="https://a.com"></p>
<p><img src="" alt="http://a.com"></p>
<p><img src="" alt="www.a.com"></p>
<p><img src="" alt="a@b.c"></p>
<p>Autolink literal after image.</p>
<p><img src="" alt="a"> <a href="https://a.com">https://a.com</a></p>
<p><img src="" alt="a"> <a href="http://a.com">http://a.com</a></p>
<p><img src="" alt="a"> <a href="http://www.a.com">www.a.com</a></p>
<p><img src="" alt="a"> <a href="mailto:a@b.c">a@b.c</a></p>

```

## combined-with-links.comment.md

```example 7
Link start.

[https://a.com

[http://a.com

[www.a.com

[a@b.c

Label end.

https://a.com]

http://a.com]

www.a.com]

a@b.c]

Link start and label end.

[https://a.com]

[http://a.com]

[www.a.com]

[a@b.c]

What naïvely seems like a label end (A).

https://a.com`]`

http://a.com`]`

www.a.com`]`

a@b.c`]`

Link start and what naïvely seems like a balanced brace (B).

[https://a.com`]`

[http://a.com`]`

[www.a.com`]`

[a@b.c`]`

What naïvely seems like a label end (C).

https://a.com `]`

http://a.com `]`

www.a.com `]`

a@b.c `]`

Link start and what naïvely seems like a balanced brace (D).

[https://a.com `]`

[http://a.com `]`

[www.a.com `]`

[a@b.c `]`

Link label with reference.

[https://a.com][x]

[http://a.com][x]

[www.a.com][x]

[a@b.c][x]

[x]: #

Link label with resource.

[https://a.com]()

[http://a.com]()

[www.a.com]()

[a@b.c]()

More in link.

[a https://b.com c]()

[a http://b.com c]()

[a www.b.com c]()

[a b@c.d e]()

Autolink literal after link.

[a]() https://a.com

[a]() http://a.com

[a]() www.a.com

[a]() a@b.c

.
<p>Link start.</p>
<p>[https://a.com</p>
<p>[http://a.com</p>
<p>[www.a.com</p>
<p>[<a href="mailto:a@b.c">a@b.c</a></p>
<p>Label end.</p>
<p><a href="https://a.com%5D">https://a.com]</a></p>
<p><a href="http://a.com%5D">http://a.com]</a></p>
<p><a href="http://www.a.com%5D">www.a.com]</a></p>
<p><a href="mailto:a@b.c">a@b.c</a>]</p>
<p>Link start and label end.</p>
<p>[https://a.com]</p>
<p>[http://a.com]</p>
<p>[www.a.com]</p>
<p>[<a href="mailto:a@b.c">a@b.c</a>]</p>
<p>What naïvely seems like a label end (A).</p>
<p><a href="https://a.com%60%5D%60">https://a.com`]`</a></p>
<p><a href="http://a.com%60%5D%60">http://a.com`]`</a></p>
<p><a href="http://www.a.com%60%5D%60">www.a.com`]`</a></p>
<p><a href="mailto:a@b.c">a@b.c</a><code class="notranslate">]</code></p>
<p>Link start and what naïvely seems like a balanced brace (B).</p>
<p>[https://a.com<code class="notranslate">]</code></p>
<p>[http://a.com<code class="notranslate">]</code></p>
<p>[www.a.com<code class="notranslate">]</code></p>
<p>[<a href="mailto:a@b.c">a@b.c</a><code class="notranslate">]</code></p>
<p>What naïvely seems like a label end (C).</p>
<p><a href="https://a.com">https://a.com</a> <code class="notranslate">]</code></p>
<p><a href="http://a.com">http://a.com</a> <code class="notranslate">]</code></p>
<p><a href="http://www.a.com">www.a.com</a> <code class="notranslate">]</code></p>
<p><a href="mailto:a@b.c">a@b.c</a> <code class="notranslate">]</code></p>
<p>Link start and what naïvely seems like a balanced brace (D).</p>
<p>[https://a.com <code class="notranslate">]</code></p>
<p>[http://a.com <code class="notranslate">]</code></p>
<p>[www.a.com <code class="notranslate">]</code></p>
<p>[<a href="mailto:a@b.c">a@b.c</a> <code class="notranslate">]</code></p>
<p>Link label with reference.</p>
<p><a href="#">https://a.com</a></p>
<p><a href="#">http://a.com</a></p>
<p><a href="#">www.a.com</a></p>
<p><a href="#">a@b.c</a></p>
<p>Link label with resource.</p>
<p><a href="">https://a.com</a></p>
<p><a href="">http://a.com</a></p>
<p><a href="">www.a.com</a></p>
<p><a href="">a@b.c</a></p>
<p>More in link.</p>
<p><a href="">a https://b.com c</a></p>
<p><a href="">a http://b.com c</a></p>
<p><a href="">a www.b.com c</a></p>
<p><a href="">a b@c.d e</a></p>
<p>Autolink literal after link.</p>
<p><a href="">a</a> <a href="https://a.com">https://a.com</a></p>
<p><a href="">a</a> <a href="http://a.com">http://a.com</a></p>
<p><a href="">a</a> <a href="http://www.a.com">www.a.com</a></p>
<p><a href="">a</a> <a href="mailto:a@b.c">a@b.c</a></p>

```

## email-tld-digits.md

```example 8
a@0.0

a@0.b

a@a.29

a@a.b

a@0.0.c

react@0.11.1

react@0.12.0-rc1

react@0.14.0-alpha1

react@16.7.0-alpha.2

react@0.0.0-experimental-aae83a4b9

[ react@0.11.1

[ react@0.12.0-rc1

[ react@0.14.0-alpha1

[ react@16.7.0-alpha.2

[ react@0.0.0-experimental-aae83a4b9

.
<p>a@0.0</p>
<p><a href="mailto:a@0.b">a@0.b</a></p>
<p>a@a.29</p>
<p><a href="mailto:a@a.b">a@a.b</a></p>
<p><a href="mailto:a@0.0.c">a@0.0.c</a></p>
<p>react@0.11.1</p>
<p>react@0.12.0-rc1</p>
<p>react@0.14.0-alpha1</p>
<p>react@16.7.0-alpha.2</p>
<p>react@0.0.0-experimental-aae83a4b9</p>
<p>[ react@0.11.1</p>
<p>[ react@0.12.0-rc1</p>
<p>[ react@0.14.0-alpha1</p>
<p>[ react@16.7.0-alpha.2</p>
<p>[ react@0.0.0-experimental-aae83a4b9</p>

```

## links-autolink-literals-and-characters.md

```example 9
[www.example.com/a&copy;](#)

www.example.com/a&copy;

[www.example.com/a&bogus;](#)

www.example.com/a&bogus;

[www.example.com/a\.](#)

www.example.com/a\.

.
<p><a href="#">www.example.com/a©</a></p>
<p><a href="http://www.example.com/a">www.example.com/a</a>©</p>
<p><a href="#">www.example.com/a&#x26;bogus;</a></p>
<p><a href="http://www.example.com/a">www.example.com/a</a>&#x26;bogus;</p>
<p><a href="#">www.example.com/a.</a></p>
<p><a href="http://www.example.com/a%5C">www.example.com/a\</a>.</p>

```

## path-or-link-end.md

```example 10
In autolink literal path or link end?

[https://a.com/d]()

[http://a.com/d]()

[www.a.com/d]()

https://a.com/d]()

http://a.com/d]()

www.a.com/d]()

In autolink literal search or link end?

[https://a.com?d]()

[http://a.com?d]()

[www.a.com?d]()

https://a.com?d]()

http://a.com?d]()

www.a.com?d]()

In autolink literal hash or link end?

[https://a.com#d]()

[http://a.com#d]()

[www.a.com#d]()

https://a.com#d]()

http://a.com#d]()

www.a.com#d]()

.
<p>In autolink literal path or link end?</p>
<p><a href="">https://a.com/d</a></p>
<p><a href="">http://a.com/d</a></p>
<p><a href="">www.a.com/d</a></p>
<p><a href="https://a.com/d%5D()">https://a.com/d]()</a></p>
<p><a href="http://a.com/d%5D()">http://a.com/d]()</a></p>
<p><a href="http://www.a.com/d%5D()">www.a.com/d]()</a></p>
<p>In autolink literal search or link end?</p>
<p><a href="">https://a.com?d</a></p>
<p><a href="">http://a.com?d</a></p>
<p><a href="">www.a.com?d</a></p>
<p><a href="https://a.com?d%5D()">https://a.com?d]()</a></p>
<p><a href="http://a.com?d%5D()">http://a.com?d]()</a></p>
<p><a href="http://www.a.com?d%5D()">www.a.com?d]()</a></p>
<p>In autolink literal hash or link end?</p>
<p><a href="">https://a.com#d</a></p>
<p><a href="">http://a.com#d</a></p>
<p><a href="">www.a.com#d</a></p>
<p><a href="https://a.com#d%5D()">https://a.com#d]()</a></p>
<p><a href="http://a.com#d%5D()">http://a.com#d]()</a></p>
<p><a href="http://www.a.com#d%5D()">www.a.com#d]()</a></p>

```

## previous.comment.md › HTTP

```example 11
# HTTP

https://a.b can start after EOF

Can start after EOL:
https://a.b

Can start after tab:→https://a.b.

Can start after space: https://a.b.

Can start after left paren (https://a.b.

Can start after asterisk *https://a.b.

Can start after underscore *_https://a.b.

Can start after tilde ~https://a.b.


.
<h1>HTTP</h1>
<p><a href="https://a.b">https://a.b</a> can start after EOF</p>
<p>Can start after EOL:<br>
<a href="https://a.b">https://a.b</a></p>
<p>Can start after tab:→<a href="https://a.b">https://a.b</a>.</p>
<p>Can start after space: <a href="https://a.b">https://a.b</a>.</p>
<p>Can start after left paren (<a href="https://a.b">https://a.b</a>.</p>
<p>Can start after asterisk *<a href="https://a.b">https://a.b</a>.</p>
<p>Can start after underscore *_<a href="https://a.b">https://a.b</a>.</p>
<p>Can start after tilde ~<a href="https://a.b">https://a.b</a>.</p>

```

## previous.comment.md › www

```example 12
# www

www.a.b can start after EOF

Can start after EOL:
www.a.b

Can start after tab:→www.a.b.

Can start after space: www.a.b.

Can start after left paren (www.a.b.

Can start after asterisk *www.a.b.

Can start after underscore *_www.a.b.

Can start after tilde ~www.a.b.


.
<h1>www</h1>
<p><a href="http://www.a.b">www.a.b</a> can start after EOF</p>
<p>Can start after EOL:<br>
<a href="http://www.a.b">www.a.b</a></p>
<p>Can start after tab:→<a href="http://www.a.b">www.a.b</a>.</p>
<p>Can start after space: <a href="http://www.a.b">www.a.b</a>.</p>
<p>Can start after left paren (<a href="http://www.a.b">www.a.b</a>.</p>
<p>Can start after asterisk *<a href="http://www.a.b">www.a.b</a>.</p>
<p>Can start after underscore *_<a href="http://www.a.b">www.a.b</a>.</p>
<p>Can start after tilde ~<a href="http://www.a.b">www.a.b</a>.</p>

```

## previous.comment.md › Correct character before

```example 13
## Correct character before

a@b.c can start after EOF

Can start after EOL:
a@b.c

Can start after tab:→a@b.c.

Can start after space: a@b.c.

Can start after left paren(a@b.c.

Can start after asterisk*a@b.c.

While theoretically it’s possible to start at an underscore, that underscore
is part of the email, so it’s in fact part of the link: _a@b.c.

Can start after tilde~a@b.c.


.
<h2>Correct character before</h2>
<p><a href="mailto:a@b.c">a@b.c</a> can start after EOF</p>
<p>Can start after EOL:<br>
<a href="mailto:a@b.c">a@b.c</a></p>
<p>Can start after tab:→<a href="mailto:a@b.c">a@b.c</a>.</p>
<p>Can start after space: <a href="mailto:a@b.c">a@b.c</a>.</p>
<p>Can start after left paren(<a href="mailto:a@b.c">a@b.c</a>.</p>
<p>Can start after asterisk*<a href="mailto:a@b.c">a@b.c</a>.</p>
<p>While theoretically it’s possible to start at an underscore, that underscore<br>
is part of the email, so it’s in fact part of the link: <a href="mailto:_a@b.c">_a@b.c</a>.</p>
<p>Can start after tilde~<a href="mailto:a@b.c">a@b.c</a>.</p>

```

## previous.comment.md › Others characters before

```example 14
## Others characters before

While other characters before the email aren’t allowed by GFM, they work on
github.com: !a@b.c, "a@b.c, #a@b.c, $a@b.c, &a@b.c, 'a@b.c, )a@b.c, +a@b.c,
,a@b.c, -a@b.c, .a@b.c, /a@b.c, :a@b.c, ;a@b.c, <a@b.c, =a@b.c, >a@b.c, ?a@b.c,
@a@b.c, \a@b.c, ]a@b.c, ^a@b.c, `a@b.c, {a@b.c, }a@b.c.


.
<h2>Others characters before</h2>
<p>While other characters before the email aren’t allowed by GFM, they work on<br>
github.com: !<a href="mailto:a@b.c">a@b.c</a>, "<a href="mailto:a@b.c">a@b.c</a>, #<a href="mailto:a@b.c">a@b.c</a>, $<a href="mailto:a@b.c">a@b.c</a>, &#x26;<a href="mailto:a@b.c">a@b.c</a>, '<a href="mailto:a@b.c">a@b.c</a>, )<a href="mailto:a@b.c">a@b.c</a>, <a href="mailto:+a@b.c">+a@b.c</a>,<br>
,<a href="mailto:a@b.c">a@b.c</a>, <a href="mailto:-a@b.c">-a@b.c</a>, <a href="mailto:.a@b.c">.a@b.c</a>, /<a href="mailto:a@b.c">a@b.c</a>, :<a href="mailto:a@b.c">a@b.c</a>, ;<a href="mailto:a@b.c">a@b.c</a>, &#x3C;<a href="mailto:a@b.c">a@b.c</a>, =<a href="mailto:a@b.c">a@b.c</a>, ><a href="mailto:a@b.c">a@b.c</a>, ?<a href="mailto:a@b.c">a@b.c</a>,<br>
@<a href="mailto:a@b.c">a@b.c</a>, \<a href="mailto:a@b.c">a@b.c</a>, ]<a href="mailto:a@b.c">a@b.c</a>, ^<a href="mailto:a@b.c">a@b.c</a>, `<a href="mailto:a@b.c">a@b.c</a>, {<a href="mailto:a@b.c">a@b.c</a>, }<a href="mailto:a@b.c">a@b.c</a>.</p>

```

## previous.comment.md › Commas

```example 15
## Commas

See `https://github.com/remarkjs/remark/discussions/678`.

,https://github.com

[ ,https://github.com

[asd] ,https://github.com

.
<h2>Commas</h2>
<p>See <code class="notranslate">https://github.com/remarkjs/remark/discussions/678</code>.</p>
<p>,<a href="https://github.com">https://github.com</a></p>
<p>[ ,https://github.com</p>
<p>[asd] ,<a href="https://github.com">https://github.com</a></p>

```

## micromark-extension-gfm-autolink-literal › should support a closing paren at TLD

```example 16
www.a.)
.
<p><a href="http://www.a">www.a</a>.)</p>
```

## micromark-extension-gfm-autolink-literal › should support a no TLD

```example 17
www.a b
.
<p><a href="http://www.a">www.a</a> b</p>
```

## micromark-extension-gfm-autolink-literal › should support a path instead of TLD

```example 18
www.a/b c
.
<p><a href="http://www.a/b">www.a/b</a> c</p>
```

## micromark-extension-gfm-autolink-literal › should support a replacement character in a domain

```example 19
www.�a
.
<p><a href="http://www.%EF%BF%BDa">www.�a</a></p>
```

## micromark-extension-gfm-autolink-literal › should support non-ascii characters in a domain (http)

```example 20
http://點看.com
.
<p><a href="http://%E9%BB%9E%E7%9C%8B.com">http://點看.com</a></p>
```

## micromark-extension-gfm-autolink-literal › should *not* support non-ascii characters in atext (email)

```example 21
點看@example.com
.
<p>點看@example.com</p>
```

## micromark-extension-gfm-autolink-literal › should *not* support non-ascii characters in a domain (email)

```example 22
example@點看.com
.
<p>example@點看.com</p>
```

## micromark-extension-gfm-autolink-literal › should support non-ascii characters in a domain (www)

```example 23
www.點看.com
.
<p><a href="http://www.%E9%BB%9E%E7%9C%8B.com">www.點看.com</a></p>
```

## micromark-extension-gfm-autolink-literal › should support non-ascii characters in a path

```example 24
www.a.com/點看
.
<p><a href="http://www.a.com/%E9%BB%9E%E7%9C%8B">www.a.com/點看</a></p>
```

## micromark-extension-gfm-autolink-literal › should support a dash to start a domain

```example 25
www.-a.b
.
<p><a href="http://www.-a.b">www.-a.b</a></p>
```

## micromark-extension-gfm-autolink-literal › should support a dollar as a domain name

```example 26
www.$
.
<p><a href="http://www.$">www.$</a></p>
```

## micromark-extension-gfm-autolink-literal › should support adjacent dots in a domain name

```example 27
www.a..b.c
.
<p><a href="http://www.a..b.c">www.a..b.c</a></p>
```

## micromark-extension-gfm-autolink-literal › should support named character references in domains

```example 28
www.a&a;
.
<p><a href="http://www.a">www.a</a>&amp;a;</p>
```

## micromark-extension-gfm-autolink-literal › should support a closing paren and period after a path

```example 29
https://a.bc/d/e/).
.
<p><a href="https://a.bc/d/e/">https://a.bc/d/e/</a>).</p>
```

## micromark-extension-gfm-autolink-literal › should support a period and closing paren after a path

```example 30
https://a.bc/d/e/.)
.
<p><a href="https://a.bc/d/e/">https://a.bc/d/e/</a>.)</p>
```

## micromark-extension-gfm-autolink-literal › should support a closing paren and period after a domain

```example 31
https://a.bc).
.
<p><a href="https://a.bc">https://a.bc</a>).</p>
```

## micromark-extension-gfm-autolink-literal › should support a period and closing paren after a domain

```example 32
https://a.bc.)
.
<p><a href="https://a.bc">https://a.bc</a>.)</p>
```

## micromark-extension-gfm-autolink-literal › should support a closing paren and period in a path

```example 33
https://a.bc).d
.
<p><a href="https://a.bc).d">https://a.bc).d</a></p>
```

## micromark-extension-gfm-autolink-literal › should support a period and closing paren in a path

```example 34
https://a.bc.)d
.
<p><a href="https://a.bc.)d">https://a.bc.)d</a></p>
```

## micromark-extension-gfm-autolink-literal › should support two closing parens in a path

```example 35
https://a.bc/))d
.
<p><a href="https://a.bc/))d">https://a.bc/))d</a></p>
```

## micromark-extension-gfm-autolink-literal › should not support ftp links

```example 36
ftp://a/b/c.txt
.
<p>ftp://a/b/c.txt</p>
```

## micromark-extension-gfm-autolink-literal › should support http links after Unicode punctuation

```example 37
，https://example.com
.
<p>，<a href="https://example.com">https://example.com</a></p>
```

## micromark-extension-gfm-autolink-literal › should support email links after Unicode punctuation

```example 38
，example@example.com
.
<p>，<a href="mailto:example@example.com">example@example.com</a></p>
```

## micromark-extension-gfm-autolink-literal › should not link character reference for `:`

```example 39
http&#x3A;//user:password@host:port/path?key=value#fragment
.
<p>http://user:password@host:port/path?key=value#fragment</p>
```
