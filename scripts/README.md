# scripts

Repo tooling that isn't part of the package.

- [`size.ts`](size.ts) is the bundle-size gate (`pnpm size`), which CI runs on every PR.
- [`vendor.ts`](vendor.ts) turns an upstream suite's tests (a micromark extension's, or the
  yaml-test-suite) into examples for `test/spec/`, from a local clone at the pinned commit. It is run by hand when a suite is re-pinned.
