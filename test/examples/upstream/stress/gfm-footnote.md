---
source: gfm-footnote
url: https://github.com/micromark/micromark-extension-gfm-footnote/tree/0a62fad40470f2447707020c52d38d1494199ee1/test
commit: 0a62fad40470f2447707020c52d38d1494199ee1
checks: sound
---

# micromark-extension-gfm-footnote

## bang-caret-interplay.md

```example 1
a![i](#)
a\![i](#)
a![i][]
a![^1]
[^1]
^1]

[^1]: b

[i]: c

.
<p>a<img src="" alt="i" />
a!<a href="#">i</a>
a<img src="c" alt="i" />
a!<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup>
<sup><a href="#user-content-fn-1" id="user-content-fnref-1-2" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup>
^1]</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>b <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a> <a href="#user-content-fnref-1-2" data-footnote-backref="" aria-label="Back to reference 1-2" class="data-footnote-backref">↩<sup>2</sup></a></p>
</li>
</ol>
</section>

```

## bang-caret-undefined.md

```example 2
a![^1]

.
<p>a![^1]</p>

```

## constructs-in-footnotes-after-blank.md

````example 3
Call[^1][^2][^3][^4][^5][^6][^7][^8][^9][^10].

[^1]:
    > Block quote?

[^2]:
    ```js
    function a() {
      return 1 // fenced code?
    }
    ```

[^3]:
        indented code?

[^4]:
    [x]: definition?

[^5]:
    # heading (atx)?

[^6]:
    ***

[^7]:
    heading (setext)?
    ===================

[^8]:
    <div>html?</div>

[^9]:
    * list item?

[^10]:
    paragraph?

.
<p>Call<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup><sup><a href="#user-content-fn-5" id="user-content-fnref-5" data-footnote-ref="" aria-describedby="footnote-label">5</a></sup><sup><a href="#user-content-fn-6" id="user-content-fnref-6" data-footnote-ref="" aria-describedby="footnote-label">6</a></sup><sup><a href="#user-content-fn-7" id="user-content-fnref-7" data-footnote-ref="" aria-describedby="footnote-label">7</a></sup><sup><a href="#user-content-fn-8" id="user-content-fnref-8" data-footnote-ref="" aria-describedby="footnote-label">8</a></sup><sup><a href="#user-content-fn-9" id="user-content-fnref-9" data-footnote-ref="" aria-describedby="footnote-label">9</a></sup><sup><a href="#user-content-fn-10" id="user-content-fnref-10" data-footnote-ref="" aria-describedby="footnote-label">10</a></sup>.</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<blockquote>
<p>Block quote?</p>
</blockquote>
<a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-2">
<pre lang="js"><code>function a() {
  return 1 // fenced code?
}
</code></pre>
<a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-3">
<pre><code>indented code?
</code></pre>
<a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-4">
<a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-5">
<h1>heading (atx)?</h1>
<a href="#user-content-fnref-5" data-footnote-backref="" aria-label="Back to reference 5" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-6">
<hr />
<a href="#user-content-fnref-6" data-footnote-backref="" aria-label="Back to reference 6" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-7">
<h1>heading (setext)?</h1>
<a href="#user-content-fnref-7" data-footnote-backref="" aria-label="Back to reference 7" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-8">
<div>html?</div>
<a href="#user-content-fnref-8" data-footnote-backref="" aria-label="Back to reference 8" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-9">
<ul>
<li>list item?</li>
</ul>
<a href="#user-content-fnref-9" data-footnote-backref="" aria-label="Back to reference 9" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-10">
<p>paragraph? <a href="#user-content-fnref-10" data-footnote-backref="" aria-label="Back to reference 10" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

````

## constructs-in-footnotes-first.md

````example 4
Call[^1][^2][^3][^4][^5][^6][^7][^8][^9][^10].

[^1]: > Block quote?

[^2]: ```js
    function a() {
      return 1 // fenced code?
    }
    ```

[^3]:     indented code?

[^4]: [x]: definition?

[^5]: # heading (atx)?

[^6]: ***

[^7]: heading (setext)?
    ===================

[^8]: <div>html?</div>

[^9]: * list item?

[^10]: paragraph?

.
<p>Call<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup><sup><a href="#user-content-fn-5" id="user-content-fnref-5" data-footnote-ref="" aria-describedby="footnote-label">5</a></sup><sup><a href="#user-content-fn-6" id="user-content-fnref-6" data-footnote-ref="" aria-describedby="footnote-label">6</a></sup><sup><a href="#user-content-fn-7" id="user-content-fnref-7" data-footnote-ref="" aria-describedby="footnote-label">7</a></sup><sup><a href="#user-content-fn-8" id="user-content-fnref-8" data-footnote-ref="" aria-describedby="footnote-label">8</a></sup><sup><a href="#user-content-fn-9" id="user-content-fnref-9" data-footnote-ref="" aria-describedby="footnote-label">9</a></sup><sup><a href="#user-content-fn-10" id="user-content-fnref-10" data-footnote-ref="" aria-describedby="footnote-label">10</a></sup>.</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<blockquote>
<p>Block quote?</p>
</blockquote>
<a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-2">
<pre lang="js"><code>function a() {
  return 1 // fenced code?
}
</code></pre>
<a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-3">
<p>indented code? <a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-4">
<a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-5">
<h1>heading (atx)?</h1>
<a href="#user-content-fnref-5" data-footnote-backref="" aria-label="Back to reference 5" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-6">
<hr />
<a href="#user-content-fnref-6" data-footnote-backref="" aria-label="Back to reference 6" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-7">
<h1>heading (setext)?</h1>
<a href="#user-content-fnref-7" data-footnote-backref="" aria-label="Back to reference 7" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-8">
<div>html?</div>
<a href="#user-content-fnref-8" data-footnote-backref="" aria-label="Back to reference 8" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-9">
<ul>
<li>list item?</li>
</ul>
<a href="#user-content-fnref-9" data-footnote-backref="" aria-label="Back to reference 9" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-10">
<p>paragraph? <a href="#user-content-fnref-10" data-footnote-backref="" aria-label="Back to reference 10" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

````

## constructs-in-footnotes-rest.md

````example 5
Call[^1][^2][^3][^4][^5][^6][^7][^8][^9][^10].

[^1]: a

    > Block quote?

[^2]: a

    ```js
    function a() {
      return 1 // fenced code?
    }
    ```

[^3]: a

        indented code?

[^4]: a

    [x]: definition?

[^5]: a

    # heading (atx)?

[^6]: a

    ***

[^7]: a

    heading (setext)?
    ===================

[^8]: a

    <div>html?</div>

[^9]: a

    * list item?

[^10]: a

    paragraph?

.
<p>Call<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup><sup><a href="#user-content-fn-5" id="user-content-fnref-5" data-footnote-ref="" aria-describedby="footnote-label">5</a></sup><sup><a href="#user-content-fn-6" id="user-content-fnref-6" data-footnote-ref="" aria-describedby="footnote-label">6</a></sup><sup><a href="#user-content-fn-7" id="user-content-fnref-7" data-footnote-ref="" aria-describedby="footnote-label">7</a></sup><sup><a href="#user-content-fn-8" id="user-content-fnref-8" data-footnote-ref="" aria-describedby="footnote-label">8</a></sup><sup><a href="#user-content-fn-9" id="user-content-fnref-9" data-footnote-ref="" aria-describedby="footnote-label">9</a></sup><sup><a href="#user-content-fn-10" id="user-content-fnref-10" data-footnote-ref="" aria-describedby="footnote-label">10</a></sup>.</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>a</p>
<blockquote>
<p>Block quote?</p>
</blockquote>
<a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-2">
<p>a</p>
<pre lang="js"><code>function a() {
  return 1 // fenced code?
}
</code></pre>
<a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-3">
<p>a</p>
<pre><code>indented code?
</code></pre>
<a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-4">
<p>a <a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-5">
<p>a</p>
<h1>heading (atx)?</h1>
<a href="#user-content-fnref-5" data-footnote-backref="" aria-label="Back to reference 5" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-6">
<p>a</p>
<hr />
<a href="#user-content-fnref-6" data-footnote-backref="" aria-label="Back to reference 6" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-7">
<p>a</p>
<h1>heading (setext)?</h1>
<a href="#user-content-fnref-7" data-footnote-backref="" aria-label="Back to reference 7" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-8">
<p>a</p>
<div>html?</div>
<a href="#user-content-fnref-8" data-footnote-backref="" aria-label="Back to reference 8" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-9">
<p>a</p>
<ul>
<li>list item?</li>
</ul>
<a href="#user-content-fnref-9" data-footnote-backref="" aria-label="Back to reference 9" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-10">
<p>a</p>
<p>paragraph? <a href="#user-content-fnref-10" data-footnote-backref="" aria-label="Back to reference 10" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

````

## constructs-in-identifiers.md

```example 6
[^*emphasis*]

[^**strong**]

[^`code`]

[^www.example.com]

[^https://example.com]

[^://example.com]

[^[link](#)]

[^![image](#)]

[^*emphasis*]: a

[^**strong**]: a

[^`code`]: a

[^www.example.com]: a

[^https://example.com]: a

[^://example.com]: a

[^[link](#)]: a

[^![image](#)]: a

.
<p><sup><a href="#user-content-fn-*emphasis*" id="user-content-fnref-*emphasis*" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></p>
<p><sup><a href="#user-content-fn-**strong**" id="user-content-fnref-**strong**" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup></p>
<p><sup><a href="#user-content-fn-%60code%60" id="user-content-fnref-%60code%60" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup></p>
<p><sup><a href="#user-content-fn-www.example.com" id="user-content-fnref-www.example.com" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup></p>
<p><sup><a id="user-content-fnref-https://example.com" data-footnote-ref="" aria-describedby="footnote-label">5</a></sup></p>
<p><sup><a id="user-content-fnref-://example.com" data-footnote-ref="" aria-describedby="footnote-label">6</a></sup></p>
<p>[^<a href="#">link</a>]</p>
<p>[^![image](#)]</p>
<p>[^<a href="#">link</a>]: a</p>
<p>[^![image](#)]: a</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-*emphasis*">
<p>a <a href="#user-content-fnref-*emphasis*" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-**strong**">
<p>a <a href="#user-content-fnref-**strong**" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-%60code%60">
<p>a <a href="#user-content-fnref-%60code%60" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-www.example.com">
<p>a <a href="#user-content-fnref-www.example.com" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-https://example.com">
<p>a ↩</p>
</li>
<li id="user-content-fn-://example.com">
<p>a ↩</p>
</li>
</ol>
</section>

```

## containers.md

```example 7
Call[^1][^2][^3][^4]

> [^1]: Defined in a block quote.
>
> More.
[^2]: Directly after a block quote.

* [^3]: Defined in a list item.

  More.
[^4]: Directly after a list item.

.
<p>Call<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup></p>
<blockquote>
<p>More.</p>
</blockquote>
<ul>
<li>
<p>More.</p>
</li>
</ul>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>Defined in a block quote. <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-2">
<p>Directly after a block quote. <a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-3">
<p>Defined in a list item. <a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-4">
<p>Directly after a list item. <a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## continuation.md

```example 8
[^1][^2][^3][^4]

[^1]: Paragraph
…continuation


.
<p><sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup></p>

```

## continuation.md › Heading

```example 9
# Heading

[^2]: Paragraph
…continuation

    “code”, which is paragraphs…

    …because of the indent!

[^3]: Paragraph
…continuation

> block quote

[^4]: Paragraph
…continuation

- list

.
<h1>Heading</h1>
<blockquote>
<p>block quote</p>
</blockquote>
<ul>
<li>list</li>
</ul>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>Paragraph
…continuation <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-2">
<p>Paragraph
…continuation</p>
<p>“code”, which is paragraphs…</p>
<p>…because of the indent! <a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-3">
<p>Paragraph
…continuation <a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-4">
<p>Paragraph
…continuation <a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## definitions-initial-blank.md

```example 10
Call[^1][^2][^3][^4][^5].

[^1]:
    ---

[^2]:
    Paragraph.

[^3]:
Lazy?

[^4]:

    Another blank.

[^5]:

Lazy!

.
<p>Call<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup><sup><a href="#user-content-fn-5" id="user-content-fnref-5" data-footnote-ref="" aria-describedby="footnote-label">5</a></sup>.</p>
<p>Lazy?</p>
<p>Lazy!</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<hr />
<a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-2">
<p>Paragraph. <a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-3">
<a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-4">
<p>Another blank. <a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-5">
<a href="#user-content-fnref-5" data-footnote-backref="" aria-label="Back to reference 5" class="data-footnote-backref">↩</a>
</li>
</ol>
</section>

```

## duplicate-calls.md

```example 11
Call[^1][^1]

[^1]: Recursion[^1][^1]

.
<p>Call<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-1" id="user-content-fnref-1-2" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>Recursion<sup><a href="#user-content-fn-1" id="user-content-fnref-1-3" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-1" id="user-content-fnref-1-4" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup> <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a> <a href="#user-content-fnref-1-2" data-footnote-backref="" aria-label="Back to reference 1-2" class="data-footnote-backref">↩<sup>2</sup></a> <a href="#user-content-fnref-1-3" data-footnote-backref="" aria-label="Back to reference 1-3" class="data-footnote-backref">↩<sup>3</sup></a> <a href="#user-content-fnref-1-4" data-footnote-backref="" aria-label="Back to reference 1-4" class="data-footnote-backref">↩<sup>4</sup></a></p>
</li>
</ol>
</section>

```

## duplicate-definitions.md

```example 12
Call[^1]

[^1]: a

[^1]: b

.
<p>Call<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>a <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## footnotes-in-constructs.md

```example 13
*emphasis[^1]*

**strong[^2]**

`code[^3]`

![image[^4]](#)

[link[^5]](#)

[^1]: a

[^2]: b

[^3]: c

[^4]: d

[^5]: e

.
<p><em>emphasis<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></em></p>
<p><strong>strong<sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup></strong></p>
<p><code>code[^3]</code></p>
<p><img src="" alt="image" /></p>
<p><a href="#">link<sup></sup></a><a href="#user-content-fn-5" id="user-content-fnref-5" data-footnote-ref="" aria-describedby="footnote-label">4</a></p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>a <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-2">
<p>b <a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-4">
<p>d <a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-5">
<p>e <a href="#user-content-fnref-5" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## inline-notes.md

`````example 14
Here is an inline note.^[Inlines notes are easier to write, since
you don’t have to pick an identifier and move down to type the
note.]

alpha ^[one [balanced] three] bravo.

alpha ^[four [unbalanced five] bravo.

alpha ^[six unbalanced] seven] bravo.

alpha ^[eight escaped\] nine] bravo.

alpha ^[ten ^[nested] eleven] bravo.

alpha ^[twelve *emphasis] thirteen* bravo.

alpha ^[fourteen **emphasis] fifteen* bravo.

alpha ^[sixteen *emphasis] seventeen** bravo.

alpha ^[eighteen ![image](a) nineteen] bravo.

alpha ^[twenty [link](b) twenty one] bravo.

alpha ^[] bravo.

Mixing code with inline notes:

Inline note with ^[one ```code `` and such``` three] bravo.

Inline note with ^[one `code ```` and` three] bravo.

mixed ^[ with `code]`

.
<p>Here is an inline note.^[Inlines notes are easier to write, since
you don’t have to pick an identifier and move down to type the
note.]</p>
<p>alpha ^[one [balanced] three] bravo.</p>
<p>alpha ^[four [unbalanced five] bravo.</p>
<p>alpha ^[six unbalanced] seven] bravo.</p>
<p>alpha ^[eight escaped] nine] bravo.</p>
<p>alpha ^[ten ^[nested] eleven] bravo.</p>
<p>alpha ^[twelve <em>emphasis] thirteen</em> bravo.</p>
<p>alpha ^[fourteen *<em>emphasis] fifteen</em> bravo.</p>
<p>alpha ^[sixteen <em>emphasis] seventeen</em>* bravo.</p>
<p>alpha ^[eighteen <img src="a" alt="image" /> nineteen] bravo.</p>
<p>alpha ^[twenty <a href="b">link</a> twenty one] bravo.</p>
<p>alpha ^[] bravo.</p>
<p>Mixing code with inline notes:</p>
<p>Inline note with ^[one <code>code `` and such</code> three] bravo.</p>
<p>Inline note with ^[one <code>code ```` and</code> three] bravo.</p>
<p>mixed ^[ with <code>code]</code></p>

`````

## interrupt.md

```example 15
[^0][^1][^2][^3][^4][^5]

[^0]: Paragraph
…continuation
[^1]: Another
[^2]: Paragraph
…continuation

.
<p><sup><a href="#user-content-fn-0" id="user-content-fnref-0" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">5</a></sup><sup><a href="#user-content-fn-5" id="user-content-fnref-5" data-footnote-ref="" aria-describedby="footnote-label">6</a></sup></p>

```

## interrupt.md › Heading

```example 16
# Heading
[^3]: Paragraph
…continuation
    “code”, which is paragraphs…

    …because of the indent!
[^4]: Paragraph
…continuation
> block quote
[^5]: Paragraph
…continuation
*   list

.
<h1>Heading</h1>
<blockquote>
<p>block quote</p>
</blockquote>
<ul>
<li>list</li>
</ul>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-0">
<p>Paragraph
…continuation <a href="#user-content-fnref-0" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-1">
<p>Another <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-2">
<p>Paragraph
…continuation <a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-3">
<p>Paragraph
…continuation
“code”, which is paragraphs…</p>
<p>…because of the indent! <a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-4">
<p>Paragraph
…continuation <a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 5" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-5">
<p>Paragraph
…continuation <a href="#user-content-fnref-5" data-footnote-backref="" aria-label="Back to reference 6" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## many-blank-lines-no-indent.md

```example 17
[^1][^2][^3][^4]

[^1]: Paragraph



.
<p><sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup></p>

```

## many-blank-lines-no-indent.md › Heading

```example 18
# Heading


[^2]: Paragraph


    “code”, which is paragraphs…


    …because of the indent!


[^3]: Paragraph


> block quote


[^4]: Paragraph


- list

.
<h1>Heading</h1>
<blockquote>
<p>block quote</p>
</blockquote>
<ul>
<li>list</li>
</ul>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>Paragraph <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-2">
<p>Paragraph</p>
<p>“code”, which is paragraphs…</p>
<p>…because of the indent! <a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-3">
<p>Paragraph <a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-4">
<p>Paragraph <a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## many-blank-lines.md

```example 19
[^1][^2][^3][^4]

[^1]: Paragraph


    # Heading


[^2]: Paragraph


        code


        more code


[^3]: Paragraph


    > block quote


[^4]: Paragraph


    - list

.
<p><sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup></p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>Paragraph</p>
<h1>Heading</h1>
<a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-2">
<p>Paragraph</p>
<pre><code>code


more code
</code></pre>
<a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-3">
<p>Paragraph</p>
<blockquote>
<p>block quote</p>
</blockquote>
<a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-4">
<p>Paragraph</p>
<ul>
<li>list</li>
</ul>
<a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a>
</li>
</ol>
</section>

```

## nest.md

```example 20
Note![^1][^2][^3][^4]

- [^1]: Paragraph

> [^2]: Paragraph

[^3]: [^4]: Paragraph

.
<p>Note!<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup></p>
<ul>
<li></li>
</ul>
<blockquote>
</blockquote>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>Paragraph <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-2">
<p>Paragraph <a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-3">
<a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-4">
<p>Paragraph <a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## normal-blank-lines-no-indent.md

```example 21
[^1][^2][^3][^4]

[^1]: Paragraph


.
<p><sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup></p>

```

## normal-blank-lines-no-indent.md › Heading

```example 22
# Heading

[^2]: Paragraph

    “code”, which is paragraphs…

    …because of the indent!

[^3]: Paragraph

> block quote

[^4]: Paragraph

- list

.
<h1>Heading</h1>
<blockquote>
<p>block quote</p>
</blockquote>
<ul>
<li>list</li>
</ul>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>Paragraph <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-2">
<p>Paragraph</p>
<p>“code”, which is paragraphs…</p>
<p>…because of the indent! <a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-3">
<p>Paragraph <a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-4">
<p>Paragraph <a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## normal-blank-lines.md

```example 23
[^1][^2][^3][^4]

[^1]: Paragraph

    # Heading

[^2]: Paragraph

        code

        more code

[^3]: Paragraph

    > block quote

[^4]: Paragraph

    - list

.
<p><sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup></p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>Paragraph</p>
<h1>Heading</h1>
<a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-2">
<p>Paragraph</p>
<pre><code>code

more code
</code></pre>
<a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-3">
<p>Paragraph</p>
<blockquote>
<p>block quote</p>
</blockquote>
<a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-4">
<p>Paragraph</p>
<ul>
<li>list</li>
</ul>
<a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a>
</li>
</ol>
</section>

```

## pandoc.md

```example 24
Here is a footnote reference,[^1] and another.[^longnote]

[^1]: Here is the footnote.

[^longnote]: Here’s one with multiple blocks.

    Subsequent paragraphs are indented to show that they
belong to the previous footnote.

        { some.code }

    The whole paragraph can be indented, or just the first
    line.  In this way, multi-paragraph footnotes work like
    multi-paragraph list items.

This paragraph won’t be part of the note, because it
isn’t indented.

.
<p>Here is a footnote reference,<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup> and another.<sup><a href="#user-content-fn-longnote" id="user-content-fnref-longnote" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup></p>
<p>This paragraph won’t be part of the note, because it
isn’t indented.</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>Here is the footnote. <a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-longnote">
<p>Here’s one with multiple blocks.</p>
<p>Subsequent paragraphs are indented to show that they
belong to the previous footnote.</p>
<pre><code>{ some.code }
</code></pre>
<p>The whole paragraph can be indented, or just the first
line.  In this way, multi-paragraph footnotes work like
multi-paragraph list items. <a href="#user-content-fnref-longnote" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## prefix-before.md

```example 25
Call[^1][^2][^3][^4][^5][^6][^7][^8][^9][^10][^11][^12].

     [^1]: 5

    [^2]: 4

   [^3]: 3

  [^4]: 2

 [^5]: 1

[^6]: 0

***

   [^7]: 3

     5

   [^8]: 3

    4

   [^9]: 3

   3

  [^10]: 2

     5

  [^11]: 2

    4

  [^12]: 2

   3

.
<p>Call[^1][^2]<sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-5" id="user-content-fnref-5" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-6" id="user-content-fnref-6" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup><sup><a href="#user-content-fn-7" id="user-content-fnref-7" data-footnote-ref="" aria-describedby="footnote-label">5</a></sup><sup><a href="#user-content-fn-8" id="user-content-fnref-8" data-footnote-ref="" aria-describedby="footnote-label">6</a></sup><sup><a href="#user-content-fn-9" id="user-content-fnref-9" data-footnote-ref="" aria-describedby="footnote-label">7</a></sup><sup><a href="#user-content-fn-10" id="user-content-fnref-10" data-footnote-ref="" aria-describedby="footnote-label">8</a></sup><sup><a href="#user-content-fn-11" id="user-content-fnref-11" data-footnote-ref="" aria-describedby="footnote-label">9</a></sup><sup><a href="#user-content-fn-12" id="user-content-fnref-12" data-footnote-ref="" aria-describedby="footnote-label">10</a></sup>.</p>
<pre><code> [^1]: 5

[^2]: 4
</code></pre>
<hr />
<p>3</p>
<p>3</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-3">
<p>3 <a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-4">
<p>2 <a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-5">
<p>1 <a href="#user-content-fnref-5" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-6">
<p>0 <a href="#user-content-fnref-6" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-7">
<p>3</p>
<p>5 <a href="#user-content-fnref-7" data-footnote-backref="" aria-label="Back to reference 5" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-8">
<p>3</p>
<p>4 <a href="#user-content-fnref-8" data-footnote-backref="" aria-label="Back to reference 6" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-9">
<p>3 <a href="#user-content-fnref-9" data-footnote-backref="" aria-label="Back to reference 7" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-10">
<p>2</p>
<p>5 <a href="#user-content-fnref-10" data-footnote-backref="" aria-label="Back to reference 8" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-11">
<p>2</p>
<p>4 <a href="#user-content-fnref-11" data-footnote-backref="" aria-label="Back to reference 9" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-12">
<p>2 <a href="#user-content-fnref-12" data-footnote-backref="" aria-label="Back to reference 10" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## prefix.md

```example 26
Call[^1][^2][^3][^4][^5][^6][^7][^8][^9].

[^1]: a

        8

[^2]: a

       7

[^3]: a

      6

[^4]: a

     5

[^5]: a

    4

[^6]: a

   3

[^7]: a

  2

[^8]: a

 1

[^9]: a

0

.
<p>Call<sup><a href="#user-content-fn-1" id="user-content-fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup><sup><a href="#user-content-fn-2" id="user-content-fnref-2" data-footnote-ref="" aria-describedby="footnote-label">2</a></sup><sup><a href="#user-content-fn-3" id="user-content-fnref-3" data-footnote-ref="" aria-describedby="footnote-label">3</a></sup><sup><a href="#user-content-fn-4" id="user-content-fnref-4" data-footnote-ref="" aria-describedby="footnote-label">4</a></sup><sup><a href="#user-content-fn-5" id="user-content-fnref-5" data-footnote-ref="" aria-describedby="footnote-label">5</a></sup><sup><a href="#user-content-fn-6" id="user-content-fnref-6" data-footnote-ref="" aria-describedby="footnote-label">6</a></sup><sup><a href="#user-content-fn-7" id="user-content-fnref-7" data-footnote-ref="" aria-describedby="footnote-label">7</a></sup><sup><a href="#user-content-fn-8" id="user-content-fnref-8" data-footnote-ref="" aria-describedby="footnote-label">8</a></sup><sup><a href="#user-content-fn-9" id="user-content-fnref-9" data-footnote-ref="" aria-describedby="footnote-label">9</a></sup>.</p>
<p>3</p>
<p>2</p>
<p>1</p>
<p>0</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-1">
<p>a</p>
<pre><code>8
</code></pre>
<a href="#user-content-fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a>
</li>
<li id="user-content-fn-2">
<p>a</p>
<p>7 <a href="#user-content-fnref-2" data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-3">
<p>a</p>
<p>6 <a href="#user-content-fnref-3" data-footnote-backref="" aria-label="Back to reference 3" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-4">
<p>a</p>
<p>5 <a href="#user-content-fnref-4" data-footnote-backref="" aria-label="Back to reference 4" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-5">
<p>a</p>
<p>4 <a href="#user-content-fnref-5" data-footnote-backref="" aria-label="Back to reference 5" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-6">
<p>a <a href="#user-content-fnref-6" data-footnote-backref="" aria-label="Back to reference 6" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-7">
<p>a <a href="#user-content-fnref-7" data-footnote-backref="" aria-label="Back to reference 7" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-8">
<p>a <a href="#user-content-fnref-8" data-footnote-backref="" aria-label="Back to reference 8" class="data-footnote-backref">↩</a></p>
</li>
<li id="user-content-fn-9">
<p>a <a href="#user-content-fnref-9" data-footnote-backref="" aria-label="Back to reference 9" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>

```

## micromark-extension-gfm-footnote › should support `options.label`, `options.backLabel`

```example 27
Noot.[^a]

[^a]: dingen
.
<p>Noot.<sup><a href="#user-content-fn-a" id="user-content-fnref-a" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Voetnoten</h2>
<ol>
<li id="user-content-fn-a">
<p>dingen <a href="#user-content-fnref-a" data-footnote-backref="" aria-label="Terug naar de inhoud" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>
```

## micromark-extension-gfm-footnote › should support `options.labelTagName`

```example 28
a[^b]

[^b]: c
.
<p>a<sup><a href="#user-content-fn-b" id="user-content-fnref-b" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></p>
<section data-footnotes="" class="footnotes"><h1 id="footnote-label" class="sr-only">Footnotes</h1>
<ol>
<li id="user-content-fn-b">
<p>c <a href="#user-content-fnref-b" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>
```

## micromark-extension-gfm-footnote › should support `options.clobberPrefix`

```example 29
a[^1]

[^1]: b
.
<p>a<sup><a href="#fn-1" id="fnref-1" data-footnote-ref="" aria-describedby="footnote-label">1</a></sup></p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="fn-1">
<p>b <a href="#fnref-1" data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref">↩</a></p>
</li>
</ol>
</section>
```
