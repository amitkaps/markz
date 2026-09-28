/** @prose
 * # Size gate
 *
 * The 20 KB budget, measured the way a consumer pays for it: everything `src/index.ts` pulls in,
 * bundled and minified, then gzipped (spec: Performance and size). Run as a script, it fails the
 * build above the budget, so growth shows up in the PR that causes it rather than at the end.
 * Brotli is printed for reference only. The site's Quality page measures with the same `size()`.
 */
import { join } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { build, type Rolldown } from 'vite-plus';

export const BUDGET = 20 * 1024;

export interface Size {
	minified: number;
	gzip: number;
	brotli: number;
}

/** A caller bundled away from this file (the site) passes the repo root. */
export async function size(root = join(import.meta.dirname, '..')): Promise<Size> {
	const result = await build({
		configFile: false,
		logLevel: 'silent',
		build: {
			write: false,
			minify: true,
			// `minify` alone mangles and compresses but keeps the layout; this removes whitespace too.
			rolldownOptions: { output: { minify: true } },
			lib: {
				entry: join(root, 'src/index.ts'),
				formats: ['es'],
				fileName: 'index'
			}
		}
	});
	const output = (Array.isArray(result) ? result[0] : result) as Rolldown.RolldownOutput;
	const code = output.output[0].code;
	return {
		minified: code.length,
		gzip: gzipSync(code, { level: 9 }).length,
		brotli: brotliCompressSync(code).length
	};
}

if (import.meta.main) {
	const { minified, gzip, brotli } = await size();
	const kb = (n: number) => `${(n / 1024).toFixed(2)} KB`;
	console.log(`minified ${kb(minified)}, gzip ${kb(gzip)}, brotli ${kb(brotli)}`);
	if (gzip > BUDGET) {
		console.error(`over the ${kb(BUDGET)} gzip budget by ${kb(gzip - BUDGET)}`);
		process.exitCode = 1;
	}
}
