---
source: directive
url: https://github.com/micromark/micromark-extension-directive/tree/75da8c52a3f40de6485ac1928fdcdefd7ea0c3fb/test
commit: 75da8c52a3f40de6485ac1928fdcdefd7ea0c3fb
checks: sound
---

# micromark-extension-directive

## micromark-extension-directive (syntax, text) › should not support an empty shortcut (`#`)

```example 1
:a{.#b}
```

## micromark-extension-directive (syntax, text) › should not support an empty shortcut (`}`)

```example 2
:a{.}
```

## micromark-extension-directive (syntax, text) › should not support certain characters in shortcuts (`"`)

```example 3
:a{.a"b}
```

## micromark-extension-directive (syntax, text) › should not support certain characters in shortcuts (`<`)

```example 4
:a{.a<b}
```

## micromark-extension-directive (syntax, leaf) › should support a digit in a name

```example 5
::a9
```

## micromark-extension-directive (syntax, leaf) › should support a dash in a name

```example 6
::a-b
```

## micromark-extension-directive (syntax, leaf) › should support an empty label

```example 7
::a[]
```

## micromark-extension-directive (syntax, leaf) › should support a whitespace only label

```example 8
::a[ →]
```

## micromark-extension-directive (syntax, leaf) › should support content in a label

```example 9
::a[a b c]
```

## micromark-extension-directive (syntax, leaf) › should support markdown in a label

```example 10
::a[a *b* c]
```

## micromark-extension-directive (syntax, leaf) › should support empty attributes

```example 11
::a{}
```

## micromark-extension-directive (syntax, leaf) › should support whitespace only attributes

```example 12
::a{ →}
```

## micromark-extension-directive (syntax, leaf) › should support attributes w/o values

```example 13
::a{a b c}
```

## micromark-extension-directive (syntax, leaf) › should support attributes w/ non-ascii letters

```example 14
::planet{плутон}
```

## micromark-extension-directive (syntax, leaf) › should support attributes w/ unquoted values

```example 15
::a{a=b c=d}
```

## micromark-extension-directive (syntax, leaf) › should support attributes w/ class shortcut

```example 16
::a{.a .b}
```

## micromark-extension-directive (syntax, leaf) › should support attributes w/ id shortcut

```example 17
::a{#a #b}
```

## micromark-extension-directive (syntax, leaf) › should support non-ascii characters in shortcuts

```example 18
::a{#بلوتو}
```

## micromark-extension-directive (syntax, leaf) › should support most characters in shortcuts

```example 19
::a{.a💚b}
```

## micromark-extension-directive (syntax, leaf) › should support double quoted attributes

```example 20
::a{a="b" c="d e f"}
```

## micromark-extension-directive (syntax, leaf) › should support single quoted attributes

```example 21
::a{a='b' c='d e f'}
```

## micromark-extension-directive (syntax, leaf) › should support whitespace around initializers

```example 22
::a{a = b c→=→'d'}
```

## micromark-extension-directive (syntax, leaf) › should not support `=` to start an unquoted attribute value

```example 23
::a{b==}
```

## micromark-extension-directive (syntax, leaf) › should support most other characters in unquoted attribute values

```example 24
::a{b=a💚b}
```

## micromark-extension-directive (syntax, leaf) › should not support an EOF in a quoted attribute value

```example 25
::a{b="c
```

## micromark-extension-directive (syntax, leaf) › should support most other characters in quoted attribute values

```example 26
::a{b="a💚b"}
```

## micromark-extension-directive (syntax, leaf) › should not support an EOF after a quoted attribute value

```example 27
::a{b="c"
```

## micromark-extension-directive (syntax, leaf) › should support code (indented) after a leaf

```example 28
::a{b=c}
    a
```

## micromark-extension-directive (syntax, leaf) › should support a definition after a leaf

```example 29
::a{b=c}
[a]: b
```

## micromark-extension-directive (syntax, leaf) › should support a heading (setext) after a leaf

```example 30
::a{b=c}
a
=
```

## micromark-extension-directive (syntax, leaf) › should support html after a leaf

```example 31
::a{b=c}
<!-->
```

## micromark-extension-directive (syntax, leaf) › should support a thematic break after a leaf

```example 32
::a{b=c}
***
```

## micromark-extension-directive (syntax, leaf) › should support code (indented) before a leaf

```example 33
    a
::a{b=c}
```

## micromark-extension-directive (syntax, leaf) › should support a definition before a leaf

```example 34
[a]: b
::a{b=c}
```

## micromark-extension-directive (syntax, leaf) › should support a heading (setext) before a leaf

```example 35
a
=
::a{b=c}
```

## micromark-extension-directive (syntax, leaf) › should support html before a leaf

```example 36
<!-->
::a{b=c}
```

## micromark-extension-directive (syntax, leaf) › should support a thematic break before a leaf

```example 37
***
::a{b=c}
```

## micromark-extension-directive (syntax, container) › should support a directive

```example 38
:::b
```

## micromark-extension-directive (syntax, container) › should support a digit in a name

```example 39
:::a9
```

## micromark-extension-directive (syntax, container) › should support a dash in a name

```example 40
:::a-b
```

## micromark-extension-directive (syntax, container) › should not support a name followed by an unclosed `[`

```example 41
:::a[
```

## micromark-extension-directive (syntax, container) › should not support a name followed by an unclosed `{`

```example 42
:::a{
```

## micromark-extension-directive (syntax, container) › should not support a name followed by an unclosed `[` w/ content

```example 43
:::a[b
```

## micromark-extension-directive (syntax, container) › should not support a name followed by an unclosed `{` w/ content

```example 44
:::a{b
```

## micromark-extension-directive (syntax, container) › should support an empty label

```example 45
:::a[]
```

## micromark-extension-directive (syntax, container) › should support a whitespace only label

```example 46
:::a[ →]
```

## micromark-extension-directive (syntax, container) › should not support an eol in a label

```example 47
:::a[
]
```

## micromark-extension-directive (syntax, container) › should support content in a label

```example 48
:::a[a b c]
```

## micromark-extension-directive (syntax, container) › should support markdown in a label

```example 49
:::a[a *b* c]
```

## micromark-extension-directive (syntax, container) › should not support content after a label

```example 50
:::a[]asd
```

## micromark-extension-directive (syntax, container) › should support empty attributes

```example 51
:::a{}
```

## micromark-extension-directive (syntax, container) › should support whitespace only attributes

```example 52
:::a{ →}
```

## micromark-extension-directive (syntax, container) › should not support an eol in attributes

```example 53
:::a{
}
```

## micromark-extension-directive (syntax, container) › should support attributes w/o values

```example 54
:::a{a b c}
```

## micromark-extension-directive (syntax, container) › should support attributes w/ non-ascii letters

```example 55
:::planet{плутон}
```

## micromark-extension-directive (syntax, container) › should not support EOLs around initializers

```example 56
:::a{f  =␍g}
```

## micromark-extension-directive (syntax, container) › should not support an EOF in a quoted attribute value

```example 57
:::a{b="c
```

## micromark-extension-directive (syntax, container) › should not support EOLs in quoted attribute values

```example 58
:::a{b="
c␍  d"}
```

## micromark-extension-directive (syntax, container) › should not support an EOF after a quoted attribute value

```example 59
:::a{b="c"
```

## micromark-extension-directive (syntax, container) › should support whitespace after directives

```example 60
:::a{b=c} →␣
```

## micromark-extension-directive (syntax, container) › should support code (indented) after a container

```example 61
:::a
:::
    a
```

## micromark-extension-directive (syntax, container) › should support a definition after a container

```example 62
:::a
:::
[a]: b
```

## micromark-extension-directive (syntax, container) › should support a heading (setext) after a container

```example 63
:::a
:::
a
=
```

## micromark-extension-directive (syntax, container) › should support html after a container

```example 64
:::a
:::
<!-->
```

## micromark-extension-directive (syntax, container) › should support a thematic break after a container

```example 65
:::a
:::
***
```

## micromark-extension-directive (syntax, container) › should support code (indented) before a container

```example 66
    a
:::a
b
```

## micromark-extension-directive (syntax, container) › should support a definition before a container

```example 67
[a]: b
:::a
b
```

## micromark-extension-directive (syntax, container) › should support a heading (setext) before a container

```example 68
a
=
:::a
b
```

## micromark-extension-directive (syntax, container) › should support html before a container

```example 69
<!-->
:::a
b
```

## micromark-extension-directive (syntax, container) › should support a thematic break before a container

```example 70
***
:::a
b
```

## micromark-extension-directive (syntax, container) › should not support lazyness (1)

```example 71
> :::a
b
```

## micromark-extension-directive (syntax, container) › should not support lazyness (2)

```example 72
> :::a
> b
c
```

## micromark-extension-directive (compile) › should support fall through directives (`*`)

```example 73
:a[:img{src="x" alt=y}]{href="z"}
```

## content › should support EOLs in a label

```example 74
:abbr[a
b␍c]
```

## content › should support EOLs at the edges of a label (1)

```example 75
:abbr[
a␍]
```

## content › should support EOLs at the edges of a label (2)

```example 76
:abbr[
]
```

## content › should support EOLs around nested directives

```example 77
:abbr[a
:abbr[b]
c]
```

## content › should support EOLs inside nested directives (1)

```example 78
:abbr[:abbr[
]]
```

## content › should support EOLs inside nested directives (2)

```example 79
:abbr[:abbr[a
b]]
```

## content › should support EOLs inside nested directives (3)

```example 80
:abbr[:abbr[
b
]]
```

## content › should support EOLs inside nested directives (4)

```example 81
:abbr[:abbr[\
]]
```

## content › should support markdown in a label

```example 82
:abbr[a *b* **c** d]
```

## content › should support character references in single attribute values

```example 83
:abbr{title='a&apos;b'}
```

## content › should not support non-terminated character references in single quoted attribute values

```example 84
:a{href='&param'}
```

## content › should support EOLs between attributes

```example 85
:span{a
b}
```

## content › should support EOLs at the edges of attributes

```example 86
:span{
a
}
```

## content › should support EOLs before initializer

```example 87
:span{a␍= b}
```

## content › should support EOLs after initializer

```example 88
:span{a=␍
b}
```

## content › should support EOLs between an unquoted attribute value and a next attribute name

```example 89
:span{a=b
c}
```

## content › should support EOLs in a double quoted attribute value

```example 90
:span{a="b
c"}
```

## content › should support EOLs in a single quoted attribute value

```example 91
:span{a='b
c'}
```

## content › should support `id` shortcuts

```example 92
:span{#a#b}
```

## content › should support `id` shortcuts after `id` attributes

```example 93
:span{id=a id="b" #c#d}
```

## content › should support `class` shortcuts

```example 94
:span{.a.b}
```

## content › should support `class` shortcuts after `class` attributes

```example 95
:span{class=a class="b c" .d.e}
```
