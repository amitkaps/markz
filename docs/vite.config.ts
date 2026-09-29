/** @prose
 * # Build config
 *
 * The site is base's SvelteKit setup, trimmed: prerendered pages served by a Cloudflare Worker.
 * One [`vite-plus`](https://vite-plus.dev) config drives dev, build, format, lint and test, as it
 * does for the library, except format and lint: `vp` reads those from the workspace root's config,
 * which covers the site too. `@amitkaps/markz` resolves to the library's source in `../src`, so the site
 * always renders with the parser in this commit and needs no library build first.
 */
import { defineConfig } from 'vite-plus';
import { prose } from '@amitkaps/prose';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';

/** @prose
 * SvelteKit's plugin installs a dev-server hook that Vitest can't run under, and the unit tests
 * cover plain modules that don't need it, so plugins are skipped under Vitest. The `@amitkaps/markz` alias
 * is Vite's, so it holds for both; `tsconfig.json` maps the same path for type checking.
 */
const inTest = !!process.env.VITEST;
const markz = new URL('../src/index.ts', import.meta.url).pathname;

export default defineConfig({
	resolve: { alias: { '@amitkaps/markz': markz } },
	plugins: inTest
		? []
		: [
				sveltekit({
					// SvelteKit 3 takes these options flat — not under a `kit` key.
					prerender: {
						// Prerendering follows every internal link, so a strict handler turns the
						// build into a link checker.
						handleHttpError: ({ referrer, message }) => {
							throw new Error(`${message} (linked from ${referrer})`);
						}
					},
					compilerOptions: {
						// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
						runes: ({ filename }) =>
							filename.split(/[/\\]/).includes('node_modules') ? undefined : true
					},
					adapter: adapter()
				}),
				prose()
			],

	// Vitest — `vp test`.
	test: {
		expect: { requireAssertions: true },
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts']
	}
});
