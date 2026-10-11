<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import ResetPassword from './ResetPassword.svelte';
	import { authService } from '$lib/services/auth/auth.service';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';

	type Props = { email: string; userId: string };

	let { email }: Props = $props();

	let otp = $state('');
	let isSubmitting = $state(false);
	let otpVerified = $state(false);

	async function requestOtp() {
		const data = await authService.fetchRequestOtp({ email });

		return data;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		try {
			if (!otp.trim()) {
				toast.error('Please fill in required fields', {
					description: 'OTP is required.'
				});
				return;
			}

			isSubmitting = true;

			const data = await authService.fetchVerifyOtp({ email, otp: otp.trim() });

			otpVerified = true;
			toast.success(data?.message ?? 'OTP Verified.', {
				description: 'Proceed to resetting your password.'
			});
		} catch (error) {
			toast.error('OTP verification failed', {
				description:
					error instanceof Error ? error.message : 'Something went wrong. Please try again.'
			});
		} finally {
			isSubmitting = false;
		}
	}

	async function resendOtp() {
		try {
			isSubmitting = true;
			const result = await requestOtp();
			toast.success(result.message ?? 'OTP sent successfully.', {
				description: 'A new reset code has been sent to your email.'
			});
		} catch (error) {
			toast.error('Unable to resend OTP', {
				description:
					error instanceof Error ? error.message : 'Something went wrong. Please try again.'
			});
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="flex max-h-screen w-full items-center justify-center px-4">
	{#if otpVerified}
		<ResetPassword {email} />
	{:else}
		<Card class="w-full max-w-md">
			<CardHeader>
				<CardTitle>OTP Verification</CardTitle>

				<CardDescription>Enter the OTP sent to your email below to verify.</CardDescription>
			</CardHeader>

			<CardContent>
				<form onsubmit={handleSubmit} novalidate class="space-y-6">
					<div class="flex flex-col items-center space-y-2">
						<InputOTP.Root bind:value={otp} maxlength={6}>
							{#snippet children({ cells })}
								<InputOTP.Group>
									{#each cells.slice(0, 6) as cell (cell)}
										<InputOTP.Slot id="otp" {cell} />
									{/each}
								</InputOTP.Group>
							{/snippet}
						</InputOTP.Root>
					</div>
					<Separator />
					<div class="flex flex-col gap-2">
						<Button type="submit" disabled={isSubmitting} variant="default" class="w-full">
							{isSubmitting ? 'Submitted...' : 'Submit'}</Button
						>
						<Button
							type="button"
							onclick={resendOtp}
							disabled={isSubmitting || otpVerified}
							variant="outline"
							class="w-full"
						>
							{#if isSubmitting}
								<Loader2Icon class="size-4 animate-spin" /> Resending...
							{:else}Resend OTP
							{/if}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	{/if}
</div>
