/** @prose
 * # Positions
 *
 * Offsets are what the AST stores; editors and error messages want lines and columns. `position`
 * builds a table of line starts once, then converts each offset by binary search. Lines are
 * 1-based and columns 0-based in UTF-16 code units, visdown's convention and source-map v3's.
 * CRLF, LF and a lone CR each end a line, as they do for the parser. An offset past the end is
 * clamped to the end.
 */
export function position(source: string): (offset: number) => Position {
  const starts = [0];
  for (let i = 0; i < source.length; i++) {
    const c = source.charCodeAt(i);
    if (c === 10 || (c === 13 && source.charCodeAt(i + 1) !== 10)) starts.push(i + 1);
  }
  return (offset) => {
    const at = Math.max(0, Math.min(offset, source.length));
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (starts[mid]! <= at) low = mid;
      else high = mid - 1;
    }
    return { line: low + 1, column: at - starts[low]! };
  };
}

/** A line, from 1, and a column, from 0, in UTF-16 code units. */
export interface Position {
  line: number;
  column: number;
}
