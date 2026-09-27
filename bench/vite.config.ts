/** @prose
 * # Vitest config for the fast benchmark
 *
 * `pnpm bench` runs `compare.bench.ts` through Vitest's benchmark runner; the full suite is
 * `run.ts`, outside Vitest. Format and lint come from the workspace root's config.
 */
import { defineConfig } from 'vite-plus';

export default defineConfig({
	test: {
		environment: 'node',
		include: [],
		benchmark: { include: ['*.bench.ts'] }
	}
});
