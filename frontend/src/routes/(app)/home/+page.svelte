<script lang="ts">
	import { onMount } from 'svelte';
	import Cookies from 'universal-cookie';
	import { ArrowRight, Circle, Copy, RotateCcw, Trophy, X } from '@lucide/svelte';
	import { authCookies } from '$lib/config/auth';
	import { PUBLIC_SERVER_URL } from '$app/env/public';

	type PlayerSymbol = 'X' | 'O';
	type GameStatus = 'waiting' | 'active' | 'finished' | 'cancelled';
	type Player = { userId: string; username: string; symbol: PlayerSymbol };
	type GameSnapshot = {
		type: 'game:state';
		gameId: string;
		status: GameStatus;
		players: Player[];
		board: (PlayerSymbol | null)[];
		turn: PlayerSymbol;
		winnerId: string | null;
		isDraw: boolean;
	};
	type ServerEvent =
		| { type: 'auth:ok'; userId: string; username: string }
		| { type: 'auth:error'; message: string }
		| GameSnapshot
		| { type: 'game:error'; message: string };
	type Connection = 'connecting' | 'connected' | 'disconnected' | 'error';

	let connection = $state<Connection>('connecting');
	let authenticated = $state(false);
	let playerId = $state('');
	let game = $state<GameSnapshot | null>(null);
	let joinId = $state('');
	let notice = $state('');
	let pending = $state<'create' | 'join' | null>(null);
	let copied = $state(false);
	let socket: WebSocket | null = null;
	let retryTimer: ReturnType<typeof setTimeout> | undefined;
	let retryCount = 0;
	let disposed = false;

	const connectionLabel: Record<Connection, string> = {
		connecting: 'Connecting',
		connected: 'Connected',
		disconnected: 'Reconnecting',
		error: 'Connection issue'
	};

	const connectionIsLive = $derived(connection === 'connected' && authenticated);
	const myPlayer = $derived(game?.players.find((player) => player.userId === playerId) ?? null);
	const opponent = $derived(game?.players.find((player) => player.userId !== playerId) ?? null);
	const isMyTurn = $derived(
		connectionIsLive && game?.status === 'active' && myPlayer?.symbol === game.turn
	);
	const canStartGame = $derived(
		connectionIsLive &&
			pending === null &&
			(!game || game.status === 'finished' || game.status === 'cancelled')
	);

	function send(data: object) {
		if (!socket || socket.readyState !== WebSocket.OPEN || !authenticated) {
			notice = 'Connecting to the game server. Please try again in a moment.';
			return false;
		}
		socket.send(JSON.stringify(data));
		return true;
	}

	function connect() {
		if (disposed) return;
		socket?.close();
		connection = 'connecting';
		authenticated = false;

		const backendOrigin = new URL(PUBLIC_SERVER_URL).origin;
		const socketUrl = backendOrigin.replace(/^http/, 'ws') + '/ws';
		const ws = new WebSocket(socketUrl);
		socket = ws;

		ws.addEventListener('open', () => {
			if (socket !== ws) return;
			connection = 'connected';
			const token = new Cookies().get<string>(authCookies.accessToken);
			if (!token) {
				notice = 'Please sign in again to play.';
				ws.close(4401, 'Authentication required');
				return;
			}
			ws.send(JSON.stringify({ type: 'auth:authenticate', token }));
		});

		ws.addEventListener('message', (event) => {
			if (socket !== ws) return;
			try {
				const data = JSON.parse(String(event.data)) as ServerEvent;
				if (data.type === 'auth:ok') {
					authenticated = true;
					playerId = data.userId;
					retryCount = 0;
					notice = 'Connected. Create a game or join with a friend’s ID.';
				} else if (data.type === 'auth:error') {
					authenticated = false;
					connection = 'error';
					notice = data.message;
				} else if (data.type === 'game:error') {
					pending = null;
					notice = data.message;
				} else if (data.type === 'game:state') {
					game = data;
					pending = null;
					if (data.status === 'waiting') {
						notice = 'Share the game ID and wait for your opponent to join.';
					} else if (data.status === 'active') {
						notice = 'Match is live. Only the player whose turn it is can move.';
					} else if (data.status === 'finished') {
						notice = data.isDraw
							? 'A draw! Both players played a great game.'
							: data.winnerId === playerId
								? 'You won! Well played.'
								: 'Your opponent won. Ready for a rematch?';
					} else if (data.status === 'cancelled') {
						game = null;
						notice = 'The waiting game was cancelled.';
					}
				}
			} catch {
				notice = 'The server sent a message that could not be read.';
			}
		});

		ws.addEventListener('close', (event) => {
			if (socket !== ws) return;
			socket = null;
			authenticated = false;
			pending = null;
			if (disposed) return;
			if (event.code === 4401) {
				connection = 'error';
				return;
			}
			if (event.code === 4001) {
				connection = 'error';
				notice = 'This account opened the game in another tab or device.';
				return;
			}
			connection = 'disconnected';
			const delay = Math.min(1000 * 2 ** retryCount, 15000);
			retryCount += 1;
			notice = 'Connection lost. Reconnecting; your game is saved.';
			retryTimer = setTimeout(connect, delay);
		});

		ws.addEventListener('error', () => {
			if (socket === ws) connection = 'error';
		});
	}

	function createGame() {
		if (canStartGame && send({ type: 'game:create' })) pending = 'create';
	}

	function joinGame(event: SubmitEvent) {
		event.preventDefault();
		const code = joinId.trim().toUpperCase();
		if (!/^[A-F\d]{12}$/.test(code)) {
			notice = 'Enter the 12-character game ID shared by your friend.';
			return;
		}
		if (send({ type: 'game:join', gameId: code })) pending = 'join';
	}

	function playSquare(index: number) {
		if (isMyTurn && game?.board[index] === null) {
			send({ type: 'game:move', index });
		}
	}

	function cancelGame() {
		send({ type: 'game:cancel' });
	}

	async function copyGameId() {
		if (!game) return;
		try {
			await navigator.clipboard.writeText(game.gameId);
			copied = true;
			setTimeout(() => (copied = false), 1600);
		} catch {
			notice = 'Could not copy automatically. Select the ID and copy it manually.';
		}
	}

	onMount(() => {
		connect();
		return () => {
			disposed = true;
			if (retryTimer) clearTimeout(retryTimer);
			const currentSocket = socket;
			socket = null;
			currentSocket?.close();
		};
	});
</script>

<svelte:head>
	<title>Play Tic Tac Toe — Little Rivals</title>
	<meta
		name="description"
		content="Start a real-time Tic Tac Toe match, share your game ID, and play a friend."
	/>
</svelte:head>

<section class="page-content game-page">
	<div class="intro">
		<h1>Ready, set,<br /><span>tic tac toe!</span></h1>
		<p class="intro-copy">Invite a friend and see who gets three in a row.</p>
	</div>

	<div class="game-layout">
		<section class="play-card" aria-label="Online tic tac toe game">
			<div class="round-header">
				<div class="round-label">
					<span class:live-dot={connectionIsLive} class="connection-indicator"></span>
					ONLINE MATCH
				</div>
				<div class="round-number" aria-live="polite">{connectionLabel[connection]}</div>
			</div>

			<div class="turn-banner" class:finished={game?.status === 'finished'} aria-live="polite">
				{#if !game}
					<span class="turn-emoji">✦</span>
					<span><strong>Make a match</strong> — create a game or join a friend.</span>
				{:else if game.status === 'waiting'}
					<span class="turn-emoji">⏳</span>
					<span><strong>Waiting for your opponent</strong> — share your game ID.</span>
				{:else if game.status === 'finished' && game.isDraw}
					<span class="turn-emoji">🤝</span>
					<span><strong>A perfect tie!</strong> Rematch?</span>
				{:else if game.status === 'finished'}
					<span class="turn-emoji">🎉</span>
					<span
						><strong
							>{game.winnerId === playerId
								? 'You take it!'
								: `${opponent?.username ?? 'Opponent'} wins!`}</strong
						> Nicely played.</span
					>
				{:else}
					<span class="turn-emoji">{game.turn === 'X' ? '✖️' : '⭕'}</span>
					<span>
						<strong>
							{game.turn === myPlayer?.symbol
								? 'Your turn'
								: `${game?.players.find((player) => player.symbol === game?.turn)?.username ?? 'Opponent'}’s turn`}
						</strong>
						{game.turn === myPlayer?.symbol ? ' — make your move!' : ' — hang tight.'}
					</span>
				{/if}
				{#if game?.status === 'finished'}
					<button class="play-again" type="button" onclick={createGame} disabled={!canStartGame}>
						New game <ArrowRight size={15} />
					</button>
				{/if}
			</div>

			{#if game}
				<div class="game-code-row">
					<div><span>GAME ID</span><strong>{game.gameId}</strong></div>
					<button class="copy-game-id" type="button" onclick={copyGameId} aria-label="Copy game ID">
						<Copy size={14} />
						{copied ? 'Copied' : 'Copy ID'}
					</button>
				</div>
			{/if}

			<div class="board" role="grid" aria-label="Tic tac toe board">
				{#each [0, 1, 2, 3, 4, 5, 6, 7, 8] as index (index)}
					{@const mark = game?.board[index] ?? null}
					<button
						class="cell"
						class:mark-x={mark === 'X'}
						class:mark-o={mark === 'O'}
						disabled={!isMyTurn || mark !== null}
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
				<div>
					<span class="turn-key x-key"><X size={13} strokeWidth={3} /></span>
					{game?.players.find((player) => player.symbol === 'X')?.username ?? 'Player X'}
				</div>
				<span class="board-footer-divider">X MOVES FIRST</span>
				<div>
					<span class="turn-key o-key"><Circle size={12} strokeWidth={3} /></span>
					{game?.players.find((player) => player.symbol === 'O')?.username ?? 'Player O'}
				</div>
			</div>
		</section>

		<aside class="score-panel" aria-label="Game and player details">
			<div class="score-panel-heading">
				<div>
					<span class="mini-eyebrow">YOUR MATCH</span>
					<h2>{game ? 'Players' : 'Play together'}</h2>
				</div>
				<span class="trophy-icon"><Trophy size={19} /></span>
			</div>

			{#if game}
				<div class="score-row player-one">
					<div class="player-avatar"><X size={21} strokeWidth={3} /></div>
					<div class="player-label">
						<strong
							>{game.players.find((player) => player.symbol === 'X')?.username ??
								'Player X'}</strong
						>
						<span
							>{game.players.find((player) => player.symbol === 'X')?.userId === playerId
								? 'You · X'
								: 'X · first move'}</span
						>
					</div>
				</div>
				<div class="score-row player-two">
					<div class="player-avatar"><Circle size={19} strokeWidth={3} /></div>
					<div class="player-label">
						<strong>{opponent?.username ?? 'Waiting for a player'}</strong>
						<span
							>{opponent
								? `${opponent.userId === playerId ? 'You' : 'Opponent'} · O`
								: 'Share the game ID to invite them'}</span
						>
					</div>
				</div>
				{#if game.status === 'waiting' && myPlayer?.symbol === 'X'}
					<button class="clear-button cancel-game-button" type="button" onclick={cancelGame}>
						Cancel waiting game
					</button>
				{/if}
			{:else}
				<p class="game-help">
					Create a match and send the 12-character ID to a friend. They can join from their account.
				</p>
				<button
					class="reset-button"
					type="button"
					onclick={createGame}
					disabled={!canStartGame || pending !== null}
				>
					{pending === 'create' ? 'Creating game…' : 'Create a game'}
				</button>
				<div class="join-divider"><span>OR JOIN A FRIEND</span></div>
				<form class="join-game-form" onsubmit={joinGame}>
					<label for="game-id">Game ID</label>
					<div class="join-game-controls">
						<input
							id="game-id"
							bind:value={joinId}
							maxlength="12"
							placeholder="e.g. 2F8A4C1D9B06"
							autocomplete="off"
							autocapitalize="characters"
							spellcheck="false"
							disabled={!connectionIsLive || pending !== null}
						/>
						<button
							type="submit"
							disabled={!connectionIsLive || pending !== null || !joinId.trim()}
						>
							{pending === 'join' ? 'Joining…' : 'Join'}
						</button>
					</div>
				</form>
			{/if}

			<div class="score-divider"></div>
			<a class="history-link" href="/history">
				<RotateCcw size={14} /> View your match history <ArrowRight size={14} />
			</a>
			<div class="score-footnote">
				<span>✦</span> Moves are validated and saved as you play.
			</div>
		</aside>
	</div>

	{#if notice}
		<p class="game-notice" role="status">{notice}</p>
	{/if}

	<footer class="page-footer">
		<span>BUILT FOR THE LOVE OF THE GAME <span class="footer-heart">♥</span></span>
	</footer>
</section>
