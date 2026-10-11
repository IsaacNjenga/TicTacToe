import { PUBLIC_SERVER_URL } from '$app/env/public';
import { ApiError } from './errors';
import { authCookies } from '$lib/config/auth';

type ApiClientOptions = {
	cookies?: {
		get: (name: string) => string | undefined;
	};
};

async function request<T>(
	path: string,
	options: RequestInit = {},
	context?: ApiClientOptions
): Promise<T> {
	const baseUrl = PUBLIC_SERVER_URL.replace(/\/+$/, '');

	if (!baseUrl) {
		throw new Error('PUBLIC_SERVER_URL is not configured.');
	}

	const headers = new Headers(options.headers);

	headers.set('Content-Type', 'application/json');

	// Forward authentication token to the backend
	const accessToken = context?.cookies?.get(authCookies.accessToken);

	if (accessToken) {
		headers.set('Authorization', `Bearer ${accessToken}`);
	}

	const response = await fetch(`${baseUrl}${path}`, {
		...options,
		headers
	});

	let data: unknown = null;

	try {
		data = await response.json();
	} catch {
		// Response has no JSON body
	}

	if (!response.ok) {
		const message =
			typeof data === 'object' &&
			data !== null &&
			'message' in data &&
			typeof data.message === 'string'
				? data.message
				: 'An unexpected API error occurred.';

		throw new ApiError(response.status, message, data);
	}

	if (typeof data === 'object' && data !== null && 'data' in data) {
		return data.data as T;
	}

	return data as T;
}

export const apiClient = {
	get<T>(path: string, context?: ApiClientOptions) {
		return request<T>(
			path,
			{
				method: 'GET'
			},
			context
		);
	},

	post<T>(path: string, body: unknown, context?: ApiClientOptions) {
		return request<T>(
			path,
			{
				method: 'POST',
				body: JSON.stringify(body)
			},
			context
		);
	},

	put<T>(path: string, body: unknown, context?: ApiClientOptions) {
		return request<T>(
			path,
			{
				method: 'PUT',
				body: JSON.stringify(body)
			},
			context
		);
	},

	patch<T>(path: string, body: unknown, context?: ApiClientOptions) {
		return request<T>(
			path,
			{
				method: 'PATCH',
				body: JSON.stringify(body)
			},
			context
		);
	},

	delete<T>(path: string, body?: unknown, context?: ApiClientOptions) {
		return request<T>(
			path,
			{
				method: 'DELETE',
				...(body !== undefined
					? {
							body: JSON.stringify(body)
						}
					: {})
			},
			context
		);
	}
};
