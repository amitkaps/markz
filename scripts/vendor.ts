/** @prose
 * # Vendoring an extension suite
 *
 * Turns a micromark extension's own tests into examples for `test/spec/`, from a local clone at
 * the commit its README pins. What markz is held to is the input: every example is compared with
 * markz's oracle, not with the HTML the suite expected, so a test that only configures the HTML
 * side (a directive handler, `allowDangerousHtml`) keeps its input. A test whose options change the
 * syntax (`disable`, `singleTilde`) is dropped, as is anything whose input isn't a literal.
 *
 * `node scripts/vendor.ts gfm-table ../micromark-extension-gfm-table` writes
 * `test/spec/gfm-table.json` and prints what it kept and dropped.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

export interface Vendored {
	example: number;
	/** `index.js › <test title>`, or the fixture file and the heading the example sits under. */
	section: string;
	markdown: string;
	/** What the suite expected, which may be another renderer's or handler's HTML. */
	html: string;
}

/** Options that change what micromark parses, so the suite's input no longer means the same. */
const SYNTAX_OPTIONS = /\bdisable\b|singleTilde/;

/** @prose
 * ## Fixtures
 *
 * A fixture is a whole document of headed sections, rendered by GitHub. Each section becomes an
 * example, heading included, with the matching slice of the HTML. Large `*.offline.md` stress
 * documents are left to step 15.
 */
function fixtures(dir: string): Vendored[] {
	const out: Vendored[] = [];
	const base = join(dir, 'test/fixtures');
	for (const file of readdirSync(base).sort()) {
		if (!file.endsWith('.md') || file.endsWith('.offline.md')) continue;
		const md = sections(readFileSync(join(base, file), 'utf8'));
		const html = htmlSections(readFileSync(join(base, file.replace(/\.md$/, '.html')), 'utf8'), md);
		for (const [i, [title, markdown]] of md.entries()) {
			// A heading with nothing under it tests nothing.
			if (!markdown.replace(/^#.*\n?/, '').trim()) continue;
			out.push({ example: 0, section: `${file} › ${title}`, markdown, html: html[i]! });
		}
	}
	return out;
}

/** Splits a document before each ATX heading outside a fence. */
function sections(text: string): [title: string, markdown: string][] {
	const out: [string, string][] = [];
	let fence = '';
	for (const line of text.split(/(?<=\n)/)) {
		const ticks = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1];
		if (fence) {
			if (
				ticks &&
				ticks[0] === fence[0] &&
				ticks.length >= fence.length &&
				!line.trim().slice(ticks.length)
			)
				fence = '';
		} else if (ticks) fence = ticks;
		const heading = !fence && /^#{1,6} (.*)/.exec(line);
		if (heading || !out.length) out.push([heading ? heading[1]!.trim() : '', '']);
		out.at(-1)![1] += line;
	}
	return out.filter(([, md]) => md.trim());
}

/**
 * The HTML under each Markdown section, found by heading text rather than by count, since a
 * section can hold a setext heading of its own. Where a heading can't be found, the section's HTML
 * is left empty and the oracle isn't checked against it.
 */
function htmlSections(html: string, md: [string, string][]): string[] {
	const starts: number[] = [];
	let from = 0;
	for (const [title] of md) {
		let at = -1;
		for (const m of html.slice(from).matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g)) {
			if (m[2]!.replace(/<[^>]+>/g, '').trim() === title) {
				at = from + m.index;
				break;
			}
		}
		starts.push(title ? at : 0);
		if (at >= 0) from = at + 1;
	}
	return starts.map((start, i) => {
		if (start < 0) return '';
		const next = starts.slice(i + 1).find((s) => s > start);
		return html.slice(start, next ?? html.length);
	});
}

/** @prose
 * ## Inline tests
 *
 * `test/index.js` asserts `micromark(input, options)` against an expected string. The TypeScript
 * compiler reads the file, so a case is found by its shape, not by a regex over the source, and a
 * string input is taken as the engine would see it, escapes and concatenation resolved.
 */
function inline(dir: string, dropped: string[]): Vendored[] {
	const file = join(dir, 'test/index.js');
	const source = ts.createSourceFile(
		file,
		readFileSync(file, 'utf8'),
		ts.ScriptTarget.Latest,
		true
	);
	const out: Vendored[] = [];
	const visit = (node: ts.Node, title: string) => {
		if (ts.isCallExpression(node)) {
			const callee = node.expression.getText();
			const name = node.arguments[0];
			if (/(^|\.)test$/.test(callee) && name && ts.isStringLiteralLike(name)) title = name.text;
			if (callee === 'micromark') {
				const input = literal(node.arguments[0]);
				const options = node.arguments[1]?.getText() ?? '';
				const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
				if (input === null) dropped.push(`index.js:${line} input is not a literal`);
				else if (SYNTAX_OPTIONS.test(options))
					dropped.push(`index.js:${line} ${title}: options change the syntax`);
				else
					out.push({
						example: 0,
						section: `index.js › ${title}`,
						markdown: input,
						html: expected(node)
					});
			}
		}
		ts.forEachChild(node, (child) => visit(child, title));
	};
	visit(source, '');
	return out;
}

function literal(node: ts.Node | undefined): string | null {
	if (!node) return null;
	if (ts.isStringLiteralLike(node)) return node.text;
	if (ts.isParenthesizedExpression(node)) return literal(node.expression);
	if (ts.isIdentifier(node)) return literal(binding(node));
	if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
		const [a, b] = [literal(node.left), literal(node.right)];
		return a === null || b === null ? null : a + b;
	}
	return null;
}

/** The initializer of the nearest enclosing `const` of that name. */
function binding(name: ts.Identifier): ts.Expression | undefined {
	for (let scope: ts.Node | undefined = name.parent; scope; scope = scope.parent) {
		if (!ts.isBlock(scope) && !ts.isSourceFile(scope)) continue;
		for (const statement of scope.statements) {
			if (!ts.isVariableStatement(statement)) continue;
			if (!(statement.declarationList.flags & ts.NodeFlags.Const)) continue;
			for (const d of statement.declarationList.declarations) {
				if (ts.isIdentifier(d.name) && d.name.text === name.text) return d.initializer;
			}
		}
	}
	return undefined;
}

/** The string `assert.equal(micromark(…), expected)` holds the call to, when it is a literal. */
function expected(call: ts.CallExpression): string {
	const parent = call.parent;
	if (!ts.isCallExpression(parent) || parent.arguments[0] !== call) return '';
	return literal(parent.arguments[1]) ?? '';
}

const [suite, dir] = process.argv.slice(2);
if (!suite || !dir) throw new Error('usage: node scripts/vendor.ts <suite> <clone>');
const dropped: string[] = [];
const examples = [...fixtures(dir), ...inline(dir, dropped)];
// Upstream sometimes asserts the same input twice, under different options.
const seen = new Set<string>();
const kept = examples.filter((e) => !seen.has(e.markdown) && seen.add(e.markdown));
kept.forEach((e, i) => (e.example = i + 1));
writeFileSync(`test/spec/${suite}.json`, JSON.stringify(kept, null, 1) + '\n');
const commit = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
console.log(
	`${suite} at ${commit}: ${kept.length} examples, ${examples.length - kept.length} duplicate inputs`
);
for (const d of dropped) console.log(`  dropped ${d}`);
