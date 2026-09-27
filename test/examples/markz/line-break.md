# Line breaks

```example 95
a\
b
c
.
<p>a<br />
b
c</p>
```

```example 96 ambiguous trailing-backslash
a\␣
b
.
<p>a<br />
b</p>
```
