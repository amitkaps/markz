/** Markdown imported as text, which Vite resolves in the tests and in the site's build. */
declare module '*.md?raw' {
	const text: string;
	export default text;
}
