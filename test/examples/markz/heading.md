# Headings

Every heading gets an id: `{#id}` on the line above, or GitHub's slug numbered past the ids already used.

```example 9
## Foo

## Foo

## Foo 1
.
<h2 id="foo">Foo</h2>
<h2 id="foo-1">Foo</h2>
<h2 id="foo-1-1">Foo 1</h2>
```

```example 10
{#top}
# A

# Pricing

{#pricing}
# B
.
<h1 id="top">A</h1>
<h1 id="pricing">Pricing</h1>
<h1 id="pricing">B</h1>
.
#pricing
```

```example 11
## Hello _world_ #
.
<h2 id="hello-world">Hello <em>world</em></h2>
```

A closing run of `#`s needs a space before it; otherwise, or escaped, it is content.

```example 12 ambiguous closing-hashes
# a #

# b#

# c \#
.
<h1 id="a">a</h1>
<h1 id="b">b#</h1>
<h1 id="c-">c #</h1>
```
