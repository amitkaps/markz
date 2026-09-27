/** @prose
 * # The grammar
 *
 * The dialect as data, read from [`prose/grammar.md`](../prose/grammar.md): every construct of
 * `syntax.md`, by its id, with its part, its origin, its productions and the side rules EBNF can't
 * state. The page is the only copy, so there is nothing to drift: it is read with markz itself, a
 * `###` heading's explicit id naming the construct, the `##` above it the part, an `ebnf` code
 * block its productions and the list after it its side rules, `` `name`: text `` each. What comes
 * before the first part, under Document, is the document's own. A construct's origin is
 * `syntax.md`'s, from the lead of its section.
 *
 * The tests hold it to `syntax.md`, the fuzzer generates documents from it (step 16), and
 * `cases.ts` holds markz to it at every construct's edges: where the two read a case differently,
 * a side rule here must say why (step 18). A misreading of the page by markz would show there as
 * a grammar that isn't well formed or doesn't match `syntax.md`.
 */
import grammar from '../prose/grammar.md?raw';
import { parse, textContent } from '../src/index';
import { productions, references, type Production } from './ebnf';
import { origin, type Origin } from './syntax';

export type { Origin } from './syntax';
export type ConstructPart = 'Metadata' | 'Block' | 'Inline';

export interface Construct {
	/** The id in `syntax.md` (`{#id}`), and the production the construct is named by. */
	id: string;
	part: ConstructPart;
	origin: Origin;
	/** Its productions, in EBNF, the first one named by the id. */
	grammar: string;
	/** What EBNF can't state, by name. */
	rules: Record<string, string>;
}

const PARTS: readonly string[] = ['Metadata', 'Block', 'Inline'];

export const DOCUMENT: Omit<Construct, 'id' | 'part' | 'origin'> = { grammar: '', rules: {} };
export const CONSTRUCTS: Construct[] = [];
{
	const doc = parse(grammar);
	let part = '';
	let current: Omit<Construct, 'id' | 'part' | 'origin'> | null = null;
	for (const node of doc.children(doc.root)) {
		const type = doc.type(node);
		if (type === 'heading') {
			const { depth, id, idExplicit } = doc.data(node, 'heading');
			if (depth === 2) {
				part = textContent(doc, node);
				current = part === 'Document' ? DOCUMENT : null;
			} else if (depth === 3 && idExplicit) {
				if (!PARTS.includes(part)) throw new Error(`grammar.md: ${id} is under ${part}`);
				const o = origin(id);
				if (!o) throw new Error(`grammar.md: ${id} has no origin in syntax.md`);
				const c: Construct = { id, part: part as ConstructPart, origin: o, grammar: '', rules: {} };
				CONSTRUCTS.push(c);
				current = c;
			}
		} else if (type === 'code' && doc.data(node, 'code').lang === 'ebnf' && current) {
			current.grammar = doc.data(node, 'code').value;
		} else if (type === 'list' && current?.grammar) {
			for (const item of doc.children(node)) {
				const text = doc.source.slice(doc.start(item), doc.end(item));
				const m = /^- `([a-z-]+)`: ([\s\S]*)$/.exec(text.trim());
				if (!m) throw new Error(`grammar.md: not a side rule: ${text}`);
				current.rules[m[1]!] = m[2]!.replace(/\s*\n\s*/g, ' ');
			}
		}
	}
}

/** Every production, by name, with the construct that defines it (`null` for the document's). */
export const PRODUCTIONS = new Map<string, Production & { construct: string | null }>();
for (const [construct, grammar] of [
	[null, DOCUMENT.grammar] as const,
	...CONSTRUCTS.map((c) => [c.id, c.grammar] as const)
]) {
	for (const p of productions(grammar)) {
		if (PRODUCTIONS.has(p.name)) throw new Error(`production ${p.name} is defined twice`);
		PRODUCTIONS.set(p.name, { ...p, construct });
	}
}

export const construct = (id: string): Construct | undefined => CONSTRUCTS.find((c) => c.id === id);

/** The names reachable from `document`. */
export function reachable(): Set<string> {
	const seen = new Set<string>();
	const visit = (name: string) => {
		if (seen.has(name)) return;
		seen.add(name);
		const p = PRODUCTIONS.get(name);
		if (p) for (const n of references(p.expr)) visit(n);
	};
	visit('document');
	return seen;
}
