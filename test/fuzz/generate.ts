/** @prose
 * # Generated documents
 *
 * Documents built from the dialect's own grammar, so the fuzzer writes what an author could, not
 * only noise. Each production in `grammar.ts` becomes a fast-check arbitrary: a literal is itself,
 * a sequence joins its parts, an alternative picks one, and a repeat takes up to three. Recursion
 * stops at a fixed depth by taking an alternative's first option, which the grammar lists first
 * because it is the plainest (`paragraph` for a block, `text` for an inline). fast-check shrinks
 * a failing document along the same structure, so a failure comes back as the smallest document
 * the grammar can write that still fails.
 *
 * The productions describe what markz accepts and leave the choices to side rules, so a generated
 * document is often read as something other than what built it. That is the point: whatever it
 * becomes, it must be sound, and where it is CommonMark or GFM, it must match the oracle.
 */
import fc from 'fast-check';
import { type Expr } from '../ebnf';
import { construct, PRODUCTIONS, type Origin } from '../grammar';

export interface Options {
	/**
	 * The origins whose constructs may be written. A construct of another origin is left out
	 * wherever it is a choice or optional: an alternative, or a `?` or `*` (a link's `{…}`
	 * attributes are djot's). Leave it out for every construct.
	 */
	origins?: readonly Origin[];
	/**
	 * What a negated class, such as `char`, draws from. A character the class excludes is never
	 * drawn.
	 */
	alphabet: string;
	/** How deep productions may nest before each alternative takes its first option. */
	depth?: number;
}

export function grammarDocument(options: Options, start = 'document'): fc.Arbitrary<string> {
	const { origins, alphabet, depth = 5 } = options;
	const allowed = (name: string) => {
		const p = PRODUCTIONS.get(name);
		const c = p?.construct ? construct(p.construct) : undefined;
		return !origins || !c || origins.includes(c.origin);
	};
	const arbitraries = fc.letrec<Record<string, string>>((tie) => {
		const build = (expr: Expr): fc.Arbitrary<string> => {
			switch (expr.kind) {
				case 'name':
					return tie(expr.name);
				case 'literal':
					return fc.constant(expr.text);
				case 'class':
					return fc.constantFrom(...members(expr, alphabet));
				case 'seq':
					return fc.tuple(...expr.items.map((e) => build(e))).map((p) => p.join(''));
				case 'alt': {
					const kept = expr.options.filter((o) => o.kind !== 'name' || allowed(o.name));
					// Inside a construct left out, never reached; it keeps its options.
					const options = kept.length ? kept : expr.options;
					if (options.length === 1) return build(options[0]!);
					return fc.oneof(
						{ maxDepth: depth, depthIdentifier: 'grammar' },
						...options.map((o) => build(o))
					);
				}
				case 'repeat': {
					if (expr.item.kind === 'name' && !allowed(expr.item.name) && expr.op !== '+') {
						return fc.constant('');
					}
					const item = build(expr.item);
					if (expr.op === '?') return fc.option(item, { nil: '' });
					return fc
						.array(item, {
							minLength: expr.op === '+' ? 1 : 0,
							maxLength: 3,
							depthIdentifier: 'grammar'
						})
						.map((p) => p.join(''));
				}
			}
		};
		const out: Record<string, fc.Arbitrary<string>> = {};
		for (const [name, p] of PRODUCTIONS) out[name] = build(p.expr);
		return out;
	});
	return arbitraries[start]!;
}

/** The characters a class admits: its ranges, capped, or for a negated class the alphabet's rest. */
function members(expr: Extract<Expr, { kind: 'class' }>, alphabet: string): string[] {
	const inside = (c: number) => expr.ranges.some(([a, b]) => c >= a && c <= b);
	if (expr.negated) {
		const out = alphabet.split('').filter((c) => !inside(c.charCodeAt(0)));
		return out.length ? out : ['a'];
	}
	const out: string[] = [];
	for (const [a, b] of expr.ranges) {
		for (let c = a; c <= b && c - a < 26; c++) out.push(String.fromCodePoint(c));
	}
	return out;
}

/** @prose
 * ## Noise
 *
 * Strings of the characters Markdown gives meaning to, and the ones that trouble offsets: every
 * line ending, tabs, a byte order mark, a lone surrogate and an astral-plane character. Most of
 * what this draws is nonsense, which is what finds a crash the grammar would never write.
 */
export const MARKDOWN: string[] = [
	...'abc 1\t\n\r#>-*+_~`$:{}[]()<>!|\\&;"\'.=/@^%?,'.split(''),
	'\r\n',
	String.fromCharCode(0xfeff),
	String.fromCharCode(0xd800),
	String.fromCodePoint(0x1f600)
];

export const noise = fc
	.array(fc.constantFrom(...MARKDOWN, '```', '$$', ':::', '---', '${', '<!--', '-->'), {
		maxLength: 80
	})
	.map((p) => p.join(''));

/** @prose
 * ## Mutations
 *
 * A known document with a few edits: a character inserted, deleted or doubled at random places.
 * Starting from real examples reaches states noise rarely does, such as a table with one cell
 * missing or a fence one backtick short.
 */
export function mutated(documents: readonly string[]): fc.Arbitrary<string> {
	const edit = fc.tuple(
		fc.nat(),
		fc.constantFrom('insert', 'delete', 'double'),
		fc.constantFrom(...MARKDOWN)
	);
	return fc
		.tuple(fc.constantFrom(...documents), fc.array(edit, { minLength: 1, maxLength: 4 }))
		.map(([doc, edits]) => {
			let out = doc;
			for (const [at, op, c] of edits) {
				const i = out.length ? at % (out.length + 1) : 0;
				if (op === 'insert') out = out.slice(0, i) + c + out.slice(i);
				else if (op === 'delete') out = out.slice(0, i) + out.slice(i + 1);
				else out = out.slice(0, i) + out.slice(i, i + 1) + out.slice(i);
			}
			return out;
		});
}
