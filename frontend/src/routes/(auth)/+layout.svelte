<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>Sign In | TicTacToe</title>
	<meta
		name="description"
		content="Sign in to TicTacToe."
	/>
</svelte:head>

<div class="min-h-screen bg-muted/30">
	{@render children()}
</div>