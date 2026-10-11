<script lang="ts">
	import { onMount } from 'svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import LoaderIcon from '@lucide/svelte/icons/loader-circle';

	type PlayerSymbol = 'X' | 'O';
	type GameStatus = 'WAITING' | 'READY';
	type Connection = 'connecting' | 'connected' | 'disconnected' | 'error';
	type NoticeTone = 'info' | 'error';

	const SERVER_URL = 'ws://localhost:8080';

	const connectionLabel: Record<Connection, string> = {
		connecting: 'Connecting…',
		connected: 'Connected',
		disconnected: 'Disconnected',
		error: 'Connection error'
	};

	const connectionDot: Record<Connection, string> = {
		connecting: 'bg-amber-500 animate-pulse',
		connected: 'bg-emerald-500',
		disconnected: 'bg-muted-foreground',
		error: 'bg-destructive'
	};

	let connection = $state<Connection>('connecting');
	let gameId = $state(''); // the active game
	let joinId = $state(''); // what the person types into the join field
	let gameStatus = $state<GameStatus | ''>('');
	let mySymbol = $state<PlayerSymbol | ''>('');
	let players = $state<PlayerSymbol[]>([]);
	let notice = $state<{ text: string; tone: NoticeTone } | null>(null);
	let pending = $state<'create' | 'join' | null>(null);
	let copied = $state(false);

	let socket: WebSocket | null = null;

	const isConnected = $derived(connection === 'connected');
	const inGame = $derived(!!mySymbol);
	const canAct = $derived(isConnected && !inGame && pending === null);
	const isReady = $derived(gameStatus === 'READY');

	function setNotice(text: string, tone: NoticeTone = 'info') {
		notice = { text, tone };
	}

	function resetSession() {
		gameId = '';
		gameStatus = '';
		mySymbol = '';
		players = [];
		pending = null;
	}

	function connect() {
		socket?.close();
		connection = 'connecting';
		notice = null;

		const ws = new WebSocket(SERVER_URL);
		socket = ws;

		ws.addEventListener('open', () => {
			connection = 'connected';
		});

		ws.addEventListener('message', (event) => {
			try {
				const data = JSON.parse(String(event.data));
				pending = null;

				switch (data.type) {
					case 'game:created':
						gameId = data.gameId;
						mySymbol = data.symbol;
						setNotice('Game created. Share the ID so a friend can join.');
						break;

					case 'game:joined':
						gameId = data.gameId;
						mySymbol = data.symbol;
						setNotice(`You joined as ${data.symbol}.`);
						break;

					case 'game:state':
						gameId = data.gameId;
						gameStatus = data.status;
						players = data.players.map((player: { symbol: PlayerSymbol }) => player.symbol);
						setNotice(
							data.status === 'READY'
								? 'Both players are here. The game is ready.'
								: 'Waiting for a second player to join.'
						);
						break;

					case 'game:opponent_left':
						setNotice(data.message);
						break;

					case 'error':
						setNotice(data.message, 'error');
						break;
				}
			} catch {
				setNotice('The server sent a message we could not read.', 'error');
			}
		});

		ws.addEventListener('close', () => {
			if (socket !== ws) return; // an older socket closing after a reconnect
			connection = 'disconnected';
			resetSession();
			setNotice('Connection lost. Reconnect to keep playing.', 'error');
		});

		ws.addEventListener('error', () => {
			if (socket !== ws) return;
			connection = 'error';
		});
	}

	onMount(() => {
		connect();

		return () => {
			const ws = socket;
			socket = null; // so the close handler ignores this teardown
			ws?.close();
		};
	});

	function send(data: object) {
		if (!socket || socket.readyState !== WebSocket.OPEN) {
			setNotice('Not connected to the server. Select Reconnect and try again.', 'error');
			return false;
		}
		socket.send(JSON.stringify(data));
		return true;
	}

	function createGame() {
		if (send({ type: 'game:create' })) pending = 'create';
	}

	function joinGame(event?: SubmitEvent) {
		event?.preventDefault();
		const id = joinId.trim();

		if (!id) {
			setNotice('Enter a game ID to join.', 'error');
			return;
		}

		if (send({ type: 'game:join', gameId: id })) pending = 'join';
	}

	async function copyGameId() {
		try {
			await navigator.clipboard.writeText(gameId);
			copied = true;
			setTimeout(() => (copied = false), 1800);
		} catch {
			setNotice('Could not copy. Select the ID and copy it manually.', 'error');
		}
	}
</script>

<svelte:head>
	<title>Tic-Tac-Toe lobby</title>
</svelte:head>

<main class="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-4 p-4 sm:p-6">
	<header class="flex items-start justify-between gap-4">
		<div class="space-y-1">
			<h1 class="text-2xl font-semibold tracking-tight">Tic-Tac-Toe</h1>
			<p class="text-sm text-muted-foreground">Play a friend in real time.</p>
		</div>

		<Badge variant="outline" class="mt-1 gap-2 py-1">
			<span class="size-2 rounded-full {connectionDot[connection]}" aria-hidden="true"></span>
			<span role="status">{connectionLabel[connection]}</span>
		</Badge>
	</header>

	{#if notice}
		<Alert.Root variant={notice.tone === 'error' ? 'destructive' : 'default'} aria-live="polite">
			{#if notice.tone === 'error'}
				<TriangleAlertIcon />
			{:else}
				<InfoIcon />
			{/if}
			<Alert.Description>{notice.text}</Alert.Description>
		</Alert.Root>
	{/if}

	{#if connection === 'disconnected' || connection === 'error'}
		<Button variant="secondary" onclick={connect}>
			<RefreshCwIcon />
			Reconnect
		</Button>
	{/if}

	{#if !inGame}
		<Card.Root>
			<Tabs.Root value="create">
				<Card.Header>
					<Tabs.List class="grid w-full grid-cols-2">
						<Tabs.Trigger value="create">New game</Tabs.Trigger>
						<Tabs.Trigger value="join">Join a game</Tabs.Trigger>
					</Tabs.List>
				</Card.Header>

				<Card.Content>
					<Tabs.Content value="create" class="space-y-4">
						<p class="text-sm text-muted-foreground">
							Start a game and you'll get an ID to send to your opponent.
						</p>
						<Button class="w-full" onclick={createGame} disabled={!canAct}>
							{#if pending === 'create'}
								<LoaderIcon class="animate-spin" />
								Creating…
							{:else}
								Create game
							{/if}
						</Button>
					</Tabs.Content>

					<Tabs.Content value="join">
						<form class="space-y-4" onsubmit={joinGame}>
							<div class="space-y-2">
								<Label for="gameId">Game ID</Label>
								<Input
									id="gameId"
									bind:value={joinId}
									placeholder="Paste the ID you were sent"
									autocomplete="off"
									spellcheck="false"
									disabled={!isConnected}
								/>
							</div>
							<Button type="submit" class="w-full" disabled={!canAct || !joinId.trim()}>
								{#if pending === 'join'}
									<LoaderIcon class="animate-spin" />
									Joining…
								{:else}
									Join game
								{/if}
							</Button>
						</form>
					</Tabs.Content>
				</Card.Content>
			</Tabs.Root>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Header>
				<div class="flex items-center justify-between gap-3">
					<Card.Title>{isReady ? 'Ready to play' : 'Waiting for opponent'}</Card.Title>
					<Badge variant={isReady ? 'default' : 'secondary'}>
						{#if !isReady}<LoaderIcon class="size-3 animate-spin" />{/if}
						{isReady ? 'Ready' : 'Waiting'}
					</Badge>
				</div>
				<Card.Description>You're playing as {mySymbol}.</Card.Description>
			</Card.Header>

			<Card.Content class="space-y-5">
				<div class="space-y-2">
					<Label for="activeGameId">Game ID</Label>
					<div class="flex gap-2">
						<Input id="activeGameId" value={gameId} readonly class="font-mono" />
						<Button
							variant="outline"
							size="icon"
							onclick={copyGameId}
							aria-label={copied ? 'Copied' : 'Copy game ID'}
						>
							{#if copied}<CheckIcon />{:else}<CopyIcon />{/if}
						</Button>
					</div>
				</div>

				<Separator />

				<ul class="grid grid-cols-2 gap-3" aria-label="Players">
					{#each ['X', 'O'] as const as symbol (symbol)}
						{@const joined = players.includes(symbol)}
						{@const you = symbol === mySymbol}
						<li
							class="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 transition-colors
								{joined ? 'border-primary bg-primary/5' : 'border-dashed bg-muted/40'}"
						>
							<span
								class="text-6xl leading-none font-bold {joined
									? 'text-foreground'
									: 'text-muted-foreground/30'}"
								aria-hidden="true">{symbol}</span
							>
							<span class="text-sm text-muted-foreground">
								{#if joined}
									{you ? 'You' : 'Opponent'}
								{:else}
									Waiting…
								{/if}
							</span>
							<span class="sr-only">Player {symbol}: {joined ? 'connected' : 'not joined yet'}</span>
						</li>
					{/each}
				</ul>
			</Card.Content>
		</Card.Root>
	{/if}
</main>