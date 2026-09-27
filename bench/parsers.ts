/** @prose
 * # Parsers
 *
 * One adapter per parser, so the benchmark treats them alike: each gives its public structured
 * parse, if it has one, and its parse to HTML, set up for a mode. An adapter imports its library
 * only when it's loaded, so a process that times one parser never pays for another's startup.
 *
 * Three parsers, each for what markz can learn from it: markdown-exit, the fastest, a TypeScript
 * rewrite of markdown-it; marked, the smallest, a regex lexer; and micromark, the spec-exact state
 * machine that is also the tests' oracle. markz isn't a general-purpose replacement for any of
 * them. The parsers studied and left out are in `README.md`.
 *
 * The structured parses aren't the same thing, and each adapter names what it builds: markz a
 * flat tree with offsets, markdown-exit a flat token stream, marked a nested token list.
 * micromark has none in public. That difference is part of what's measured.
 *
 * Each adapter declares its configuration and what it reads beyond CommonMark, and the runner
 * reports both, so the README's and the site's tables are generated from what ran.
 *
 * The two modes (`README.md`):
 *
 * - **common**: every parser on the same workload, documents that use only what all of them
 *   share, each set up as its adapter lists (mostly its defaults, GFM where it has it).
 * - **dialect**: each parser as close to markz as its plugins get. Math is on wherever it can be
 *   read without typesetting, which is rendering, not parsing: micromark's syntax extension with a
 *   handler that writes the TeX as text (its own HTML extension runs KaTeX), and markdown-exit's
 *   tex plugin with the same handler. marked's math extension runs KaTeX, so its stays off.
 *   marked reads directives through marked-directive.
 */
import type MarkdownIt from 'markdown-it';

export type Mode = 'common' | 'dialect';
export type Measure = 'structured' | 'html';

export interface Parser {
	/** What `structured` returns, or `null` when the parser has no public structured parse. */
	representation: string | null;
	structured?: (source: string) => unknown;
	html: (source: string) => string | Promise<string>;
	/** How it is set up for the mode, as its options or plugins. */
	configuration: string;
	/** What it reads beyond CommonMark in the mode. */
	capabilities: string[];
}

export const PARSERS = ['markz', 'markdown-exit', 'marked', 'micromark'];

/** @prose
 * micromark-extension-math's HTML extension runs KaTeX, so the benchmark writes math as the
 * markdown-exit adapter does: the TeX, escaped, in a span that says inline or display. The fence and
 * line-ending bookkeeping is the extension's own.
 */
const MATH_HTML: import('micromark-util-types').HtmlExtension = {
	enter: {
		mathFlow() {
			this.lineEndingIfNeeded();
			this.tag('<span class="math display">');
		},
		mathFlowFenceMeta() {
			this.buffer();
		},
		mathText() {
			this.tag('<span class="math inline">');
			this.buffer();
		}
	},
	exit: {
		mathFlow() {
			const value = this.resume();
			this.raw(this.encode(value.replace(/(?:\r?\n|\r)$/, '')));
			this.tag('</span>');
			this.setData('mathFlowOpen');
			this.setData('slurpOneLineEnding');
		},
		mathFlowFence() {
			if (!this.getData('mathFlowOpen')) {
				this.setData('mathFlowOpen', true);
				this.setData('slurpOneLineEnding', true);
				this.buffer();
			}
		},
		mathFlowFenceMeta() {
			this.resume();
		},
		mathFlowValue(token) {
			this.raw(this.sliceSerialize(token));
		},
		mathText() {
			this.raw(this.encode(this.resume()));
			this.tag('</span>');
		},
		mathTextData(token) {
			this.raw(this.sliceSerialize(token));
		}
	}
};

export async function load(name: string, mode: Mode): Promise<Parser> {
	const dialect = mode === 'dialect';
	switch (name) {
		case 'markz': {
			const { parse, html } = await import('markz');
			return {
				representation: 'flat tree with offsets',
				structured: parse,
				html: (s) => html(parse(s)),
				configuration: 'none: it has no options',
				capabilities: [
					'tables',
					'strikethrough',
					'task lists',
					'directives',
					'metadata',
					'math',
					'attributes',
					'expressions'
				]
			};
		}
		case 'micromark': {
			const { micromark } = await import('micromark');
			const extensions: import('micromark-util-types').Extension[] = [];
			const htmlExtensions: import('micromark-util-types').HtmlExtension[] = [];
			if (!dialect) {
				const { gfm, gfmHtml } = await import('micromark-extension-gfm');
				extensions.push(gfm());
				htmlExtensions.push(gfmHtml());
			} else {
				// The GFM parts markz has: no bare URLs, footnotes or tag filter.
				const { gfmTable, gfmTableHtml } = await import('micromark-extension-gfm-table');
				const { gfmStrikethrough, gfmStrikethroughHtml } =
					await import('micromark-extension-gfm-strikethrough');
				const { gfmTaskListItem, gfmTaskListItemHtml } =
					await import('micromark-extension-gfm-task-list-item');
				const { directive, directiveHtml } = await import('micromark-extension-directive');
				const { frontmatter, frontmatterHtml } = await import('micromark-extension-frontmatter');
				const { math } = await import('micromark-extension-math');
				extensions.push(
					gfmTable(),
					gfmStrikethrough(),
					gfmTaskListItem(),
					directive(),
					frontmatter(),
					math()
				);
				// Without a handler micromark drops every directive; this writes each as its element.
				htmlExtensions.push(
					gfmTableHtml(),
					gfmStrikethroughHtml(),
					gfmTaskListItemHtml(),
					directiveHtml({
						'*'(d) {
							this.tag(`<${d.name}>`);
							this.raw(d.label ?? '');
							this.raw(d.content ?? '');
							this.tag(`</${d.name}>`);
							return true;
						}
					}),
					frontmatterHtml(),
					MATH_HTML
				);
			}
			return {
				representation: null,
				html: (s) => micromark(s, { extensions, htmlExtensions }),
				configuration: dialect
					? 'the GFM table, strikethrough and task-list extensions, directive (each as its element), frontmatter, math (untypeset)'
					: 'micromark-extension-gfm',
				capabilities: dialect
					? ['tables', 'strikethrough', 'task lists', 'directives', 'frontmatter', 'math']
					: ['GFM']
			};
		}
		case 'markdown-exit': {
			const md = new (await import('markdown-exit')).MarkdownExit();
			if (dialect) {
				const front = (await import('markdown-it-front-matter')).default;
				const { tex } = await import('@mdit/plugin-tex');
				const container = (await import('markdown-it-container')).default;
				const tasks = (await import('markdown-it-task-lists')).default;
				// The plugins are written against markdown-it; markdown-exit takes the same API.
				const it = md as unknown as InstanceType<typeof MarkdownIt>;
				it.use(front, () => {});
				// `$…$` and `$$…$$`, written as markz writes math, without typesetting.
				it.use(tex, {
					render: (content: string, block: boolean) =>
						`<span class="math ${block ? 'display' : 'inline'}">${it.utils.escapeHtml(content)}</span>`
				});
				// One container for every `:::name`, written as a div of that class.
				it.use(container, 'any', { validate: () => true });
				it.use(tasks);
			}
			return {
				representation: 'flat token stream',
				structured: (s) => md.parse(s, {}),
				html: (s) => md.render(s),
				configuration: dialect
					? 'default preset, front-matter, @mdit/plugin-tex (untypeset), container (any name), task-lists'
					: 'default preset',
				capabilities: dialect
					? [
							'tables',
							'strikethrough',
							'task lists',
							'frontmatter',
							'dollar math',
							'::: containers'
						]
					: ['tables', 'strikethrough']
			};
		}
		case 'marked': {
			const { Marked } = await import('marked');
			const marked = new Marked({ gfm: true, async: false });
			if (dialect) marked.use((await import('marked-directive')).createDirectives());
			return {
				representation: 'nested token list',
				structured: (s) => marked.lexer(s),
				html: (s) => marked.parse(s) as string,
				configuration: dialect ? '{ gfm: true }, marked-directive' : '{ gfm: true }',
				capabilities: dialect ? ['GFM', 'directives'] : ['GFM']
			};
		}
	}
	throw new Error(`unknown parser ${name}`);
}
