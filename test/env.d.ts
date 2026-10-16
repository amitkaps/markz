/// <reference types="vite-plus/client" />
/** @prose
 * # Types for the tests
 *
 * What TypeScript needs to know about Vite's imports, in the tests and the Quality page.
 */
/** Markdown imported as text, which Vite resolves in the tests and in the Quality page's generator. */
declare module "*.md?raw" {
  const text: string;
  export default text;
}
