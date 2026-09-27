/** @prose
 * # EBNF
 *
 * The notation `grammar.ts` is written in, read into a tree so the grammar can be checked (every
 * name defined, every production reachable) and, from step 16, generate documents. It is the W3C
 * notation of the XML spec, kept small: `name ::= expression`, `|` for alternatives, juxtaposition
 * for sequence, `?`, `*` and `+`, parentheses, `'literal'` or `"literal"`, `#xA` for a character by
 * code point, and `[a-z]` or `[^…]` for a character class, which may hold `#x…` too.
 */

export type Expr =
	| { kind: 'name'; name: string }
	| { kind: 'literal'; text: string }
	| { kind: 'class'; negated: boolean; ranges: [number, number][] }
	| { kind: 'seq'; items: Expr[] }
	| { kind: 'alt'; options: Expr[] }
	| { kind: 'repeat'; op: '?' | '*' | '+'; item: Expr };

export interface Production {
	name: string;
	expr: Expr;
	/** The production's text, as written. */
	source: string;
}

const NAME = /[a-z][a-z\d-]*/y;
const HEX = /#x([\dA-Fa-f]+)/y;

/** Reads `name ::= …` productions. A line that doesn't start one continues the one before. */
export function productions(text: string): Production[] {
	const out: Production[] = [];
	const lines = text
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);
	for (const line of lines) {
		const m = /^([a-z][a-z\d-]*)\s+::=\s+(.+)$/.exec(line);
		if (m) out.push({ name: m[1]!, expr: { kind: 'name', name: '' }, source: m[2]! });
		else if (out.length) out.at(-1)!.source += ` ${line}`;
		else throw new Error(`not a production: ${line}`);
	}
	for (const p of out) p.expr = parse(p.source, p.name);
	return out;
}

function parse(source: string, name: string): Expr {
	let i = 0;
	const fail = (why: string): never => {
		throw new Error(`${name}: ${why} at ${i} in ${source}`);
	};
	const space = () => {
		while (source[i] === ' ') i++;
	};
	const sticky = (re: RegExp) => {
		re.lastIndex = i;
		const m = re.exec(source);
		if (m) i = re.lastIndex;
		return m;
	};

	function alt(): Expr {
		const options = [seq()];
		for (space(); source[i] === '|'; space()) {
			i++;
			options.push(seq());
		}
		return options.length === 1 ? options[0]! : { kind: 'alt', options };
	}

	function seq(): Expr {
		const items: Expr[] = [];
		for (space(); i < source.length && !'|)'.includes(source[i]!); space()) {
			let item = primary();
			const op = source[i];
			if (op === '?' || op === '*' || op === '+') {
				i++;
				item = { kind: 'repeat', op, item };
			}
			items.push(item);
		}
		if (!items.length) fail('empty alternative');
		return items.length === 1 ? items[0]! : { kind: 'seq', items };
	}

	function primary(): Expr {
		const c = source[i];
		if (c === '(') {
			i++;
			const e = alt();
			if (source[i++] !== ')') fail('expected )');
			return e;
		}
		if (c === "'" || c === '"') {
			const close = source.indexOf(c, i + 1);
			if (close <= i + 1) fail('empty or unclosed literal');
			const text = source.slice(i + 1, close);
			i = close + 1;
			return { kind: 'literal', text };
		}
		if (c === '[') return charClass();
		const hex = sticky(HEX);
		if (hex) {
			const code = parseInt(hex[1]!, 16);
			return { kind: 'literal', text: String.fromCodePoint(code) };
		}
		const n = sticky(NAME);
		if (n) return { kind: 'name', name: n[0] };
		return fail('unexpected character');
	}

	function charClass(): Expr {
		i++;
		const negated = source[i] === '^';
		if (negated) i++;
		const ranges: [number, number][] = [];
		const one = (): number => {
			const hex = sticky(HEX);
			if (hex) return parseInt(hex[1]!, 16);
			const code = source.codePointAt(i);
			if (code === undefined) fail('unclosed class');
			i += code! > 0xffff ? 2 : 1;
			return code!;
		};
		while (source[i] !== ']') {
			if (i >= source.length) fail('unclosed class');
			const from = one();
			let to = from;
			if (source[i] === '-' && source[i + 1] !== ']') {
				i++;
				to = one();
				if (to < from) fail('reversed range');
			}
			ranges.push([from, to]);
		}
		i++;
		if (!ranges.length) fail('empty class');
		return { kind: 'class', negated, ranges };
	}

	const expr = alt();
	if (i < source.length) fail('unexpected )');
	return expr;
}

/** Every name an expression refers to. */
export function references(expr: Expr, out = new Set<string>()): Set<string> {
	if (expr.kind === 'name') out.add(expr.name);
	else if (expr.kind === 'seq') for (const e of expr.items) references(e, out);
	else if (expr.kind === 'alt') for (const e of expr.options) references(e, out);
	else if (expr.kind === 'repeat') references(expr.item, out);
	return out;
}
