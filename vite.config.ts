/** @prose
 * # Build config
 *
 * One [`vite-plus`](https://vite-plus.dev) config drives build, format, lint and test —
 * `vp <script>` in `package.json` reads whichever section its command needs. `pack` bundles the
 * library with tsdown; `prose()` ([`@amitkaps/prose`](https://github.com/amitkaps/prose),
 * dev-only) is mounted at `/__prose/` by `vp dev`.
 */
import { defineConfig } from 'vite-plus';
import { prose } from '@amitkaps/prose';

const generated = ['dist/**'];
const vendored = ['test/examples/upstream/**/*.md', 'test/documents/**'];
// The benchmark's generated corpus and results, and the published snapshot, which is its output.
const bench = ['bench/corpus/**', 'bench/results/**', 'bench/.size/**', 'docs/src/lib/bench.json'];
// The site's generated files. `vp` reads this config for the whole workspace, `docs/` included.
const site = ['docs/.svelte-kit/**', 'docs/build/**', 'docs/worker-configuration.d.ts'];
// Tests that measure time, which run after the rest.
const timing = 'test/complexity.test.ts';

export default defineConfig({
	plugins: process.env.VITEST ? [] : [prose()],

	// tsdown — `vp pack`. ESM only, with declarations.
	pack: {
		entry: ['src/index.ts'],
		format: ['esm'],
		dts: true,
		clean: true,
		fixedExtension: false
	},

	// Oxfmt — `vp fmt` / `vp check`.
	fmt: {
		useTabs: true,
		singleQuote: true,
		semi: true,
		printWidth: 100,
		trailingComma: 'none',
		sortPackageJson: true,
		svelte: { indentScriptAndStyle: true },
		ignorePatterns: [...generated, ...vendored, ...bench, ...site, 'pnpm-lock.yaml', 'CHANGELOG.md']
	},

	// Oxlint — `vp lint` / `vp check`.
	lint: {
		plugins: ['typescript', 'unicorn', 'import'],
		categories: { correctness: 'error' },
		options: { typeAware: true, typeCheck: true },
		ignorePatterns: [...generated, ...bench, ...site]
	},

	// Vitest — `vp test`. The linear-time tests measure time, so they run last, on their own:
	// alongside the fuzzer and the edge cases, a busy CPU can make a linear pattern look slow.
	test: {
		expect: { requireAssertions: true },
		environment: 'node',
		projects: [
			{
				extends: true,
				test: {
					name: 'tests',
					include: ['src/**/*.{test,spec}.ts', 'test/**/*.{test,spec}.ts'],
					exclude: [timing],
					sequence: { groupOrder: 0 }
				}
			},
			{ extends: true, test: { name: 'timing', include: [timing], sequence: { groupOrder: 1 } } }
		]
	}
});
