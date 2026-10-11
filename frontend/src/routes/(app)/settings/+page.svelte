<script lang="ts">
	import { Moon, Sun, Trophy } from '@lucide/svelte';
	import { mode, toggleMode } from 'mode-watcher';

	let darkMode = $derived(mode.current === 'dark');
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<section class="page-content settings-page">
	<div class="intro">
		<!-- <div class="eyebrow"><span class="eyebrow-sparkle">✳</span> MAKE IT YOURS</div> -->
		<h1>A little more<br /><span>your style.</span></h1>
		<p class="intro-copy">Set the mood for your next legendary match.</p>
	</div>

	<div class="settings-card">
		<div class="settings-section">
			<div class="settings-icon">
				{#if darkMode}<Moon size={20} />{:else}<Sun size={20} />{/if}
			</div>
			<div class="settings-description">
				<h2>Night owl mode</h2>
				<p>Easy on the eyes, even after dark.</p>
			</div>
			<button
				class="toggle-switch"
				class:enabled={darkMode}
				type="button"
				onclick={toggleMode}
				role="switch"
				aria-checked={darkMode}
				aria-label="Toggle night owl mode"><span></span></button
			>
		</div>
		<div class="settings-divider"></div>
		<div class="settings-section score-setting">
			<div class="settings-icon"><Trophy size={20} /></div>
			<div class="settings-description">
				<h2>Your match history</h2>
				<p>Completed online matches and player comparisons are saved to your account.</p>
			</div>
			<a class="settings-clear" href="/history">View history</a>
		</div>
	</div>

	<div class="settings-tip">
		<p>
			Match results are recorded by the server after a game ends. Waiting and cancelled games do not
			affect your record.
		</p>
	</div>

	<footer class="page-footer">
		<span>BUILT FOR THE LOVE OF THE GAME <span class="footer-heart">♥</span></span>
	</footer>
</section>
