<script lang="ts">
	import { page } from '$app/state';
	import { Moon, Sun } from '@lucide/svelte';
	import { mode, toggleMode } from 'mode-watcher';
	import AppSidebar from '../../lib/layout/AppSidebar.svelte';

	let { children } = $props();
	let darkMode = $derived(mode.current === 'dark');
	let currentPage = $derived(page.url.pathname === '/settings' ? 'SETTINGS' : 'HOME');
</script>

<div class="app-shell">
	<AppSidebar />

	<main class="main-area">
		<header class="topbar">
			<div class="breadcrumb">
				<span>PLAYGROUND</span><span class="breadcrumb-divider">/</span><strong
					>{currentPage}</strong
				>
			</div>
			<button
				class="topbar-theme"
				type="button"
				onclick={toggleMode}
				aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
			>
				{#if darkMode}<Sun size={16} />{:else}<Moon size={16} />{/if}
				<span>{darkMode ? 'Light mode' : 'Dark mode'}</span>
			</button>
		</header>

		{@render children()}
	</main>
</div>
