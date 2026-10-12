<script lang="ts">
	import { page } from '$app/state';
	import { Circle, X } from '@lucide/svelte';
	import { appConfig } from '../config/app';
	import { navigationItems } from '../config/navigation';
	import { resolve } from '$app/paths';
	import {
		Sidebar,
		SidebarContent,
		SidebarFooter,
		SidebarHeader,
		SidebarMenu,
		SidebarMenuItem,
		SidebarMenuButton,
		SidebarTrigger,
		useSidebar
	} from '../../lib/components/ui/sidebar';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import User from '@lucide/svelte/icons/user';

	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '../../lib/components/ui/dropdown-menu';
	import { toggleMode } from 'mode-watcher';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Cookies from 'universal-cookie';
	import { goto } from '$app/navigation';
	import { authCookies } from '$lib/config/auth';
	import Separator from '$lib/components/ui/separator/separator.svelte';

	const { toggle } = useSidebar();

	const cookies = new Cookies();

	const user = cookies.get(authCookies.user);

	function handleSignOut() {
		cookies.remove(authCookies.accessToken, { path: '/' });
		cookies.remove(authCookies.refreshToken, { path: '/' });
		cookies.remove(authCookies.user, { path: '/' });
		goto(resolve('/login'));
	}
</script>

<Sidebar collapsible="icon">
	<SidebarHeader>
		<div class="flex h-auto items-center gap-3">
			<div
				class="flex size-auto flex-row items-center justify-center rounded-lg bg-primary text-primary-foreground"
			>
				<a class="brand" href="/home" aria-label={`${appConfig.name} home`}>
					<span class="brand-mark" aria-hidden="true">
						<X size={21} strokeWidth={3} />
						<Circle size={15} strokeWidth={3} />
					</span>
					<span class="brand-copy">little<span>rivals</span></span>
				</a>
			</div>
		</div>
	</SidebarHeader>

	<Separator />

	<SidebarContent>
		<SidebarMenu class="navigation">
			{#each navigationItems as item (item.href)}
				{@const href = resolve(item.href)}
				{@const isActive = page.url.pathname === href}

				<SidebarMenuItem>
					<SidebarMenuButton {isActive} class="nav-link" tooltipContent={item.title}>
						{#snippet child({ props })}
							<a {href} {...props}>
								<item.icon size={18} strokeWidth={2.2} />
								<span>{item.title}</span>
							</a>
						{/snippet}
					</SidebarMenuButton>
				</SidebarMenuItem>
			{/each}
		</SidebarMenu>
	</SidebarContent>

	<SidebarFooter class="sidebar-bottom">
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger>
						{#snippet child({ props })}
							<SidebarMenuButton
								{...props}
								size="lg"
								class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								tooltipContent="Account & Settings"
							>
								<div
									class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
								>
									{#if user}
										<img src={user.avatar} alt="img" class="size-6" />
									{:else}
										<User class="size-4" />
									{/if}
								</div>
								<div class="grid flex-1 text-left text-xs leading-tight">
									{#if user}<span class="truncate font-semibold">{user.username} </span>
									{:else}<span class="truncate font-semibold">User Account</span>
									{/if}
									<span class="truncate font-semibold"></span>
									<span class="truncate text-[10px] text-muted-foreground"
										>Preferences & Actions</span
									>
								</div>
								<ChevronsUpDown class="ml-auto size-4 text-muted-foreground" />
							</SidebarMenuButton>
						{/snippet}
					</DropdownMenuTrigger>

					<DropdownMenuContent
						side="top"
						align="start"
						class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg"
						><!-- Sidebar Collapse Toggle -->
						<DropdownMenuItem class="cursor-pointer gap-2" onclick={toggle}>
							<SidebarTrigger class="pointer-events-none size-4" />
							<span>Toggle Sidebar</span>
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<!-- Theme Toggle -->
						<DropdownMenuItem class="cursor-pointer gap-2" onclick={toggleMode}>
							<div class="relative flex size-4 shrink-0 items-center justify-center">
								<SunIcon
									class="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
								/>
								<MoonIcon
									class="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
								/>
							</div>
							<span>Toggle Theme</span>
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						<!-- Sign Out -->
						<DropdownMenuItem
							class="cursor-pointer gap-2 text-destructive focus:text-destructive"
							onclick={handleSignOut}
						>
							<LogOut class="size-4" />
							<span>Sign Out</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	</SidebarFooter>
	
</Sidebar>

<!-- <aside class="sidebar">
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
</aside> -->
