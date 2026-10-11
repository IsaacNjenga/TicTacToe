<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import { resolve } from '$app/paths';
	import { authService } from '$lib/services/auth/auth.service';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';

	type Props = { email: string };

	let { email }: Props = $props();

	let isSubmitting = $state(false);
	let password = $state('');
	let retypePassword = $state('');

	const requiredFieldsConfig = [{ label: 'Password', getValue: () => password }];

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		try {
			const missingFields = requiredFieldsConfig
				.filter((field) => !field.getValue()?.toString().trim())
				.map((field) => field.label);

			if (missingFields.length > 0) {
				toast.error('Please fill in required fields', {
					description: `Missing: ${missingFields.join(', ')}`
				});
				return;
			}

			if (password !== retypePassword) {
				toast.error('Passwords do not match', {
					description: 'Please re-enter the same password in both fields.'
				});
				return;
			}

			if (password.length < 8) {
				toast.error('Password too short', {
					description: 'Passwords must be at least 8 characters long.'
				});
				return;
			}

			isSubmitting = true;
			const data = await authService.fetchPasswordReset({
				email,
				newPassword: password
			});

			toast.success(data.message ?? 'Password reset successfully.', {
				description: 'You can now sign in with your new password.'
			});
			await goto(resolve('/(auth)/login'));
		} catch (error) {
			toast.error('Password reset failed', {
				description:
					error instanceof Error ? error.message : 'Something went wrong. Please try again.'
			});
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card class="w-full max-w-md">
	<CardHeader>
		<CardTitle>Reset Your Password</CardTitle>

		<CardDescription>Input your new password to reset</CardDescription>
	</CardHeader>

	<CardContent>
		<form onsubmit={handleSubmit} novalidate class="space-y-6">
			<div class="space-y-2">
				<Label for="password">Your new password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					bind:value={password}
					autocomplete="new-password"
					required
				/>
				<Label for="retypePassword">Retype your password</Label>
				<Input
					id="retypePassword"
					name="retypePassword"
					type="password"
					bind:value={retypePassword}
					autocomplete="new-password"
					required
				/>
			</div>
			<Separator />
			<div class="flex flex-col gap-2">
				<Button type="submit" disabled={isSubmitting} variant="default" class="w-full">
					{#if isSubmitting}
						<Loader2Icon class="size-4 animate-spin" /> Resetting password...
					{:else}Reset password
					{/if}</Button
				>
				<Button href="/login" disabled={isSubmitting} variant="outline" class="w-full"
					>Back to sign in</Button
				>
			</div>
		</form>
	</CardContent>
</Card>
