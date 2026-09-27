/** @prose
 * # Parsers
 *
 * One adapter per parser, so the benchmark treats them alike: each gives its public structured
 * parse, if it has one, and its parse to HTML, set up for a mode. An adapter imports its library
 * only when it's loaded, so a process that times one parser never pays for another's startup.
 *
 * The structured parses aren't the same thing, and each adapter names what it builds: markz a
 * flat tree with offsets, markdown-it and markdown-exit a flat token stream, marked a nested token
 * list, Comark a nested array tree, remark a nested tree with positions (mdast). micromark alone
 * has none in public: remark is how its tree is built and how most people get HTML from it, so
 * both are here, and the gap between them is what the pipeline costs. That difference is part
 * of what's measured.
 *
 * Each adapter declares its configuration and what it reads beyond CommonMark, and the runner
 * reports both, so the README's and the site's tables are generated from what ran.
 *
 * The two modes (`README.md`):
 *
 * - **common**: every parser on the same workload, documents that use only what all of them
 *   share, each set up as its adapter lists (mostly its defaults, GFM where it has it).
 * - **dialect**: each parser as close to markz as its plugins get. Math is on only where the
 *   plugin doesn't typeset (micromark's and Comark's run KaTeX, which isn't parsing), so it is
 *   markdown-it's and markdown-exit's alone. marked has no plugins here, and stays at its GFM
 *   defaults.
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

export const PARSERS = [
	'markz',
	'micromark',
	'remark',
	'markdown-it',
	'markdown-exit',
	'marked',
	'comark'
];

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
				extensions.push(
					gfmTable(),
					gfmStrikethrough(),
					gfmTaskListItem(),
					directive(),
					frontmatter()
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
					frontmatterHtml()
				);
			}
			return {
				representation: null,
				html: (s) => micromark(s, { extensions, htmlExtensions }),
				configuration: dialect
					? 'the GFM table, strikethrough and task-list extensions, directive (each as its element), frontmatter'
					: 'micromark-extension-gfm',
				capabilities: dialect
					? ['tables', 'strikethrough', 'task lists', 'directives', 'frontmatter']
					: ['GFM']
			};
		}
		case 'markdown-it':
		case 'markdown-exit': {
			const md =
				name === 'markdown-it'
					? new (await import('markdown-it')).default()
					: new (await import('markdown-exit')).MarkdownExit();
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
			return {
				representation: 'nested token list',
				structured: (s) => marked.lexer(s),
				html: (s) => marked.parse(s) as string,
				configuration: '{ gfm: true }: it has no plugins here',
				capabilities: ['GFM']
			};
		}
		case 'remark': {
			const { unified } = await import('unified');
			const remarkParse = (await import('remark-parse')).default;
			const remarkRehype = (await import('remark-rehype')).default;
			const rehypeStringify = (await import('rehype-stringify')).default;
			const parser = unified().use(remarkParse);
			if (!dialect) parser.use((await import('remark-gfm')).default);
			else {
				const { gfmTable } = await import('micromark-extension-gfm-table');
				const { gfmStrikethrough } = await import('micromark-extension-gfm-strikethrough');
				const { gfmTaskListItem } = await import('micromark-extension-gfm-task-list-item');
				const { gfmTableFromMarkdown } = await import('mdast-util-gfm-table');
				const { gfmStrikethroughFromMarkdown } = await import('mdast-util-gfm-strikethrough');
				const { gfmTaskListItemFromMarkdown } = await import('mdast-util-gfm-task-list-item');
				// remark-gfm can't leave parts out, so the parts markz has go in as remark-gfm adds them.
				parser.use(function () {
					const data = this.data();
					(data.micromarkExtensions ??= []).push(gfmTable(), gfmStrikethrough(), gfmTaskListItem());
					(data.fromMarkdownExtensions ??= []).push(
						gfmTableFromMarkdown(),
						gfmStrikethroughFromMarkdown(),
						gfmTaskListItemFromMarkdown()
					);
				});
				parser.use((await import('remark-frontmatter')).default);
				parser.use((await import('remark-directive')).default);
				// remark-rehype drops a directive it has no handler for; this makes each its element.
				parser.use(() => (tree) => {
					const stack: import('mdast').Nodes[] = [tree as import('mdast').Root];
					for (let node = stack.pop(); node; node = stack.pop()) {
						if (
							node.type === 'containerDirective' ||
							node.type === 'leafDirective' ||
							node.type === 'textDirective'
						) {
							node.data = { ...node.data, hName: node.name };
						}
						if ('children' in node) stack.push(...node.children);
					}
				});
			}
			const processor = parser().use(remarkRehype).use(rehypeStringify);
			return {
				representation: 'nested tree with positions (mdast)',
				structured: (s) => parser.parse(s),
				html: (s) => String(processor.processSync(s)),
				configuration: dialect
					? 'remark-parse, the GFM table, strikethrough and task-list parts, remark-frontmatter, remark-directive (each as its element), remark-rehype, rehype-stringify'
					: 'remark-parse, remark-gfm, remark-rehype, rehype-stringify',
				capabilities: dialect
					? ['tables', 'strikethrough', 'task lists', 'directives', 'frontmatter']
					: ['GFM']
			};
		}
		case 'comark': {
			const { createMarkdownParser } = await import('comark');
			const { createHtmlRenderer } = await import('@comark/html');
			// Common turns off Comark's default plugins (raw HTML, frontmatter, and the rest); its
			// component and attribute syntax is core and stays.
			const options = { registerDefaultPlugins: dialect };
			return {
				representation: 'nested array tree',
				structured: createMarkdownParser(options),
				html: createHtmlRenderer(options),
				configuration: `{ registerDefaultPlugins: ${dialect} }`,
				capabilities: dialect
					? ['GFM', 'components', 'attributes', 'frontmatter', 'raw HTML']
					: ['GFM', 'components', 'attributes']
			};
		}
	}
	throw new Error(`unknown parser ${name}`);
}
