---
source: yaml
url: https://github.com/yaml/yaml-test-suite/tree/da267a5c4782e7361e82889e76c0dc7df0e1e870/src
commit: da267a5c4782e7361e82889e76c0dc7df0e1e870
checks: sound
---

# yaml-test-suite

## 2CMS › Invalid mapping in plain multiline (error mapping)

```example 1
---
this
 is
  invalid: x
---

.
error
```

## 2EBW › Allowed characters in keys (mapping scalar)

```example 2
---
a!"#$%&'()*+,-./09:;<=>?@AZ[\]^_`az{|}~: safe
?foo: safe question mark
:foo: safe colon
-foo: safe dash
this is#not: a comment
---

.
{
  "a!\"#$%&'()*+,-./09:;<=>?@AZ[\\]^_`az{|}~": "safe",
  "?foo": "safe question mark",
  ":foo": "safe colon",
  "-foo": "safe dash",
  "this is#not": "a comment"
}

```

## 2SXE › Anchors With Colon in Name (alias edge mapping 1.3-err)

```example 3
---
&a: key: &a value
foo:
  *a:
---

.
{
  "key": "value",
  "foo": "key"
}

```

## 3GZX › Spec Example 7.1. Alias Nodes (mapping spec alias)

```example 4
---
First occurrence: &anchor Foo
Second occurrence: *anchor
Override anchor: &anchor Bar
Reuse anchor: *anchor
---

.
{
  "First occurrence": "Foo",
  "Second occurrence": "Foo",
  "Override anchor": "Bar",
  "Reuse anchor": "Bar"
}

```

## 4CQQ › Spec Example 2.18. Multi-line Flow Scalars (spec scalar)

```example 5
---
plain:
  This unquoted scalar
  spans many lines.

quoted: "So does this
  quoted scalar.\n"
---

.
{
  "plain": "This unquoted scalar spans many lines.",
  "quoted": "So does this quoted scalar.\n"
}

```

## 4MUZ › Flow mapping colon on line after key (flow mapping)

```example 6
---
{"foo"
: "bar"}
---

.
{
  "foo": "bar"
}

```

## 4MUZ:1 › Flow mapping colon on line after key (flow mapping)

```example 7
---
{"foo"
: bar}
---

```

## 4MUZ:2 › Flow mapping colon on line after key (flow mapping)

```example 8
---
{foo
: bar}
---

.
{
  "foo": "bar"
}

```

## 54T7 › Flow Mapping (flow mapping)

```example 9
---
{foo: you, bar: far}
---

.
{
  "foo": "you",
  "bar": "far"
}

```

## 57H4 › Spec Example 8.22. Block Collection Nodes (sequence mapping tag)

```example 10
---
sequence: !!seq
- entry
- !!seq
 - nested
mapping: !!map
 foo: bar
---

.
{
  "sequence": [
    "entry",
    [
      "nested"
    ]
  ],
  "mapping": {
    "foo": "bar"
  }
}

```

## 58MP › Flow mapping edge cases (edge flow mapping)

```example 11
---
{x: :x}
---

.
{
  "x": ":x"
}

```

## 5GBF › Spec Example 6.5. Empty Lines (double literal spec scalar upto-1.2 whitespace)

```example 12
---
Folding:
  "Empty line
   →
  as a line feed"
Chomping: |
  Clipped empty lines
␣

---

.
{
  "Folding": "Empty line\nas a line feed",
  "Chomping": "Clipped empty lines\n"
}

```

## 5LLU › Block scalar with wrong indented line after spaces only (error folded whitespace)

```example 13
---
block scalar: >
␣
␣␣
␣␣␣
 invalid
---

.
error
```

## 5U3A › Sequence on same Line as Mapping Key (error sequence mapping)

```example 14
---
key: - a
     - b
---

.
error
```

## 652Z › Question mark at start of flow key (flow)

```example 15
---
{ ?foo: bar,
bar: 42
}
---

.
{
  "?foo" : "bar",
  "bar" : 42
}

```

## 6HB6 › Spec Example 6.1. Indentation Spaces (comment flow spec indent upto-1.2 whitespace)

```example 16
---
  # Leading comment line spaces are
   # neither content nor indentation.
␣␣␣␣
Not indented:
 By one space: |
    By four
      spaces
 Flow style: [    # Leading spaces
   By two,        # in flow style
  Also by two,    # are neither
  →Still by two   # content nor
    ]             # indentation.
---

.
{
  "Not indented": {
    "By one space": "By four\n  spaces\n",
    "Flow style": [
      "By two",
      "Also by two",
      "Still by two"
    ]
  }
}

```

## 6JWB › Tags for Block Objects (mapping sequence tag)

```example 17
---
foo: !!seq
  - !!str a
  - !!map
    key: !!str value
---

.
{
  "foo": [
    "a",
    {
      "key": "value"
    }
  ]
}

```

## 6M2F › Aliases in Explicit Block Mapping (alias explicit-key empty-key)

```example 18
---
? &a a
: &b b
: *a
---

```

## 6S55 › Invalid scalar at the end of sequence (error mapping sequence)

```example 19
---
key:
 - bar
 - baz
 invalid
---

.
error
```

## 6SLA › Allowed characters in quoted mapping key (mapping single double)

```example 20
---
"foo\nbar:baz\tx \\$%^&*()x": 23
'x\ny:z\tx $%^&*()x': 24
---

.
{
  "foo\nbar:baz\tx \\$%^&*()x": 23,
  "x\\ny:z\\tx $%^&*()x": 24
}

```

## 74H7 › Tags in Implicit Mapping (tag mapping)

```example 21
---
!!str a: b
c: !!int 42
e: !!str f
g: h
!!str 23: !!bool false
---

.
{
  "a": "b",
  "c": 42,
  "e": "f",
  "g": "h",
  "23": false
}

```

## 7FWL › Spec Example 6.24. Verbatim Tags (mapping spec tag unknown-tag)

```example 22
---
!<tag:yaml.org,2002:str> foo :
  !<!bar> baz
---

.
{
  "foo": "baz"
}

```

## 7LBH › Multiline double quoted implicit keys (error double)

```example 23
---
"a\nb": 1
"c
 d": 1
---

.
error
```

## 7MNF › Missing colon (error mapping)

```example 24
---
top1:
  key1: val1
top2
---

.
error
```

## 7W2P › Block Mapping with Missing Values (explicit-key mapping)

```example 25
---
? a
? b
c:
---

.
{
  "a": null,
  "b": null,
  "c": null
}

```

## 87E4 › Spec Example 7.8. Single Quoted Implicit Keys (spec flow sequence mapping)

```example 26
---
'implicit block key' : [
  'implicit flow key' : value,
 ]
---

.
{
  "implicit block key": [
    {
      "implicit flow key": "value"
    }
  ]
}

```

## 8QBE › Block Sequence in Block Mapping (mapping sequence)

```example 27
---
key:
 - item1
 - item2
---

.
{
  "key": [
    "item1",
    "item2"
  ]
}

```

## 8XDJ › Comment in plain multiline value (error comment scalar)

```example 28
---
key: word1
#  xxx
  word2
---

.
error
```

## 96NN › Leading tab content in literals (indent literal whitespace)

```example 29
---
foo: |-
 →bar
---

.
{"foo":"\tbar"}

```

## 9CWY › Invalid scalar at the end of mapping (error mapping sequence)

```example 30
---
key:
 - item1
 - item2
invalid
---

.
error
```

## 9FMG › Multi-level Mapping Indent (mapping indent)

```example 31
---
a:
  b:
    c: d
  e:
    f: g
h: i
---

.
{
  "a": {
    "b": {
      "c": "d"
    },
    "e": {
      "f": "g"
    }
  },
  "h": "i"
}

```

## 9J7A › Simple Mapping Indent (simple mapping indent)

```example 32
---
foo:
  bar: baz
---

.
{
  "foo": {
    "bar": "baz"
  }
}

```

## A2M4 › Spec Example 6.2. Indentation Indicators (explicit-key spec libyaml-err indent whitespace sequence upto-1.2)

```example 33
---
? a
: -→b
  -  -→c
     - d
---

.
{
  "a": [
    "b",
    [
      "c",
      "d"
    ]
  ]
}

```

## A6F9 › Spec Example 8.4. Chomping Final Line Break (spec literal scalar)

```example 34
---
strip: |-
  text
clip: |
  text
keep: |+
  text
---

.
{
  "strip": "text",
  "clip": "text\n",
  "keep": "text\n"
}

```

## A984 › Multiline Scalar in Mapping (scalar)

```example 35
---
a: b
 c
d:
 e
  f
---

.
{
  "a": "b c",
  "d": "e f"
}

```

## AZ63 › Sequence With Same Indentation as Parent Mapping (indent mapping sequence)

```example 36
---
one:
- 2
- 3
four: 5
---

.
{
  "one": [
    2,
    3
  ],
  "four": 5
}

```

## BD7L › Invalid mapping after sequence (error mapping sequence)

```example 37
---
- item1
- item2
invalid: x
---

.
error
```

## BS4K › Comment between plain scalar lines (error scalar)

```example 38
---
word1  # comment
word2
---

.
error
```

## BU8L › Node Anchor and Tag on Seperate Lines (anchor indent 1.3-err tag)

```example 39
---
key: &anchor
 !!map
  a: b
---

.
{
  "key": {
    "a": "b"
  }
}

```

## C2DT › Spec Example 7.18. Flow Mapping Adjacent Values (spec flow mapping)

```example 40
---
{
"adjacent":value,
"readable": value,
"empty":
}
---

.
{
  "adjacent": "value",
  "readable": "value",
  "empty": null
}

```

## C2SP › Flow Mapping Key on two lines (error flow mapping)

```example 41
---
[23
]: 42
---

.
error
```

## CML9 › Missing comma in flow (error flow comment)

```example 42
---
key: [ word1
#  xxx
  word2 ]
---

.
error
```

## D49Q › Multiline single quoted implicit keys (error single mapping)

```example 43
---
'a\nb': 1
'c
 d': 1
---

.
error
```

## DC7X › Various trailing tabs (comment whitespace)

```example 44
---
a: b→
seq:→
 - a→
c: d→#X
---

.
{
  "a": "b",
  "seq": [
    "a"
  ],
  "c": "d"
}

```

## DFF7 › Spec Example 7.16. Flow Mapping Entries (explicit-key spec flow mapping)

```example 45
---
{
? explicit: entry,
implicit: entry,
?
}
---

```

## DK95 › Tabs that look like indentation (indent whitespace)

```example 46
---
foo:
 →bar
---

.
{
  "foo" : "bar"
}

```

## DK95:1 › Tabs that look like indentation (indent whitespace)

```example 47
---
foo: "bar
→baz"
---

.
error
```

## DK95:2 › Tabs that look like indentation (indent whitespace)

```example 48
---
foo: "bar
  →baz"
---

.
{
  "foo" : "bar baz"
}

```

## DK95:6 › Tabs that look like indentation (indent whitespace)

```example 49
---
foo:
  a: 1
  →b: 2
---

.
error
```

## DK95:8 › Tabs that look like indentation (indent whitespace)

```example 50
---
foo: "bar
 → → baz → → "
---

.
{
  "foo" : "bar baz \t \t "
}

```

## DMG6 › Wrong indendation in Map (error mapping indent)

```example 51
---
key:
  ok: 1
 wrong: 2
---

.
error
```

## E76Z › Aliases in Implicit Block Mapping (mapping alias)

```example 52
---
&a a: &b b
*b : *a
---

.
{
  "a": "b",
  "b": "a"
}

```

## EHF6 › Tags for Flow Objects (tag flow mapping sequence)

```example 53
---
!!map {
  k: !!seq
  [ a, !!str b]
}
---

.
{
  "k": [
    "a",
    "b"
  ]
}

```

## EW3V › Wrong indendation in mapping (error mapping indent)

```example 54
---
k1: v1
 k2: v2
---

.
error
```

## FBC9 › Allowed characters in plain scalars (scalar)

```example 55
---
safe: a!"#$%&'()*+,-./09:;<=>?@AZ[\]^_`az{|}~
     !"#$%&'()*+,-./09:;<=>?@AZ[\]^_`az{|}~
safe question mark: ?foo
safe colon: :foo
safe dash: -foo
---

.
{
  "safe": "a!\"#$%&'()*+,-./09:;<=>?@AZ[\\]^_`az{|}~ !\"#$%&'()*+,-./09:;<=>?@AZ[\\]^_`az{|}~",
  "safe question mark": "?foo",
  "safe colon": ":foo",
  "safe dash": "-foo"
}

```

## FRK4 › Spec Example 7.3. Completely Empty Flow Nodes (empty-key explicit-key spec flow mapping)

```example 56
---
{
  ? foo :,
  : bar,
}
---

```

## G4RS › Spec Example 2.17. Quoted Scalars (spec scalar)

```example 57
---
unicode: "Sosa did fine.\u263A"
control: "\b1998\t1999\t2000\n"
hex esc: "\x0d\x0a is \r\n"

single: '"Howdy!" he cried.'
quoted: ' # Not a ''comment''.'
tie-fighter: '|\-*-/|'
---

.
{
  "unicode": "Sosa did fine.☺",
  "control": "\b1998\t1999\t2000\n",
  "hex esc": "\r\n is \r\n",
  "single": "\"Howdy!\" he cried.",
  "quoted": " # Not a 'comment'.",
  "tie-fighter": "|\\-*-/|"
}

```

## G7JE › Multiline implicit keys (error mapping)

```example 58
---
a\nb: 1
c
 d: 1
---

.
error
```

## GDY7 › Comment that looks like a mapping key (comment error mapping)

```example 59
---
key: value
this is #not a: key
---

.
error
```

## GH63 › Mixed Block Mapping (explicit to implicit) (explicit-key mapping)

```example 60
---
? a
: 1.3
fifteen: d
---

.
{
  "a": 1.3,
  "fifteen": "d"
}

```

## GT5M › Node anchor in sequence (anchor error sequence)

```example 61
---
- item1
&node
- item2
---

.
error
```

## H2RW › Blank lines (comment literal scalar whitespace)

```example 62
---
foo: 1

bar: 2
␣␣␣␣
text: |
  a
␣␣␣␣
  b

  c
␣
  d
---

.
{
  "foo": 1,
  "bar": 2,
  "text": "a\n  \nb\n\nc\n\nd\n"
}

```

## H7J7 › Node anchor not indented (anchor error indent tag)

```example 63
---
key: &x
!!map
  a: b
---

.
error
```

## HMK4 › Spec Example 2.16. Indentation determines scope (spec folded literal)

```example 64
---
name: Mark McGwire
accomplishment: >
  Mark set a major league
  home run record in 1998.
stats: |
  65 Home Runs
  0.278 Batting Average
---

.
{
  "name": "Mark McGwire",
  "accomplishment": "Mark set a major league home run record in 1998.\n",
  "stats": "65 Home Runs\n0.278 Batting Average\n"
}

```

## HMQ5 › Spec Example 6.23. Node Properties (spec tag alias)

```example 65
---
!!str &a1 "foo":
  !!str bar
&a2 baz : *a1
---

.
{
  "foo": "bar",
  "baz": "foo"
}

```

## HU3P › Invalid Mapping in plain scalar (error mapping scalar)

```example 66
---
key:
  word1 word2
  no: key
---

.
error
```

## J3BT › Spec Example 5.12. Tabs and Spaces (spec whitespace upto-1.2)

```example 67
---
# Tabs and spaces
quoted: "Quoted →"
block:→|
  void main() {
  →printf("Hello, world!\n");
  }
---

.
{
  "quoted": "Quoted \t",
  "block": "void main() {\n\tprintf(\"Hello, world!\\n\");\n}\n"
}

```

## JKF3 › Multiline unidented double quoted block key (indent)

```example 68
---
- - "bar
bar": x
---

.
error
```

## JQ4R › Spec Example 8.14. Block Sequence (mapping spec sequence)

```example 69
---
block sequence:
  - one
  - two : three
---

.
{
  "block sequence": [
    "one",
    {
      "two": "three"
    }
  ]
}

```

## JS2J › Spec Example 6.29. Node Anchors (spec alias)

```example 70
---
First occurrence: &anchor Value
Second occurrence: *anchor
---

.
{
  "First occurrence": "Value",
  "Second occurrence": "Value"
}

```

## JTV5 › Block Mapping with Multiline Scalars (explicit-key mapping scalar)

```example 71
---
? a
  true
: null
  d
? e
  42
---

.
{
  "a true": "null d",
  "e 42": null
}

```

## JY7Z › Trailing content that looks like a mapping (error mapping double)

```example 72
---
key1: "quoted1"
key2: "quoted2" no key: nor value
key3: "quoted3"
---

.
error
```

## KK5P › Various combinations of explicit block mappings (explicit-key mapping sequence)

```example 73
---
complex1:
  ? - a
complex2:
  ? - a
  : b
complex3:
  ? - a
  : >
    b
complex4:
  ? >
    a
  :
complex5:
  ? - a
  : - b
---

```

## KMK3 › Block Submapping (mapping)

```example 74
---
foo:
  bar: 1
baz: 2
---

.
{
  "foo": {
    "bar": 1
  },
  "baz": 2
}

```

## L24T › Trailing line of spaces (whitespace)

```example 75
---
foo: |
  x
␣␣␣
---

.
{
  "foo" : "x\n \n"
}

```

## L94M › Tags in Explicit Mapping (explicit-key tag mapping)

```example 76
---
? !!str a
: !!int 47
? c
: !!str d
---

.
{
  "a": 47,
  "c": "d"
}

```

## L9U5 › Spec Example 7.11. Plain Implicit Keys (spec flow mapping)

```example 77
---
implicit block key : [
  implicit flow key : value,
 ]
---

.
{
  "implicit block key": [
    {
      "implicit flow key": "value"
    }
  ]
}

```

## LQZ7 › Spec Example 7.4. Double Quoted Implicit Keys (spec scalar flow)

```example 78
---
"implicit block key" : [
  "implicit flow key" : value,
 ]
---

.
{
  "implicit block key": [
    {
      "implicit flow key": "value"
    }
  ]
}

```

## M2N8:1 › Question mark edge cases (edge empty-key)

```example 79
---
? []: x
---

```

## M5C3 › Spec Example 8.21. Block Scalar Nodes (indent spec literal folded tag local-tag 1.3-err)

```example 80
---
literal: |2
  value
folded:
   !foo
  >1
 value
---

.
{
  "literal": "value\n",
  "folded": "value\n"
}

```

## M5DY › Spec Example 2.11. Mapping between Sequences (complex-key explicit-key spec mapping sequence)

```example 81
---
? - Detroit Tigers
  - Chicago cubs
:
  - 2001-07-23

? [ New York Yankees,
    Atlanta Braves ]
: [ 2001-07-02, 2001-08-12,
    2001-08-14 ]
---

```

## N4JP › Bad indentation in mapping (error mapping indent double)

```example 82
---
map:
  key1: "quoted1"
 key2: "bad indentation"
---

.
error
```

## NB6Z › Multiline plain value with tabs on empty lines (scalar whitespace)

```example 83
---
key:
  value
  with
  →
  tabs
---

.
{
  "key": "value with\ntabs"
}

```

## NHX8 › Empty Lines at End of Document (empty-key whitespace)

```example 84
---
:


---

```

## P94K › Spec Example 6.11. Multi-Line Comments (spec comment)

```example 85
---
key:    # Comment
        # lines
  value


---

.
{
  "key": "value"
}

```

## PBJ2 › Spec Example 2.3. Mapping Scalars to Sequences (spec mapping sequence)

```example 86
---
american:
  - Boston Red Sox
  - Detroit Tigers
  - New York Yankees
national:
  - New York Mets
  - Chicago Cubs
  - Atlanta Braves
---

.
{
  "american": [
    "Boston Red Sox",
    "Detroit Tigers",
    "New York Yankees"
  ],
  "national": [
    "New York Mets",
    "Chicago Cubs",
    "Atlanta Braves"
  ]
}

```

## Q4CL › Trailing content after quoted value (error mapping double)

```example 87
---
key1: "quoted1"
key2: "quoted2" trailing content
key3: "quoted3"
---

.
error
```

## Q5MG › Tab at beginning of line followed by a flow mapping (flow whitespace)

```example 88
---
→{}
---

.
{}

```

## Q9WF › Spec Example 6.12. Separation Spaces (complex-key flow spec comment whitespace 1.3-err)

```example 89
---
{ first: Sammy, last: Sosa }:
# Statistics:
  hr:  # Home runs
     65
  avg: # Average
   0.278
---

```

## RLU9 › Sequence Indent (sequence indent)

```example 90
---
foo:
- 42
bar:
  - 44
---

.
{
  "foo": [
    42
  ],
  "bar": [
    44
  ]
}

```

## RR7F › Mixed Block Mapping (implicit to explicit) (explicit-key mapping)

```example 91
---
a: 4.2
? d
: 23
---

.
{
  "d": 23,
  "a": 4.2
}

```

## RZP5 › Various Trailing Comments [1.3] (anchor comment folded mapping 1.3-mod)

```example 92
---
a: "double
  quotes" # lala
b: plain
 value  # lala
c  : #lala
  d
? # lala
 - seq1
: # lala
 - #lala
  seq2
e: &node # lala
 - x: y
block: > # lala
  abcde
---

```

## S3PD › Spec Example 8.18. Implicit Block Mapping Entries (empty-key spec mapping)

```example 93
---
plain key: in-line value
: # Both empty
"quoted key":
- entry
---

```

## S98Z › Block scalar with more spaces than first content line (error folded comment scalar whitespace)

```example 94
---
empty block scalar: >
␣
␣␣
␣␣␣
 # comment
---

.
error
```

## S9E8 › Spec Example 5.3. Block Structure Indicators (explicit-key spec mapping sequence)

```example 95
---
sequence:
- one
- two
mapping:
  ? sky
  : blue
  sea : green
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

## SBG9 › Flow Sequence in Flow Mapping (complex-key sequence mapping flow)

```example 96
---
{a: [b, c], [d, e]: f}
---

```

## SM9W:1 › Single character streams (mapping)

```example 97
---
:
---

```

## SR86 › Anchor plus Alias (alias error)

```example 98
---
key1: &a value
key2: &b *a
---

.
error
```

## SU5Z › Comment without whitespace after doublequoted scalar (comment error double whitespace)

```example 99
---
key: "value"# invalid comment
---

.
error
```

## SU74 › Anchor and alias as mapping key (error anchor alias mapping)

```example 100
---
key1: &alias value1
&b *alias : value2
---

.
error
```

## SY6V › Anchor before sequence entry on same line (anchor error sequence)

```example 101
---
&anchor - sequence entry
---

.
error
```

## TD5N › Invalid scalar after sequence (error sequence scalar)

```example 102
---
- item1
- item2
invalid
---

.
error
```

## TE2A › Spec Example 8.16. Block Mappings (spec mapping)

```example 103
---
block mapping:
 key: value
---

.
{
  "block mapping": {
    "key": "value"
  }
}

```

## U44R › Bad indentation in mapping (2) (error mapping indent double)

```example 104
---
map:
  key1: "quoted1"
   key2: "bad indentation"
---

.
error
```

## U99R › Invalid comma in tag (error tag)

```example 105
---
- !!str, xxx
---

.
error
```

## UKK6:1 › Syntax character edge cases (edge empty-key)

```example 106
---
::
---

.
{
  ":": null
}

```

## UV7Q › Legal tab after indentation (indent whitespace)

```example 107
---
x:
 - x
  →x
---

.
{
  "x": [
    "x x"
  ]
}

```

## VJP3 › Flow collections over many lines (flow indent)

```example 108
---
k: {
k
:
v
}
---

.
error
```

## VJP3:1 › Flow collections over many lines (flow indent)

```example 109
---
k: {
 k
 :
 v
 }
---

.
{
  "k" : {
    "k" : "v"
  }
}

```

## WZ62 › Spec Example 7.2. Empty Content (spec flow scalar tag)

```example 110
---
{
  foo : !!str,
  !!str : bar,
}
---

.
{
  "foo": "",
  "": "bar"
}

```

## X38W › Aliases in Flow Objects (alias complex-key flow)

```example 111
---
{ &a [a, &b b]: *b, *a : [c, *b, d]}
---

```

## X4QW › Comment without whitespace after block scalar indicator (folded comment error whitespace)

```example 112
---
block: ># comment
  scalar
---

.
error
```

## XV9V › Spec Example 6.5. Empty Lines [1.3] (literal spec scalar 1.3-mod)

```example 113
---
Folding:
  "Empty line

  as a line feed"
Chomping: |
  Clipped empty lines
␣

---

.
{
  "Folding": "Empty line\nas a line feed",
  "Chomping": "Clipped empty lines\n"
}

```

## XW4D › Various Trailing Comments (comment explicit-key folded 1.3-err)

```example 114
---
a: "double
  quotes" # lala
b: plain
 value  # lala
c  : #lala
  d
? # lala
 - seq1
: # lala
 - #lala
  seq2
e:
 &node # lala
 - x: y
block: > # lala
  abcde
---

```

## Y79Y › Tabs in various contexts (whitespace)

```example 115
---
foo: |
→
bar: 1
---

.
error
```

## Y79Y:3 › Tabs in various contexts (whitespace)

```example 116
---
- [
→foo,
 foo
 ]
---

.
error
```

## Y79Y:4 › Tabs in various contexts (whitespace)

```example 117
---
-→-
---

.
error
```

## Y79Y:5 › Tabs in various contexts (whitespace)

```example 118
---
- →-
---

.
error
```

## Y79Y:6 › Tabs in various contexts (whitespace)

```example 119
---
?→-
---

.
error
```

## Y79Y:7 › Tabs in various contexts (whitespace)

```example 120
---
? -
:→-
---

.
error
```

## Y79Y:8 › Tabs in various contexts (whitespace)

```example 121
---
?→key:
---

.
error
```

## Y79Y:9 › Tabs in various contexts (whitespace)

```example 122
---
? key:
:→key:
---

.
error
```

## YJV2 › Dash in flow sequence (flow sequence)

```example 123
---
[-]
---

.
error
```

## Z67P › Spec Example 8.21. Block Scalar Nodes [1.3] (indent spec literal folded tag local-tag 1.3-mod)

```example 124
---
literal: |2
  value
folded: !foo >1
 value
---

.
{
  "literal": "value\n",
  "folded": "value\n"
}

```

## ZCZ6 › Invalid mapping in plain single line value (error mapping scalar)

```example 125
---
a: b: c: d
---

.
error
```

## ZF4X › Spec Example 2.6. Mapping of Mappings (flow spec mapping)

```example 126
---
Mark McGwire: {hr: 65, avg: 0.278}
Sammy Sosa: {
    hr: 63,
    avg: 0.288
  }
---

.
{
  "Mark McGwire": {
    "hr": 65,
    "avg": 0.278
  },
  "Sammy Sosa": {
    "hr": 63,
    "avg": 0.288
  }
}

```

## ZH7C › Anchors in Mapping (anchor mapping)

```example 127
---
&a a: b
c: &d d
---

.
{
  "a": "b",
  "c": "d"
}

```

## ZK9H › Nested top level flow mapping (flow indent mapping sequence)

```example 128
---
{ key: [[[
  value
 ]]]
}
---

.
{
  "key": [
    [
      [
        "value"
      ]
    ]
  ]
}

```

## ZVH3 › Wrong indented sequence item (error sequence indent)

```example 129
---
- key: value
 - item1
---

.
error
```

## ZXT5 › Implicit key followed by newline and adjacent value (error flow mapping sequence)

```example 130
---
[ "key"
  :value ]
---

.
error
```
