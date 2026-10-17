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

An element or a span takes its id first, and a heading's slug is numbered past it.

```example 654 heading-id
{@section #checks /}

## Checks
.
<section id="checks"></section>
<h2 id="checks-1">Checks</h2>
```

```example 11
## Hello _world_ #
.
<h2 id="hello-world">Hello <em>world</em></h2>
```

A closing run of `#`s needs a space before it. Without one, or escaped, it is content.

```example 12 ambiguous closing-hashes
# a #

# b#

# c \#
.
<h1 id="a">a</h1>
<h1 id="b">b#</h1>
<h1 id="c-">c #</h1>
```
