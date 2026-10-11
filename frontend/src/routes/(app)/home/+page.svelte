<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowRight, Circle, RotateCcw, Trophy, X } from '@lucide/svelte';

	type Mark = 'X' | 'O';
	type Scores = { x: number; o: number; draws: number };

	const winningCombinations = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8],
		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8],
		[0, 4, 8],
		[2, 4, 6]
	];

	let board = $state<(Mark | null)[]>(Array(9).fill(null));
	let currentTurn = $state<Mark>('X');
	let winner = $state<Mark | null>(null);
	let winningSquares = $state<number[]>([]);
	let isDraw = $state(false);
	let scores = $state<Scores>({ x: 0, o: 0, draws: 0 });
	let ready = $state(false);

	function readScores(): Scores | null {
		const cookie = document.cookie.split('; ').find((value) => value.startsWith('tttg-scores='));
		if (!cookie) return null;

		try {
			const value = JSON.parse(
				decodeURIComponent(cookie.slice('tttg-scores='.length))
			) as Partial<Scores>;
			if (
				Number.isSafeInteger(value.x) &&
				Number.isSafeInteger(value.o) &&
				Number.isSafeInteger(value.draws) &&
				value.x! >= 0 &&
				value.o! >= 0 &&
				value.draws! >= 0
			) {
				return { x: value.x!, o: value.o!, draws: value.draws! };
			}
		} catch (error) {
			console.warn('Saved scores could not be read.', error);
		}
		return null;
	}

	function saveScores() {
		document.cookie = `tttg-scores=${encodeURIComponent(JSON.stringify(scores))}; max-age=31536000; path=/; samesite=lax`;
	}

	onMount(() => {
		scores = readScores() ?? scores;
		ready = true;
	});

	function playSquare(index: number) {
		if (board[index] || winner || isDraw) return;

		const nextBoard = [...board];
		nextBoard[index] = currentTurn;
		board = nextBoard;

		const winningCombo = winningCombinations.find((combo) =>
			combo.every((square) => nextBoard[square] === currentTurn)
		);

		if (winningCombo) {
			winner = currentTurn;
			winningSquares = winningCombo;
			const scoreKey = currentTurn === 'X' ? 'x' : 'o';
			scores = { ...scores, [scoreKey]: scores[scoreKey] + 1 };
			if (ready) saveScores();
		} else if (nextBoard.every(Boolean)) {
			isDraw = true;
			scores = { ...scores, draws: scores.draws + 1 };
			if (ready) saveScores();
		} else {
			currentTurn = currentTurn === 'X' ? 'O' : 'X';
		}
	}

	function startNextRound() {
		board = Array(9).fill(null);
		currentTurn = 'X';
		winner = null;
		winningSquares = [];
		isDraw = false;
	}

	function clearScores() {
		scores = { x: 0, o: 0, draws: 0 };
		saveScores();
	}
</script>

<svelte:head>
	<title>Tic Tac Toe — On The Go</title>
	<meta
		name="description"
		content="A little tic tac toe, a lot of friendly rivalry. Play a round and keep the score."
	/>
</svelte:head>

<section class="page-content game-page">
	<div class="intro">
		<!-- <div class="eyebrow"><span class="eyebrow-sparkle">✳</span> THE CLASSIC, WITH A TWIST</div> -->
		<h1>Ready, set,<br /><span>tic tac toe!</span></h1>
	</div>

	<div class="game-layout">
		<section class="play-card" aria-label="Tic tac toe game">
			<div class="round-header">
				<div class="round-label"><span class="live-dot"></span> FRIENDLY MATCH</div>
				<div class="round-number">ROUND <span>{scores.x + scores.o + scores.draws + 1}</span></div>
			</div>

			<div class="turn-banner" class:finished={winner !== null || isDraw} aria-live="polite">
				{#if winner}
					<span class="turn-emoji">🎉</span>
					<span><strong>Player {winner === 'X' ? '1' : '2'} takes it!</strong> Nicely played.</span>
				{:else if isDraw}
					<span class="turn-emoji">🤝</span>
					<span><strong>A perfect tie!</strong> Rematch?</span>
				{:else}
					<span class="turn-emoji">{currentTurn === 'X' ? '✖️' : '⭕'}</span>
					<span
						><strong>Player {currentTurn === 'X' ? '1' : '2'}’s turn</strong> — you’ve got this!</span
					>
				{/if}
				{#if winner || isDraw}
					<button class="play-again" type="button" onclick={startNextRound}>
						Play again <ArrowRight size={15} />
					</button>
				{/if}
			</div>

			<div class="board" role="grid" aria-label="Tic tac toe board">
				{#each board as mark, index (index)}
					<button
						class="cell"
						class:mark-x={mark === 'X'}
						class:mark-o={mark === 'O'}
						class:winning-square={winningSquares.includes(index)}
						disabled={mark !== null || winner !== null || isDraw}
						onclick={() => playSquare(index)}
						role="gridcell"
						aria-label={`Square ${index + 1}${mark ? `, ${mark}` : ', empty'}`}
					>
						{#if mark === 'X'}
							<X size={43} strokeWidth={3.2} />
						{:else if mark === 'O'}
							<Circle size={39} strokeWidth={3.2} />
						{:else}
							<span class="cell-hint"></span>
						{/if}
					</button>
				{/each}
			</div>

			<div class="board-footer">
				<div><span class="turn-key x-key"><X size={13} strokeWidth={3} /></span> PLAYER 1</div>
				<span class="board-footer-divider">FIRST MOVE, FIRST GLORY</span>
				<div><span class="turn-key o-key"><Circle size={12} strokeWidth={3} /></span> PLAYER 2</div>
			</div>
		</section>

		<aside class="score-panel" aria-label="Match scores">
			<div class="score-panel-heading">
				<div>
					<span class="mini-eyebrow">THE SCOREBOARD</span>
					<h2>Who's on a roll?</h2>
				</div>
				<span class="trophy-icon"><Trophy size={19} /></span>
			</div>

			<div class="score-row player-one">
				<div class="player-avatar"><X size={21} strokeWidth={3} /></div>
				<div class="player-label"><strong>Player 1</strong><span>Team X</span></div>
				<div class="score-value">{scores.x}</div>
			</div>
			<div class="score-row player-two">
				<div class="player-avatar"><Circle size={19} strokeWidth={3} /></div>
				<div class="player-label"><strong>Player 2</strong><span>Team O</span></div>
				<div class="score-value">{scores.o}</div>
			</div>

			<div class="draw-row"><span>🤝</span><span>Draws</span><strong>{scores.draws}</strong></div>
			<div class="score-divider"></div>
			<button class="reset-button" type="button" onclick={startNextRound}>
				<RotateCcw size={15} /> Restart round
			</button>
			<button class="clear-button" type="button" onclick={clearScores}>Clear scoreboard</button>
			<div class="score-footnote"><span>✦</span> Score sticks around in this browser.</div>
		</aside>
	</div>

	<footer class="page-footer">
		<span>BUILT FOR THE LOVE OF THE GAME <span class="footer-heart">♥</span></span>
	</footer>
</section>
