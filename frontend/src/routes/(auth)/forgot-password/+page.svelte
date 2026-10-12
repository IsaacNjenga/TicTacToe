<script lang="ts">
	import { env } from '$env/dynamic/public';
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
	import OTPForm from '$lib/components/modules/auth/OTPForm.svelte';

	let email = $state('');
	let isSubmitting = $state(false);
	let otpSent = $state(false);
	let resetEmail = $state('');
	let resetUserId = $state('');

	const requiredFieldsConfig = [{ label: 'Email', getValue: () => email }];

	async function requestOtp() {
		const response = await fetch(`${env.PUBLIC_SERVER_URL}/auth/password-reset/request-otp`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				email: email.trim()
			})
		});

		const data = (await response.json().catch(() => ({}))) as { message?: string };

		if (!response.ok) {
			throw new Error(data.message ?? 'Unable to request OTP. Please try again.');
		}

		return data;
	}

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

			isSubmitting = true;
			const result = await requestOtp();
			resetEmail = email.trim().toLowerCase();
			otpSent = true;
			toast.success(result.message ?? 'OTP sent successfully.', {
				description: 'Check your email for the reset code.'
			});
		} catch (error) {
			toast.error('Unable to send OTP', {
				description:
					error instanceof Error ? error.message : 'Something went wrong. Please try again.'
			});
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	{#if otpSent}
		<OTPForm email={resetEmail} userId={resetUserId} />
	{:else}
		<Card class="w-full max-w-md">
			<CardHeader>
				<CardTitle>Forgot Your password?</CardTitle>

				<CardDescription>
					Enter your email address and we'll help you reset your password.
				</CardDescription>
			</CardHeader>

			<CardContent>
				<form onsubmit={handleSubmit} novalidate class="space-y-6">
					<div class="space-y-2">
						<Label for="email">Email Address</Label>

						<Input id="email" name="email" type="text" bind:value={email} required />
					</div>
					<!-- <Separator /> -->
					<div class="flex flex-col gap-2">
						<Button type="submit" disabled={isSubmitting} variant="default" class="w-full"
							>Reset Password</Button
						>
						<Button href="/login" disabled={isSubmitting} variant="outline" class="w-full"
							>Back to sign in</Button
						>
					</div>
				</form>
			</CardContent>
		</Card>
	{/if}
</div>
