/** @prose
 * The public entry point: what `import … from '@amitkaps/markz'` exposes, and the BOM rule for the root.
 */
import { describe, expect, it } from 'vite-plus/test';
import { html, parse } from './index';
import { expectTree } from '../test/harness/tree';

describe('parse', () => {
	it('returns a document rooted after any BOM', () => {
		const doc = parse('﻿');
		expect(doc.start(doc.root)).toBe(1);
		expect(doc.end(doc.root)).toBe(1);
		expectTree(doc);
	});
});

describe('html', () => {
	it('accepts source or a document', () => {
		expect(html('')).toBe('');
		expect(html(parse(''))).toBe('');
	});
});
