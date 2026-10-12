import type { Component } from 'svelte';
import House from '@lucide/svelte/icons/house';
import Settings from '@lucide/svelte/icons/settings-2';
import History from '@lucide/svelte/icons/history';
import Trophy from '@lucide/svelte/icons/trophy';

export type NavigationItem = {
	title: string;
	href: '/home' | '/history' | '/hall-of-fame' | '/settings';
	icon: Component;
};

export const navigationItems: NavigationItem[] = [
	{ title: 'Home', href: '/home', icon: House },
	{ title: 'History', href: '/history', icon: History },
	{ title: 'Hall Of Fame', href: '/hall-of-fame', icon: Trophy },
	{ title: 'Settings', href: '/settings', icon: Settings }
];
