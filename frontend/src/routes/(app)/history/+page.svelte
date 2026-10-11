<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowRight, Circle, Trophy, X } from '@lucide/svelte';
	import { apiClient } from '$lib/services/api/client';
	import { getBrowserServiceContext } from '$lib/services/api/browser-context';

	type Summary = { played: number; wins: number; losses: number; draws: number };
	type Rival = Summary & { userId: string; username: string };
	type Match = {
		_id: string;
		code: string;
		players: { userId: string; username: string; symbol: 'X' | 'O' }[];
		winnerId: string | null;
		isDraw: boolean;
		moveCount: number;
		createdAt: string;
		updatedAt: string;
	};
	type HistoryResponse = {
		userId: string;
		summary: Summary;
		recent: Match[];
		rivals: Rival[];
	};

	let history = $state<HistoryResponse | null>(null);
	let currentPlayerId = $state('');
	let loading = $state(true);
	let error = $state('');

	const winRate = $derived(
		history && history.summary.played > 0
			? Math.round((history.summary.wins / history.summary.played) * 100)
			: 0
	);

	function resultFor(match: Match) {
		if (match.isDraw) return 'Draw';
		return match.winnerId === currentPlayerId ? 'Win' : 'Loss';
	}

	function opponentFor(match: Match) {
		return match.players.find((player) => player.userId !== currentPlayerId);
	}

	function displayDate(value: string) {
		return new Intl.DateTimeFormat(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(value));
	}

	onMount(async () => {
		try {
			const context = getBrowserServiceContext();
			history = await apiClient.get<HistoryResponse>('/games/history', context);
			currentPlayerId = history.userId;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Could not load your match history.';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Your Match History — Little Rivals</title>
	<meta
		name="description"
		content="See your Tic Tac Toe record, recent matches, and rival stats."
	/>
</svelte:head>

<section class="page-content history-page">
	<div class="intro">
		<h1>Your games,<br /><span>your story.</span></h1>
		<p class="intro-copy">Every finished match, all in one place.</p>
	</div>

	{#if loading}
		<p class="history-message" role="status">Loading your games…</p>
	{:else if error}
		<p class="history-message history-error" role="alert">{error}</p>
	{:else if history}
		<div class="history-summary" aria-label="Your overall record">
			<article class="history-stat">
				<span>GAMES PLAYED</span>
				<strong>{history.summary.played}</strong>
			</article>
			<article class="history-stat">
				<span>WINS</span>
				<strong>{history.summary.wins}</strong>
			</article>
			<article class="history-stat">
				<span>LOSSES</span>
				<strong>{history.summary.losses}</strong>
			</article>
			<article class="history-stat">
				<span>DRAWS</span>
				<strong>{history.summary.draws}</strong>
			</article>
			<article class="history-stat">
				<span>WIN RATE</span>
				<strong>{winRate}%</strong>
			</article>
		</div>

		<div class="history-columns">
			<section class="history-card" aria-labelledby="recent-games-heading">
				<div class="history-card-heading">
					<div>
						<span class="mini-eyebrow">THE SCOREBOOK</span>
						<h2 id="recent-games-heading">Recent matches</h2>
					</div>
					<Trophy size={20} />
				</div>

				{#if history.recent.length === 0}
					<div class="history-empty">
						<p>No finished games yet.</p>
						<a href="/home">Start your first match <ArrowRight size={14} /></a>
					</div>
				{:else}
					<div class="match-list">
						{#each history.recent as match (match._id)}
							{@const opponent = opponentFor(match)}
							{@const result = resultFor(match)}
							<article class="match-row">
								<div
									class="match-result"
									class:result-win={result === 'Win'}
									class:result-loss={result === 'Loss'}
								>
									{result}
								</div>
								<div class="match-opponent">
									<strong>{opponent?.username ?? 'Unknown player'}</strong>
									<span>{displayDate(match.updatedAt)} · {match.moveCount} moves</span>
								</div>
								<div
									class="match-symbols"
									aria-label={`Played as ${match.players.find((p) => p.userId === currentPlayerId)?.symbol ?? '?'}`}
								>
									{#if match.players.find((player) => player.userId === currentPlayerId)?.symbol === 'X'}
										<X size={16} strokeWidth={3} />
									{:else}
										<Circle size={14} strokeWidth={3} />
									{/if}
								</div>
							</article>
						{/each}
					</div>
					{#if history.summary.played > history.recent.length}
						<p class="history-footnote">
							Showing the 50 most recent games of {history.summary.played}.
						</p>
					{/if}
				{/if}
			</section>

			<section class="history-card" aria-labelledby="rivals-heading">
				<div class="history-card-heading">
					<div>
						<span class="mini-eyebrow">HEAD TO HEAD</span>
						<h2 id="rivals-heading">Your rivals</h2>
					</div>
					<Circle size={20} />
				</div>

				{#if history.rivals.length === 0}
					<div class="history-empty">
						<p>Your player comparisons will show up here.</p>
					</div>
				{:else}
					<div class="rival-list">
						{#each history.rivals as rival (rival.userId)}
							<article class="rival-row">
								<div class="rival-avatar">{rival.username.slice(0, 1).toUpperCase()}</div>
								<div class="rival-name">
									<strong>{rival.username}</strong>
									<span>{rival.played} {rival.played === 1 ? 'game' : 'games'}</span>
								</div>
								<div
									class="rival-record"
									aria-label={`${rival.wins} wins, ${rival.losses} losses, ${rival.draws} draws`}
								>
									<strong>{rival.wins}–{rival.losses}–{rival.draws}</strong>
									<span>W–L–D</span>
								</div>
							</article>
						{/each}
					</div>
					<p class="history-footnote">Ranked by games played · your wins–losses–draws</p>
				{/if}
			</section>
		</div>
	{/if}

	<footer class="page-footer">
		<span>BUILT FOR THE LOVE OF THE GAME <span class="footer-heart">♥</span></span>
	</footer>
</section>
