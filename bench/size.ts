/** @prose
 * # Bundle size
 *
 * What each parser costs a page that renders Markdown to HTML with it, bundled, minified and
 * compressed exactly as `scripts/size.ts` measures markz. Every entry does the same job, parse to
 * HTML with the benchmark's configuration for its mode, so the table compares entry points that
 * do the same work, not packages. A parser that loads code lazily
 * (Comark's plugins) is counted with every chunk it can load, since a page pays for them once it
 * uses them.
 *
 * This is a comparison, not the budget: markz's 20 KB gate stays in `scripts/size.ts`.
 *
 * A size changes only when an entry or a package does, so each is cached (`results/sizes.json`,
 * gitignored) under its entry's text, the versions of the packages it imports, and for markz the
 * hash of its build. A run bundles only what changed, which keeps a plain `pnpm compare` fast.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { build, type Rolldown } from 'vite-plus';
import type { Mode } from './parsers.ts';

export interface Size {
	parser: string;
	mode: Mode;
	/** The packages the entry imports. */
	entry: string[];
	minified: number;
	gzip: number;
	brotli: number;
}

const DIRECTIVE = `{ '*'(d) { this.tag('<' + d.name + '>'); this.raw(d.label ?? ''); this.raw(d.content ?? ''); this.tag('</' + d.name + '>'); return true; } }`;

/** One entry per parser and mode, the same configuration as `parsers.ts`. */
const ENTRIES: Record<string, Record<Mode, string>> = {
	markz: {
		common: `import { parse, html } from 'markz';\nexport default (s) => html(parse(s));`,
		dialect: `import { parse, html } from 'markz';\nexport default (s) => html(parse(s));`
	},
	micromark: {
		common: `import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';
export default (s) => micromark(s, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });`,
		dialect: `import { micromark } from 'micromark';
import { gfmTable, gfmTableHtml } from 'micromark-extension-gfm-table';
import { gfmStrikethrough, gfmStrikethroughHtml } from 'micromark-extension-gfm-strikethrough';
import { gfmTaskListItem, gfmTaskListItemHtml } from 'micromark-extension-gfm-task-list-item';
import { directive, directiveHtml } from 'micromark-extension-directive';
import { frontmatter, frontmatterHtml } from 'micromark-extension-frontmatter';
export default (s) => micromark(s, {
	extensions: [gfmTable(), gfmStrikethrough(), gfmTaskListItem(), directive(), frontmatter()],
	htmlExtensions: [gfmTableHtml(), gfmStrikethroughHtml(), gfmTaskListItemHtml(), directiveHtml(${DIRECTIVE}), frontmatterHtml()]
});`
	},
	remark: {
		common: `import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify);
export default (s) => String(processor.processSync(s));`,
		dialect: `import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { gfmTable } from 'micromark-extension-gfm-table';
import { gfmStrikethrough } from 'micromark-extension-gfm-strikethrough';
import { gfmTaskListItem } from 'micromark-extension-gfm-task-list-item';
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table';
import { gfmStrikethroughFromMarkdown } from 'mdast-util-gfm-strikethrough';
import { gfmTaskListItemFromMarkdown } from 'mdast-util-gfm-task-list-item';
function gfmParts() {
	const data = this.data();
	(data.micromarkExtensions ??= []).push(gfmTable(), gfmStrikethrough(), gfmTaskListItem());
	(data.fromMarkdownExtensions ??= []).push(gfmTableFromMarkdown(), gfmStrikethroughFromMarkdown(), gfmTaskListItemFromMarkdown());
}
function elements() {
	return (tree) => {
		const stack = [tree];
		for (let node = stack.pop(); node; node = stack.pop()) {
			if (node.type.endsWith('Directive')) node.data = { ...node.data, hName: node.name };
			if (node.children) stack.push(...node.children);
		}
	};
}
const processor = unified().use(remarkParse).use(gfmParts).use(remarkFrontmatter).use(remarkDirective).use(elements).use(remarkRehype).use(rehypeStringify);
export default (s) => String(processor.processSync(s));`
	},
	'markdown-it': itEntry(`import MarkdownIt from 'markdown-it';\nconst md = new MarkdownIt();`),
	'markdown-exit': itEntry(
		`import { MarkdownExit } from 'markdown-exit';\nconst md = new MarkdownExit();`
	),
	marked: {
		common: `import { Marked } from 'marked';\nconst marked = new Marked({ gfm: true });\nexport default (s) => marked.parse(s);`,
		dialect: `import { Marked } from 'marked';\nconst marked = new Marked({ gfm: true });\nexport default (s) => marked.parse(s);`
	},
	comark: {
		common: `import { createHtmlRenderer } from '@comark/html';\nexport default createHtmlRenderer({ registerDefaultPlugins: false });`,
		dialect: `import { createHtmlRenderer } from '@comark/html';\nexport default createHtmlRenderer({ registerDefaultPlugins: true });`
	}
};

function itEntry(create: string): Record<Mode, string> {
	return {
		common: `${create}\nexport default (s) => md.render(s);`,
		dialect: `${create}
import front from 'markdown-it-front-matter';
import { tex } from '@mdit/plugin-tex';
import container from 'markdown-it-container';
import tasks from 'markdown-it-task-lists';
md.use(front, () => {});
md.use(tex, { render: (c, block) => '<span class="math ' + (block ? 'display' : 'inline') + '">' + md.utils.escapeHtml(c) + '</span>' });
md.use(container, 'any', { validate: () => true });
md.use(tasks);
export default (s) => md.render(s);`
	};
}

const here = import.meta.dirname;
const CACHE = join(here, 'results/sizes.json');

/** What the entry imports, and the key its size is cached under. */
function identify(source: string): { entry: string[]; key: string } {
	const entry = [...new Set([...source.matchAll(/from '([^']+)'/g)].map((m) => m[1]!))];
	const versions = entry.map((name) => {
		if (name === 'markz') {
			const built = readFileSync(join(here, '../dist/index.js'));
			return `markz@${createHash('sha256').update(built).digest('hex').slice(0, 16)}`;
		}
		const pkg = join(here, 'node_modules', name, 'package.json');
		return `${name}@${(JSON.parse(readFileSync(pkg, 'utf8')) as { version: string }).version}`;
	});
	const key = createHash('sha256').update(source).update(versions.join()).digest('hex');
	return { entry, key };
}

export async function sizes(parsers: readonly string[]): Promise<Size[]> {
	let cache: Record<string, Omit<Size, 'parser' | 'mode' | 'entry'>> = {};
	try {
		cache = JSON.parse(readFileSync(CACHE, 'utf8')) as typeof cache;
	} catch {
		// Nothing cached yet.
	}
	const dir = join(here, '.size');
	rmSync(dir, { recursive: true, force: true });
	mkdirSync(dir);
	const out: Size[] = [];
	try {
		for (const parser of parsers) {
			for (const mode of ['common', 'dialect'] as const) {
				const source = ENTRIES[parser]![mode];
				const { entry, key } = identify(source);
				if (!cache[key]) {
					const file = join(dir, `${parser}-${mode}.js`);
					writeFileSync(file, source);
					cache[key] = await measure(file);
				}
				out.push({ parser, mode, entry, ...cache[key]! });
			}
		}
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
	mkdirSync(join(CACHE, '..'), { recursive: true });
	writeFileSync(CACHE, JSON.stringify(cache, null, '\t'));
	return out;
}

async function measure(entry: string) {
	const result = await build({
		configFile: false,
		logLevel: 'silent',
		build: {
			write: false,
			minify: true,
			rolldownOptions: { output: { minify: true } },
			lib: { entry, formats: ['es'], fileName: 'index' }
		}
	});
	const output = (Array.isArray(result) ? result[0] : result) as Rolldown.RolldownOutput;
	const code = output.output
		.filter((o): o is Rolldown.OutputChunk => o.type === 'chunk')
		.map((c) => c.code)
		.join('\n');
	return {
		minified: Buffer.byteLength(code),
		gzip: gzipSync(code, { level: 9 }).length,
		brotli: brotliCompressSync(code).length
	};
}
