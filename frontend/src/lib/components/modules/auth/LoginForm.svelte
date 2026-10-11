<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Cookies from 'universal-cookie';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { authCookies, type LoginResult } from '$lib/config/auth';
	import { toast } from 'svelte-sonner';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';

	import { authService } from '$lib/services/auth/auth.service';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let showPassword = $state(false);

	const cookieOptions = {
		path: '/',
		sameSite: 'lax' as const,
		maxAge: 60 * 60 * 24 * 30,
		secure: false
	};

	const requiredFieldsConfig = [
		{ label: 'Email Address', getValue: () => email },
		{ label: 'Password', getValue: () => password }
	];

	async function handleSubmission(event: SubmitEvent) {
		event.preventDefault();

		const missingFields = requiredFieldsConfig
			.filter((field) => !field.getValue()?.toString().trim())
			.map((field) => field.label);

		if (missingFields.length > 0) {
			toast.error('Please fill in required fields', {
				description: `Missing: ${missingFields.join(', ')}`
			});
			return;
		}

		isLoading = true;
		try {
			const data = await authService.fetchSignIn({
				email: email.trim(),
				password: password.trim()
			});

			const loginResult: LoginResult = {
				token: data.token ?? '',
				refreshToken: data.refreshToken ?? '',
				user: data.user ?? {
					id: '',
					email,
					avatar: null,
					username: ''
				}
			};

			const cookies = new Cookies();
			cookies.set(authCookies.accessToken, loginResult.token, cookieOptions);
			cookies.set(authCookies.refreshToken, loginResult.refreshToken, cookieOptions);
			cookies.set(authCookies.user, JSON.stringify(loginResult.user), cookieOptions);

			toast.success('Signed in');
			await goto(resolve('/(app)/home'));
		} catch (error) {
			const description =
				error instanceof Error ? error.message : 'Something went wrong. Please try again.';
			toast.error('Login failed', { description });
		} finally {
			isLoading = false;
		}
	}
</script>

<Card class="w-full max-w-md border-0 shadow-lg">
	<CardHeader class="space-y-1 text-center">
		<CardTitle class="text-2xl font-semibold">Welcome back</CardTitle>

		<p class="text-sm text-muted-foreground">Sign in to your account to continue</p>
	</CardHeader>

	<CardContent>
		<form onsubmit={handleSubmission} novalidate class="space-y-5">
			<div class="space-y-2">
				<Label for="email">Email Address</Label>

				<Input
					id="email"
					name="email"
					type="email"
					placeholder="Your email address"
					bind:value={email}
					required
				/>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label for="password">Password</Label>

					<a href="/forgot-password" class="text-sm font-medium text-primary hover:underline">
						Forgot password?
					</a>
				</div>
				<div class="relative">
					<Input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						placeholder="Your password"
						bind:value={password}
						autocomplete="current-password"
						required
					/>
					<button
						type="button"
						class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						aria-label={showPassword ? 'Hide password' : 'Show password'}
						onclick={() => (showPassword = !showPassword)}
					>
						{#if showPassword}
							<EyeOff class="size-4" />
						{:else}
							<Eye class="size-4" />
						{/if}
					</button>
				</div>
			</div>

			<Button type="submit" class="w-full" disabled={isLoading}>
				{#if isLoading}
					<Loader2Icon class="size-4 animate-spin" /> Signing in...
				{:else}
					Sign in
				{/if}
			</Button>
		</form>

		<p class="mt-5 text-center text-sm text-muted-foreground">
			New to TicTacToe?
			<a href={resolve('/(auth)/sign-up')} class="font-medium text-primary hover:underline">
				Create an account
			</a>
		</p>
	</CardContent>
</Card>
