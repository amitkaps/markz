# fuzz

What the fuzzer draws from and holds each document to, for [`../fuzz.test.ts`](../fuzz.test.ts)
and [`../complexity.test.ts`](../complexity.test.ts).

- [`generate.ts`](generate.ts): fast-check arbitraries. Documents written from the grammar's
  productions, optionally only those of chosen origins; noise from Markdown's characters and the
  ones that trouble offsets; and known examples with a few random edits.
- [`sound.ts`](sound.ts): what every document must satisfy, whatever the input.
- [`adversarial.ts`](adversarial.ts): patterns that would make a careless parser quadratic, each
  growing in proportion to a count.

A failure fast-check finds is shrunk to its smallest form. Once fixed, it goes into
`../dialect/*.md` as an example, so it stays fixed without the fuzzer finding it again.
