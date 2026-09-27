---
source: math
url: https://github.com/micromark/micromark-extension-math/tree/4c9e82c46f4ee3bb794382b84f9fa537f7452f9e/test
commit: 4c9e82c46f4ee3bb794382b84f9fa537f7452f9e
checks: math
---

# micromark-extension-math

## math › should support one, two, or more dollars by default

```example 1
$a$, $$b$$, $$$c$$$
```

## math › should support an escaped dollar sign which would otherwise open math

```example 2
a \$b$
.
<p>a $b$</p>
```

## math › should not support escaped dollar signs in math (text)

```example 3
a $b\$
```

## math › should support math (text) right after an escaped dollar sign

```example 4
a \$$b$
```

## math › should support a single dollar in math (text) w/ padding and two dollar signs

```example 5
a $$ $ $$
```

## math › should support nested math by using more dollars outside of math (text)

```example 6
a $$\raisebox{0.25em}{$\frac a b$}$$ b
```

## math › should support an “escaped” dollar right on the KaTeX level, not on the Markdown level

```example 7
a $$ \$ $$ b
```

## math › should support padding with a line ending in math (text)

```example 8
a $$
a\$ $$ b
```

## math › should support math (text) w/ one dollar sign

```example 9
a $b$
```

## math › should support math (text) w/ two dollar signs

```example 10
a $$b$$
```

## math › should support math (text) w/ three dollar signs

```example 11
a $$$b$$$
```

## math › should support EOLs in math

```example 12
a $b
c␍d␍
e$ f
```

## math › should not support math (flow) w/ one dollar sign

```example 13
$
a
$
```

## math › should support math (flow) w/ two dollar sign

```example 14
$$
a
$$
```

## math › should support math (flow) w/ three dollar sign

```example 15
$$$
a
$$$
```

## math › should support math (flow) w/o content

```example 16
$$
$$
```

## math › should support math (flow) w/o closing fence

```example 17
$$
a
```

## math › should support math (flow) w/o closing fence ending at an EOL

```example 18
$$
a

```

## math › should support math (flow) w/ a meta string

```example 19
$$asd &amp; \& asd
a
$$
```

## math › should not support math (flow) w/ a dollar sign in the meta string

```example 20
$$asd$asd
a
$$
```

## math › should not support math (flow) w/ content on the closing fence

```example 21
$$
a
$$ b
```

## math › should support whitespace on the closing fence

```example 22
$$
a
$$␣␣
```

## math › should strip the prefix of the opening fence from content lines

```example 23
  $$
→a
  b
 c
d
$$
```

## math › should support math (flow) in a block quote

```example 24
> $$
> a
> $$
> b
```

## math › should support math (flow) in a list (item)

```example 25
* $$
  a
  $$
  b
```

## math › should support `<`

```example 26
a $\sum_{\substack{0<i<m\\0<j<n}}$ b
```

## math › should support `"`

```example 27
a $\text{a \"{a} c}$ b
```

## math › should not support laziness (1)

```example 28
> $$
a
$$
```

## math › should not support laziness (2)

```example 29
> $$
> a
$$
```

## math › should not support laziness (3)

```example 30
a
> $$
```
