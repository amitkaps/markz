// Plugins that ship no types; the benchmark only passes them to `md.use`.
declare module 'markdown-it-container' {
	import type { PluginWithParams } from 'markdown-it';
	const container: PluginWithParams;
	export default container;
}
declare module 'markdown-it-task-lists' {
	import type { PluginSimple } from 'markdown-it';
	const tasks: PluginSimple;
	export default tasks;
}
