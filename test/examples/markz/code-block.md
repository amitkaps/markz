# Code blocks

`````example 18 ambiguous fence-length
````md
```js
x
```
````
.
<pre><code class="language-md">```js
x
```
</code></pre>
`````

````example 19 unclosed
> ```
> a
b
.
<blockquote>
<pre><code>a
</code></pre>
</blockquote>
<p>b</p>
````

`````example 20
````
<div>&copy;</div>
    code
***
````
.
<pre><code>&lt;div&gt;&amp;copy;&lt;/div&gt;
    code
***
</code></pre>
`````

````example 21
```a&#65;b
```
.
<pre><code class="language-aAb"></code></pre>
````
