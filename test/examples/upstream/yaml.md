---
source: yaml
url: https://github.com/yaml/yaml-test-suite/tree/da267a5c4782e7361e82889e76c0dc7df0e1e870/src
commit: da267a5c4782e7361e82889e76c0dc7df0e1e870
checks: yaml
---

# yaml-test-suite

## 236B › Invalid value after mapping (error mapping)

```example 1
---
foo:
  bar
invalid
---

.
error
```

## 26DV › Whitespace around colon in mappings (alias mapping whitespace)

```example 2
---
"top1" :␣
  "key1" : &alias1 scalar1
'top2' :␣
  'key2' : &alias2 scalar2
top3: &node3␣
  *alias1 : scalar3
top4:␣
  *alias2 : scalar4
top5   :␣␣␣␣
  scalar5
top6:␣
  &anchor6 'key6' : scalar6
---

.
{
  "top1": {
    "key1": "scalar1"
  },
  "top2": {
    "key2": "scalar2"
  },
  "top3": {
    "scalar1": "scalar3"
  },
  "top4": {
    "scalar2": "scalar4"
  },
  "top5": "scalar5",
  "top6": {
    "key6": "scalar6"
  }
}

```

## 2JQS › Block Mapping with Missing Keys (duplicate-key mapping empty-key)

```example 3
---
: a
: b
---

```

## 3UYS › Escaped slash in double quotes (double)

```example 4
---
escaped slash: "a\/b"
---

.
{
  "escaped slash": "a/b"
}

```

## 4ABK › Flow Mapping Separate Values (flow mapping)

```example 5
---
{
unquoted : "separate",
http://foo.com,
omitted value:,
}
---

```

## 4HVU › Wrong indendation in Sequence (error sequence indent)

```example 6
---
key:
   - ok
   - also ok
  - wrong
---

.
error
```

## 4JVG › Scalar value with two anchors (anchor error mapping)

```example 7
---
top1: &node1
  &k1 key1: val1
top2: &node2
  &v2 val2
---

.
error
```

## 4ZYM › Spec Example 6.4. Line Prefixes (spec scalar literal double upto-1.2 whitespace)

```example 8
---
plain: text
  lines
quoted: "text
  →lines"
block: |
  text
   →lines
---

.
{
  "plain": "text lines",
  "quoted": "text lines",
  "block": "text\n \tlines\n"
}

```

## 565N › Construct Binary (tag unknown-tag)

```example 9
---
canonical: !!binary "\
 R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5\
 OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/+\
 +f/++f/++f/++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLC\
 AgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs="
generic: !!binary |
 R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5
 OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/+
 +f/++f/++f/++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLC
 AgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs=
description:
 The binary value above is a tiny arrow encoded as a gif image.
---

.
{
  "canonical": "R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5OTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLCAgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs=",
  "generic": "R0lGODlhDAAMAIQAAP//9/X17unp5WZmZgAAAOfn515eXvPz7Y6OjuDg4J+fn5\nOTk6enp56enmlpaWNjY6Ojo4SEhP/++f/++f/++f/++f/++f/++f/++f/++f/+\n+f/++f/++f/++f/++f/++SH+Dk1hZGUgd2l0aCBHSU1QACwAAAAADAAMAAAFLC\nAgjoEwnuNAFOhpEMTRiggcz4BNJHrv/zCFcLiwMWYNG84BwwEeECcgggoBADs=\n",
  "description": "The binary value above is a tiny arrow encoded as a gif image."
}

```

## 5BVJ › Spec Example 5.7. Block Scalar Indicators (spec literal folded scalar)

```example 10
---
literal: |
  some
  text
folded: >
  some
  text
---

.
{
  "literal": "some\ntext\n",
  "folded": "some text\n"
}

```

## 5NYZ › Spec Example 6.9. Separated Comment (mapping spec comment)

```example 11
---
key:    # Comment
  value
---

.
{
  "key": "value"
}

```

## 5WE3 › Spec Example 8.17. Explicit Block Mapping Entries (explicit-key spec mapping comment literal sequence)

```example 12
---
? explicit key # Empty value
? |
  block key
: - one # Explicit compact
  - two # block value
---

.
{
  "explicit key": null,
  "block key\n": [
    "one",
    "two"
  ]
}

```

## 6H3V › Backslashes in singlequotes (scalar single)

```example 13
---
'foo: bar\': baz'
---

.
{
  "foo: bar\\": "baz'"
}

```

## 9SHH › Spec Example 5.8. Quoted Scalar Indicators (spec scalar)

```example 14
---
single: 'text'
double: "text"
---

.
{
  "single": "text",
  "double": "text"
}

```

## CUP7 › Spec Example 5.6. Node Property Indicators (local-tag spec tag alias)

```example 15
---
anchored: !local &anchor value
alias: *anchor
---

.
{
  "anchored": "value",
  "alias": "value"
}

```

## D88J › Flow Sequence in Block Mapping (flow sequence mapping)

```example 16
---
a: [b, c]
---

.
{
  "a": [
    "b",
    "c"
  ]
}

```

## D9TU › Single Pair Block Mapping (simple mapping)

```example 17
---
foo: bar
---

.
{
  "foo": "bar"
}

```

## DK95:3 › Tabs that look like indentation (indent whitespace)

```example 18
---
 →
foo: 1
---

.
{
  "foo" : 1
}

```

## DK95:4 › Tabs that look like indentation (indent whitespace)

```example 19
---
foo: 1
→
bar: 2
---

.
{
  "foo" : 1,
  "bar" : 2
}

```

## DK95:5 › Tabs that look like indentation (indent whitespace)

```example 20
---
foo: 1
 →
bar: 2
---

.
{
  "foo" : 1,
  "bar" : 2
}

```

## F8F9 › Spec Example 8.5. Chomping Trailing Lines (spec literal scalar comment)

```example 21
---
 # Strip
  # Comments:
strip: |-
  # text
␣␣
 # Clip
  # comments:

clip: |
  # text
␣
 # Keep
  # comments:

keep: |+
  # text

 # Trail
  # comments.
---

.
{
  "strip": "# text",
  "clip": "# text\n",
  "keep": "# text\n\n"
}

```

## J5UC › Multiple Pair Block Mapping (mapping)

```example 22
---
foo: blue
bar: arrr
baz: jazz
---

.
{
  "foo": "blue",
  "bar": "arrr",
  "baz": "jazz"
}

```

## J7VC › Empty Lines Between Mapping Elements (whitespace mapping)

```example 23
---
one: 2


three: 4
---

.
{
  "one": 2,
  "three": 4
}

```

## K858 › Spec Example 8.6. Empty Scalar Chomping (spec folded literal whitespace)

```example 24
---
strip: >-

clip: >

keep: |+

---

.
{
  "strip": "",
  "clip": "",
  "keep": "\n"
}

```

## LX3P › Implicit Flow Mapping Key on one line (complex-key mapping flow sequence 1.3-err)

```example 25
---
[flow]: block
---

```

## SYW4 › Spec Example 2.2. Mapping Scalars to Scalars (spec scalar comment)

```example 26
---
hr:  65    # Home runs
avg: 0.278 # Batting average
rbi: 147   # Runs Batted In
---

.
{
  "hr": 65,
  "avg": 0.278,
  "rbi": 147
}

```

## UDR7 › Spec Example 5.4. Flow Collection Indicators (spec flow sequence mapping)

```example 27
---
sequence: [ one, two, ]
mapping: { sky: blue, sea: green }
---

.
{
  "sequence": [
    "one",
    "two"
  ],
  "mapping": {
    "sky": "blue",
    "sea": "green"
  }
}

```

## W5VH › Allowed characters in alias (alias 1.3-err)

```example 28
---
a: &:@*!$"<foo>: scalar a
b: *:@*!$"<foo>:
---

.
{
  "a": "scalar a",
  "b": "scalar a"
}

```

## Y79Y:1 › Tabs in various contexts (whitespace)

```example 29
---
foo: |
 →
bar: 1
---

.
{
  "foo": "\t\n",
  "bar": 1
}

```
