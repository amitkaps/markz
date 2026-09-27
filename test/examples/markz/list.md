# Lists

```example 15
- [x] done
- [ ] todo
.
<ul>
<li><input type="checkbox" disabled="" checked="" /> done</li>
<li><input type="checkbox" disabled="" /> todo</li>
</ul>
```

```example 16
- a

- b
.
<ul>
<li><p>a</p>
</li>
<li><p>b</p>
</li>
</ul>
```

```example 17 ambiguous same-marker
1) one
2) two

* x
.
<ol>
<li>one</li>
<li>two</li>
</ol>
<ul>
<li>x</li>
</ul>
```
