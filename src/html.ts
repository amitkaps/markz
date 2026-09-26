/** @prose
 * # HTML
 *
 * `html()` is a fold over the document into a string, the output prose and base consume (spec:
 * HTML output). It never touches the DOM, so it runs the same in Node, Workers and the browser.
 *
 * It grows one node type at a time with the block and inline passes (`prose/plan.md`, steps 4–5).
 * A node type it can't write yet is an error rather than silent output, so the oracle harness
 * reports it as a failure.
 */
import { type Document, type NodeId } from './ast';
import { parse } from './parse';

export function html(input: string | Document): string {
	const doc = typeof input === 'string' ? parse(input) : input;
	return render(doc, doc.root);
}

function render(doc: Document, node: NodeId): string {
	const type = doc.type(node);
	switch (type) {
		case 'document': {
			let out = '';
			for (const child of doc.children(node)) out += render(doc, child);
			return out;
		}
		default:
			throw new Error(`html: no output for ${type} yet`);
	}
}
