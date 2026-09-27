# Tables

```example 28
intro
| a | b |
| :- | -: |
| 1 |
.
<p>intro</p>
<table>
<thead>
<tr>
<th align="left">a</th>
<th align="right">b</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">1</td>
<td align="right"></td>
</tr>
</tbody>
</table>
```

```example 29
| a \| b | c |
| - | - |
.
<table>
<thead>
<tr>
<th>a | b</th>
<th>c</th>
</tr>
</thead>
</table>
```

A delimiter row with a colon needs no pipe, since it can't be a setext underline.

```example 30
a
:-:
.
<table>
<thead>
<tr>
<th align="center">a</th>
</tr>
</thead>
</table>
```

A row indented four columns ends the table, and under a paragraph it is never a delimiter row.

```example 31
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
</table>
<p>| b |</p>
.
| b |
```

```example 32 ambiguous table-header
| a |
    | - |
.
<p>| a |
| - |</p>
```

A delimiter row that opens another block is that block.

```example 33 ambiguous table-header
| a |
- | -
.
<p>| a |</p>
<ul>
<li>| -</li>
</ul>
```

```example 34
|
-|
.
<p>|
-|</p>
```

```example 35
a
    b
-|
.
<p>a
b
-|</p>
```
