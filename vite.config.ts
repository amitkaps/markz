/** @prose
 * # Build config
 *
 * One [`vite-plus`](https://viteplus.dev) config drives build, format, lint and test —
 * `vp <script>` in `package.json` reads whichever section its command needs. `pack` bundles the
 * library with tsdown. `@amitkaps/prose` is a CLI now (`pnpm prose`), not a plugin, so it has no
 * place here.
 */
import { defineConfig } from "vite-plus";
import { craftz } from "@amitkaps/craftz";

const generated = ["dist/**"];
const vendored = ["test/examples/upstream/**/*.md", "test/documents/**"];
// The site `prose build` writes, with the Quality page.
const site = [".prose/**"];
// Tests that measure time, which run after the rest.
const timing = "test/complexity.test.ts";
// `SEED=random` is drawn once here, so every test file searches from the same seed, and printed,
// so a passing run says what it searched. `$RANDOM` is empty in the `sh` that runs scripts on Linux.
const seed =
  process.env["SEED"] === "random"
    ? String(Math.floor(Math.random() * 2 ** 31))
    : process.env["SEED"];
if (process.env["SEED"] === "random")
  console.log(`SEARCH=${process.env["SEARCH"] ?? 1} SEED=${seed}`);

export default defineConfig({
  // craftz() sets the format and lint rules, and the site: `vp build` hands the folder
  // `prose build` writes to Cloudflare, assets only.
  plugins: [craftz()],

  // tsdown — `vp pack`. ESM only, with declarations. The code ships readable but without its
  // comments, keeping license comments and `@__PURE__` annotations, and with no sourcemaps
  // (design: Package). The `/*!` banner keeps the license with the code when a consumer bundles it.
  // publint checks the package's `exports`, `files` and types, and fails the build on a problem.
  pack: {
    entry: ["src/index.ts"],
    format: ["esm"],
    // The browsers the standard names, and the Node markz is built on, since it runs in both.
    target: ["chrome142", "edge142", "firefox153", "safari18.6", "ios18.6", "node26"],
    dts: { generator: "oxc" },
    clean: true,
    fixedExtension: false,
    banner: { js: "/*! @amitkaps/markz · MIT License · https://github.com/amitkaps/markz */" },
    outputOptions: { comments: { legal: true, annotation: true, jsdoc: false } },
    publint: { strict: true },
  },

  // Oxfmt and Oxlint — `vp check`. What they leave alone, beside the rules craftz() sets.
  fmt: { ignorePatterns: [...generated, ...vendored, ...site] },
  lint: { ignorePatterns: [...generated, ...site] },

  // Vitest — `vp test`. The linear-time tests measure time, so they run last, on their own:
  // alongside the fuzzer and the edge cases, a busy CPU can make a linear pattern look slow.
  test: {
    expect: { requireAssertions: true },
    environment: "node",
    env: seed ? { SEED: seed } : {},
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
