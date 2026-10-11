import { redirect } from '@sveltejs/kit';
import { authCookies } from '$lib/config/auth';

export function load({ cookies }) {
    throw redirect(303, cookies.get(authCookies.accessToken) ? '/home' : '/login');
}
