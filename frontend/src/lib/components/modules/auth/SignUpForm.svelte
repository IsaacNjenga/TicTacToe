<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { authService } from '$lib/services/auth/auth.service';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';

	let username = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let showPassword = $state(false);

	async function handleSubmission(event: SubmitEvent) {
		event.preventDefault();

		if (password !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}

		isLoading = true;

		try {
			await authService.fetchSignUp({
				username: username.trim(),
				email: email.trim(),
				password
			});

			toast.success('Account created', {
				description: 'Your account is ready. Sign in to start playing.'
			});
			await goto(resolve('/(auth)/login'));
		} catch (error) {
			const description =
				error instanceof Error ? error.message : 'Something went wrong. Please try again.';
			toast.error('Sign-up failed', { description });
		} finally {
			isLoading = false;
		}
	}
</script>

<Card class="w-full max-w-md border-0 shadow-lg">
	<CardHeader class="space-y-1 text-center">
		<CardTitle class="text-2xl font-semibold">Create your account</CardTitle>
		<p class="text-sm text-muted-foreground">Join TicTacToe and start playing</p>
	</CardHeader>

	<CardContent>
		<form onsubmit={handleSubmission} class="space-y-5">
			<div class="space-y-2">
				<Label for="username">Username</Label>
				<Input
					id="username"
					name="username"
					type="text"
					placeholder="Choose a username"
					autocomplete="username"
					bind:value={username}
					required
				/>
			</div>

			<div class="space-y-2">
				<Label for="email">Email address</Label>
				<Input
					id="email"
					name="email"
					type="email"
					placeholder="you@example.com"
					autocomplete="email"
					bind:value={email}
					required
				/>
			</div>

			<div class="space-y-2">
				<Label for="password">Password</Label>
				<div class="relative">
					<Input
						id="password"
						name="password"
						type={showPassword ? 'text' : 'password'}
						placeholder="At least 8 characters"
						autocomplete="new-password"
						minlength={8}
						bind:value={password}
						required
					/><button
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

			<div class="space-y-2">
				<Label for="confirm-password">Confirm password</Label>
				<div class="relative">
					<Input
						id="confirm-password"
						name="confirm-password"
						type={showPassword ? 'text' : 'password'}
						placeholder="Enter your password again"
						autocomplete="new-password"
						minlength={8}
						bind:value={confirmPassword}
						required
					/><button
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
					<Loader2Icon class="size-4 animate-spin" /> Creating account...
				{:else}
					Create account
				{/if}
			</Button>
		</form>

		<p class="mt-5 text-center text-sm text-muted-foreground">
			Already have an account?
			<a href={resolve('/(auth)/login')} class="font-medium text-primary hover:underline">
				Sign in
			</a>
		</p>
	</CardContent>
</Card>
