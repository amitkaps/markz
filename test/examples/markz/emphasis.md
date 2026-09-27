# Emphasis

```example 66
_a_ **b** ~~c~~
.
<p><em>a</em> <strong>b</strong> <del>c</del></p>
```

```example 67 ambiguous star-places
_foo *bar* baz_ and a*b*c
.
<p><em>foo <em>bar</em> baz</em> and a<em>b</em>c</p>
```

```example 68
snake_case_name
.
<p>snake_case_name</p>
```

```example 69
_a ${x * y} b_
.
<p><em>a <code class="language-js expression">x * y</code> b</em></p>
```

```example 70 unclosed
_a and **b
.
<p>_a and **b</p>
```
