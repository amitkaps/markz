# quality

The Quality page: the test suite made browsable, as one HTML file beside the site. It shows what
markz is held to, what it costs to ship and hold, and how long it takes, all measured on the
commit it is built from. `pnpm quality` writes it, after `prose build` writes the rest of the site.

- [`quality.ts`](quality.ts) writes the page.
- [`data.ts`](data.ts) computes its numbers, by running the harness's own code.
- [`element.ts`](element.ts) is the `<markz-quality>` element the page runs, inlined.
- [`style.css`](style.css) is its stylesheet, inlined too.
