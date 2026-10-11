<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowRight, Circle,  X } from '@lucide/svelte';

	onMount(() => {
		void goto('/home');
	});
</script>

<svelte:head>
	<title>Tic Tac Toe — LittleRivals</title>
</svelte:head>

<main class="welcome-screen">
	<div class="welcome-card">
		<div class="welcome-mark" aria-hidden="true"><X size={38} /><Circle size={30} /></div>
		<div class="eyebrow">MADE FOR TWO</div>
		<h1>Ready, set,<br /><span>tic tac toe!</span></h1>
		<p>Two players. One tiny board.</p>
		<a class="welcome-button" href="/home">Let’s play <ArrowRight size={17} /></a>
	</div>
</main>
