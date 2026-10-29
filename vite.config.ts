/** @prose
 * # Build config
 *
 * One [`vite-plus`](https://viteplus.dev) config drives build, format, lint and test —
 * `vp <script>` in `package.json` reads whichever section its command needs. `pack` bundles the
 * library with tsdown. `@amitkaps/prose` is a CLI now (`pnpm prose`), not a plugin, so it has no
 * place here.
 */
import { readFileSync } from "node:fs";
import { defineConfig } from "vite-plus";

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

// A doc imported with `?raw`, as its text, which Vite does in the tests and tsdown doesn't. The
// rules subpath bundles its usage doc this way.
const raw = {
  name: "raw",
  load(id: string) {
    if (id.endsWith("?raw")) {
      return `export default ${JSON.stringify(readFileSync(id.slice(0, -4), "utf8"))};`;
    }
    return null;
  },
};

export default defineConfig({
  // craftz() sets the format and lint rules.
  // tsdown — `vp pack`. ESM only, with declarations. The code ships readable but without its
  // comments, keeping license comments and `@__PURE__` annotations, and with no sourcemaps
  // (design: Package). The `/*!` banner keeps the license with the code when a consumer bundles it.
  // publint checks the package's `exports`, `files` and types, and fails the build on a problem.
  pack: {
    entry: ["src/index.ts", "src/rules.ts", "src/cli.ts"],
    format: ["esm"],
    // The browsers the standard names, and the Node markz is built on, since it runs in both.
    target: ["chrome142", "edge142", "firefox153", "safari18.6", "ios18.6", "node26.12.1"],
    dts: { generator: "oxc" },
    clean: true,
    fixedExtension: false,
    banner: { js: "/*! @amitkaps/markz · MIT License · https://github.com/amitkaps/markz */" },
    outputOptions: { comments: { legal: true, annotation: true, jsdoc: false } },
    publint: { strict: true },
    plugins: [raw],
    platform: "neutral",
  },

  // Oxfmt and Oxlint — `vp check`. What they leave alone, beside what craftz's rules set.
  fmt: { ignorePatterns: [...generated, ...vendored, ...site], proseWrap: "never" },
  lint: {
    ignorePatterns: [...generated, ...site],
    plugins: ["typescript", "unicorn", "import"],
    categories: { correctness: "error" },
    options: { typeAware: true, typeCheck: true },
  },

  // Vitest — `vp test`. The linear-time tests measure time, so they run last, on their own:
  // alongside the fuzzer and the edge cases, a busy CPU can make a linear pattern look slow.
  // `pnpm test` runs the tests project, and `pnpm timing` the timing one.
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

  /** @prose
   * # Verify
   *
   * `verify` runs `all`, whose tasks run side by side, as
   * [craftz's rules](https://craftz.amitkaps.com/docs/rules.md#scripts-verify) say. `size`
   * bundles `src/` itself, so it runs beside them. The Quality page reads the edges `test` kept
   * and is written into the site, so `report` waits for both.
   *
   * `linear` runs `pnpm timing` once `test` is done, so the clocks don't share the CPU with the
   * fuzzer and the edge searches. `report` doesn't wait for it, and writes the page meanwhile.
   * That's one busy core beside the timing, which its margin of twice linear absorbs, and it takes
   * 4 seconds off the end of `verify`. A task can't share a script's name, so the task that orders
   * a script is named for its place in `verify`, as `report` runs `pnpm quality`.
   */
  run: {
    cache: false,
    tasks: {
      linear: { command: "pnpm timing", dependsOn: ["test"] },
      report: { command: "pnpm quality", dependsOn: ["test", "site"] },
      all: {
        command: "true",
        dependsOn: ["check", "test", "linear", "build", "size", "site", "report"],
      },
    },
  },
});
