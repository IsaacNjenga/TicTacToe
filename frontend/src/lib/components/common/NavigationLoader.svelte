<script lang="ts">
	import { navigating } from '$app/state';
</script>

{#if navigating !== null}
	<div
		class="fixed top-0 right-0 left-0 z-100 h-0.5 w-full overflow-hidden bg-primary/10 backdrop-blur-xs"
	>
		<div
			class="animate-indeterminate h-full w-full origin-left bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-400"
		></div>

		<div
			class="absolute top-0 right-0 h-full w-24 bg-linear-to-r from-transparent via-cyan-300 to-white opacity-80 blur-[2px]"
		></div>
	</div>
{/if}

<style>
	@keyframes indeterminate {
		0% {
			transform: translateX(-100%) scaleX(0.2);
		}
		50% {
			transform: translateX(-10%) scaleX(0.6);
		}
		100% {
			transform: translateX(100%) scaleX(1);
		}
	}

	.animate-indeterminate {
		animation: indeterminate 1.4s cubic-bezier(0.65, 0, 0.35, 1) infinite;
	}
</style>
