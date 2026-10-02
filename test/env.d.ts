/// <reference types="vite-plus/client" />
/** Markdown imported as text, which Vite resolves in the tests and in the Quality page's generator. */
declare module "*.md?raw" {
  const text: string;
  export default text;
}
