---
source: directive
url: https://github.com/micromark/micromark-extension-directive/tree/75da8c52a3f40de6485ac1928fdcdefd7ea0c3fb/test
commit: 75da8c52a3f40de6485ac1928fdcdefd7ea0c3fb
checks: oracle
---

# micromark-extension-directive

## micromark-extension-directive (syntax, text) › should support an escaped colon which would otherwise be a directive

```example 1
\:a
```

## micromark-extension-directive (syntax, text) › should support a directive after an escaped colon

```example 2
\::a
```

## micromark-extension-directive (syntax, text) › should not support a directive after a colon

```example 3
a ::b
```

## micromark-extension-directive (syntax, text) › should not support a colon not followed by a letter

```example 4
:
```

## micromark-extension-directive (syntax, text) › should support a colon followed by a letter

```example 5
:a
```

## micromark-extension-directive (syntax, text) › should support a colon followed by a digit

```example 6
:9
```

## micromark-extension-directive (syntax, text) › should support a colon followed by non-ascii letters

```example 7
a :פּלוטאָ b
```

## micromark-extension-directive (syntax, text) › should not support a colon followed by a dash

```example 8
:-
```

## micromark-extension-directive (syntax, text) › should not support a colon followed by an underscore

```example 9
:_
```

## micromark-extension-directive (syntax, text) › should not support a colon followed by non-ascii punctuation

```example 10
:꙳
```

## micromark-extension-directive (syntax, text) › should support a digit in a name

```example 11
:a9
```

## micromark-extension-directive (syntax, text) › should support a dash in a name

```example 12
:a-b
```

## micromark-extension-directive (syntax, text) › should *not* support a dash at the end of a name

```example 13
:a-
```

## micromark-extension-directive (syntax, text) › should support an underscore in a name

```example 14
:a_b
```

## micromark-extension-directive (syntax, text) › should *not* support an underscore at the end of a name

```example 15
:a_
```

## micromark-extension-directive (syntax, text) › should *not* support a colon right after a name

```example 16
:a:
```

## micromark-extension-directive (syntax, text) › should not interfere w/ gemoji (1)

```example 17
:+1:
```

## micromark-extension-directive (syntax, text) › should not interfere w/ gemoji (2)

```example 18
:heart:
```

## micromark-extension-directive (syntax, text) › should not interfere w/ gemoji (3)

```example 19
:call_me_hand:
```

## micromark-extension-directive (syntax, text) › should not interfere w/ emphasis (`_`)

```example 20
_:directive_
```

## micromark-extension-directive (syntax, text) › should support a name followed by an unclosed `[`

```example 21
:a[
```

## micromark-extension-directive (syntax, text) › should support a name followed by an unclosed `{`

```example 22
:a{
```

## micromark-extension-directive (syntax, text) › should support a name followed by an unclosed `[` w/ content

```example 23
:a[b
```

## micromark-extension-directive (syntax, text) › should support a name followed by an unclosed `{` w/ content

```example 24
:a{b
```

## micromark-extension-directive (syntax, text) › should support an empty label

```example 25
:a[]
```

## micromark-extension-directive (syntax, text) › should support a whitespace only label

```example 26
:a[ →]
```

## micromark-extension-directive (syntax, text) › should support an eol in a label

```example 27
:a[
]
```

## micromark-extension-directive (syntax, text) › should support content in a label

```example 28
:a[a b c]asd
```

## micromark-extension-directive (syntax, text) › should support markdown in a label

```example 29
:a[a *b* c]asd
```

## micromark-extension-directive (syntax, text) › should support initial and final whitespace in and around a label

```example 30
a :x[ b ] c
```

## micromark-extension-directive (syntax, text) › should support markdown in a label (hard break)

```example 31
:x[a␣␣
b]c
```

## micromark-extension-directive (syntax, text) › should support a directive in a label

```example 32
a :b[c :d[e] f] g
```

## micromark-extension-directive (syntax, text) › should support content after a label

```example 33
:a[]asd
```

## micromark-extension-directive (syntax, text) › should support empty attributes

```example 34
:a{}
```

## micromark-extension-directive (syntax, text) › should support whitespace only attributes

```example 35
:a{ →}
```

## micromark-extension-directive (syntax, text) › should support an eol in attributes

```example 36
:a{
}
```

## micromark-extension-directive (syntax, text) › should support attributes w/o values

```example 37
:a{a b c}
```

## micromark-extension-directive (syntax, text) › should support attributes w/ non-ascii letters

```example 38
:planet{плутон}
```

## micromark-extension-directive (syntax, text) › should support attributes w/ unquoted values

```example 39
:a{a=b c=d}
```

## micromark-extension-directive (syntax, text) › should support attributes w/ class shortcut

```example 40
:a{.a .b}
```

## micromark-extension-directive (syntax, text) › should support attributes w/ class shortcut w/o whitespace between

```example 41
:a{.a.b}
```

## micromark-extension-directive (syntax, text) › should support attributes w/ id shortcut

```example 42
:a{#a #b}
```

## micromark-extension-directive (syntax, text) › should support attributes w/ id shortcut w/o whitespace between

```example 43
:a{#a#b}
```

## micromark-extension-directive (syntax, text) › should support attributes w/ shortcuts combined w/ other attributes

```example 44
:a{#a.b.c#d e f=g #h.i.j}
```

## micromark-extension-directive (syntax, text) › should not support an empty shortcut (`.`)

```example 45
:a{..b}
```

## micromark-extension-directive (syntax, text) › should not support certain characters in shortcuts (`=`)

```example 46
:a{.a=b}
```

## micromark-extension-directive (syntax, text) › should support non-ascii characters in shortcuts

```example 47
:a{#بلوتو}
```

## micromark-extension-directive (syntax, text) › should support most characters in shortcuts

```example 48
:a{.a💚b}
```

## micromark-extension-directive (syntax, text) › should support an underscore in attribute names

```example 49
:a{_}
```

## micromark-extension-directive (syntax, text) › should support a colon in attribute names

```example 50
:a{xml:lang}
```

## micromark-extension-directive (syntax, text) › should support double quoted attributes

```example 51
:a{a="b" c="d e f"}
```

## micromark-extension-directive (syntax, text) › should support single quoted attributes

```example 52
:a{a='b' c='d e f'}
```

## micromark-extension-directive (syntax, text) › should support whitespace around initializers

```example 53
:a{a = b c→=→'d' f  =␍"g"}
```

## micromark-extension-directive (syntax, text) › should not support `=` to start an unquoted attribute value

```example 54
:a{b==}
```

## micromark-extension-directive (syntax, text) › should not support a missing attribute value after `=`

```example 55
:a{b=}
```

## micromark-extension-directive (syntax, text) › should not support an apostrophe in an unquoted attribute value

```example 56
:a{b=c'}
```

## micromark-extension-directive (syntax, text) › should not support a grave accent in an unquoted attribute value

```example 57
:a{b=c`}
```

## micromark-extension-directive (syntax, text) › should support most other characters in unquoted attribute values

```example 58
:a{b=a💚b}
```

## micromark-extension-directive (syntax, text) › should not support an EOF in a quoted attribute value

```example 59
:a{b="c
```

## micromark-extension-directive (syntax, text) › should support most other characters in quoted attribute values

```example 60
:a{b="a💚b"}
```

## micromark-extension-directive (syntax, text) › should support EOLs in quoted attribute values

```example 61
:a{b="
c␍  d"}
```

## micromark-extension-directive (syntax, text) › should not support an EOF after a quoted attribute value

```example 62
:a{b="c"
```

## micromark-extension-directive (syntax, leaf) › should support a directive

```example 63
::b
```

## micromark-extension-directive (syntax, leaf) › should not support two colons not followed by a letter

```example 64
::
```

## micromark-extension-directive (syntax, leaf) › should support two colons followed by a letter

```example 65
::a
```

## micromark-extension-directive (syntax, leaf) › should support two colons followed by a digit

```example 66
::9
```

## micromark-extension-directive (syntax, leaf) › should support two colons followed by non-ascii letters

```example 67
::פּלוטאָ
```

## micromark-extension-directive (syntax, leaf) › should not support two colons followed by a dash

```example 68
::-
```

## micromark-extension-directive (syntax, leaf) › should not support a name followed by an unclosed `[`

```example 69
::a[
```

## micromark-extension-directive (syntax, leaf) › should not support a name followed by an unclosed `{`

```example 70
::a{
```

## micromark-extension-directive (syntax, leaf) › should not support a name followed by an unclosed `[` w/ content

```example 71
::a[b
```

## micromark-extension-directive (syntax, leaf) › should not support a name followed by an unclosed `{` w/ content

```example 72
::a{b
```

## micromark-extension-directive (syntax, leaf) › should not support an eol in a label

```example 73
::a[
]
```

## micromark-extension-directive (syntax, leaf) › should not support content after a label

```example 74
::a[]asd
```

## micromark-extension-directive (syntax, leaf) › should not support an eol in attributes

```example 75
::a{
}
```

## micromark-extension-directive (syntax, leaf) › should not support EOLs around initializers

```example 76
::a{f  =␍g}
```

## micromark-extension-directive (syntax, leaf) › should not support EOLs in quoted attribute values

```example 77
::a{b="
c␍  d"}
```

## micromark-extension-directive (syntax, leaf) › should support whitespace after directives

```example 78
::a{b=c} →␣
```

## micromark-extension-directive (syntax, leaf) › should support a block quote after a leaf

```example 79
::a{b=c}
>a
```

## micromark-extension-directive (syntax, leaf) › should support code (fenced) after a leaf

````example 80
::a{b=c}
```js
a
````

## micromark-extension-directive (syntax, leaf) › should support a heading (atx) after a leaf

```example 81
::a{b=c}
# a
```

## micromark-extension-directive (syntax, leaf) › should support a list after a leaf

```example 82
::a{b=c}
* a
```

## micromark-extension-directive (syntax, leaf) › should support a paragraph after a leaf

```example 83
::a{b=c}
a
```

## micromark-extension-directive (syntax, leaf) › should support a block quote before a leaf

```example 84
>a
::a{b=c}
```

## micromark-extension-directive (syntax, leaf) › should support code (fenced) before a leaf

````example 85
```js
a
```
::a{b=c}
````

## micromark-extension-directive (syntax, leaf) › should support a heading (atx) before a leaf

```example 86
# a
::a{b=c}
```

## micromark-extension-directive (syntax, leaf) › should support a list before a leaf

```example 87
* a
::a{b=c}
```

## micromark-extension-directive (syntax, leaf) › should support a paragraph before a leaf

```example 88
a
::a{b=c}
```

## micromark-extension-directive (syntax, leaf) › should not support lazyness (1)

```example 89
> ::a
b
```

## micromark-extension-directive (syntax, leaf) › should not support lazyness (2)

```example 90
> a
::b
```

## micromark-extension-directive (syntax, container) › should not support three colons not followed by a letter

```example 91
:::
```

## micromark-extension-directive (syntax, container) › should support three colons followed by a letter

```example 92
:::a
```

## micromark-extension-directive (syntax, container) › should support three colons followed by a digit

```example 93
:::9
```

## micromark-extension-directive (syntax, container) › should support three colons followed by non-ascii letters

```example 94
:::פּלוטאָ
```

## micromark-extension-directive (syntax, container) › should not support three colons followed by a dash

```example 95
:::-
```

## micromark-extension-directive (syntax, container) › should support no closing fence

```example 96
:::a

```

## micromark-extension-directive (syntax, container) › should support no closing fence in a block quote (1)

```example 97
> :::directive
```

## micromark-extension-directive (syntax, container) › should support no closing fence in a block quote (2)

```example 98
> :::directive
>

```

## micromark-extension-directive (syntax, container) › should support no closing fence in a block quote (3)

```example 99
> :::directive
> asd

```

## micromark-extension-directive (syntax, container) › should support no closing fence in a block quote (4)

```example 100
> :::directive
>

asd
```

## micromark-extension-directive (syntax, container) › should support no closing fence in a list (1)

```example 101
* :::directive
```

## micromark-extension-directive (syntax, container) › should support no closing fence in a list (2)

```example 102
* :::directive
␣␣

```

## micromark-extension-directive (syntax, container) › should support no closing fence in a list (3)

```example 103
* :::directive
  asd

```

## micromark-extension-directive (syntax, container) › should support no closing fence in a list (4)

```example 104
* :::directive
␣␣

asd
```

## micromark-extension-directive (syntax, container) › should support an immediate closing fence

```example 105
:::a
:::
```

## micromark-extension-directive (syntax, container) › should support content after a closing fence

```example 106
:::a
:::
b
```

## micromark-extension-directive (syntax, container) › should not close w/ a “closing” fence of two colons

```example 107
:::a
::
b
```

## micromark-extension-directive (syntax, container) › should close w/ a closing fence of more colons

```example 108
:::a
::::
b
```

## micromark-extension-directive (syntax, container) › should support more opening colons

```example 109
::::a
::::
b
```

## micromark-extension-directive (syntax, container) › should not close w/ a “closing” fence of less colons than the opening

```example 110
:::::a
::::
b
```

## micromark-extension-directive (syntax, container) › should close w/ a closing fence followed by white space

```example 111
:::a
::: →
c
```

## micromark-extension-directive (syntax, container) › should not close w/ a “closing” fence followed by other characters

```example 112
:::a
::: b
c
```

## micromark-extension-directive (syntax, container) › should close w/ an indented closing fence

```example 113
:::a
  :::
c
```

## micromark-extension-directive (syntax, container) › should not close w/ when the “closing” fence is indented at a tab size

```example 114
:::a
→:::
c
```

## micromark-extension-directive (syntax, container) › should not close w/ when the “closing” fence is indented more than a tab size

```example 115
:::a
     :::
c
```

## micromark-extension-directive (syntax, container) › should support blank lines in content

```example 116
:::a

␣␣
→a
```

## micromark-extension-directive (syntax, container) › should support an EOL EOF

```example 117
:::a
→a

```

## micromark-extension-directive (syntax, container) › should support an indented directive

```example 118
  :::a
  b
  :::
c
```

## micromark-extension-directive (syntax, container) › should still not close an indented directive when the “closing” fence is indented a tab size

```example 119
  :::a
→:::
c
```

## micromark-extension-directive (syntax, container) › should support a block quote after a container

```example 120
:::a
:::
>a
```

## micromark-extension-directive (syntax, container) › should support code (fenced) after a container

````example 121
:::a
:::
```js
a
````

## micromark-extension-directive (syntax, container) › should support a heading (atx) after a container

```example 122
:::a
:::
# a
```

## micromark-extension-directive (syntax, container) › should support a list after a container

```example 123
:::a
:::
* a
```

## micromark-extension-directive (syntax, container) › should support a paragraph after a container

```example 124
:::a
:::
a
```

## micromark-extension-directive (syntax, container) › should support a block quote before a container

```example 125
>a
:::a
b
```

## micromark-extension-directive (syntax, container) › should support code (fenced) before a container

````example 126
```js
a
```
:::a
b
````

## micromark-extension-directive (syntax, container) › should support a heading (atx) before a container

```example 127
# a
:::a
b
```

## micromark-extension-directive (syntax, container) › should support a list before a container

```example 128
* a
:::a
b
```

## micromark-extension-directive (syntax, container) › should support a paragraph before a container

```example 129
a
:::a
b
```

## micromark-extension-directive (syntax, container) › should support prefixed containers (1)

```example 130
 :::x
␣
```

## micromark-extension-directive (syntax, container) › should support prefixed containers (2)

```example 131
 :::x
 - a
```

## micromark-extension-directive (syntax, container) › should support prefixed containers (3)

```example 132
 :::x
 - a
 > b
```

## micromark-extension-directive (syntax, container) › should support prefixed containers (4)

```example 133
 :::x
 - a
 > b
 :::
```

## micromark-extension-directive (syntax, container) › should not support lazyness (3)

```example 134
> a
:::b
```

## micromark-extension-directive (syntax, container) › should not support lazyness (4)

```example 135
> :::a
:::
```

## micromark-extension-directive (compile) › should support a directives (abbr)

```example 136
:abbr

:abbr[HTML]

:abbr{title="HyperText Markup Language"}

:abbr[HTML]{title="HyperText Markup Language"}
```

## micromark-extension-directive (compile) › should support directives (youtube)

```example 137
Text:

:youtube

:youtube[Cat in a box a]

:youtube{v=1}

:youtube[Cat in a box b]{v=2}

Leaf:

::youtube

::youtube[Cat in a box c]

::youtube{v=3}

::youtube[Cat in a box d]{v=4}

Container:

:::youtube
w
:::

:::youtube[Cat in a box e]
x
:::

:::youtube{v=5}
y
:::

:::youtube[Cat in a box f]{v=6}
z
:::
```

## micromark-extension-directive (compile) › should support fall through directives (`*`)

```example 138
:youtube[Cat in a box]
:br
```

## content › should support character escapes and character references in label

```example 139
:abbr[x\&y&amp;z]
```

## content › should support escaped brackets in a label

```example 140
:abbr[x\[y\]z]
```

## content › should support balanced brackets in a label

```example 141
:abbr[x[y]z]
```

## content › should support balanced brackets in a label, 32 levels deep

```example 142
:abbr[1[2[3[4[5[6[7[8[9[10[11[12[13[14[15[16[17[18[19[20[21[22[23[24[25[26[27[28[29[30[31[32[x]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]
```

## content › should *not* support balanced brackets in a label, 33 levels deep

```example 143
:abbr[1[2[3[4[5[6[7[8[9[10[11[12[13[14[15[16[17[18[19[20[21[22[23[24[25[26[27[28[29[30[31[32[33[x]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]
```

## content › should support character references in unquoted attribute values

```example 144
:abbr{title=a&apos;b}
```

## content › should support character references in double attribute values

```example 145
:abbr{title="a&apos;b"}
```

## content › should support unknown character references in attribute values

```example 146
:abbr{title="a&somethingelse;b"}
```

## content › should not support non-terminated character references in unquoted attribute values

```example 147
:a{href=&param}
```

## content › should not support non-terminated character references in double quoted attribute values

```example 148
:a{href="&param"}
```

## content › should support container directives in container directives

```example 149
::::div{.big}
:::div{.small}
Text
```

## content › should support leaf directives in container directives

```example 150
:::div{.big}
::hr{.small}
```

## content › should support text directives in container directives

```example 151
:::div{.big}
:b[Text]
```

## content › should support lists in container directives

```example 152
:::section
* a
:::
```

## content › should support lists w/ label brackets in container directives

```example 153
:::section[]
* a
:::
```

## content › should support lists w/ attribute braces in container directives

```example 154
:::section{}
* a
:::
```

## content › should support lazy containers in an unclosed container directive

```example 155
:::i
- +
a
```

## content › should support line endings + spread in containers (syntax-tree/mdast-util-directive#13)

```example 156
 :::div
* b

 c
:::
```
