# scripts

Repo tooling that isn't part of the package.

- [`size.ts`](size.ts) is the bundle-size gate (`pnpm size`), which CI runs on every PR.
- [`quality.ts`](quality.ts) writes the Quality page (`pnpm quality`): one HTML file with what
  markz is held to, what it costs to ship and hold, and how long it takes. It is made of
  [`quality-data.ts`](quality-data.ts) (the numbers, from the test harness),
  [`quality-element.ts`](quality-element.ts) (the `<markz-quality>` element the page runs, inlined)
  and [`quality.css`](quality.css). `prose build` writes the rest of the site; run this after it.
- [`vendor.ts`](vendor.ts) turns an upstream suite's tests (a micromark extension's, the
  yaml-test-suite or github-slugger's) into examples for `test/examples/upstream/`, from a local clone at the
  pinned commit, and curates them: sweeps and repeated variants of a form markz cuts go to
  `test/examples/upstream/stress/` instead. It is run by hand when a suite is re-pinned.
