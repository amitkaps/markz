# Paragraphs

```example 7
{.verse}
Moko kahan
Main to
.
<p class="verse">Moko kahan
Main to</p>
```

Only a `-`, `*`, `+` or `1.` item interrupts a paragraph, so `2.` goes on with it.

```example 8 ambiguous item-interrupts
a
2. b
- c
.
<p>a
2. b</p>
<ul>
<li>c</li>
</ul>
```
