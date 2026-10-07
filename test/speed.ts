/** @prose
 * # Speed
 *
 * `pnpm bench`: markz alone, this working tree's `src/` against `origin/main`'s, in seconds. It
 * answers one question while you work: did this change move it? Each cell is parse + HTML over
 * some text, in MB/s: each document tier read whole, and each construct over its own examples,
 * repeated to a size (`examples/markz/<id>.md`), so a slower construct shows by name. Last comes
 * what holding the CommonMark spec's tree costs, as a multiple of its source.
 *
 * Both versions run in one process, a pass of each in turn (`harness/speed.ts`), and that is
 * repeated in three fresh processes (`--versus`). A cell shows the median change and the range
 * across the processes. It is marked only when every process puts it beyond 5% the same way. A
 * saved baseline from an earlier run was ruled out, since the machine drifts between runs by more
 * than any change worth finding. `--against <ref>` times against another commit.
 *
 * `--compare` times markz beside the parsers in `harness/parsers.ts` on each tier's common
 * variant, each parser in a fresh process of its own (`--parser <name>`), so no parser's heap or
 * JIT state colours another's numbers. It is for our own insight: nothing here is published.
 *
 * `--profile` shows where the time goes rather than how much there is (`harness/profile.ts`). It
 * profiles every tier, or one tier or construct by name (`--profile heading`), and writes the
 * profile to `node_modules/.cache/` for DevTools.
 */
import "./harness/node.ts";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

const { html, parse } = await import("../src/index.ts");
const { TIERS, common, documents, repeat } = await import("./harness/corpus.ts");
const { readFences } = await import("./harness/fences.ts");
const { OTHERS, load } = await import("./harness/parsers.ts");
const { retained, time, versus, warm } = await import("./harness/speed.ts");
const { profile, summarize } = await import("./harness/profile.ts");

const root = join(import.meta.dirname, "..");
const CACHE = join(root, "node_modules/.cache/markz");
const PROFILE = join(CACHE, "markz.cpuprofile");
const PROFILE_MS = 3_000;
const BUDGET_MS = 25;
/** Both versions' passes together, for each cell. */
const VERSUS_MS = 60;
/** Processes the comparison runs in. A version's luck with the JIT holds for a whole process. */
const RUNS = 3;
const WARM_MS = 1_000;
const CONSTRUCT_BYTES = 20_000;
/** No change under this is marked, however quiet both runs were. */
const FLOOR = 0.05;

interface Speed {
  mbPerSecond: number;
  /** The middle half of the passes' spread, as a fraction of the median. */
  noise: number;
}

function speed(run: (text: string) => unknown, texts: string[]): Speed {
  const bytes = texts.reduce((sum, t) => sum + t.length, 0);
  const t = time(run, texts, BUDGET_MS, 3);
  return { mbPerSecond: bytes / 1e3 / t.ms, noise: (t.high - t.low) / t.ms };
}

const run = (text: string) => html(parse(text));

/** What the bench times: each document tier whole, and each construct's examples repeated. */
function timed(): { name: string; texts: string[] }[] {
  const out = TIERS.map((tier) => ({
    name: `${tier} documents`,
    texts: [...documents(tier).values()],
  }));
  const own = join(root, "test/examples/markz");
  for (const file of readdirSync(own).sort()) {
    if (!file.endsWith(".md") || file === "README.md" || file === "not-supported.md") continue;
    const examples = readFences(readFileSync(join(own, file), "utf8")).examples;
    const text = examples.map((e) => e.markdown.replace(/\s*$/, "\n")).join("\n");
    out.push({ name: file.slice(0, -3), texts: [repeat(text, CONSTRUCT_BYTES)] });
  }
  return out;
}

const argv = process.argv.slice(2);
const flag = (name: string) => argv.indexOf(name);
const mb = (n: number | undefined) => (n === undefined ? "—" : n.toFixed(1));

if (flag("--parser") >= 0) {
  // One parser's process: warm up on every tier, time each, and report on stdout.
  const tiers = JSON.parse(readFileSync(argv[flag("--parser") + 2]!, "utf8")) as Record<
    string,
    string[]
  >;
  const run = await load(argv[flag("--parser") + 1]!);
  warm(run, Object.values(tiers).flat(), WARM_MS);
  const out: Record<string, number> = {};
  for (const [tier, texts] of Object.entries(tiers)) out[tier] = speed(run, texts).mbPerSecond;
  process.stdout.write(JSON.stringify(out));
} else if (flag("--compare") >= 0) {
  const dir = mkdtempSync(join(tmpdir(), "markz-compare-"));
  const file = join(dir, "tiers.json");
  const tiers = Object.fromEntries(
    TIERS.map((tier) => [tier, [...documents(tier).values()].map((d) => common(parse(d)))]),
  );
  writeFileSync(file, JSON.stringify(tiers));
  const width = 16;
  console.log(
    `${"MB/s, parse + HTML".padEnd(width + 8)}${TIERS.map((t) => t.padStart(8)).join("")}`,
  );
  console.log("common variant, warm, each parser in its own process\n");
  try {
    for (const parser of ["markz", ...OTHERS]) {
      const child = spawnSync(
        process.execPath,
        [join(import.meta.dirname, "speed.ts"), "--parser", parser, file],
        { encoding: "utf8" },
      );
      if (child.status !== 0) {
        console.log(`${parser.padEnd(width + 8)}failed: ${child.stderr.split("\n")[0]}`);
        continue;
      }
      const out = JSON.parse(child.stdout) as Record<string, number>;
      console.log(
        `${parser.padEnd(width + 8)}${TIERS.map((t) => mb(out[t]).padStart(8)).join("")}`,
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
} else if (flag("--profile") >= 0) {
  // A tier or construct to profile, or every tier.
  const target = argv[flag("--profile") + 1];
  const all = timed();
  const chosen = target
    ? all.filter((c) => c.name === target || c.name === `${target} documents`)
    : all.filter((c) => c.name.endsWith(" documents"));
  if (!chosen.length) {
    console.error(`no tier or construct "${target}": ${all.map((c) => c.name).join(", ")}`);
    process.exit(1);
  }
  const texts = chosen.flatMap((c) => c.texts);
  warm(run, texts, WARM_MS);
  const cpu = await profile(run, texts, PROFILE_MS);
  mkdirSync(join(PROFILE, ".."), { recursive: true });
  writeFileSync(PROFILE, JSON.stringify(cpu));
  console.log(`parse + HTML: ${chosen.map((c) => c.name).join(", ")}, warm\n`);
  console.log(summarize(cpu, root));
  console.log(`\n${relative(root, PROFILE)} opens in DevTools for the flame chart`);
} else if (flag("--versus") >= 0) {
  // One process of the default bench: both versions over every cell, as JSON on stdout.
  const base = await import(join(argv[flag("--versus") + 1]!, "src/index.ts"));
  const before = (text: string) => base.html(base.parse(text));
  const cells = timed();
  const texts = cells.flatMap((c) => c.texts);
  // Warmed in turns: whichever version warmed last measured a few percent faster.
  for (let i = 0; i < 10; i++) {
    warm(before, texts, WARM_MS / 10);
    warm(run, texts, WARM_MS / 10);
  }
  const out: Record<string, { mbPerSecond: number; change: number }> = {};
  for (const cell of cells) {
    const bytes = cell.texts.reduce((sum, t) => sum + t.length, 0);
    const v = versus(before, run, cell.texts, VERSUS_MS);
    out[cell.name] = { mbPerSecond: bytes / 1e3 / v.ms, change: v.change };
  }
  process.stdout.write(JSON.stringify(out));
} else {
  // The ref's `src/`, unpacked once per commit, for the processes to load beside the working tree's.
  const ref = flag("--against") >= 0 ? argv[flag("--against") + 1]! : "origin/main";
  const git = (...args: string[]) => spawnSync("git", args, { cwd: root, maxBuffer: 1 << 28 });
  const sha = git("rev-parse", "--verify", `${ref}^{commit}`).stdout.toString().trim();
  if (!sha) {
    console.error(`no commit "${ref}"`);
    process.exit(1);
  }
  // Node strips types only outside `node_modules`, so the ref's files can't live in the cache.
  const dir = join(tmpdir(), "markz-bench", sha);
  if (!existsSync(join(dir, "src/index.ts"))) {
    mkdirSync(dir, { recursive: true });
    const tar = git("archive", "--format=tar", sha, "src").stdout;
    spawnSync("tar", ["-x", "-C", dir], { input: tar });
  }

  const started = performance.now();
  const runs: Record<string, { mbPerSecond: number; change: number }>[] = [];
  for (let i = 0; i < RUNS; i++) {
    const child = spawnSync(
      process.execPath,
      [join(import.meta.dirname, "speed.ts"), "--versus", dir],
      { encoding: "utf8" },
    );
    if (child.status !== 0) {
      console.error(child.stderr);
      process.exit(1);
    }
    runs.push(JSON.parse(child.stdout));
  }

  const cells = Object.keys(runs[0]!);
  const width = Math.max(...cells.map((c) => c.length)) + 2;
  const median = (xs: number[]) => xs.toSorted((a, b) => a - b)[xs.length >> 1]!;
  const pct = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(0)}%`;
  console.log(`against ${ref} (${sha.slice(0, 7)}), both in each of ${RUNS} processes\n`);
  console.log(
    `${"MB/s, parse + HTML".padEnd(width)}${"now".padStart(8)}${"change".padStart(9)}${"runs".padStart(16)}`,
  );
  for (const cell of cells) {
    const changes = runs.map((r) => r[cell]!.change);
    const mark = changes.every((c) => c > FLOOR)
      ? "  faster"
      : changes.every((c) => c < -FLOOR)
        ? "  SLOWER"
        : "";
    console.log(
      `${cell.padEnd(width)}${mb(median(runs.map((r) => r[cell]!.mbPerSecond))).padStart(8)}${pct(median(changes)).padStart(9)}${`${pct(Math.min(...changes))} to ${pct(Math.max(...changes))}`.padStart(16)}${mark}`,
    );
  }

  const spec = [...documents("spec").values()][0]!;
  console.log(
    `\nholding the CommonMark spec's tree: ${(retained(parse, spec) / spec.length).toFixed(1)}× its source`,
  );
  console.log(`${((performance.now() - started) / 1000).toFixed(1)} s`);
}
