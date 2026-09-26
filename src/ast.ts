/** @prose
 * # AST
 *
 * The flat, read-only document markz parses into. A node is an index; its type, range and tree
 * links live in parallel typed arrays, and the few node types that carry data keep it in a side
 * table. The parser fills a `Builder`, which hands over a `Document` once and is done: there is no
 * mutation API, so offsets can never drift from the source they point into (spec: AST).
 */

/** @prose
 * ## Node types
 *
 * `T` is the one list of node types. Its keys are the public string names and its values the
 * internal numeric codes stored in the `type` array, in the same order, so the name table below is
 * just its keys. The list is the spec's node list, no more.
 */
export const T = {
	document: 0,
	metadata: 1,
	comment: 2,
	heading: 3,
	paragraph: 4,
	text: 5,
	emphasis: 6,
	strong: 7,
	delete: 8,
	link: 9,
	image: 10,
	code: 11,
	inlineCode: 12,
	blockquote: 13,
	list: 14,
	listItem: 15,
	thematicBreak: 16,
	break: 17,
	table: 18,
	tableRow: 19,
	tableCell: 20,
	directive: 21,
	math: 22,
	raw: 23,
	expression: 24
} as const;

export type NodeType = keyof typeof T;

const NAMES = Object.keys(T) as NodeType[];

/** A node is its index. `NONE` stands for a missing parent, child or sibling. */
export type NodeId = number;
export const NONE: NodeId = -1;

/** A half-open range of UTF-16 offsets into the parsed source. */
export interface Range {
	start: number;
	end: number;
}

/** @prose
 * ## Node data
 *
 * What each node type carries beyond its range and links. Strings that a node may lack are `null`
 * rather than empty, because the output distinguishes them (`[a](b "")` has a title). Values that
 * are decoded or stripped of container prefixes (`> ` inside a blockquote) are stored as strings;
 * everything else is a range, so the source stays the one copy of the text.
 */
export type MetadataScalar = string | number | boolean | null;
export type MetadataValue = MetadataScalar | MetadataScalar[];

export interface NodeData {
	/** The flat object, and the range of the lines between the `---` fences. */
	metadata: { value: Record<string, MetadataValue>; range: Range };
	heading: { depth: 1 | 2 | 3 | 4 | 5 | 6; id: string; idExplicit: boolean };
	/** Decoded text; the node's range covers the raw characters. */
	text: { value: string };
	link: Destination & { autolink: boolean };
	image: Destination & { alt: string };
	code: { lang: string | null; meta: string | null; value: string; body: Range };
	inlineCode: { value: string };
	list: { ordered: boolean; start: number; tight: boolean };
	/** `null` for an ordinary item, a boolean for a GFM task item. */
	listItem: { checked: boolean | null };
	table: { align: Align[] };
	/**
	 * A leaf or text directive's label is also its children (inline content). A container's is
	 * only this: plain text, escapes decoded, never parsed inline.
	 */
	directive: {
		kind: 'text' | 'leaf' | 'container';
		name: string;
		label: (Range & { value: string }) | null;
	};
	math: { block: boolean; value: string; range: Range };
	/** A ` ```=format ` fence; `value` is its content. */
	raw: { format: string; value: string; range: Range };
	/** `${…}`; `code` is what is between the braces. */
	expression: { code: string; range: Range };
}

export interface Destination {
	destination: string;
	title: string | null;
	destinationRange: Range;
	/** `${…}` inside the destination. */
	expressions: Range[];
}

export type Align = 'left' | 'center' | 'right' | null;

/** The node types that carry data, and so the ones `Document.data` accepts. */
export type DataType = keyof NodeData;

/** @prose
 * ## Attributes and diagnostics
 *
 * A `{…}` block, wherever it is allowed, becomes an `Attributes` in a second side table, so the
 * common case costs one empty slot. `#id` and `.class` are stored under the keys `id` and `class`,
 * each item with its own range, in source order: the renderer applies "classes accumulate, a later
 * value wins" and the AST stays verbatim.
 *
 * A diagnostic is rejected syntax that was kept as text: its range, what was wrong, and the
 * supported form from the "Write instead" column of `syntax.md`.
 */
export interface Attribute extends Range {
	key: string;
	value: string;
}

export interface Attributes extends Range {
	items: Attribute[];
}

export interface Diagnostic extends Range {
	message: string;
	instead: string;
}

/** @prose
 * ## Document
 *
 * The read-only view consumers get from `parse`. Accessors take a node and read one array slot, so
 * a walk allocates nothing but the generator `children` returns. Node ids are only meaningful for
 * the document that produced them and are not bounds-checked. `data` checks the type it is asked
 * for, which keeps a wrong guess from reading another type's fields as if they were its own.
 */
export class Document {
	readonly source: string;
	readonly root: NodeId = 0;
	readonly diagnostics: readonly Diagnostic[];
	readonly #store: Store;

	/** @internal Documents come from `parse`; the constructor is not public API. */
	constructor(source: string, store: Store, diagnostics: readonly Diagnostic[]) {
		this.source = source;
		this.#store = store;
		this.diagnostics = diagnostics;
	}

	/** The number of nodes. Ids run from 0 (the root) to `size - 1`, parents before children. */
	get size(): number {
		return this.#store.type.length;
	}

	type(node: NodeId): NodeType {
		return NAMES[this.#store.type[node]!]!;
	}

	start(node: NodeId): number {
		return this.#store.start[node]!;
	}

	end(node: NodeId): number {
		return this.#store.end[node]!;
	}

	parent(node: NodeId): NodeId {
		return this.#store.parent[node]!;
	}

	firstChild(node: NodeId): NodeId {
		return this.#store.firstChild[node]!;
	}

	nextSibling(node: NodeId): NodeId {
		return this.#store.nextSibling[node]!;
	}

	*children(node: NodeId): Generator<NodeId, void, undefined> {
		const { firstChild, nextSibling } = this.#store;
		for (let child = firstChild[node]!; child !== NONE; child = nextSibling[child]!) yield child;
	}

	data<K extends DataType>(node: NodeId, type: K): Readonly<NodeData[K]> {
		if (this.#store.type[node] !== T[type]) {
			throw new TypeError(`node ${node} is a ${this.type(node)}, not a ${type}`);
		}
		return this.#store.data[node] as NodeData[K];
	}

	attributes(node: NodeId): Readonly<Attributes> | undefined {
		return this.#store.attributes[node];
	}

	/** The metadata object, which can only be the root's first child. */
	get metadata(): Readonly<Record<string, MetadataValue>> | undefined {
		const first = this.firstChild(this.root);
		return first !== NONE && this.type(first) === 'metadata'
			? this.data(first, 'metadata').value
			: undefined;
	}
}

/** @internal The arrays behind a `Document`, all `size` long. */
export interface Store {
	type: Uint8Array;
	start: Int32Array;
	end: Int32Array;
	parent: Int32Array;
	firstChild: Int32Array;
	nextSibling: Int32Array;
	data: unknown[];
	attributes: (Attributes | undefined)[];
}

/** @prose
 * ## Builder
 *
 * How the parser writes the tree. It keeps a stack of open nodes: `open` starts a child of the
 * innermost one and makes it innermost, `close` sets its end and pops it, and `leaf` adds a
 * finished child. Children are appended through a `lastChild` array that only the builder has, so
 * appending is constant time and the document doesn't carry the extra column. Arrays grow by
 * doubling from a guess based on the source length. `finish` closes the root at the end of the
 * source and trims the arrays to size without copying.
 */
type DataArgs<K extends NodeType> = K extends DataType ? [data: NodeData[K]] : [];

export class Builder {
	readonly #source: string;
	#size = 0;
	#type: Uint8Array;
	#start: Int32Array;
	#end: Int32Array;
	#parent: Int32Array;
	#firstChild: Int32Array;
	#nextSibling: Int32Array;
	#lastChild: Int32Array;
	readonly #data: unknown[] = [];
	readonly #attributes: (Attributes | undefined)[] = [];
	readonly #diagnostics: Diagnostic[] = [];
	readonly #open: NodeId[] = [];

	/** The root starts at `start`, which is 1 when the source begins with a BOM. */
	constructor(source: string, start = 0) {
		this.#source = source;
		const capacity = Math.max(16, source.length >> 3);
		this.#type = new Uint8Array(capacity);
		this.#start = new Int32Array(capacity);
		this.#end = new Int32Array(capacity);
		this.#parent = new Int32Array(capacity);
		this.#firstChild = new Int32Array(capacity);
		this.#nextSibling = new Int32Array(capacity);
		this.#lastChild = new Int32Array(capacity);
		this.#open.push(this.#add(T.document, start, source.length, NONE, undefined));
	}

	/** The innermost open node. */
	get current(): NodeId {
		return this.#open[this.#open.length - 1]!;
	}

	open<K extends NodeType>(type: K, start: number, ...data: DataArgs<K>): NodeId {
		const node = this.#add(T[type], start, start, this.current, data[0]);
		this.#open.push(node);
		return node;
	}

	close(end: number): NodeId {
		if (this.#open.length === 1) throw new Error('the root is closed by finish()');
		const node = this.#open.pop()!;
		this.#end[node] = end;
		return node;
	}

	leaf<K extends NodeType>(type: K, start: number, end: number, ...data: DataArgs<K>): NodeId {
		return this.#add(T[type], start, end, this.current, data[0]);
	}

	/** Data that is only known once a node's content has been read, such as a list's tightness. */
	setData<K extends DataType>(node: NodeId, type: K, data: NodeData[K]): void {
		if (this.#type[node] !== T[type]) throw new TypeError(`node ${node} is not a ${type}`);
		this.#data[node] = data;
	}

	setAttributes(node: NodeId, attributes: Attributes): void {
		this.#attributes[node] = attributes;
	}

	diagnose(diagnostic: Diagnostic): void {
		this.#diagnostics.push(diagnostic);
	}

	finish(): Document {
		if (this.#open.length !== 1) throw new Error(`${this.#open.length - 1} nodes left open`);
		const n = this.#size;
		const store: Store = {
			type: this.#type.subarray(0, n),
			start: this.#start.subarray(0, n),
			end: this.#end.subarray(0, n),
			parent: this.#parent.subarray(0, n),
			firstChild: this.#firstChild.subarray(0, n),
			nextSibling: this.#nextSibling.subarray(0, n),
			data: this.#data,
			attributes: this.#attributes
		};
		// A paragraph's inline diagnostics are found when it closes, after later block ones.
		this.#diagnostics.sort((a, b) => a.start - b.start);
		return new Document(this.#source, store, this.#diagnostics);
	}

	#add(type: number, start: number, end: number, parent: NodeId, data: unknown): NodeId {
		const node = this.#size++;
		if (node === this.#type.length) this.#grow();
		this.#type[node] = type;
		this.#start[node] = start;
		this.#end[node] = end;
		this.#parent[node] = parent;
		this.#firstChild[node] = NONE;
		this.#nextSibling[node] = NONE;
		this.#lastChild[node] = NONE;
		this.#data.push(data);
		this.#attributes.push(undefined);
		if (parent !== NONE) {
			const last = this.#lastChild[parent]!;
			if (last === NONE) this.#firstChild[parent] = node;
			else this.#nextSibling[last] = node;
			this.#lastChild[parent] = node;
		}
		return node;
	}

	#grow(): void {
		const grow = <A extends Uint8Array | Int32Array>(a: A): A => {
			const b = new (a.constructor as new (n: number) => A)(a.length * 2);
			b.set(a);
			return b;
		};
		this.#type = grow(this.#type);
		this.#start = grow(this.#start);
		this.#end = grow(this.#end);
		this.#parent = grow(this.#parent);
		this.#firstChild = grow(this.#firstChild);
		this.#nextSibling = grow(this.#nextSibling);
		this.#lastChild = grow(this.#lastChild);
	}
}
