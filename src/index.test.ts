/** @prose
 * Smoke test for the public entry point; replaced by the CommonMark suite as the parser lands.
 */
import { describe, expect, it } from 'vite-plus/test';
import { parse } from './index';

describe('parse', () => {
	it('is exported', () => {
		expect(typeof parse).toBe('function');
	});
});
