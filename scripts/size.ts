/** @prose
 * # Size gate
 *
 * The 20 KB budget, measured the way a consumer pays for it: everything `src/index.ts` pulls in,
 * bundled and minified, then gzipped (spec: Performance and size). It fails the build above the
 * budget, so growth shows up in the PR that causes it rather than at the end. Brotli is printed for
 * reference only.
 */
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { build, type Rolldown } from 'vite-plus';

const BUDGET = 20 * 1024;

const result = await build({
	configFile: false,
	logLevel: 'silent',
	build: {
		write: false,
		minify: true,
		lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index' }
	}
});
const output = (Array.isArray(result) ? result[0] : result) as Rolldown.RolldownOutput;
const code = output.output[0].code;

const gzip = gzipSync(code, { level: 9 }).length;
const brotli = brotliCompressSync(code).length;
const kb = (n: number) => `${(n / 1024).toFixed(2)} KB`;
console.log(`minified ${kb(code.length)}, gzip ${kb(gzip)}, brotli ${kb(brotli)}`);
if (gzip > BUDGET) {
	console.error(`over the ${kb(BUDGET)} gzip budget by ${kb(gzip - BUDGET)}`);
	process.exitCode = 1;
}
