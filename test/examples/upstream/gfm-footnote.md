---
source: gfm-footnote
url: https://github.com/micromark/micromark-extension-gfm-footnote/tree/0a62fad40470f2447707020c52d38d1494199ee1/test
commit: 0a62fad40470f2447707020c52d38d1494199ee1
checks: oracle
---

# micromark-extension-gfm-footnote

## bang-caret.md

```example 1
a![^1]

[^1]: b

.
<p>a!<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>b <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## calls.md

```example 2
Calls may not be empty: [^].

Calls cannot contain whitespace only: [^ ].

Calls cannot contain whitespace at all: [^ ], [^→], [^
].

Calls can contain other characters, such as numbers [^1234567890], or [^^]
even another caret.

[^]: empty

[^ ]: space

[^→]: tab

[^
]&#x3A; line feed

[^1234567890]: numbers

[^^]: caret

.
<p>Calls may not be empty: <a href="empty">^</a>.</p>
<p>Calls cannot contain whitespace only: <a href="empty">^ </a>.</p>
<p>Calls cannot contain whitespace at all: <a href="empty">^ </a>, <a href="empty">^→</a>, <a href="empty">^
</a>.</p>
<p>Calls can contain other characters, such as numbers <sup><a href="#user-content-fn-1234567890" id="user-content-fnref-1234567890" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup>, or <sup><a href="#user-content-fn-%5E" id="user-content-fnref-%5e" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup>
even another caret.</p>
<p><a href="empty">^
</a>: line feed</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1234567890">
<p>numbers <a href="#user-content-fnref-1234567890" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-%5E">
<p>caret <a href="#user-content-fnref-%5E" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## definitions.md

```example 3
Note![^0][^1][^2][^3][^4][^5][^6][^7][^8][^9][^10]

[^0]: alpha

[^1]: bravo

[^2]: charlie
    indented delta

[^3]:    echo

[^4]:     foxtrot

[^5]:> golf

[^6]:    > hotel

[^7]:     > india

[^8]: # juliett

[^9]: ---

[^10]:- - - kilo

.
<p>Note!<sup><a href="#user-content-fn-0" id="user-content-fnref-0" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">5</a></sup><sup><a href="#user-content-fn-5" id="user-content-fnref-5" data-footnote-ref="" aria-describedby="footnote-label">6</a></sup><sup><a href="#user-content-fn-6" id="user-content-fnref-6" data-footnote-ref="" aria-describedby="footnote-label">7</a></sup><sup><a href="#user-content-fn-7" id="user-content-fnref-7" data-footnote-ref="" aria-describedby="footnote-label">8</a></sup><sup><a href="#user-content-fn-8" id="user-content-fnref-8" data-footnote-ref="" aria-describedby="footnote-label">9</a></sup><sup><a href="#user-content-fn-9" id="user-content-fnref-9" data-footnote-ref="" aria-describedby="footnote-label">10</a></sup><sup><a href="#user-content-fn-10" id="user-content-fnref-10" data-footnote-ref="" aria-describedby="footnote-label">11</a></sup></p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-0">
<p>alpha <a href="#user-content-fnref-0" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-1">
<p>bravo <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-2">
<p>charlie
indented delta <a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-3">
<p>echo <a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-4">
<p>foxtrot <a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 5" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-5">
<blockquote>
<p>golf</p>
</blockquote>
<a href="#user-content-fnref-5" data-footnote-backref="" aria-label="Back to reference 6" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-6">
<blockquote>
<p>hotel</p>
</blockquote>
<a href="#user-content-fnref-6" data-footnote-backref="" aria-label="Back to reference 7" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-7">
<blockquote>
<p>india</p>
</blockquote>
<a href="#user-content-fnref-7" data-footnote-backref="" aria-label="Back to reference 8" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-8">
<h1>juliett</h1>
<a href="#user-content-fnref-8" data-footnote-backref="" aria-label="Back to reference 9" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-9">
<hr />
<a href="#user-content-fnref-9" data-footnote-backref="" aria-label="Back to reference 10" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-10">
<ul>
<li>
<ul>
<li>
<ul>
<li>kilo</li>
</ul>
</li>
</ul>
</li>
</ul>
<a href="#user-content-fnref-10" data-footnote-backref="" aria-label="Back to reference 11" class="data-footnote-backref">↩</a>
</li>
</ol>
</section>

```

## images-or-footnotes.md

```example 4
What are these![^1], ![^2][], and ![this][^3].

[^1]: a

[^2]: b

[^3]: c

.
<p>What are these!<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup>, !<sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup>[], and ![this]<sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup>.</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>a <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-2">
<p>b <a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-3">
<p>c <a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## inline-notes-pandoc.md

```example 5
Here is an inline note.^[Inlines notes are easier to write, since
you don’t have to pick an identifier and move down to type the
note.]

.
<p>Here is an inline note.^[Inlines notes are easier to write, since
you don’t have to pick an identifier and move down to type the
note.]</p>

```

## links-or-footnotes.md

```example 6
What are these[^1], [^2][], and [this][^3].

[^1]: a

[^2]: b

[^3]: c

.
<p>What are these<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup>, <sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup>[], and [this]<sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup>.</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>a <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-2">
<p>b <a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-3">
<p>c <a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## references-and-definitions.md

```example 7
Here is a short reference,[1], a collapsed one,[2][], and a full [one][3].

[1]: a

[2]: b

[3]: c

.
<p>Here is a short reference,<a href="a">1</a>, a collapsed one,<a href="b">2</a>, and a full <a href="c">one</a>.</p>

```

## micromark-extension-gfm-footnote › should not support inline footnotes

```example 8
^[inline]
.
<p>^[inline]</p>
```

## micromark-extension-gfm-footnote › should ignore definitions w/o calls

```example 9
A paragraph.

[^a]: whatevs
.
<p>A paragraph.</p>

```

## micromark-extension-gfm-footnote › should support calls and definitions

```example 10
A call.[^a]

[^a]: whatevs
.
<p>A call.<sup><a href="#user-content-fn-a" id="user-content-fnref-a" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-a">
<p>whatevs <a href="#user-content-fnref-a" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>
```

## micromark-extension-gfm-footnote › should support a character escape in a call / definition

```example 11
Call.[^a\+b].

[^a\+b]: y
.
<p>Call.<sup><a href="#user-content-fn-a%5C+b" id="user-content-fnref-a%5C+b" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup>.</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-a%5C+b">
<p>y <a href="#user-content-fnref-a%5C+b" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>
```

## micromark-extension-gfm-footnote › should support a character reference in a call / definition

```example 12
Call.[^a&copy;b].

[^a&copy;b]: y
.
<p>Call.<sup><a href="#user-content-fn-a&amp;copy;b" id="user-content-fnref-a&amp;copy;b" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup>.</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-a&amp;copy;b">
<p>y <a href="#user-content-fnref-a&amp;copy;b" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>
```

## micromark-extension-gfm-footnote › should support a useful character escape in a call / definition

```example 13
Call.[^a\]b].

[^a\]b]: y
.
<p>Call.<sup><a href="#user-content-fn-a%5C%5Db" id="user-content-fnref-a%5C%5Db" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup>.</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-a%5C%5Db">
<p>y <a href="#user-content-fnref-a%5C%5Db" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>
```

## micromark-extension-gfm-footnote › should support a useful character reference in a call / definition

```example 14
Call.[^a&#91;b].

[^a&#91;b]: y
.
<p>Call.<sup><a href="#user-content-fn-a&amp;#91;b" id="user-content-fnref-a&amp;#91;b" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup>.</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-a&amp;#91;b">
<p>y <a href="#user-content-fnref-a&amp;#91;b" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>
```

## micromark-extension-gfm-footnote › should match calls to definitions on the source of the label, not on resolved escapes

```example 15
Call.[^a\+b].

[^a+b]: y
.
<p>Call.[^a+b].</p>

```

## micromark-extension-gfm-footnote › should match calls to definitions on the source of the label, not on resolved references

```example 16
Call.[^a&#91;b].

[^a\[b]: y
.
<p>Call.[^a[b].</p>

```

## micromark-extension-gfm-footnote › should support lazyness (1)

```example 17
[^1].

[^1]: a
b
.
<p><sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup>.</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>a
b <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>
```

## micromark-extension-gfm-footnote › should support lazyness (2)

```example 18
[^1].

> [^1]: a
b
.
<p><sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup>.</p>
<blockquote>
</blockquote>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>a
b <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>
```

## micromark-extension-gfm-footnote › should support lazyness (3)

```example 19
[^1].

> [^1]: a
> b
.
<p><sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup>.</p>
<blockquote>
</blockquote>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>a
b <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>
```

## micromark-extension-gfm-footnote › should support lazyness (4)

```example 20
[^1].

[^1]: a

    > b
.
<p><sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup>.</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>a</p>
<blockquote>
<p>b</p>
</blockquote>
<a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a>
</li>
</ol>
</section>
```
