<script lang="ts">
	import { onMount } from 'svelte';
	import { Moon, Sun, Trophy } from '@lucide/svelte';
	import { mode, toggleMode } from 'mode-watcher';
	import { apiClient } from '$lib/services/api/client';
	import { getBrowserServiceContext } from '$lib/services/api/browser-context';
	import { authCookies } from '$lib/config/auth';
	import { countryFlag } from '$lib/utils/country';

	let darkMode = $derived(mode.current === 'dark');
	let userId = $state('');
	let countryCode = $state('');
	let profileLoading = $state(true);
	let profileSaving = $state(false);
	let profileMessage = $state('');
	let profileError = $state('');

	onMount(async () => {
		try {
			const context = getBrowserServiceContext();
			const user = context.cookies.get(authCookies.user) as { id?: string } | undefined;
			if (!user?.id) throw new Error('Sign in again to update your profile.');
			userId = user.id;
			const profile = await apiClient.get<{ countryCode?: string | null }>(
				`/users/get-user/${encodeURIComponent(userId)}`,
				context
			);
			countryCode = profile.countryCode ?? '';
		} catch (error) {
			profileError = error instanceof Error ? error.message : 'Could not load your profile.';
		} finally {
			profileLoading = false;
		}
	});

	async function saveCountry(event: SubmitEvent) {
		event.preventDefault();
		const normalizedCountry = countryCode.trim().toUpperCase();
		if (normalizedCountry && !/^[A-Z]{2}$/.test(normalizedCountry)) {
			profileError = 'Use a 2-letter country code, such as US or KE.';
			profileMessage = '';
			return;
		}
		profileSaving = true;
		profileError = '';
		profileMessage = '';
		try {
			const context = getBrowserServiceContext();
			await apiClient.put(
				`/users/update-user/${encodeURIComponent(userId)}`,
				{
					countryCode: normalizedCountry || null
				},
				context
			);
			countryCode = normalizedCountry;
			profileMessage = normalizedCountry ? 'Country updated.' : 'Country removed.';
		} catch (error) {
			profileError = error instanceof Error ? error.message : 'Could not update your country.';
		} finally {
			profileSaving = false;
		}
	}
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
		<div class="settings-divider"></div>
		<form class="settings-section country-profile" onsubmit={saveCountry}>
			<div class="settings-icon country-flag-preview" aria-hidden="true">
				{countryFlag(countryCode) || '🌐'}
			</div>
			<div class="settings-description country-setting-description">
				<h2>Leaderboard country</h2>
				<p>Choose the flag shown beside your name. Leave blank to hide it.</p>
				<label class="country-code-label" for="profile-country-code">2-letter country code</label>
				<input
					id="profile-country-code"
					class="country-code-input"
					bind:value={countryCode}
					maxlength="2"
					pattern="[A-Za-z]{2}"
					placeholder="US"
					autocomplete="country"
					disabled={profileLoading || profileSaving || !userId}
				/>
			</div>
			<button
				class="settings-clear country-save"
				type="submit"
				disabled={profileLoading || profileSaving || !userId}
			>
				{profileSaving ? 'Saving…' : 'Save country'}
			</button>
			{#if profileLoading}
				<p class="profile-feedback" role="status">Loading profile…</p>
			{:else if profileError}
				<p class="profile-feedback profile-feedback-error" role="alert">{profileError}</p>
			{:else if profileMessage}
				<p class="profile-feedback" role="status">{profileMessage}</p>
			{/if}
		</form>
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
