# scripts

Repo tooling that isn't part of the package.

- [`size.ts`](size.ts) is the bundle-size gate (`pnpm size`), which CI runs on every PR.
- [`report.ts`](report.ts) writes the conformance report (`pnpm report`): every spec example
  with its status against the oracle, as one self-contained page at `report/conformance.html`.
  [`report.html`](report.html) is its template.
