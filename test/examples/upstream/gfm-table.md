---
source: gfm-table
url: https://github.com/micromark/micromark-extension-gfm-table/tree/1511204dae5a01e81588cee417ecd4fb8d2c8aff/test
commit: 1511204dae5a01e81588cee417ecd4fb8d2c8aff
checks: oracle
---

# micromark-extension-gfm-table

## align.md › An empty initial cell

```example 1
## An empty initial cell

| | a|c|
|--|:----:|:---|
|a|b|c|
|a|b|c|


.
<h2>An empty initial cell</h2>
<table>
<thead>
<tr>
<th></th>
<th align="center">a</th>
<th align="left">c</th>
</tr>
</thead>
<tbody>
<tr>
<td>a</td>
<td align="center">b</td>
<td align="left">c</td>
</tr>
<tr>
<td>a</td>
<td align="center">b</td>
<td align="left">c</td>
</tr>
</tbody>
</table>

```

## align.md › Missing alignment characters

```example 2
## Missing alignment characters

| a | b | c |
|   |---|---|
| d | e | f |

* * *

| a | b | c |
|---|---|   |
| d | e | f |


.
<h2>Missing alignment characters</h2>
<p>| a | b | c |
|   |---|---|
| d | e | f |</p>
<hr />
<p>| a | b | c |
|---|---|   |
| d | e | f |</p>

```

## align.md › Incorrect characters

```example 3
## Incorrect characters

| a | b | c |
|---|-*-|---|
| d | e | f |


.
<h2>Incorrect characters</h2>
<p>| a | b | c |
|---|-*-|---|
| d | e | f |</p>

```

## align.md › Two alignments

```example 4
## Two alignments

|a|
|::|

|a|
|:-:|


.
<h2>Two alignments</h2>
<p>|a|
|::|</p>
<table>
<thead>
<tr>
<th align="center">a</th>
</tr>
</thead>
</table>

```

## align.md › Two at the start or end

```example 5
## Two at the start or end

|a|
|::-|

|a|
|-::|


.
<h2>Two at the start or end</h2>
<p>|a|
|::-|</p>
<p>|a|
|-::|</p>

```

## align.md › In the middle

```example 6
## In the middle

|a|
|-:-|


.
<h2>In the middle</h2>
<p>|a|
|-:-|</p>

```

## align.md › A space in the middle

```example 7
## A space in the middle

|a|
|- -|


.
<h2>A space in the middle</h2>
<p>|a|
|- -|</p>

```

## align.md › No pipe

```example 8
## No pipe

a
:-:

a
:-

a
-:


.
<h2>No pipe</h2>
<table>
<thead>
<tr>
<th align="center">a</th>
</tr>
</thead>
</table>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
</table>
<table>
<thead>
<tr>
<th align="right">a</th>
</tr>
</thead>
</table>

```

## align.md › A single colon

```example 9
## A single colon

|a|
|:|

a
:


.
<h2>A single colon</h2>
<p>|a|
|:|</p>
<p>a
:</p>

```

## align.md › Alignment on empty cells

```example 10
## Alignment on empty cells

| a | b | c | d | e |
| - | - | :- | -: | :-: |
| f |

.
<h2>Alignment on empty cells</h2>
<table>
<thead>
<tr>
<th>a</th>
<th>b</th>
<th align="left">c</th>
<th align="right">d</th>
<th align="center">e</th>
</tr>
</thead>
<tbody>
<tr>
<td>f</td>
<td></td>
<td align="left"></td>
<td align="right"></td>
<td align="center"></td>
</tr>
</tbody>
</table>

```

## basic.md › Tables

```example 11
# Tables

| a | b | c |
| - | - | - |
| d | e | f |


.
<h1>Tables</h1>
<table>
<thead>
<tr>
<th>a</th>
<th>b</th>
<th>c</th>
</tr>
</thead>
<tbody>
<tr>
<td>d</td>
<td>e</td>
<td>f</td>
</tr>
</tbody>
</table>

```

## basic.md › No body

```example 12
## No body

| a | b | c |
| - | - | - |


.
<h2>No body</h2>
<table>
<thead>
<tr>
<th>a</th>
<th>b</th>
<th>c</th>
</tr>
</thead>
</table>

```

## basic.md › One column

```example 13
## One column

| a |
| - |
| b |

.
<h2>One column</h2>
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
<tbody>
<tr>
<td>b</td>
</tr>
</tbody>
</table>

```

## containers.md › In lists

```example 14
## In lists

*   Unordered:

    | A | B |
    | - | - |
    | 1 | 2 |

1.  Ordered:

    | A | B |
    | - | - |
    | 1 | 2 |

*   Lazy?
    | A | B |
    | - | - |
   | 1 | 2 |
  | 3 | 4 |
 | 5 | 6 |
| 7 | 8 |


.
<h2>In lists</h2>
<ul>
<li>
<p>Unordered:</p>
<table>
<thead>
<tr>
<th>A</th>
<th>B</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>2</td>
</tr>
</tbody>
</table>
</li>
</ul>
<ol>
<li>
<p>Ordered:</p>
<table>
<thead>
<tr>
<th>A</th>
<th>B</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>2</td>
</tr>
</tbody>
</table>
</li>
</ol>
<ul>
<li>Lazy?
<table>
<thead>
<tr>
<th>A</th>
<th>B</th>
</tr>
</thead>
</table>
</li>
</ul>
<p>| 1 | 2 |
| 3 | 4 |
| 5 | 6 |
| 7 | 8 |</p>

```

## containers.md › In block quotes

```example 15
## In block quotes

> W/ space:
> | A | B |
> | - | - |
> | 1 | 2 |

>W/o space:
>| A | B |
>| - | - |
>| 1 | 2 |

> Lazy?
> | A | B |
> | - | - |
> | 1 | 2 |
>| 3 | 4 |
| 5 | 6 |


.
<h2>In block quotes</h2>
<blockquote>
<p>W/ space:</p>
<table>
<thead>
<tr>
<th>A</th>
<th>B</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>2</td>
</tr>
</tbody>
</table>
</blockquote>
<blockquote>
<p>W/o space:</p>
<table>
<thead>
<tr>
<th>A</th>
<th>B</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>2</td>
</tr>
</tbody>
</table>
</blockquote>
<blockquote>
<p>Lazy?</p>
<table>
<thead>
<tr>
<th>A</th>
<th>B</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>2</td>
</tr>
<tr>
<td>3</td>
<td>4</td>
</tr>
</tbody>
</table>
</blockquote>
<p>| 5 | 6 |</p>

```

## containers.md › List interrupting delimiters

```example 16
### List interrupting delimiters

a |
- |

a
-|

a
|-

.
<h3>List interrupting delimiters</h3>
<p>a |</p>
<ul>
<li>|</li>
</ul>
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>

```

## double-delimiter-row.md

```example 17
| a |
| - |
| - |
| 1 |

.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
<tbody>
<tr>
<td>-</td>
</tr>
<tr>
<td>1</td>
</tr>
</tbody>
</table>

```

## gfm.md › A

```example 18
## A

| foo | bar |
| --- | --- |
| baz | bim |


.
<h2>A</h2>
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

## gfm.md › B

```example 19
## B

| abc | defghi |
:-: | -----------:
bar | baz


.
<h2>B</h2>
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

## gfm.md › C

```example 20
## C

| f\|oo  |
| ------ |
| b `\|` az |
| b **\|** im |


.
<h2>C</h2>
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

## gfm.md › D

```example 21
## D

| abc | def |
| --- | --- |
| bar | baz |
> bar


.
<h2>D</h2>
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

## gfm.md › E

```example 22
## E

| abc | def |
| --- | --- |
| bar | baz |
bar

bar


.
<h2>E</h2>
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

## gfm.md › F

```example 23
## F

| abc | def |
| --- |
| bar |


.
<h2>F</h2>
<p>| abc | def |
| --- |
| bar |</p>

```

## gfm.md › G

```example 24
## G

| abc | def |
| --- | --- |
| bar |
| bar | baz | boo |


.
<h2>G</h2>
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

## gfm.md › H

```example 25
## H

| abc | def |
| --- | --- |

.
<h2>H</h2>
<table>
<thead>
<tr>
<th>abc</th>
<th>def</th>
</tr>
</thead>
</table>

```

## grave.md › Grave accent in cell

```example 26
## Grave accent in cell

| A            | B |
|--------------|---|
| <kbd>`</kbd> | C |


.
<h2>Grave accent in cell</h2>
<table>
<thead>
<tr>
<th>A</th>
<th>B</th>
</tr>
</thead>
<tbody>
<tr>
<td><kbd>`</kbd></td>
<td>C</td>
</tr>
</tbody>
</table>

```

## grave.md › Escaped grave accent in “inline code” in cell

```example 27
## Escaped grave accent in “inline code” in cell

| A   |
|-----|
| `\` |


.
<h2>Escaped grave accent in “inline code” in cell</h2>
<table>
<thead>
<tr>
<th>A</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>\</code></td>
</tr>
</tbody>
</table>

```

## grave.md › “Empty” inline code

```example 28
## “Empty” inline code

| 1 | 2    | 3  |
|---|------|----|
| a |   `` |    |
| b |   `` | `` |
| c |    ` | `  |
| d |     `|`   |
| e | `\|` |    |
| f |   \| |    |


.
<h2>“Empty” inline code</h2>
<table>
<thead>
<tr>
<th>1</th>
<th>2</th>
<th>3</th>
</tr>
</thead>
<tbody>
<tr>
<td>a</td>
<td>``</td>
<td></td>
</tr>
<tr>
<td>b</td>
<td>``</td>
<td>``</td>
</tr>
<tr>
<td>c</td>
<td>`</td>
<td>`</td>
</tr>
<tr>
<td>d</td>
<td>`</td>
<td>`</td>
</tr>
<tr>
<td>e</td>
<td><code>|</code></td>
<td></td>
</tr>
<tr>
<td>f</td>
<td>|</td>
<td></td>
</tr>
</tbody>
</table>

```

## grave.md › Escaped pipes in code in cells

```example 29
## Escaped pipes in code in cells

| `\|\\` |
| --- |
| `\|\\` |

`\|\\`

.
<h2>Escaped pipes in code in cells</h2>
<table>
<thead>
<tr>
<th><code>|\\</code></th>
</tr>
</thead>
<tbody>
<tr>
<td><code>|\\</code></td>
</tr>
</tbody>
</table>
<p><code>\|\\</code></p>

```

## indent-alt.md

```example 30
| alpha |
   | - |

| bravo |
    | - |

| charlie |
| - |
   | delta |

| echo |
| - |
    | foxtrot |

.
<table>
<thead>
<tr>
<th>alpha</th>
</tr>
</thead>
</table>
<p>| bravo |
| - |</p>
<table>
<thead>
<tr>
<th>charlie</th>
</tr>
</thead>
<tbody>
<tr>
<td>delta</td>
</tr>
</tbody>
</table>
<table>
<thead>
<tr>
<th>echo</th>
</tr>
</thead>
</table>
<pre><code>| foxtrot |
</code></pre>

```

## indent.md › Indented delimiter row

```example 31
## Indented delimiter row

a
   |-

a
    |-


.
<h2>Indented delimiter row</h2>
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
<p>a
|-</p>

```

## indent.md › Indented body

```example 32
## Indented body

| a |
 | - |
  | C |
   | D |
    | E |

.
<h2>Indented body</h2>
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
<tbody>
<tr>
<td>C</td>
</tr>
<tr>
<td>D</td>
</tr>
</tbody>
</table>
<pre><code>| E |
</code></pre>

```

## interrupt.md › Blank line

```example 33
## Blank line

a
:-
b

c


.
<h2>Blank line</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>
<p>c</p>

```

## interrupt.md › Block quote

```example 34
## Block quote

a
:-
b
> c


.
<h2>Block quote</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>
<blockquote>
<p>c</p>
</blockquote>

```

## interrupt.md › Code (fenced)

````example 35
## Code (fenced)

a
:-
b
```
c
```


.
<h2>Code (fenced)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>
<pre><code>c
</code></pre>

````

## interrupt.md › Code (indented)

```example 36
## Code (indented)

a
:-
b
    c


.
<h2>Code (indented)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>
<pre><code>c
</code></pre>

```

## interrupt.md › Definition

```example 37
## Definition

a
:-
b
[c]: d


.
<h2>Definition</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
<tr>
<td align="left">[c]: d</td>
</tr>
</tbody>
</table>

```

## interrupt.md › Heading (atx)

```example 38
## Heading (atx)

a
:-
b

.
<h2>Heading (atx)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>

```

## interrupt.md › Heading (setext) (rank 1)

```example 39
## Heading (setext) (rank 1)

a
:-
b
==
c


.
<h2>Heading (setext) (rank 1)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
<tr>
<td align="left">==</td>
</tr>
<tr>
<td align="left">c</td>
</tr>
</tbody>
</table>

```

## interrupt.md › Heading (setext) (rank 2)

```example 40
## Heading (setext) (rank 2)

a
:-
b
--
c


.
<h2>Heading (setext) (rank 2)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
<tr>
<td align="left">--</td>
</tr>
<tr>
<td align="left">c</td>
</tr>
</tbody>
</table>

```

## interrupt.md › HTML (flow, kind 1: raw)

```example 41
## HTML (flow, kind 1: raw)

a
:-
b
<pre>
  a
</pre>


.
<h2>HTML (flow, kind 1: raw)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>
<pre>  a
</pre>

```

## interrupt.md › HTML (flow, kind 2: comment)

```example 42
## HTML (flow, kind 2: comment)

a
:-
b
<!-- c -->


.
<h2>HTML (flow, kind 2: comment)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>


```

## interrupt.md › HTML (flow, kind 3: instruction)

```example 43
## HTML (flow, kind 3: instruction)

a
:-
b
<? c ?>


.
<h2>HTML (flow, kind 3: instruction)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>


```

## interrupt.md › HTML (flow, kind 4: declaration)

```example 44
## HTML (flow, kind 4: declaration)

a
:-
b
<!C>


.
<h2>HTML (flow, kind 4: declaration)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>


```

## interrupt.md › HTML (flow, kind 5: cdata)

```example 45
## HTML (flow, kind 5: cdata)

a
:-
b
<![CDATA[c]]>


.
<h2>HTML (flow, kind 5: cdata)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>


```

## interrupt.md › HTML (flow, kind 6: basic)

```example 46
## HTML (flow, kind 6: basic)

a
:-
b
<div>


.
<h2>HTML (flow, kind 6: basic)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>
<div>

```

## interrupt.md › HTML (flow, kind 7: complete)

```example 47
## HTML (flow, kind 7: complete)

a
:-
b
<x>


.
<h2>HTML (flow, kind 7: complete)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>


```

## interrupt.md › List (ordered, 1)

```example 48
## List (ordered, 1)

a
:-
b
1. c


.
<h2>List (ordered, 1)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>
<ol>
<li>c</li>
</ol>

```

## interrupt.md › List (ordered, other)

```example 49
## List (ordered, other)

a
:-
b
2. c


.
<h2>List (ordered, other)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>
<ol start="2">
<li>c</li>
</ol>

```

## interrupt.md › List (unordered)

```example 50
## List (unordered)

a
:-
b
* c


.
<h2>List (unordered)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>
<ul>
<li>c</li>
</ul>

```

## interrupt.md › List (unordered, blank)

```example 51
## List (unordered, blank)

a
:-
b
*
c


.
<h2>List (unordered, blank)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>
<ul>
<li></li>
</ul>
<p>c</p>

```

## interrupt.md › List (unordered, blank start)

```example 52
## List (unordered, blank start)

a
:-
b
*
  c


.
<h2>List (unordered, blank start)</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>
<ul>
<li>c</li>
</ul>

```

## interrupt.md › Thematic break

```example 53
## Thematic break

a
:-
b
***

.
<h2>Thematic break</h2>
<table>
<thead>
<tr>
<th align="left">a</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">b</td>
</tr>
</tbody>
</table>
<hr />
</div>

```

## loose.md › Loose

```example 54
## Loose

Header 1 | Header 2
-------- | --------
Cell 1   | Cell 2
Cell 3   | Cell 4


.
<h2>Loose</h2>
<table>
<thead>
<tr>
<th>Header 1</th>
<th>Header 2</th>
</tr>
</thead>
<tbody>
<tr>
<td>Cell 1</td>
<td>Cell 2</td>
</tr>
<tr>
<td>Cell 3</td>
<td>Cell 4</td>
</tr>
</tbody>
</table>

```

## loose.md › One “column”, loose

```example 55
## One “column”, loose

a
-
b


.
<h2>One “column”, loose</h2>
<h2>a</h2>
<p>b</p>

```

## loose.md › No pipe in first row

```example 56
## No pipe in first row

a
| - |

.
<h2>No pipe in first row</h2>
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>

```

## pierce.md

```example 57
| a |
> | - |

| a |
| - |
> | b |

.
<p>| a |</p>
<blockquote>
<p>| - |</p>
</blockquote>
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
<blockquote>
<p>| b |</p>
</blockquote>

```

## some-escapes.md › Some more escapes

```example 58
# Some more escapes

| Head          |
| ------------- |
| A | Alpha     |
| B \| Bravo    |
| C \\| Charlie |
| D \\\| Delta  |
| E \\\\| Echo  |
| F \ Foxtrott  |

Note: GH has a bug where in case C and E, the escaped escape is treated as a
normal escape: [see this issue](https://github.com/github/cmark-gfm/issues/277).

| a \ b \+ c `\|` d |
| ----------------- |

.
<h1>Some more escapes</h1>
<table>
<thead>
<tr>
<th>Head</th>
</tr>
</thead>
<tbody>
<tr>
<td>A</td>
</tr>
<tr>
<td>B | Bravo</td>
</tr>
<tr>
<td>C | Charlie</td>
</tr>
<tr>
<td>D \| Delta</td>
</tr>
<tr>
<td>E \| Echo</td>
</tr>
<tr>
<td>F \ Foxtrott</td>
</tr>
</tbody>
</table>
<p>Note: GH has a bug where in case C and E, the escaped escape is treated as a
normal escape: <a href="https://github.com/github/cmark-gfm/issues/277">see this issue</a>.</p>
<table>
<thead>
<tr>
<th>a \ b + c <code>|</code> d</th>
</tr>
</thead>
</table>

```

## markdown -> html (micromark) › should not support a table w/ the head row ending in an eof (1)

```example 59
| a |
.
<p>| a |</p>
```

## markdown -> html (micromark) › should not support a table w/ the head row ending in an eof (2)

```example 60
| a
.
<p>| a</p>
```

## markdown -> html (micromark) › should not support a table w/ the head row ending in an eof (3)

```example 61
a |
.
<p>a |</p>
```

## markdown -> html (micromark) › should support a table w/ a delimiter row ending in an eof (1)

```example 62
| a |
| - |
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
```

## markdown -> html (micromark) › should support a table w/ a delimiter row ending in an eof (2)

```example 63
| a
| -
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
```

## markdown -> html (micromark) › should support a table w/ a body row ending in an eof (1)

```example 64
| a |
| - |
| b |
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
<tbody>
<tr>
<td>b</td>
</tr>
</tbody>
</table>
```

## markdown -> html (micromark) › should support a table w/ a body row ending in an eof (2)

```example 65
| a
| -
| b
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
<tbody>
<tr>
<td>b</td>
</tr>
</tbody>
</table>
```

## markdown -> html (micromark) › should support a table w/ a body row ending in an eof (3)

```example 66
a|b
-|-
c|d
.
<table>
<thead>
<tr>
<th>a</th>
<th>b</th>
</tr>
</thead>
<tbody>
<tr>
<td>c</td>
<td>d</td>
</tr>
</tbody>
</table>
```

## markdown -> html (micromark) › should support rows w/ trailing whitespace (1)

```example 67
| a␣␣
| -→
| b |␣␣␣␣␣
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
<tbody>
<tr>
<td>b</td>
</tr>
</tbody>
</table>
```

## markdown -> html (micromark) › should support rows w/ trailing whitespace (2)

```example 68
| a |␣
| - |
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
```

## markdown -> html (micromark) › should support rows w/ trailing whitespace (3)

```example 69
| a |
| - |␣
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
```

## markdown -> html (micromark) › should support rows w/ trailing whitespace (4)

```example 70
| a |
| - |
| b |␣
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
<tbody>
<tr>
<td>b</td>
</tr>
</tbody>
</table>
```

## markdown -> html (micromark) › should support empty first header cells

```example 71
||a|
|-|-|
.
<table>
<thead>
<tr>
<th></th>
<th>a</th>
</tr>
</thead>
</table>
```

## markdown -> html (micromark) › should support empty last header cells

```example 72
|a||
|-|-|
.
<table>
<thead>
<tr>
<th>a</th>
<th></th>
</tr>
</thead>
</table>
```

## markdown -> html (micromark) › should support empty header cells

```example 73
a||b
-|-|-
.
<table>
<thead>
<tr>
<th>a</th>
<th></th>
<th>b</th>
</tr>
</thead>
</table>
```

## markdown -> html (micromark) › should support empty first body cells

```example 74
|a|b|
|-|-|
||c|
.
<table>
<thead>
<tr>
<th>a</th>
<th>b</th>
</tr>
</thead>
<tbody>
<tr>
<td></td>
<td>c</td>
</tr>
</tbody>
</table>
```

## markdown -> html (micromark) › should support empty last body cells

```example 75
|a|b|
|-|-|
|c||
.
<table>
<thead>
<tr>
<th>a</th>
<th>b</th>
</tr>
</thead>
<tbody>
<tr>
<td>c</td>
<td></td>
</tr>
</tbody>
</table>
```

## markdown -> html (micromark) › should support empty body cells

```example 76
a|b|c
-|-|-
d||e
.
<table>
<thead>
<tr>
<th>a</th>
<th>b</th>
<th>c</th>
</tr>
</thead>
<tbody>
<tr>
<td>d</td>
<td></td>
<td>e</td>
</tr>
</tbody>
</table>
```

## markdown -> html (micromark) › should support a list after a table

```example 77
| a |
| - |
- b
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
<ul>
<li>b</li>
</ul>
```

## markdown -> html (micromark) › should not support a lazy delimiter row (1)

```example 78
> | a |
| - |
.
<blockquote>
<p>| a |
| - |</p>
</blockquote>
```

## markdown -> html (micromark) › should not support a lazy delimiter row (2)

```example 79
> a
> | b |
| - |
.
<blockquote>
<p>a
| b |
| - |</p>
</blockquote>
```

## markdown -> html (micromark) › should not support a lazy delimiter row (3)

```example 80
| a |
> | - |
.
<p>| a |</p>
<blockquote>
<p>| - |</p>
</blockquote>
```

## markdown -> html (micromark) › should not support a lazy delimiter row (4)

```example 81
> a
> | b |
|-
.
<blockquote>
<p>a
| b |
|-</p>
</blockquote>
```

## markdown -> html (micromark) › should not support a lazy body row (1)

```example 82
> | a |
> | - |
| b |
.
<blockquote>
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
</blockquote>
<p>| b |</p>
```

## markdown -> html (micromark) › should not support a lazy body row (2)

```example 83
> a
> | b |
> | - |
| c |
.
<blockquote>
<p>a</p>
<table>
<thead>
<tr>
<th>b</th>
</tr>
</thead>
</table>
</blockquote>
<p>| c |</p>
```

## markdown -> html (micromark) › should not support a lazy body row (3)

```example 84
> | A |
> | - |
> | 1 |
| 2 |
.
<blockquote>
<table>
<thead>
<tr>
<th>A</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
</tr>
</tbody>
</table>
</blockquote>
<p>| 2 |</p>
```

## markdown -> html (micromark) › should not change how lists and lazyness work

```example 85
   - d
    - e
```

## markdown -> html (micromark) › should form a table if the delimiter row is indented w/ 3 spaces

```example 86
| a |
   | - |
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
```

## markdown -> html (micromark) › should not form a table if the delimiter row is indented w/ 4 spaces

```example 87
| a |
    | - |
.
<p>| a |
| - |</p>
```

## markdown -> html (micromark) › should be interrupted by a block quote

```example 88
| a |
| - |
> block quote?
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
<blockquote>
<p>block quote?</p>
</blockquote>
```

## markdown -> html (micromark) › should be interrupted by a block quote (empty)

```example 89
| a |
| - |
>
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
<blockquote>
</blockquote>
```

## markdown -> html (micromark) › should be interrupted by a list

```example 90
| a |
| - |
- list?
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
<ul>
<li>list?</li>
</ul>
```

## markdown -> html (micromark) › should be interrupted by a list (empty)

```example 91
| a |
| - |
-
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
<ul>
<li></li>
</ul>
```

## markdown -> html (micromark) › should be interrupted by HTML (flow)

```example 92
| a |
| - |
<!-- HTML? -->
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
<!-- HTML? -->
```

## markdown -> html (micromark) › should be interrupted by code (indented)

```example 93
| a |
| - |
→code?
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
<pre><code>code?
</code></pre>
```

## markdown -> html (micromark) › should be interrupted by code (fenced)

````example 94
| a |
| - |
```js
code?
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
<pre><code class="language-js">code?
</code></pre>

````

## markdown -> html (micromark) › should be interrupted by a thematic break

```example 95
| a |
| - |
***
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
<hr />
```

## markdown -> html (micromark) › should be interrupted by a heading (ATX)

```example 96
| a |
| - |
# heading?
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
</table>
<h1>heading?</h1>
```

## markdown -> html (micromark) › should *not* be interrupted by a heading (setext)

```example 97
| a |
| - |
heading
=
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
<tbody>
<tr>
<td>heading</td>
</tr>
<tr>
<td>=</td>
</tr>
</tbody>
</table>
```

## markdown -> html (micromark) › should *not* be interrupted by a heading (setext), but interrupt if the underline is also a thematic break

```example 98
| a |
| - |
heading
---
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
<tbody>
<tr>
<td>heading</td>
</tr>
</tbody>
</table>
<hr />
```

## markdown -> html (micromark) › should *not* be interrupted by a heading (setext), but interrupt if the underline is also an empty list item bullet

```example 99
| a |
| - |
heading
-
.
<table>
<thead>
<tr>
<th>a</th>
</tr>
</thead>
<tbody>
<tr>
<td>heading</td>
</tr>
</tbody>
</table>
<ul>
<li></li>
</ul>
```
