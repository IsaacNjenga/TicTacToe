<script lang="ts">
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/services/api/client';
	import { getBrowserServiceContext } from '$lib/services/api/browser-context';
	import { authCookies } from '$lib/config/auth';
	import { countryFlag } from '$lib/utils/country';

	type Standing = {
		userId: string;
		username: string;
		countryCode: string | null;
		played: number;
		wins: number;
		draws: number;
		losses: number;
	};

	let standings = $state<Standing[]>([]);
	let currentUserId = $state('');
	let loading = $state(true);
	let error = $state('');

	const currentRank = $derived(
		standings.findIndex((player) => player.userId === currentUserId) + 1
	);

	async function loadStandings() {
		loading = true;
		error = '';
		try {
			const context = getBrowserServiceContext();
			standings = await apiClient.get<Standing[]>('/games/leaderboard', context);
			const user = context.cookies.get(authCookies.user) as { id?: string } | undefined;
			currentUserId = user?.id ?? '';
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Could not load global standings.';
		} finally {
			loading = false;
		}
	}

	onMount(loadStandings);
</script>

<svelte:head>
	<title>Hall of Fame — Little Rivals</title>
	<meta name="description" content="Global Tic Tac Toe standings and player records." />
</svelte:head>

<section class="page-content hall-page">
	<div class="intro">
		<span class="mini-eyebrow">GLOBAL STANDINGS</span>
		<h1>Hall of <span>Fame.</span></h1>
		<p class="intro-copy">
			Every finished match counts. Rankings are ordered by wins, draws, then losses.
		</p>
	</div>

	{#if currentRank > 0}
		<p class="rank-callout">Your current rank <strong>#{currentRank}</strong></p>
	{/if}

	<section class="leaderboard-panel" aria-label="Global player standings">
		<div class="leaderboard-heading">
			<div>
				<span class="mini-eyebrow">TOP PLAYERS</span>
				<h2>Season records</h2>
			</div>
			<button
				class="leaderboard-refresh"
				type="button"
				onclick={loadStandings}
				disabled={loading}
				aria-label="Refresh standings"
			>
				Refresh
			</button>
		</div>

		{#if loading}
			<p class="leaderboard-message" role="status">Loading global standings…</p>
		{:else if error}
			<p class="leaderboard-message leaderboard-error" role="alert">{error}</p>
		{:else if standings.length === 0}
			<p class="leaderboard-message">
				No completed matches yet. Start a game to claim the first spot.
			</p>
		{:else}
			<div class="leaderboard-table-wrap">
				<table class="leaderboard-table">
					<thead>
						<tr>
							<th scope="col" class="rank-column">#</th>
							<th scope="col">Player</th>
							<th scope="col">Country</th>
							<th scope="col">W</th>
							<th scope="col">D</th>
							<th scope="col">L</th>
							<th scope="col" class="total-column">Games</th>
						</tr>
					</thead>
					<tbody>
						{#each standings as player, index (player.userId)}
							<tr class:current-player={player.userId === currentUserId}>
								<td class="rank-column">{index + 1}</td>
								<td class="leaderboard-player"
									>{player.username}{#if player.userId === currentUserId}<span class="you-label"
											>YOU</span
										>{/if}</td
								>
								<td
									class="leaderboard-country"
									aria-label={player.countryCode ?? 'Country not set'}
								>
									{#if player.countryCode}
										<span aria-hidden="true">{countryFlag(player.countryCode)}</span>
										<span>{player.countryCode}</span>
									{:else}<span class="country-missing">—</span>{/if}
								</td>
								<td>{player.wins}</td>
								<td>{player.draws}</td>
								<td>{player.losses}</td>
								<td class="total-column">{player.played}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<footer class="page-footer">
		<span>BUILT FOR THE LOVE OF THE GAME <span class="footer-heart">♥</span></span>
	</footer>
</section>
