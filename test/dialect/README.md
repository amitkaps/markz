# dialect

markz's own examples, in the CommonMark spec's format: one file per part of
[`syntax.md`](../../prose/syntax.md), each `##` a construct id (`../grammar.ts`) or a Not supported row's warning code. The
format is described in [`../examples.ts`](../examples.ts).

An example's info string may name the edge it tries, for [`../cases.ts`](../cases.ts):
`example near-miss`, `example boundary`, `example unclosed`, or `example ambiguous <rule>` with
the side rule that settles it. Every construct has an ambiguous and an unclosed example, or a
reason in `cases.ts` why it can't.
