<script lang="ts">
	import SignUpForm from '$lib/components/modules/auth/SignUpForm.svelte';
</script>

<svelte:head>
	<title>Create Account | TicTacToe</title>
	<meta name="description" content="Create your TicTacToe account." />
</svelte:head>

<div class="flex min-h-screen items-center justify-center px-4 py-12">
	<div class="flex w-full max-w-md flex-col items-center">
		<div class="mb-8 text-center">
			<div
				class="flex h-16 w-40 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"
			>
				<span class="text-xl font-bold tracking-tight">TicTacToe</span>
			</div>
		</div>

		<SignUpForm />

		<p class="mt-6 text-center text-xs text-muted-foreground">
			&copy; 2026 TicTacToe. All rights reserved.
		</p>
	</div>
</div>
