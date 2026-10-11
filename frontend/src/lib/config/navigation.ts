import type { Component } from 'svelte';
import House from '@lucide/svelte/icons/house';
import Settings from '@lucide/svelte/icons/settings-2';
import History from '@lucide/svelte/icons/history';

export type NavigationItem = {
	title: string;
	href: '/home' | '/history' | '/settings';
	icon: Component;
};

export const navigationItems: NavigationItem[] = [
	{ title: 'Home', href: '/home', icon: House },
	{ title: 'History', href: '/history', icon: History },
	{ title: 'Settings', href: '/settings', icon: Settings }
];
