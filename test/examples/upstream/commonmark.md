---
source: commonmark
url: https://spec.commonmark.org/0.31.2/spec.json
version: 0.31.2
checks: oracle
---

# CommonMark

## Tabs

```example 1
→foo→baz→→bim

.
<pre><code>foo→baz→→bim
</code></pre>

```

```example 2
  →foo→baz→→bim

.
<pre><code>foo→baz→→bim
</code></pre>

```

```example 3
    a→a
    ὐ→a

.
<pre><code>a→a
ὐ→a
</code></pre>

```

```example 4
  - foo

→bar

.
<ul>
<li>
<p>foo</p>
<p>bar</p>
</li>
</ul>

```

```example 5
- foo

→→bar

.
<ul>
<li>
<p>foo</p>
<pre><code>  bar
</code></pre>
</li>
</ul>

```

```example 6
>→→foo

.
<blockquote>
<pre><code>  foo
</code></pre>
</blockquote>

```

```example 7
-→→foo

.
<ul>
<li>
<pre><code>  foo
</code></pre>
</li>
</ul>

```

```example 8
    foo
→bar

.
<pre><code>foo
bar
</code></pre>

```

```example 9
 - foo
   - bar
→ - baz

.
<ul>
<li>foo
<ul>
<li>bar
<ul>
<li>baz</li>
</ul>
</li>
</ul>
</li>
</ul>

```

```example 10
#→Foo

.
<h1>Foo</h1>

```

```example 11
*→*→*→

.
<hr />

```

## Backslash escapes

```example 12
\!\"\#\$\%\&\'\(\)\*\+\,\-\.\/\:\;\<\=\>\?\@\[\\\]\^\_\`\{\|\}\~

.
<p>!&quot;#$%&amp;'()*+,-./:;&lt;=&gt;?@[\]^_`{|}~</p>

```

```example 13
\→\A\a\ \3\φ\«

.
<p>\→\A\a\ \3\φ\«</p>

```

```example 14
\*not emphasized*
\<br/> not a tag
\[not a link](/foo)
\`not code`
1\. not a list
\* not a list
\# not a heading
\[foo]: /url "not a reference"
\&ouml; not a character entity

.
<p>*not emphasized*
&lt;br/&gt; not a tag
[not a link](/foo)
`not code`
1. not a list
* not a list
# not a heading
[foo]: /url &quot;not a reference&quot;
&amp;ouml; not a character entity</p>

```

```example 15
\\*emphasis*

.
<p>\<em>emphasis</em></p>

```

```example 16
foo\
bar

.
<p>foo<br />
bar</p>

```

```example 17
`` \[\` ``

.
<p><code>\[\`</code></p>

```

```example 18
    \[\]

.
<pre><code>\[\]
</code></pre>

```

```example 19
~~~
\[\]
~~~

.
<pre><code>\[\]
</code></pre>

```

```example 20
<https://example.com?find=\*>

.
<p><a href="https://example.com?find=%5C*">https://example.com?find=\*</a></p>

```

```example 21
<a href="/bar\/)">

.
<a href="/bar\/)">

```

```example 22
[foo](/bar\* "ti\*tle")

.
<p><a href="/bar*" title="ti*tle">foo</a></p>

```

```example 23
[foo]

[foo]: /bar\* "ti\*tle"

.
<p><a href="/bar*" title="ti*tle">foo</a></p>

```

````example 24
``` foo\+bar
foo
```

.
<pre><code class="language-foo+bar">foo
</code></pre>

````

## Entity and numeric character references

```example 25
&nbsp; &amp; &copy; &AElig; &Dcaron;
&frac34; &HilbertSpace; &DifferentialD;
&ClockwiseContourIntegral; &ngE;

.
<p>  &amp; © Æ Ď
¾ ℋ ⅆ
∲ ≧̸</p>

```

```example 26
&#35; &#1234; &#992; &#0;

.
<p># Ӓ Ϡ �</p>

```

```example 27
&#X22; &#XD06; &#xcab;

.
<p>&quot; ആ ಫ</p>

```

```example 28
&nbsp &x; &#; &#x;
&#87654321;
&#abcdef0;
&ThisIsNotDefined; &hi?;

.
<p>&amp;nbsp &amp;x; &amp;#; &amp;#x;
&amp;#87654321;
&amp;#abcdef0;
&amp;ThisIsNotDefined; &amp;hi?;</p>

```

```example 29
&copy

.
<p>&amp;copy</p>

```

```example 30
&MadeUpEntity;

.
<p>&amp;MadeUpEntity;</p>

```

```example 31
<a href="&ouml;&ouml;.html">

.
<a href="&ouml;&ouml;.html">

```

```example 32
[foo](/f&ouml;&ouml; "f&ouml;&ouml;")

.
<p><a href="/f%C3%B6%C3%B6" title="föö">foo</a></p>

```

```example 33
[foo]

[foo]: /f&ouml;&ouml; "f&ouml;&ouml;"

.
<p><a href="/f%C3%B6%C3%B6" title="föö">foo</a></p>

```

````example 34
``` f&ouml;&ouml;
foo
```

.
<pre><code class="language-föö">foo
</code></pre>

````

```example 35
`f&ouml;&ouml;`

.
<p><code>f&amp;ouml;&amp;ouml;</code></p>

```

```example 36
    f&ouml;f&ouml;

.
<pre><code>f&amp;ouml;f&amp;ouml;
</code></pre>

```

```example 37
&#42;foo&#42;
*foo*

.
<p>*foo*
<em>foo</em></p>

```

```example 38
&#42; foo

* foo

.
<p>* foo</p>
<ul>
<li>foo</li>
</ul>

```

```example 39
foo&#10;&#10;bar

.
<p>foo

bar</p>

```

```example 40
&#9;foo

.
<p>→foo</p>

```

```example 41
[a](url &quot;tit&quot;)

.
<p>[a](url &quot;tit&quot;)</p>

```

## Precedence

```example 42
- `one
- two`

.
<ul>
<li>`one</li>
<li>two`</li>
</ul>

```

## Thematic breaks

```example 43
***
---
___

.
<hr />
<hr />
<hr />

```

```example 44
+++

.
<p>+++</p>

```

```example 45
===

.
<p>===</p>

```

```example 46
--
**
__

.
<p>--
**
__</p>

```

```example 47
 ***
  ***
   ***

.
<hr />
<hr />
<hr />

```

```example 48
    ***

.
<pre><code>***
</code></pre>

```

```example 49
Foo
    ***

.
<p>Foo
***</p>

```

```example 50
_____________________________________

.
<hr />

```

```example 51
 - - -

.
<hr />

```

```example 52
 **  * ** * ** * **

.
<hr />

```

```example 53
-     -      -      -

.
<hr />

```

```example 54
- - - -␣␣␣␣

.
<hr />

```

```example 55
_ _ _ _ a

a------

---a---

.
<p>_ _ _ _ a</p>
<p>a------</p>
<p>---a---</p>

```

```example 56
 *-*

.
<p><em>-</em></p>

```

```example 57
- foo
***
- bar

.
<ul>
<li>foo</li>
</ul>
<hr />
<ul>
<li>bar</li>
</ul>

```

```example 58
Foo
***
bar

.
<p>Foo</p>
<hr />
<p>bar</p>

```

```example 59
Foo
---
bar

.
<h2>Foo</h2>
<p>bar</p>

```

```example 60
* Foo
* * *
* Bar

.
<ul>
<li>Foo</li>
</ul>
<hr />
<ul>
<li>Bar</li>
</ul>

```

```example 61
- Foo
- * * *

.
<ul>
<li>Foo</li>
<li>
<hr />
</li>
</ul>

```

## ATX headings

```example 62
# foo
## foo
### foo
#### foo
##### foo
###### foo

.
<h1>foo</h1>
<h2>foo</h2>
<h3>foo</h3>
<h4>foo</h4>
<h5>foo</h5>
<h6>foo</h6>

```

```example 63
####### foo

.
<p>####### foo</p>

```

```example 64
#5 bolt

#hashtag

.
<p>#5 bolt</p>
<p>#hashtag</p>

```

```example 65
\## foo

.
<p>## foo</p>

```

```example 66
# foo *bar* \*baz\*

.
<h1>foo <em>bar</em> *baz*</h1>

```

```example 67
#                  foo␣␣␣␣␣␣␣␣␣␣␣␣␣␣␣␣␣␣␣␣␣

.
<h1>foo</h1>

```

```example 68
 ### foo
  ## foo
   # foo

.
<h3>foo</h3>
<h2>foo</h2>
<h1>foo</h1>

```

```example 69
    # foo

.
<pre><code># foo
</code></pre>

```

```example 70
foo
    # bar

.
<p>foo
# bar</p>

```

```example 71
## foo ##
  ###   bar    ###

.
<h2>foo</h2>
<h3>bar</h3>

```

```example 72
# foo ##################################
##### foo ##

.
<h1>foo</h1>
<h5>foo</h5>

```

```example 73
### foo ###␣␣␣␣␣

.
<h3>foo</h3>

```

```example 74
### foo ### b

.
<h3>foo ### b</h3>

```

```example 75
# foo#

.
<h1>foo#</h1>

```

```example 76
### foo \###
## foo #\##
# foo \#

.
<h3>foo ###</h3>
<h2>foo ###</h2>
<h1>foo #</h1>

```

```example 77
****
## foo
****

.
<hr />
<h2>foo</h2>
<hr />

```

```example 78
Foo bar
# baz
Bar foo

.
<p>Foo bar</p>
<h1>baz</h1>
<p>Bar foo</p>

```

```example 79
##␣
#
### ###

.
<h2></h2>
<h1></h1>
<h3></h3>

```

## Setext headings

```example 80
Foo *bar*
=========

Foo *bar*
---------

.
<h1>Foo <em>bar</em></h1>
<h2>Foo <em>bar</em></h2>

```

```example 81
Foo *bar
baz*
====

.
<h1>Foo <em>bar
baz</em></h1>

```

```example 82
  Foo *bar
baz*→
====

.
<h1>Foo <em>bar
baz</em></h1>

```

```example 83
Foo
-------------------------

Foo
=

.
<h2>Foo</h2>
<h1>Foo</h1>

```

```example 84
   Foo
---

  Foo
-----

  Foo
  ===

.
<h2>Foo</h2>
<h2>Foo</h2>
<h1>Foo</h1>

```

```example 85
    Foo
    ---

    Foo
---

.
<pre><code>Foo
---

Foo
</code></pre>
<hr />

```

```example 86
Foo
   ----␣␣␣␣␣␣

.
<h2>Foo</h2>

```

```example 87
Foo
    ---

.
<p>Foo
---</p>

```

```example 88
Foo
= =

Foo
--- -

.
<p>Foo
= =</p>
<p>Foo</p>
<hr />

```

```example 89
Foo␣␣
-----

.
<h2>Foo</h2>

```

```example 90
Foo\
----

.
<h2>Foo\</h2>

```

```example 91
`Foo
----
`

<a title="a lot
---
of dashes"/>

.
<h2>`Foo</h2>
<p>`</p>
<h2>&lt;a title=&quot;a lot</h2>
<p>of dashes&quot;/&gt;</p>

```

```example 92
> Foo
---

.
<blockquote>
<p>Foo</p>
</blockquote>
<hr />

```

```example 93
> foo
bar
===

.
<blockquote>
<p>foo
bar
===</p>
</blockquote>

```

```example 94
- Foo
---

.
<ul>
<li>Foo</li>
</ul>
<hr />

```

```example 95
Foo
Bar
---

.
<h2>Foo
Bar</h2>

```

```example 96
---
Foo
---
Bar
---
Baz

.
<hr />
<h2>Foo</h2>
<h2>Bar</h2>
<p>Baz</p>

```

```example 97

====

.
<p>====</p>

```

```example 98
---
---

.
<hr />
<hr />

```

```example 99
- foo
-----

.
<ul>
<li>foo</li>
</ul>
<hr />

```

```example 100
    foo
---

.
<pre><code>foo
</code></pre>
<hr />

```

```example 101
> foo
-----

.
<blockquote>
<p>foo</p>
</blockquote>
<hr />

```

```example 102
\> foo
------

.
<h2>&gt; foo</h2>

```

```example 103
Foo

bar
---
baz

.
<p>Foo</p>
<h2>bar</h2>
<p>baz</p>

```

```example 104
Foo
bar

---

baz

.
<p>Foo
bar</p>
<hr />
<p>baz</p>

```

```example 105
Foo
bar
* * *
baz

.
<p>Foo
bar</p>
<hr />
<p>baz</p>

```

```example 106
Foo
bar
\---
baz

.
<p>Foo
bar
---
baz</p>

```

## Indented code blocks

```example 107
    a simple
      indented code block

.
<pre><code>a simple
  indented code block
</code></pre>

```

```example 108
  - foo

    bar

.
<ul>
<li>
<p>foo</p>
<p>bar</p>
</li>
</ul>

```

```example 109
1.  foo

    - bar

.
<ol>
<li>
<p>foo</p>
<ul>
<li>bar</li>
</ul>
</li>
</ol>

```

```example 110
    <a/>
    *hi*

    - one

.
<pre><code>&lt;a/&gt;
*hi*

- one
</code></pre>

```

```example 111
    chunk1

    chunk2
␣␣
␣
␣
    chunk3

.
<pre><code>chunk1

chunk2



chunk3
</code></pre>

```

```example 112
    chunk1
␣␣␣␣␣␣
      chunk2

.
<pre><code>chunk1
␣␣
  chunk2
</code></pre>

```

```example 113
Foo
    bar


.
<p>Foo
bar</p>

```

```example 114
    foo
bar

.
<pre><code>foo
</code></pre>
<p>bar</p>

```

```example 115
# Heading
    foo
Heading
------
    foo
----

.
<h1>Heading</h1>
<pre><code>foo
</code></pre>
<h2>Heading</h2>
<pre><code>foo
</code></pre>
<hr />

```

```example 116
        foo
    bar

.
<pre><code>    foo
bar
</code></pre>

```

```example 117

␣␣␣␣
    foo
␣␣␣␣


.
<pre><code>foo
</code></pre>

```

```example 118
    foo␣␣

.
<pre><code>foo␣␣
</code></pre>

```

## Fenced code blocks

````example 119
```
<
 >
```

.
<pre><code>&lt;
 &gt;
</code></pre>

````

```example 120
~~~
<
 >
~~~

.
<pre><code>&lt;
 &gt;
</code></pre>

```

```example 121
``
foo
``

.
<p><code>foo</code></p>

```

````example 122
```
aaa
~~~
```

.
<pre><code>aaa
~~~
</code></pre>

````

````example 123
~~~
aaa
```
~~~

.
<pre><code>aaa
```
</code></pre>

````

```````example 124
````
aaa
```
``````

.
<pre><code>aaa
```
</code></pre>

```````

```example 125
~~~~
aaa
~~~
~~~~

.
<pre><code>aaa
~~~
</code></pre>

```

````example 126
```

.
<pre><code></code></pre>

````

``````example 127
`````

```
aaa

.
<pre><code>
```
aaa
</code></pre>

``````

````example 128
> ```
> aaa

bbb

.
<blockquote>
<pre><code>aaa
</code></pre>
</blockquote>
<p>bbb</p>

````

````example 129
```

␣␣
```

.
<pre><code>
␣␣
</code></pre>

````

````example 130
```
```

.
<pre><code></code></pre>

````

````example 131
 ```
 aaa
aaa
```

.
<pre><code>aaa
aaa
</code></pre>

````

````example 132
  ```
aaa
  aaa
aaa
  ```

.
<pre><code>aaa
aaa
aaa
</code></pre>

````

````example 133
   ```
   aaa
    aaa
  aaa
   ```

.
<pre><code>aaa
 aaa
aaa
</code></pre>

````

````example 134
    ```
    aaa
    ```

.
<pre><code>```
aaa
```
</code></pre>

````

````example 135
```
aaa
  ```

.
<pre><code>aaa
</code></pre>

````

````example 136
   ```
aaa
  ```

.
<pre><code>aaa
</code></pre>

````

````example 137
```
aaa
    ```

.
<pre><code>aaa
    ```
</code></pre>

````

````example 138
``` ```
aaa

.
<p><code> </code>
aaa</p>

````

```example 139
~~~~~~
aaa
~~~ ~~

.
<pre><code>aaa
~~~ ~~
</code></pre>

```

````example 140
foo
```
bar
```
baz

.
<p>foo</p>
<pre><code>bar
</code></pre>
<p>baz</p>

````

```example 141
foo
---
~~~
bar
~~~
# baz

.
<h2>foo</h2>
<pre><code>bar
</code></pre>
<h1>baz</h1>

```

````example 142
```ruby
def foo(x)
  return 3
end
```

.
<pre><code class="language-ruby">def foo(x)
  return 3
end
</code></pre>

````

```example 143
~~~~    ruby startline=3 $%@#$
def foo(x)
  return 3
end
~~~~~~~

.
<pre><code class="language-ruby">def foo(x)
  return 3
end
</code></pre>

```

`````example 144
````;
````

.
<pre><code class="language-;"></code></pre>

`````

````example 145
``` aa ```
foo

.
<p><code>aa</code>
foo</p>

````

````example 146
~~~ aa ``` ~~~
foo
~~~

.
<pre><code class="language-aa">foo
</code></pre>

````

````example 147
```
``` aaa
```

.
<pre><code>``` aaa
</code></pre>

````

## HTML blocks

```example 148
<table><tr><td>
<pre>
**Hello**,

_world_.
</pre>
</td></tr></table>

.
<table><tr><td>
<pre>
**Hello**,
<p><em>world</em>.
</pre></p>
</td></tr></table>

```

```example 149
<table>
  <tr>
    <td>
           hi
    </td>
  </tr>
</table>

okay.

.
<table>
  <tr>
    <td>
           hi
    </td>
  </tr>
</table>
<p>okay.</p>

```

```example 150
 <div>
  *hello*
         <foo><a>

.
 <div>
  *hello*
         <foo><a>

```

```example 151
</div>
*foo*

.
</div>
*foo*

```

```example 152
<DIV CLASS="foo">

*Markdown*

</DIV>

.
<DIV CLASS="foo">
<p><em>Markdown</em></p>
</DIV>

```

```example 153
<div id="foo"
  class="bar">
</div>

.
<div id="foo"
  class="bar">
</div>

```

```example 154
<div id="foo" class="bar
  baz">
</div>

.
<div id="foo" class="bar
  baz">
</div>

```

```example 155
<div>
*foo*

*bar*

.
<div>
*foo*
<p><em>bar</em></p>

```

```example 156
<div id="foo"
*hi*

.
<div id="foo"
*hi*

```

```example 157
<div class
foo

.
<div class
foo

```

```example 158
<div *???-&&&-<---
*foo*

.
<div *???-&&&-<---
*foo*

```

```example 159
<div><a href="bar">*foo*</a></div>

.
<div><a href="bar">*foo*</a></div>

```

```example 160
<table><tr><td>
foo
</td></tr></table>

.
<table><tr><td>
foo
</td></tr></table>

```

````example 161
<div></div>
``` c
int x = 33;
```

.
<div></div>
``` c
int x = 33;
```

````

```example 162
<a href="foo">
*bar*
</a>

.
<a href="foo">
*bar*
</a>

```

```example 163
<Warning>
*bar*
</Warning>

.
<Warning>
*bar*
</Warning>

```

```example 164
<i class="foo">
*bar*
</i>

.
<i class="foo">
*bar*
</i>

```

```example 165
</ins>
*bar*

.
</ins>
*bar*

```

```example 166
<del>
*foo*
</del>

.
<del>
*foo*
</del>

```

```example 167
<del>

*foo*

</del>

.
<del>
<p><em>foo</em></p>
</del>

```

```example 168
<del>*foo*</del>

.
<p><del><em>foo</em></del></p>

```

```example 169
<pre language="haskell"><code>
import Text.HTML.TagSoup

main :: IO ()
main = print $ parseTags tags
</code></pre>
okay

.
<pre language="haskell"><code>
import Text.HTML.TagSoup

main :: IO ()
main = print $ parseTags tags
</code></pre>
<p>okay</p>

```

```example 170
<script type="text/javascript">
// JavaScript example

document.getElementById("demo").innerHTML = "Hello JavaScript!";
</script>
okay

.
<script type="text/javascript">
// JavaScript example

document.getElementById("demo").innerHTML = "Hello JavaScript!";
</script>
<p>okay</p>

```

```example 171
<textarea>

*foo*

_bar_

</textarea>

.
<textarea>

*foo*

_bar_

</textarea>

```

```example 172
<style
  type="text/css">
h1 {color:red;}

p {color:blue;}
</style>
okay

.
<style
  type="text/css">
h1 {color:red;}

p {color:blue;}
</style>
<p>okay</p>

```

```example 173
<style
  type="text/css">

foo

.
<style
  type="text/css">

foo

```

```example 174
> <div>
> foo

bar

.
<blockquote>
<div>
foo
</blockquote>
<p>bar</p>

```

```example 175
- <div>
- foo

.
<ul>
<li>
<div>
</li>
<li>foo</li>
</ul>

```

```example 176
<style>p{color:red;}</style>
*foo*

.
<style>p{color:red;}</style>
<p><em>foo</em></p>

```

```example 177
<!-- foo -->*bar*
*baz*

.
<!-- foo -->*bar*
<p><em>baz</em></p>

```

```example 178
<script>
foo
</script>1. *bar*

.
<script>
foo
</script>1. *bar*

```

```example 179
<!-- Foo

bar
   baz -->
okay

.
<!-- Foo

bar
   baz -->
<p>okay</p>

```

```example 180
<?php

  echo '>';

?>
okay

.
<?php

  echo '>';

?>
<p>okay</p>

```

```example 181
<!DOCTYPE html>

.
<!DOCTYPE html>

```

```example 182
<![CDATA[
function matchwo(a,b)
{
  if (a < b && a < 0) then {
    return 1;

  } else {

    return 0;
  }
}
]]>
okay

.
<![CDATA[
function matchwo(a,b)
{
  if (a < b && a < 0) then {
    return 1;

  } else {

    return 0;
  }
}
]]>
<p>okay</p>

```

```example 183
  <!-- foo -->

    <!-- foo -->

.
  <!-- foo -->
<pre><code>&lt;!-- foo --&gt;
</code></pre>

```

```example 184
  <div>

    <div>

.
  <div>
<pre><code>&lt;div&gt;
</code></pre>

```

```example 185
Foo
<div>
bar
</div>

.
<p>Foo</p>
<div>
bar
</div>

```

```example 186
<div>
bar
</div>
*foo*

.
<div>
bar
</div>
*foo*

```

```example 187
Foo
<a href="bar">
baz

.
<p>Foo
<a href="bar">
baz</p>

```

```example 188
<div>

*Emphasized* text.

</div>

.
<div>
<p><em>Emphasized</em> text.</p>
</div>

```

```example 189
<div>
*Emphasized* text.
</div>

.
<div>
*Emphasized* text.
</div>

```

```example 190
<table>

<tr>

<td>
Hi
</td>

</tr>

</table>

.
<table>
<tr>
<td>
Hi
</td>
</tr>
</table>

```

```example 191
<table>

  <tr>

    <td>
      Hi
    </td>

  </tr>

</table>

.
<table>
  <tr>
<pre><code>&lt;td&gt;
  Hi
&lt;/td&gt;
</code></pre>
  </tr>
</table>

```

## Link reference definitions

```example 192
[foo]: /url "title"

[foo]

.
<p><a href="/url" title="title">foo</a></p>

```

```example 193
   [foo]:␣
      /url␣␣
           'the title'␣␣

[foo]

.
<p><a href="/url" title="the title">foo</a></p>

```

```example 194
[Foo*bar\]]:my_(url) 'title (with parens)'

[Foo*bar\]]

.
<p><a href="my_(url)" title="title (with parens)">Foo*bar]</a></p>

```

```example 195
[Foo bar]:
<my url>
'title'

[Foo bar]

.
<p><a href="my%20url" title="title">Foo bar</a></p>

```

```example 196
[foo]: /url '
title
line1
line2
'

[foo]

.
<p><a href="/url" title="
title
line1
line2
">foo</a></p>

```

```example 197
[foo]: /url 'title

with blank line'

[foo]

.
<p>[foo]: /url 'title</p>
<p>with blank line'</p>
<p>[foo]</p>

```

```example 198
[foo]:
/url

[foo]

.
<p><a href="/url">foo</a></p>

```

```example 199
[foo]:

[foo]

.
<p>[foo]:</p>
<p>[foo]</p>

```

```example 200
[foo]: <>

[foo]

.
<p><a href="">foo</a></p>

```

```example 201
[foo]: <bar>(baz)

[foo]

.
<p>[foo]: <bar>(baz)</p>
<p>[foo]</p>

```

```example 202
[foo]: /url\bar\*baz "foo\"bar\baz"

[foo]

.
<p><a href="/url%5Cbar*baz" title="foo&quot;bar\baz">foo</a></p>

```

```example 203
[foo]

[foo]: url

.
<p><a href="url">foo</a></p>

```

```example 204
[foo]

[foo]: first
[foo]: second

.
<p><a href="first">foo</a></p>

```

```example 205
[FOO]: /url

[Foo]

.
<p><a href="/url">Foo</a></p>

```

```example 206
[ΑΓΩ]: /φου

[αγω]

.
<p><a href="/%CF%86%CE%BF%CF%85">αγω</a></p>

```

```example 207
[foo]: /url

```

```example 208
[
foo
]: /url
bar

.
<p>bar</p>

```

```example 209
[foo]: /url "title" ok

.
<p>[foo]: /url &quot;title&quot; ok</p>

```

```example 210
[foo]: /url
"title" ok

.
<p>&quot;title&quot; ok</p>

```

```example 211
    [foo]: /url "title"

[foo]

.
<pre><code>[foo]: /url &quot;title&quot;
</code></pre>
<p>[foo]</p>

```

````example 212
```
[foo]: /url
```

[foo]

.
<pre><code>[foo]: /url
</code></pre>
<p>[foo]</p>

````

```example 213
Foo
[bar]: /baz

[bar]

.
<p>Foo
[bar]: /baz</p>
<p>[bar]</p>

```

```example 214
# [Foo]
[foo]: /url
> bar

.
<h1><a href="/url">Foo</a></h1>
<blockquote>
<p>bar</p>
</blockquote>

```

```example 215
[foo]: /url
bar
===
[foo]

.
<h1>bar</h1>
<p><a href="/url">foo</a></p>

```

```example 216
[foo]: /url
===
[foo]

.
<p>===
<a href="/url">foo</a></p>

```

```example 217
[foo]: /foo-url "foo"
[bar]: /bar-url
  "bar"
[baz]: /baz-url

[foo],
[bar],
[baz]

.
<p><a href="/foo-url" title="foo">foo</a>,
<a href="/bar-url" title="bar">bar</a>,
<a href="/baz-url">baz</a></p>

```

```example 218
[foo]

> [foo]: /url

.
<p><a href="/url">foo</a></p>
<blockquote>
</blockquote>

```

## Paragraphs

```example 219
aaa

bbb

.
<p>aaa</p>
<p>bbb</p>

```

```example 220
aaa
bbb

ccc
ddd

.
<p>aaa
bbb</p>
<p>ccc
ddd</p>

```

```example 221
aaa


bbb

.
<p>aaa</p>
<p>bbb</p>

```

```example 222
  aaa
 bbb

.
<p>aaa
bbb</p>

```

```example 223
aaa
             bbb
                                       ccc

.
<p>aaa
bbb
ccc</p>

```

```example 224
   aaa
bbb

.
<p>aaa
bbb</p>

```

```example 225
    aaa
bbb

.
<pre><code>aaa
</code></pre>
<p>bbb</p>

```

```example 226
aaa␣␣␣␣␣
bbb␣␣␣␣␣

.
<p>aaa<br />
bbb</p>

```

## Blank lines

```example 227
␣␣

aaa
␣␣

# aaa

␣␣

.
<p>aaa</p>
<h1>aaa</h1>

```

## Block quotes

```example 228
> # Foo
> bar
> baz

.
<blockquote>
<h1>Foo</h1>
<p>bar
baz</p>
</blockquote>

```

```example 229
># Foo
>bar
> baz

.
<blockquote>
<h1>Foo</h1>
<p>bar
baz</p>
</blockquote>

```

```example 230
   > # Foo
   > bar
 > baz

.
<blockquote>
<h1>Foo</h1>
<p>bar
baz</p>
</blockquote>

```

```example 231
    > # Foo
    > bar
    > baz

.
<pre><code>&gt; # Foo
&gt; bar
&gt; baz
</code></pre>

```

```example 232
> # Foo
> bar
baz

.
<blockquote>
<h1>Foo</h1>
<p>bar
baz</p>
</blockquote>

```

```example 233
> bar
baz
> foo

.
<blockquote>
<p>bar
baz
foo</p>
</blockquote>

```

```example 234
> foo
---

.
<blockquote>
<p>foo</p>
</blockquote>
<hr />

```

```example 235
> - foo
- bar

.
<blockquote>
<ul>
<li>foo</li>
</ul>
</blockquote>
<ul>
<li>bar</li>
</ul>

```

```example 236
>     foo
    bar

.
<blockquote>
<pre><code>foo
</code></pre>
</blockquote>
<pre><code>bar
</code></pre>

```

````example 237
> ```
foo
```

.
<blockquote>
<pre><code></code></pre>
</blockquote>
<p>foo</p>
<pre><code></code></pre>

````

```example 238
> foo
    - bar

.
<blockquote>
<p>foo
- bar</p>
</blockquote>

```

```example 239
>

.
<blockquote>
</blockquote>

```

```example 240
>
>␣␣
>␣

.
<blockquote>
</blockquote>

```

```example 241
>
> foo
>␣␣

.
<blockquote>
<p>foo</p>
</blockquote>

```

```example 242
> foo

> bar

.
<blockquote>
<p>foo</p>
</blockquote>
<blockquote>
<p>bar</p>
</blockquote>

```

```example 243
> foo
> bar

.
<blockquote>
<p>foo
bar</p>
</blockquote>

```

```example 244
> foo
>
> bar

.
<blockquote>
<p>foo</p>
<p>bar</p>
</blockquote>

```

```example 245
foo
> bar

.
<p>foo</p>
<blockquote>
<p>bar</p>
</blockquote>

```

```example 246
> aaa
***
> bbb

.
<blockquote>
<p>aaa</p>
</blockquote>
<hr />
<blockquote>
<p>bbb</p>
</blockquote>

```

```example 247
> bar
baz

.
<blockquote>
<p>bar
baz</p>
</blockquote>

```

```example 248
> bar

baz

.
<blockquote>
<p>bar</p>
</blockquote>
<p>baz</p>

```

```example 249
> bar
>
baz

.
<blockquote>
<p>bar</p>
</blockquote>
<p>baz</p>

```

```example 250
> > > foo
bar

.
<blockquote>
<blockquote>
<blockquote>
<p>foo
bar</p>
</blockquote>
</blockquote>
</blockquote>

```

```example 251
>>> foo
> bar
>>baz

.
<blockquote>
<blockquote>
<blockquote>
<p>foo
bar
baz</p>
</blockquote>
</blockquote>
</blockquote>

```

```example 252
>     code

>    not code

.
<blockquote>
<pre><code>code
</code></pre>
</blockquote>
<blockquote>
<p>not code</p>
</blockquote>

```

## List items

```example 253
A paragraph
with two lines.

    indented code

> A block quote.

.
<p>A paragraph
with two lines.</p>
<pre><code>indented code
</code></pre>
<blockquote>
<p>A block quote.</p>
</blockquote>

```

```example 254
1.  A paragraph
    with two lines.

        indented code

    > A block quote.

.
<ol>
<li>
<p>A paragraph
with two lines.</p>
<pre><code>indented code
</code></pre>
<blockquote>
<p>A block quote.</p>
</blockquote>
</li>
</ol>

```

```example 255
- one

 two

.
<ul>
<li>one</li>
</ul>
<p>two</p>

```

```example 256
- one

  two

.
<ul>
<li>
<p>one</p>
<p>two</p>
</li>
</ul>

```

```example 257
 -    one

     two

.
<ul>
<li>one</li>
</ul>
<pre><code> two
</code></pre>

```

```example 258
 -    one

      two

.
<ul>
<li>
<p>one</p>
<p>two</p>
</li>
</ul>

```

```example 259
   > > 1.  one
>>
>>     two

.
<blockquote>
<blockquote>
<ol>
<li>
<p>one</p>
<p>two</p>
</li>
</ol>
</blockquote>
</blockquote>

```

```example 260
>>- one
>>
  >  > two

.
<blockquote>
<blockquote>
<ul>
<li>one</li>
</ul>
<p>two</p>
</blockquote>
</blockquote>

```

```example 261
-one

2.two

.
<p>-one</p>
<p>2.two</p>

```

```example 262
- foo


  bar

.
<ul>
<li>
<p>foo</p>
<p>bar</p>
</li>
</ul>

```

````example 263
1.  foo

    ```
    bar
    ```

    baz

    > bam

.
<ol>
<li>
<p>foo</p>
<pre><code>bar
</code></pre>
<p>baz</p>
<blockquote>
<p>bam</p>
</blockquote>
</li>
</ol>

````

```example 264
- Foo

      bar


      baz

.
<ul>
<li>
<p>Foo</p>
<pre><code>bar


baz
</code></pre>
</li>
</ul>

```

```example 265
123456789. ok

.
<ol start="123456789">
<li>ok</li>
</ol>

```

```example 266
1234567890. not ok

.
<p>1234567890. not ok</p>

```

```example 267
0. ok

.
<ol start="0">
<li>ok</li>
</ol>

```

```example 268
003. ok

.
<ol start="3">
<li>ok</li>
</ol>

```

```example 269
-1. not ok

.
<p>-1. not ok</p>

```

```example 270
- foo

      bar

.
<ul>
<li>
<p>foo</p>
<pre><code>bar
</code></pre>
</li>
</ul>

```

```example 271
  10.  foo

           bar

.
<ol start="10">
<li>
<p>foo</p>
<pre><code>bar
</code></pre>
</li>
</ol>

```

```example 272
    indented code

paragraph

    more code

.
<pre><code>indented code
</code></pre>
<p>paragraph</p>
<pre><code>more code
</code></pre>

```

```example 273
1.     indented code

   paragraph

       more code

.
<ol>
<li>
<pre><code>indented code
</code></pre>
<p>paragraph</p>
<pre><code>more code
</code></pre>
</li>
</ol>

```

```example 274
1.      indented code

   paragraph

       more code

.
<ol>
<li>
<pre><code> indented code
</code></pre>
<p>paragraph</p>
<pre><code>more code
</code></pre>
</li>
</ol>

```

```example 275
   foo

bar

.
<p>foo</p>
<p>bar</p>

```

```example 276
-    foo

  bar

.
<ul>
<li>foo</li>
</ul>
<p>bar</p>

```

```example 277
-  foo

   bar

.
<ul>
<li>
<p>foo</p>
<p>bar</p>
</li>
</ul>

```

````example 278
-
  foo
-
  ```
  bar
  ```
-
      baz

.
<ul>
<li>foo</li>
<li>
<pre><code>bar
</code></pre>
</li>
<li>
<pre><code>baz
</code></pre>
</li>
</ul>

````

```example 279
-␣␣␣
  foo

.
<ul>
<li>foo</li>
</ul>

```

```example 280
-

  foo

.
<ul>
<li></li>
</ul>
<p>foo</p>

```

```example 281
- foo
-
- bar

.
<ul>
<li>foo</li>
<li></li>
<li>bar</li>
</ul>

```

```example 282
- foo
-␣␣␣
- bar

.
<ul>
<li>foo</li>
<li></li>
<li>bar</li>
</ul>

```

```example 283
1. foo
2.
3. bar

.
<ol>
<li>foo</li>
<li></li>
<li>bar</li>
</ol>

```

```example 284
*

.
<ul>
<li></li>
</ul>

```

```example 285
foo
*

foo
1.

.
<p>foo
*</p>
<p>foo
1.</p>

```

```example 286
 1.  A paragraph
     with two lines.

         indented code

     > A block quote.

.
<ol>
<li>
<p>A paragraph
with two lines.</p>
<pre><code>indented code
</code></pre>
<blockquote>
<p>A block quote.</p>
</blockquote>
</li>
</ol>

```

```example 287
  1.  A paragraph
      with two lines.

          indented code

      > A block quote.

.
<ol>
<li>
<p>A paragraph
with two lines.</p>
<pre><code>indented code
</code></pre>
<blockquote>
<p>A block quote.</p>
</blockquote>
</li>
</ol>

```

```example 288
   1.  A paragraph
       with two lines.

           indented code

       > A block quote.

.
<ol>
<li>
<p>A paragraph
with two lines.</p>
<pre><code>indented code
</code></pre>
<blockquote>
<p>A block quote.</p>
</blockquote>
</li>
</ol>

```

```example 289
    1.  A paragraph
        with two lines.

            indented code

        > A block quote.

.
<pre><code>1.  A paragraph
    with two lines.

        indented code

    &gt; A block quote.
</code></pre>

```

```example 290
  1.  A paragraph
with two lines.

          indented code

      > A block quote.

.
<ol>
<li>
<p>A paragraph
with two lines.</p>
<pre><code>indented code
</code></pre>
<blockquote>
<p>A block quote.</p>
</blockquote>
</li>
</ol>

```

```example 291
  1.  A paragraph
    with two lines.

.
<ol>
<li>A paragraph
with two lines.</li>
</ol>

```

```example 292
> 1. > Blockquote
continued here.

.
<blockquote>
<ol>
<li>
<blockquote>
<p>Blockquote
continued here.</p>
</blockquote>
</li>
</ol>
</blockquote>

```

```example 293
> 1. > Blockquote
> continued here.

.
<blockquote>
<ol>
<li>
<blockquote>
<p>Blockquote
continued here.</p>
</blockquote>
</li>
</ol>
</blockquote>

```

```example 294
- foo
  - bar
    - baz
      - boo

.
<ul>
<li>foo
<ul>
<li>bar
<ul>
<li>baz
<ul>
<li>boo</li>
</ul>
</li>
</ul>
</li>
</ul>
</li>
</ul>

```

```example 295
- foo
 - bar
  - baz
   - boo

.
<ul>
<li>foo</li>
<li>bar</li>
<li>baz</li>
<li>boo</li>
</ul>

```

```example 296
10) foo
    - bar

.
<ol start="10">
<li>foo
<ul>
<li>bar</li>
</ul>
</li>
</ol>

```

```example 297
10) foo
   - bar

.
<ol start="10">
<li>foo</li>
</ol>
<ul>
<li>bar</li>
</ul>

```

```example 298
- - foo

.
<ul>
<li>
<ul>
<li>foo</li>
</ul>
</li>
</ul>

```

```example 299
1. - 2. foo

.
<ol>
<li>
<ul>
<li>
<ol start="2">
<li>foo</li>
</ol>
</li>
</ul>
</li>
</ol>

```

```example 300
- # Foo
- Bar
  ---
  baz

.
<ul>
<li>
<h1>Foo</h1>
</li>
<li>
<h2>Bar</h2>
baz</li>
</ul>

```

## Lists

```example 301
- foo
- bar
+ baz

.
<ul>
<li>foo</li>
<li>bar</li>
</ul>
<ul>
<li>baz</li>
</ul>

```

```example 302
1. foo
2. bar
3) baz

.
<ol>
<li>foo</li>
<li>bar</li>
</ol>
<ol start="3">
<li>baz</li>
</ol>

```

```example 303
Foo
- bar
- baz

.
<p>Foo</p>
<ul>
<li>bar</li>
<li>baz</li>
</ul>

```

```example 304
The number of windows in my house is
14.  The number of doors is 6.

.
<p>The number of windows in my house is
14.  The number of doors is 6.</p>

```

```example 305
The number of windows in my house is
1.  The number of doors is 6.

.
<p>The number of windows in my house is</p>
<ol>
<li>The number of doors is 6.</li>
</ol>

```

```example 306
- foo

- bar


- baz

.
<ul>
<li>
<p>foo</p>
</li>
<li>
<p>bar</p>
</li>
<li>
<p>baz</p>
</li>
</ul>

```

```example 307
- foo
  - bar
    - baz


      bim

.
<ul>
<li>foo
<ul>
<li>bar
<ul>
<li>
<p>baz</p>
<p>bim</p>
</li>
</ul>
</li>
</ul>
</li>
</ul>

```

```example 308
- foo
- bar

<!-- -->

- baz
- bim

.
<ul>
<li>foo</li>
<li>bar</li>
</ul>
<!-- -->
<ul>
<li>baz</li>
<li>bim</li>
</ul>

```

```example 309
-   foo

    notcode

-   foo

<!-- -->

    code

.
<ul>
<li>
<p>foo</p>
<p>notcode</p>
</li>
<li>
<p>foo</p>
</li>
</ul>
<!-- -->
<pre><code>code
</code></pre>

```

```example 310
- a
 - b
  - c
   - d
  - e
 - f
- g

.
<ul>
<li>a</li>
<li>b</li>
<li>c</li>
<li>d</li>
<li>e</li>
<li>f</li>
<li>g</li>
</ul>

```

```example 311
1. a

  2. b

   3. c

.
<ol>
<li>
<p>a</p>
</li>
<li>
<p>b</p>
</li>
<li>
<p>c</p>
</li>
</ol>

```

```example 312
- a
 - b
  - c
   - d
    - e

.
<ul>
<li>a</li>
<li>b</li>
<li>c</li>
<li>d
- e</li>
</ul>

```

```example 313
1. a

  2. b

    3. c

.
<ol>
<li>
<p>a</p>
</li>
<li>
<p>b</p>
</li>
</ol>
<pre><code>3. c
</code></pre>

```

```example 314
- a
- b

- c

.
<ul>
<li>
<p>a</p>
</li>
<li>
<p>b</p>
</li>
<li>
<p>c</p>
</li>
</ul>

```

```example 315
* a
*

* c

.
<ul>
<li>
<p>a</p>
</li>
<li></li>
<li>
<p>c</p>
</li>
</ul>

```

```example 316
- a
- b

  c
- d

.
<ul>
<li>
<p>a</p>
</li>
<li>
<p>b</p>
<p>c</p>
</li>
<li>
<p>d</p>
</li>
</ul>

```

```example 317
- a
- b

  [ref]: /url
- d

.
<ul>
<li>
<p>a</p>
</li>
<li>
<p>b</p>
</li>
<li>
<p>d</p>
</li>
</ul>

```

````example 318
- a
- ```
  b


  ```
- c

.
<ul>
<li>a</li>
<li>
<pre><code>b


</code></pre>
</li>
<li>c</li>
</ul>

````

```example 319
- a
  - b

    c
- d

.
<ul>
<li>a
<ul>
<li>
<p>b</p>
<p>c</p>
</li>
</ul>
</li>
<li>d</li>
</ul>

```

```example 320
* a
  > b
  >
* c

.
<ul>
<li>a
<blockquote>
<p>b</p>
</blockquote>
</li>
<li>c</li>
</ul>

```

````example 321
- a
  > b
  ```
  c
  ```
- d

.
<ul>
<li>a
<blockquote>
<p>b</p>
</blockquote>
<pre><code>c
</code></pre>
</li>
<li>d</li>
</ul>

````

```example 322
- a

.
<ul>
<li>a</li>
</ul>

```

```example 323
- a
  - b

.
<ul>
<li>a
<ul>
<li>b</li>
</ul>
</li>
</ul>

```

````example 324
1. ```
   foo
   ```

   bar

.
<ol>
<li>
<pre><code>foo
</code></pre>
<p>bar</p>
</li>
</ol>

````

```example 325
* foo
  * bar

  baz

.
<ul>
<li>
<p>foo</p>
<ul>
<li>bar</li>
</ul>
<p>baz</p>
</li>
</ul>

```

```example 326
- a
  - b
  - c

- d
  - e
  - f

.
<ul>
<li>
<p>a</p>
<ul>
<li>b</li>
<li>c</li>
</ul>
</li>
<li>
<p>d</p>
<ul>
<li>e</li>
<li>f</li>
</ul>
</li>
</ul>

```

## Inlines

```example 327
`hi`lo`

.
<p><code>hi</code>lo`</p>

```

## Code spans

```example 328
`foo`

.
<p><code>foo</code></p>

```

```example 329
`` foo ` bar ``

.
<p><code>foo ` bar</code></p>

```

```example 330
` `` `

.
<p><code>``</code></p>

```

```example 331
`  ``  `

.
<p><code> `` </code></p>

```

```example 332
` a`

.
<p><code> a</code></p>

```

```example 333
` b `

.
<p><code> b </code></p>

```

```example 334
` `
`  `

.
<p><code> </code>
<code>  </code></p>

```

```example 335
``
foo
bar␣␣
baz
``

.
<p><code>foo bar   baz</code></p>

```

```example 336
``
foo␣
``

.
<p><code>foo </code></p>

```

```example 337
`foo   bar␣
baz`

.
<p><code>foo   bar  baz</code></p>

```

```example 338
`foo\`bar`

.
<p><code>foo\</code>bar`</p>

```

```example 339
``foo`bar``

.
<p><code>foo`bar</code></p>

```

```example 340
` foo `` bar `

.
<p><code>foo `` bar</code></p>

```

```example 341
*foo`*`

.
<p>*foo<code>*</code></p>

```

```example 342
[not a `link](/foo`)

.
<p>[not a <code>link](/foo</code>)</p>

```

```example 343
`<a href="`">`

.
<p><code>&lt;a href=&quot;</code>&quot;&gt;`</p>

```

```example 344
<a href="`">`

.
<p><a href="`">`</p>

```

```example 345
`<https://foo.bar.`baz>`

.
<p><code>&lt;https://foo.bar.</code>baz&gt;`</p>

```

```example 346
<https://foo.bar.`baz>`

.
<p><a href="https://foo.bar.%60baz">https://foo.bar.`baz</a>`</p>

```

````example 347
```foo``

.
<p>```foo``</p>

````

```example 348
`foo

.
<p>`foo</p>

```

```example 349
`foo``bar``

.
<p>`foo<code>bar</code></p>

```

## Emphasis and strong emphasis

```example 350
*foo bar*

.
<p><em>foo bar</em></p>

```

```example 351
a * foo bar*

.
<p>a * foo bar*</p>

```

```example 352
a*"foo"*

.
<p>a*&quot;foo&quot;*</p>

```

```example 353
* a *

.
<p>* a *</p>

```

```example 354
*$*alpha.

*£*bravo.

*€*charlie.

.
<p>*$*alpha.</p>
<p>*£*bravo.</p>
<p>*€*charlie.</p>

```

```example 355
foo*bar*

.
<p>foo<em>bar</em></p>

```

```example 356
5*6*78

.
<p>5<em>6</em>78</p>

```

```example 357
_foo bar_

.
<p><em>foo bar</em></p>

```

```example 358
_ foo bar_

.
<p>_ foo bar_</p>

```

```example 359
a_"foo"_

.
<p>a_&quot;foo&quot;_</p>

```

```example 360
foo_bar_

.
<p>foo_bar_</p>

```

```example 361
5_6_78

.
<p>5_6_78</p>

```

```example 362
пристаням_стремятся_

.
<p>пристаням_стремятся_</p>

```

```example 363
aa_"bb"_cc

.
<p>aa_&quot;bb&quot;_cc</p>

```

```example 364
foo-_(bar)_

.
<p>foo-<em>(bar)</em></p>

```

```example 365
_foo*

.
<p>_foo*</p>

```

```example 366
*foo bar *

.
<p>*foo bar *</p>

```

```example 367
*foo bar
*

.
<p>*foo bar
*</p>

```

```example 368
*(*foo)

.
<p>*(*foo)</p>

```

```example 369
*(*foo*)*

.
<p><em>(<em>foo</em>)</em></p>

```

```example 370
*foo*bar

.
<p><em>foo</em>bar</p>

```

```example 371
_foo bar _

.
<p>_foo bar _</p>

```

```example 372
_(_foo)

.
<p>_(_foo)</p>

```

```example 373
_(_foo_)_

.
<p><em>(<em>foo</em>)</em></p>

```

```example 374
_foo_bar

.
<p>_foo_bar</p>

```

```example 375
_пристаням_стремятся

.
<p>_пристаням_стремятся</p>

```

```example 376
_foo_bar_baz_

.
<p><em>foo_bar_baz</em></p>

```

```example 377
_(bar)_.

.
<p><em>(bar)</em>.</p>

```

```example 378
**foo bar**

.
<p><strong>foo bar</strong></p>

```

```example 379
** foo bar**

.
<p>** foo bar**</p>

```

```example 380
a**"foo"**

.
<p>a**&quot;foo&quot;**</p>

```

```example 381
foo**bar**

.
<p>foo<strong>bar</strong></p>

```

```example 382
__foo bar__

.
<p><strong>foo bar</strong></p>

```

```example 383
__ foo bar__

.
<p>__ foo bar__</p>

```

```example 384
__
foo bar__

.
<p>__
foo bar__</p>

```

```example 385
a__"foo"__

.
<p>a__&quot;foo&quot;__</p>

```

```example 386
foo__bar__

.
<p>foo__bar__</p>

```

```example 387
5__6__78

.
<p>5__6__78</p>

```

```example 388
пристаням__стремятся__

.
<p>пристаням__стремятся__</p>

```

```example 389
__foo, __bar__, baz__

.
<p><strong>foo, <strong>bar</strong>, baz</strong></p>

```

```example 390
foo-__(bar)__

.
<p>foo-<strong>(bar)</strong></p>

```

```example 391
**foo bar **

.
<p>**foo bar **</p>

```

```example 392
**(**foo)

.
<p>**(**foo)</p>

```

```example 393
*(**foo**)*

.
<p><em>(<strong>foo</strong>)</em></p>

```

```example 394
**Gomphocarpus (*Gomphocarpus physocarpus*, syn.
*Asclepias physocarpa*)**

.
<p><strong>Gomphocarpus (<em>Gomphocarpus physocarpus</em>, syn.
<em>Asclepias physocarpa</em>)</strong></p>

```

```example 395
**foo "*bar*" foo**

.
<p><strong>foo &quot;<em>bar</em>&quot; foo</strong></p>

```

```example 396
**foo**bar

.
<p><strong>foo</strong>bar</p>

```

```example 397
__foo bar __

.
<p>__foo bar __</p>

```

```example 398
__(__foo)

.
<p>__(__foo)</p>

```

```example 399
_(__foo__)_

.
<p><em>(<strong>foo</strong>)</em></p>

```

```example 400
__foo__bar

.
<p>__foo__bar</p>

```

```example 401
__пристаням__стремятся

.
<p>__пристаням__стремятся</p>

```

```example 402
__foo__bar__baz__

.
<p><strong>foo__bar__baz</strong></p>

```

```example 403
__(bar)__.

.
<p><strong>(bar)</strong>.</p>

```

```example 404
*foo [bar](/url)*

.
<p><em>foo <a href="/url">bar</a></em></p>

```

```example 405
*foo
bar*

.
<p><em>foo
bar</em></p>

```

```example 406
_foo __bar__ baz_

.
<p><em>foo <strong>bar</strong> baz</em></p>

```

```example 407
_foo _bar_ baz_

.
<p><em>foo <em>bar</em> baz</em></p>

```

```example 408
__foo_ bar_

.
<p><em><em>foo</em> bar</em></p>

```

```example 409
*foo *bar**

.
<p><em>foo <em>bar</em></em></p>

```

```example 410
*foo **bar** baz*

.
<p><em>foo <strong>bar</strong> baz</em></p>

```

```example 411
*foo**bar**baz*

.
<p><em>foo<strong>bar</strong>baz</em></p>

```

```example 412
*foo**bar*

.
<p><em>foo**bar</em></p>

```

```example 413
***foo** bar*

.
<p><em><strong>foo</strong> bar</em></p>

```

```example 414
*foo **bar***

.
<p><em>foo <strong>bar</strong></em></p>

```

```example 415
*foo**bar***

.
<p><em>foo<strong>bar</strong></em></p>

```

```example 416
foo***bar***baz

.
<p>foo<em><strong>bar</strong></em>baz</p>

```

```example 417
foo******bar*********baz

.
<p>foo<strong><strong><strong>bar</strong></strong></strong>***baz</p>

```

```example 418
*foo **bar *baz* bim** bop*

.
<p><em>foo <strong>bar <em>baz</em> bim</strong> bop</em></p>

```

```example 419
*foo [*bar*](/url)*

.
<p><em>foo <a href="/url"><em>bar</em></a></em></p>

```

```example 420
** is not an empty emphasis

.
<p>** is not an empty emphasis</p>

```

```example 421
**** is not an empty strong emphasis

.
<p>**** is not an empty strong emphasis</p>

```

```example 422
**foo [bar](/url)**

.
<p><strong>foo <a href="/url">bar</a></strong></p>

```

```example 423
**foo
bar**

.
<p><strong>foo
bar</strong></p>

```

```example 424
__foo _bar_ baz__

.
<p><strong>foo <em>bar</em> baz</strong></p>

```

```example 425
__foo __bar__ baz__

.
<p><strong>foo <strong>bar</strong> baz</strong></p>

```

```example 426
____foo__ bar__

.
<p><strong><strong>foo</strong> bar</strong></p>

```

```example 427
**foo **bar****

.
<p><strong>foo <strong>bar</strong></strong></p>

```

```example 428
**foo *bar* baz**

.
<p><strong>foo <em>bar</em> baz</strong></p>

```

```example 429
**foo*bar*baz**

.
<p><strong>foo<em>bar</em>baz</strong></p>

```

```example 430
***foo* bar**

.
<p><strong><em>foo</em> bar</strong></p>

```

```example 431
**foo *bar***

.
<p><strong>foo <em>bar</em></strong></p>

```

```example 432
**foo *bar **baz**
bim* bop**

.
<p><strong>foo <em>bar <strong>baz</strong>
bim</em> bop</strong></p>

```

```example 433
**foo [*bar*](/url)**

.
<p><strong>foo <a href="/url"><em>bar</em></a></strong></p>

```

```example 434
__ is not an empty emphasis

.
<p>__ is not an empty emphasis</p>

```

```example 435
____ is not an empty strong emphasis

.
<p>____ is not an empty strong emphasis</p>

```

```example 436
foo ***

.
<p>foo ***</p>

```

```example 437
foo *\**

.
<p>foo <em>*</em></p>

```

```example 438
foo *_*

.
<p>foo <em>_</em></p>

```

```example 439
foo *****

.
<p>foo *****</p>

```

```example 440
foo **\***

.
<p>foo <strong>*</strong></p>

```

```example 441
foo **_**

.
<p>foo <strong>_</strong></p>

```

```example 442
**foo*

.
<p>*<em>foo</em></p>

```

```example 443
*foo**

.
<p><em>foo</em>*</p>

```

```example 444
***foo**

.
<p>*<strong>foo</strong></p>

```

```example 445
****foo*

.
<p>***<em>foo</em></p>

```

```example 446
**foo***

.
<p><strong>foo</strong>*</p>

```

```example 447
*foo****

.
<p><em>foo</em>***</p>

```

```example 448
foo ___

.
<p>foo ___</p>

```

```example 449
foo _\__

.
<p>foo <em>_</em></p>

```

```example 450
foo _*_

.
<p>foo <em>*</em></p>

```

```example 451
foo _____

.
<p>foo _____</p>

```

```example 452
foo __\___

.
<p>foo <strong>_</strong></p>

```

```example 453
foo __*__

.
<p>foo <strong>*</strong></p>

```

```example 454
__foo_

.
<p>_<em>foo</em></p>

```

```example 455
_foo__

.
<p><em>foo</em>_</p>

```

```example 456
___foo__

.
<p>_<strong>foo</strong></p>

```

```example 457
____foo_

.
<p>___<em>foo</em></p>

```

```example 458
__foo___

.
<p><strong>foo</strong>_</p>

```

```example 459
_foo____

.
<p><em>foo</em>___</p>

```

```example 460
**foo**

.
<p><strong>foo</strong></p>

```

```example 461
*_foo_*

.
<p><em><em>foo</em></em></p>

```

```example 462
__foo__

.
<p><strong>foo</strong></p>

```

```example 463
_*foo*_

.
<p><em><em>foo</em></em></p>

```

```example 464
****foo****

.
<p><strong><strong>foo</strong></strong></p>

```

```example 465
____foo____

.
<p><strong><strong>foo</strong></strong></p>

```

```example 466
******foo******

.
<p><strong><strong><strong>foo</strong></strong></strong></p>

```

```example 467
***foo***

.
<p><em><strong>foo</strong></em></p>

```

```example 468
_____foo_____

.
<p><em><strong><strong>foo</strong></strong></em></p>

```

```example 469
*foo _bar* baz_

.
<p><em>foo _bar</em> baz_</p>

```

```example 470
*foo __bar *baz bim__ bam*

.
<p><em>foo <strong>bar *baz bim</strong> bam</em></p>

```

```example 471
**foo **bar baz**

.
<p>**foo <strong>bar baz</strong></p>

```

```example 472
*foo *bar baz*

.
<p>*foo <em>bar baz</em></p>

```

```example 473
*[bar*](/url)

.
<p>*<a href="/url">bar*</a></p>

```

```example 474
_foo [bar_](/url)

.
<p>_foo <a href="/url">bar_</a></p>

```

```example 475
*<img src="foo" title="*"/>

.
<p>*<img src="foo" title="*"/></p>

```

```example 476
**<a href="**">

.
<p>**<a href="**"></p>

```

```example 477
__<a href="__">

.
<p>__<a href="__"></p>

```

```example 478
*a `*`*

.
<p><em>a <code>*</code></em></p>

```

```example 479
_a `_`_

.
<p><em>a <code>_</code></em></p>

```

```example 480
**a<https://foo.bar/?q=**>

.
<p>**a<a href="https://foo.bar/?q=**">https://foo.bar/?q=**</a></p>

```

```example 481
__a<https://foo.bar/?q=__>

.
<p>__a<a href="https://foo.bar/?q=__">https://foo.bar/?q=__</a></p>

```

## Links

```example 482
[link](/uri "title")

.
<p><a href="/uri" title="title">link</a></p>

```

```example 483
[link](/uri)

.
<p><a href="/uri">link</a></p>

```

```example 484
[](./target.md)

.
<p><a href="./target.md"></a></p>

```

```example 485
[link]()

.
<p><a href="">link</a></p>

```

```example 486
[link](<>)

.
<p><a href="">link</a></p>

```

```example 487
[]()

.
<p><a href=""></a></p>

```

```example 488
[link](/my uri)

.
<p>[link](/my uri)</p>

```

```example 489
[link](</my uri>)

.
<p><a href="/my%20uri">link</a></p>

```

```example 490
[link](foo
bar)

.
<p>[link](foo
bar)</p>

```

```example 491
[link](<foo
bar>)

.
<p>[link](<foo
bar>)</p>

```

```example 492
[a](<b)c>)

.
<p><a href="b)c">a</a></p>

```

```example 493
[link](<foo\>)

.
<p>[link](&lt;foo&gt;)</p>

```

```example 494
[a](<b)c
[a](<b)c>
[a](<b>c)

.
<p>[a](&lt;b)c
[a](&lt;b)c&gt;
[a](<b>c)</p>

```

```example 495
[link](\(foo\))

.
<p><a href="(foo)">link</a></p>

```

```example 496
[link](foo(and(bar)))

.
<p><a href="foo(and(bar))">link</a></p>

```

```example 497
[link](foo(and(bar))

.
<p>[link](foo(and(bar))</p>

```

```example 498
[link](foo\(and\(bar\))

.
<p><a href="foo(and(bar)">link</a></p>

```

```example 499
[link](<foo(and(bar)>)

.
<p><a href="foo(and(bar)">link</a></p>

```

```example 500
[link](foo\)\:)

.
<p><a href="foo):">link</a></p>

```

```example 501
[link](#fragment)

[link](https://example.com#fragment)

[link](https://example.com?foo=3#frag)

.
<p><a href="#fragment">link</a></p>
<p><a href="https://example.com#fragment">link</a></p>
<p><a href="https://example.com?foo=3#frag">link</a></p>

```

```example 502
[link](foo\bar)

.
<p><a href="foo%5Cbar">link</a></p>

```

```example 503
[link](foo%20b&auml;)

.
<p><a href="foo%20b%C3%A4">link</a></p>

```

```example 504
[link]("title")

.
<p><a href="%22title%22">link</a></p>

```

```example 505
[link](/url "title")
[link](/url 'title')
[link](/url (title))

.
<p><a href="/url" title="title">link</a>
<a href="/url" title="title">link</a>
<a href="/url" title="title">link</a></p>

```

```example 506
[link](/url "title \"&quot;")

.
<p><a href="/url" title="title &quot;&quot;">link</a></p>

```

```example 507
[link](/url "title")

.
<p><a href="/url%C2%A0%22title%22">link</a></p>

```

```example 508
[link](/url "title "and" title")

.
<p>[link](/url &quot;title &quot;and&quot; title&quot;)</p>

```

```example 509
[link](/url 'title "and" title')

.
<p><a href="/url" title="title &quot;and&quot; title">link</a></p>

```

```example 510
[link](   /uri
  "title"  )

.
<p><a href="/uri" title="title">link</a></p>

```

```example 511
[link] (/uri)

.
<p>[link] (/uri)</p>

```

```example 512
[link [foo [bar]]](/uri)

.
<p><a href="/uri">link [foo [bar]]</a></p>

```

```example 513
[link] bar](/uri)

.
<p>[link] bar](/uri)</p>

```

```example 514
[link [bar](/uri)

.
<p>[link <a href="/uri">bar</a></p>

```

```example 515
[link \[bar](/uri)

.
<p><a href="/uri">link [bar</a></p>

```

```example 516
[link *foo **bar** `#`*](/uri)

.
<p><a href="/uri">link <em>foo <strong>bar</strong> <code>#</code></em></a></p>

```

```example 517
[![moon](moon.jpg)](/uri)

.
<p><a href="/uri"><img src="moon.jpg" alt="moon" /></a></p>

```

```example 518
[foo [bar](/uri)](/uri)

.
<p>[foo <a href="/uri">bar</a>](/uri)</p>

```

```example 519
[foo *[bar [baz](/uri)](/uri)*](/uri)

.
<p>[foo <em>[bar <a href="/uri">baz</a>](/uri)</em>](/uri)</p>

```

```example 520
![[[foo](uri1)](uri2)](uri3)

.
<p><img src="uri3" alt="[foo](uri2)" /></p>

```

```example 521
*[foo*](/uri)

.
<p>*<a href="/uri">foo*</a></p>

```

```example 522
[foo *bar](baz*)

.
<p><a href="baz*">foo *bar</a></p>

```

```example 523
*foo [bar* baz]

.
<p><em>foo [bar</em> baz]</p>

```

```example 524
[foo <bar attr="](baz)">

.
<p>[foo <bar attr="](baz)"></p>

```

```example 525
[foo`](/uri)`

.
<p>[foo<code>](/uri)</code></p>

```

```example 526
[foo<https://example.com/?search=](uri)>

.
<p>[foo<a href="https://example.com/?search=%5D(uri)">https://example.com/?search=](uri)</a></p>

```

```example 527
[foo][bar]

[bar]: /url "title"

.
<p><a href="/url" title="title">foo</a></p>

```

```example 528
[link [foo [bar]]][ref]

[ref]: /uri

.
<p><a href="/uri">link [foo [bar]]</a></p>

```

```example 529
[link \[bar][ref]

[ref]: /uri

.
<p><a href="/uri">link [bar</a></p>

```

```example 530
[link *foo **bar** `#`*][ref]

[ref]: /uri

.
<p><a href="/uri">link <em>foo <strong>bar</strong> <code>#</code></em></a></p>

```

```example 531
[![moon](moon.jpg)][ref]

[ref]: /uri

.
<p><a href="/uri"><img src="moon.jpg" alt="moon" /></a></p>

```

```example 532
[foo [bar](/uri)][ref]

[ref]: /uri

.
<p>[foo <a href="/uri">bar</a>]<a href="/uri">ref</a></p>

```

```example 533
[foo *bar [baz][ref]*][ref]

[ref]: /uri

.
<p>[foo <em>bar <a href="/uri">baz</a></em>]<a href="/uri">ref</a></p>

```

```example 534
*[foo*][ref]

[ref]: /uri

.
<p>*<a href="/uri">foo*</a></p>

```

```example 535
[foo *bar][ref]*

[ref]: /uri

.
<p><a href="/uri">foo *bar</a>*</p>

```

```example 536
[foo <bar attr="][ref]">

[ref]: /uri

.
<p>[foo <bar attr="][ref]"></p>

```

```example 537
[foo`][ref]`

[ref]: /uri

.
<p>[foo<code>][ref]</code></p>

```

```example 538
[foo<https://example.com/?search=][ref]>

[ref]: /uri

.
<p>[foo<a href="https://example.com/?search=%5D%5Bref%5D">https://example.com/?search=][ref]</a></p>

```

```example 539
[foo][BaR]

[bar]: /url "title"

.
<p><a href="/url" title="title">foo</a></p>

```

```example 540
[ẞ]

[SS]: /url

.
<p><a href="/url">ẞ</a></p>

```

```example 541
[Foo
  bar]: /url

[Baz][Foo bar]

.
<p><a href="/url">Baz</a></p>

```

```example 542
[foo] [bar]

[bar]: /url "title"

.
<p>[foo] <a href="/url" title="title">bar</a></p>

```

```example 543
[foo]
[bar]

[bar]: /url "title"

.
<p>[foo]
<a href="/url" title="title">bar</a></p>

```

```example 544
[foo]: /url1

[foo]: /url2

[bar][foo]

.
<p><a href="/url1">bar</a></p>

```

```example 545
[bar][foo\!]

[foo!]: /url

.
<p>[bar][foo!]</p>

```

```example 546
[foo][ref[]

[ref[]: /uri

.
<p>[foo][ref[]</p>
<p>[ref[]: /uri</p>

```

```example 547
[foo][ref[bar]]

[ref[bar]]: /uri

.
<p>[foo][ref[bar]]</p>
<p>[ref[bar]]: /uri</p>

```

```example 548
[[[foo]]]

[[[foo]]]: /url

.
<p>[[[foo]]]</p>
<p>[[[foo]]]: /url</p>

```

```example 549
[foo][ref\[]

[ref\[]: /uri

.
<p><a href="/uri">foo</a></p>

```

```example 550
[bar\\]: /uri

[bar\\]

.
<p><a href="/uri">bar\</a></p>

```

```example 551
[]

[]: /uri

.
<p>[]</p>
<p>[]: /uri</p>

```

```example 552
[
 ]

[
 ]: /uri

.
<p>[
]</p>
<p>[
]: /uri</p>

```

```example 553
[foo][]

[foo]: /url "title"

.
<p><a href="/url" title="title">foo</a></p>

```

```example 554
[*foo* bar][]

[*foo* bar]: /url "title"

.
<p><a href="/url" title="title"><em>foo</em> bar</a></p>

```

```example 555
[Foo][]

[foo]: /url "title"

.
<p><a href="/url" title="title">Foo</a></p>

```

```example 556
[foo]␣
[]

[foo]: /url "title"

.
<p><a href="/url" title="title">foo</a>
[]</p>

```

```example 557
[foo]

[foo]: /url "title"

.
<p><a href="/url" title="title">foo</a></p>

```

```example 558
[*foo* bar]

[*foo* bar]: /url "title"

.
<p><a href="/url" title="title"><em>foo</em> bar</a></p>

```

```example 559
[[*foo* bar]]

[*foo* bar]: /url "title"

.
<p>[<a href="/url" title="title"><em>foo</em> bar</a>]</p>

```

```example 560
[[bar [foo]

[foo]: /url

.
<p>[[bar <a href="/url">foo</a></p>

```

```example 561
[Foo]

[foo]: /url "title"

.
<p><a href="/url" title="title">Foo</a></p>

```

```example 562
[foo] bar

[foo]: /url

.
<p><a href="/url">foo</a> bar</p>

```

```example 563
\[foo]

[foo]: /url "title"

.
<p>[foo]</p>

```

```example 564
[foo*]: /url

*[foo*]

.
<p>*<a href="/url">foo*</a></p>

```

```example 565
[foo][bar]

[foo]: /url1
[bar]: /url2

.
<p><a href="/url2">foo</a></p>

```

```example 566
[foo][]

[foo]: /url1

.
<p><a href="/url1">foo</a></p>

```

```example 567
[foo]()

[foo]: /url1

.
<p><a href="">foo</a></p>

```

```example 568
[foo](not a link)

[foo]: /url1

.
<p><a href="/url1">foo</a>(not a link)</p>

```

```example 569
[foo][bar][baz]

[baz]: /url

.
<p>[foo]<a href="/url">bar</a></p>

```

```example 570
[foo][bar][baz]

[baz]: /url1
[bar]: /url2

.
<p><a href="/url2">foo</a><a href="/url1">baz</a></p>

```

```example 571
[foo][bar][baz]

[baz]: /url1
[foo]: /url2

.
<p>[foo]<a href="/url1">bar</a></p>

```

## Images

```example 572
![foo](/url "title")

.
<p><img src="/url" alt="foo" title="title" /></p>

```

```example 573
![foo *bar*]

[foo *bar*]: train.jpg "train & tracks"

.
<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>

```

```example 574
![foo ![bar](/url)](/url2)

.
<p><img src="/url2" alt="foo bar" /></p>

```

```example 575
![foo [bar](/url)](/url2)

.
<p><img src="/url2" alt="foo bar" /></p>

```

```example 576
![foo *bar*][]

[foo *bar*]: train.jpg "train & tracks"

.
<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>

```

```example 577
![foo *bar*][foobar]

[FOOBAR]: train.jpg "train & tracks"

.
<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>

```

```example 578
![foo](train.jpg)

.
<p><img src="train.jpg" alt="foo" /></p>

```

```example 579
My ![foo bar](/path/to/train.jpg  "title"   )

.
<p>My <img src="/path/to/train.jpg" alt="foo bar" title="title" /></p>

```

```example 580
![foo](<url>)

.
<p><img src="url" alt="foo" /></p>

```

```example 581
![](/url)

.
<p><img src="/url" alt="" /></p>

```

```example 582
![foo][bar]

[bar]: /url

.
<p><img src="/url" alt="foo" /></p>

```

```example 583
![foo][bar]

[BAR]: /url

.
<p><img src="/url" alt="foo" /></p>

```

```example 584
![foo][]

[foo]: /url "title"

.
<p><img src="/url" alt="foo" title="title" /></p>

```

```example 585
![*foo* bar][]

[*foo* bar]: /url "title"

.
<p><img src="/url" alt="foo bar" title="title" /></p>

```

```example 586
![Foo][]

[foo]: /url "title"

.
<p><img src="/url" alt="Foo" title="title" /></p>

```

```example 587
![foo]␣
[]

[foo]: /url "title"

.
<p><img src="/url" alt="foo" title="title" />
[]</p>

```

```example 588
![foo]

[foo]: /url "title"

.
<p><img src="/url" alt="foo" title="title" /></p>

```

```example 589
![*foo* bar]

[*foo* bar]: /url "title"

.
<p><img src="/url" alt="foo bar" title="title" /></p>

```

```example 590
![[foo]]

[[foo]]: /url "title"

.
<p>![[foo]]</p>
<p>[[foo]]: /url &quot;title&quot;</p>

```

```example 591
![Foo]

[foo]: /url "title"

.
<p><img src="/url" alt="Foo" title="title" /></p>

```

```example 592
!\[foo]

[foo]: /url "title"

.
<p>![foo]</p>

```

```example 593
\![foo]

[foo]: /url "title"

.
<p>!<a href="/url" title="title">foo</a></p>

```

## Autolinks

```example 594
<http://foo.bar.baz>

.
<p><a href="http://foo.bar.baz">http://foo.bar.baz</a></p>

```

```example 595
<https://foo.bar.baz/test?q=hello&id=22&boolean>

.
<p><a href="https://foo.bar.baz/test?q=hello&amp;id=22&amp;boolean">https://foo.bar.baz/test?q=hello&amp;id=22&amp;boolean</a></p>

```

```example 596
<irc://foo.bar:2233/baz>

.
<p><a href="irc://foo.bar:2233/baz">irc://foo.bar:2233/baz</a></p>

```

```example 597
<MAILTO:FOO@BAR.BAZ>

.
<p><a href="MAILTO:FOO@BAR.BAZ">MAILTO:FOO@BAR.BAZ</a></p>

```

```example 598
<a+b+c:d>

.
<p><a href="a+b+c:d">a+b+c:d</a></p>

```

```example 599
<made-up-scheme://foo,bar>

.
<p><a href="made-up-scheme://foo,bar">made-up-scheme://foo,bar</a></p>

```

```example 600
<https://../>

.
<p><a href="https://../">https://../</a></p>

```

```example 601
<localhost:5001/foo>

.
<p><a href="localhost:5001/foo">localhost:5001/foo</a></p>

```

```example 602
<https://foo.bar/baz bim>

.
<p>&lt;https://foo.bar/baz bim&gt;</p>

```

```example 603
<https://example.com/\[\>

.
<p><a href="https://example.com/%5C%5B%5C">https://example.com/\[\</a></p>

```

```example 604
<foo@bar.example.com>

.
<p><a href="mailto:foo@bar.example.com">foo@bar.example.com</a></p>

```

```example 605
<foo+special@Bar.baz-bar0.com>

.
<p><a href="mailto:foo+special@Bar.baz-bar0.com">foo+special@Bar.baz-bar0.com</a></p>

```

```example 606
<foo\+@bar.example.com>

.
<p>&lt;foo+@bar.example.com&gt;</p>

```

```example 607
<>

.
<p>&lt;&gt;</p>

```

```example 608
< https://foo.bar >

.
<p>&lt; https://foo.bar &gt;</p>

```

```example 609
<m:abc>

.
<p>&lt;m:abc&gt;</p>

```

```example 610
<foo.bar.baz>

.
<p>&lt;foo.bar.baz&gt;</p>

```

```example 611
https://example.com

.
<p>https://example.com</p>

```

```example 612
foo@bar.example.com

.
<p>foo@bar.example.com</p>

```

## Raw HTML

```example 613
<a><bab><c2c>

.
<p><a><bab><c2c></p>

```

```example 614
<a/><b2/>

.
<p><a/><b2/></p>

```

```example 615
<a  /><b2
data="foo" >

.
<p><a  /><b2
data="foo" ></p>

```

```example 616
<a foo="bar" bam = 'baz <em>"</em>'
_boolean zoop:33=zoop:33 />

.
<p><a foo="bar" bam = 'baz <em>"</em>'
_boolean zoop:33=zoop:33 /></p>

```

```example 617
Foo <responsive-image src="foo.jpg" />

.
<p>Foo <responsive-image src="foo.jpg" /></p>

```

```example 618
<33> <__>

.
<p>&lt;33&gt; &lt;__&gt;</p>

```

```example 619
<a h*#ref="hi">

.
<p>&lt;a h*#ref=&quot;hi&quot;&gt;</p>

```

```example 620
<a href="hi'> <a href=hi'>

.
<p>&lt;a href=&quot;hi'&gt; &lt;a href=hi'&gt;</p>

```

```example 621
< a><
foo><bar/ >
<foo bar=baz
bim!bop />

.
<p>&lt; a&gt;&lt;
foo&gt;&lt;bar/ &gt;
&lt;foo bar=baz
bim!bop /&gt;</p>

```

```example 622
<a href='bar'title=title>

.
<p>&lt;a href='bar'title=title&gt;</p>

```

```example 623
</a></foo >

.
<p></a></foo ></p>

```

```example 624
</a href="foo">

.
<p>&lt;/a href=&quot;foo&quot;&gt;</p>

```

```example 625
foo <!-- this is a --
comment - with hyphens -->

.
<p>foo <!-- this is a --
comment - with hyphens --></p>

```

```example 626
foo <!--> foo -->

foo <!---> foo -->

.
<p>foo <!--> foo --&gt;</p>
<p>foo <!---> foo --&gt;</p>

```

```example 627
foo <?php echo $a; ?>

.
<p>foo <?php echo $a; ?></p>

```

```example 628
foo <!ELEMENT br EMPTY>

.
<p>foo <!ELEMENT br EMPTY></p>

```

```example 629
foo <![CDATA[>&<]]>

.
<p>foo <![CDATA[>&<]]></p>

```

```example 630
foo <a href="&ouml;">

.
<p>foo <a href="&ouml;"></p>

```

```example 631
foo <a href="\*">

.
<p>foo <a href="\*"></p>

```

```example 632
<a href="\"">

.
<p>&lt;a href=&quot;&quot;&quot;&gt;</p>

```

## Hard line breaks

```example 633
foo␣␣
baz

.
<p>foo<br />
baz</p>

```

```example 634
foo\
baz

.
<p>foo<br />
baz</p>

```

```example 635
foo␣␣␣␣␣␣␣
baz

.
<p>foo<br />
baz</p>

```

```example 636
foo␣␣
     bar

.
<p>foo<br />
bar</p>

```

```example 637
foo\
     bar

.
<p>foo<br />
bar</p>

```

```example 638
*foo␣␣
bar*

.
<p><em>foo<br />
bar</em></p>

```

```example 639
*foo\
bar*

.
<p><em>foo<br />
bar</em></p>

```

```example 640
`code␣␣
span`

.
<p><code>code   span</code></p>

```

```example 641
`code\
span`

.
<p><code>code\ span</code></p>

```

```example 642
<a href="foo␣␣
bar">

.
<p><a href="foo␣␣
bar"></p>

```

```example 643
<a href="foo\
bar">

.
<p><a href="foo\
bar"></p>

```

```example 644
foo\

.
<p>foo\</p>

```

```example 645
foo␣␣

.
<p>foo</p>

```

```example 646
### foo\

.
<h3>foo\</h3>

```

```example 647
### foo␣␣

.
<h3>foo</h3>

```

## Soft line breaks

```example 648
foo
baz

.
<p>foo
baz</p>

```

```example 649
foo␣
 baz

.
<p>foo
baz</p>

```

## Textual content

```example 650
hello $.;'there

.
<p>hello $.;'there</p>

```

```example 651
Foo χρῆν

.
<p>Foo χρῆν</p>

```

```example 652
Multiple     spaces

.
<p>Multiple     spaces</p>

```
