import type { Component } from 'svelte';
import House from '@lucide/svelte/icons/house';
import Settings from '@lucide/svelte/icons/settings-2';
import Plug2 from '@lucide/svelte/icons/plug-2';

export type NavigationItem = {
	title: string;
	href: '/home' | '/settings' | '/ws';
	icon: Component;
};

export const navigationItems: NavigationItem[] = [
	{ title: 'Home', href: '/home', icon: House },
	{ title: 'WebSocket', href: '/ws', icon: Plug2 },
	{ title: 'Settings', href: '/settings', icon: Settings }
];
