# scripts

Repo tooling that isn't part of the package.

- [`size.ts`](size.ts) is the bundle-size gate (`pnpm size`), which CI runs on every PR.
- [`vendor.ts`](vendor.ts) turns an upstream suite's tests (a micromark extension's, the
  yaml-test-suite or github-slugger's) into examples for `test/spec/`, from a local clone at the
  pinned commit, and curates them: sweeps and repeated variants of a form markz cuts go to
  `test/stress/` instead. It is run by hand when a suite is re-pinned.
