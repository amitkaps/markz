/** @prose
 * # Build config
 *
 * One [`vite-plus`](https://vite-plus.dev) config drives build, format, lint and test —
 * `vp <script>` in `package.json` reads whichever section its command needs. `pack` bundles the
 * library with tsdown. `@amitkaps/prose` is a CLI now (`pnpm prose`), not a plugin, so it has no
 * place here.
 */
import { defineConfig } from "vite-plus";

const generated = ["dist/**"];
const vendored = ["test/examples/upstream/**/*.md", "test/documents/**"];
// The site's generated files. `vp` reads this config for the whole workspace, `docs/` included.
const site = ["docs/.svelte-kit/**", "docs/build/**", "docs/worker-configuration.d.ts"];
// Tests that measure time, which run after the rest.
const timing = "test/complexity.test.ts";

export default defineConfig({
  // tsdown — `vp pack`. ESM only, with declarations.
  pack: {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    clean: true,
    fixedExtension: false,
  },

  // Oxfmt — `vp fmt` / `vp check`.
  fmt: {
    svelte: {},
    ignorePatterns: [...generated, ...vendored, ...site, "pnpm-lock.yaml", "CHANGELOG.md"],
  },

  // Oxlint — `vp lint` / `vp check`.
  lint: {
    plugins: ["typescript", "unicorn", "import"],
    categories: { correctness: "error" },
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: [...generated, ...site],
  },

  // Vitest — `vp test`. The linear-time tests measure time, so they run last, on their own:
  // alongside the fuzzer and the edge cases, a busy CPU can make a linear pattern look slow.
  test: {
    expect: { requireAssertions: true },
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          name: "tests",
          include: ["src/**/*.{test,spec}.ts", "test/**/*.{test,spec}.ts"],
          exclude: [timing],
          sequence: { groupOrder: 0 },
        },
      },
      { extends: true, test: { name: "timing", include: [timing], sequence: { groupOrder: 1 } } },
    ],
  },
});
