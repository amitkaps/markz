# scripts

Repo tooling that isn't part of the package.

- [`size.ts`](size.ts) is the bundle-size gate (`pnpm size`), which CI runs on every PR.
- [`vendor.ts`](vendor.ts) turns a micromark extension's tests into examples for `test/spec/`,
  from a local clone at the pinned commit. It is run by hand when a suite is re-pinned.
