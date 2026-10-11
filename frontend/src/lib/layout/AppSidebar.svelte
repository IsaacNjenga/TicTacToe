<script lang="ts">
	import { page } from '$app/state';
	import { Circle, X } from '@lucide/svelte';
	import { appConfig } from '../config/app';
	import { navigationItems } from '../config/navigation';
</script>

<aside class="sidebar">
	<a class="brand" href="/home" aria-label={`${appConfig.name} home`}>
		<span class="brand-mark" aria-hidden="true">
			<X size={21} strokeWidth={3} />
			<Circle size={15} strokeWidth={3} />
		</span>
		<span class="brand-copy">little<span>rivals</span></span>
	</a>

	<p class="sidebar-label">PLAYGROUND</p>
	<nav class="navigation" aria-label="Main navigation">
		{#each navigationItems as item (item.href)}
			{@const Icon = item.icon}
			<a
				class="nav-link"
				class:active={page.url.pathname === item.href}
				href={item.href}
				aria-current={page.url.pathname === item.href ? 'page' : undefined}
			>
				<Icon size={18} strokeWidth={2.2} />
				<span>{item.title}</span>
			</a>
		{/each}
	</nav>

	<div class="sidebar-bottom">
		<div class="sidebar-footer"><span class="online-dot"></span> MADE FOR TWO</div>
	</div>
</aside>
