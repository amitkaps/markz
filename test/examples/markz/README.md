# markz

markz's own examples: one file per construct, named by its id in `syntax.md` (`{#id}`), and
[`not-supported.md`](not-supported.md) with a `##` for each Not supported row's warning code. The
format is [`../../harness/fences.ts`](../../harness/fences.ts)'s.

Every example is numbered in its fence, `example 17`, and is `markz:17` wherever it is named. The
numbers are one sequence across the files, so moving an example to another file never renames
it: a new one takes the next number after the highest, and a removed one's number isn't used
again.

The info string may go on to name the edge the example tries, for [`../../harness/cases.ts`](../../harness/cases.ts):
`example 17 near-miss`, `boundary`, `unclosed`, or `ambiguous <rule>` with the side rule that
settles it. Every construct has an ambiguous and an unclosed example, or a reason in `cases.ts`
why it can't.
