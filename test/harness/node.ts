/** @prose
 * # The harness under plain Node
 *
 * Vite resolves what the harness and `src/` import; plain Node doesn't. Importing this first lets
 * a Node script (`test/speed.ts` and the processes it starts) load them as they are: an extensionless
 * relative import finds its `.ts` file, and a `?raw` import is the file's text. Node strips the
 * types itself. Import it before anything it serves, and load those dynamically, since static
 * imports are resolved before any module runs.
 */
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

registerHooks({
	resolve(specifier, context, next) {
		if (specifier.endsWith('?raw')) {
			return { url: new URL(specifier, context.parentURL).href, shortCircuit: true };
		}
		try {
			return next(specifier, context);
		} catch (error) {
			if (!specifier.startsWith('.')) throw error;
			return next(`${specifier}.ts`, context);
		}
	},
	load(url, context, next) {
		if (!url.endsWith('?raw')) return next(url, context);
		const text = readFileSync(fileURLToPath(url.slice(0, -'?raw'.length)), 'utf8');
		return {
			format: 'module',
			source: `export default ${JSON.stringify(text)};`,
			shortCircuit: true
		};
	}
});
