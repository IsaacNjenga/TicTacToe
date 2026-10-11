<script lang="ts">
	import './layout.css';
	import favicon from '../lib/assets/favicon.svg';
	import { Toaster } from '../lib/components/ui/sonner';
	import { ModeWatcher } from 'mode-watcher';
	// import NavigationLoader from '../lib/components/common/NavigationLoader.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Toaster position="top-right" />
<ModeWatcher />
<!-- <NavigationLoader /> -->
{@render children()}
