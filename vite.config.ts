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
const vendored = ['test/spec/*.json'];

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
		ignorePatterns: [...generated, ...vendored, 'pnpm-lock.yaml', 'CHANGELOG.md']
	},

	// Oxlint — `vp lint` / `vp check`.
	lint: {
		plugins: ['typescript', 'unicorn', 'import'],
		categories: { correctness: 'error' },
		options: { typeAware: true, typeCheck: true },
		ignorePatterns: generated
	},

	// Vitest — `vp test`.
	test: {
		expect: { requireAssertions: true },
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts', 'test/**/*.{test,spec}.ts']
	}
});
