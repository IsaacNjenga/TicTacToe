<script lang="ts">
	// import { page } from '$app/state';
	// import { Moon, Sun } from '@lucide/svelte';
	// import { mode, toggleMode } from 'mode-watcher';
	import AppSidebar from '../../lib/layout/AppSidebar.svelte';
	import { SidebarProvider } from '../../lib/components/ui/sidebar';
	import { SidebarTrigger } from '$lib/components/ui/sidebar';

	let { children } = $props();
	// let darkMode = $derived(mode.current === 'dark');
	// let currentPage = $derived(
	// 	page.url.pathname === '/settings'
	// 		? 'SETTINGS'
	// 		: page.url.pathname === '/history'
	// 			? 'HISTORY'
	// 			: 'HOME'
	// );
</script>

<div class="app-shell">
	<SidebarProvider>
		<AppSidebar />
		<header class="mobile-sidebar-bar md:hidden">
			<SidebarTrigger aria-label="Open navigation menu" />
			<span>little<span class="mobile-brand-accent">rivals</span></span>
		</header>
		{@render children()}
	</SidebarProvider>
</div>
