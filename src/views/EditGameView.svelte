<script lang="ts">
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { Game } from '$types';
	import { toast } from '@zerodevx/svelte-toast';
	import { type ViewStateStore } from '../stores/view-state-store.svelte';

	let { store, games }: { store: ViewStateStore; games: Game[] } = $props();

	const handleBackToDashboard = () => {
		store.updateSelectedGameId('');
		store.updateView('dashboard');
	};

	const handleSaveEditedGame = () => {
		store.updateSelectedGameId('');
		toast.push('Game saved (Not working yet)', {
			theme: {
				'--toastBackground': '#333',
				'--toastColor': '#fff'
			}
		});
		store.updateView('dashboard');
	};

	const game = games.find((game: Game) => game.id === store.selectedGameId);
</script>

<ViewWrapper>
	{#if game === undefined}
		<nav class="flex justify-between w-full items-center mb-z-ds-12">
			<div class="flex flex-col">
				<span class="font-bold">Eckchen</span>
				<span class="text-z-ds-general-black-80 text-xs">Game not found</span>
			</div>

			<button class="z-ds-button" onclick={handleBackToDashboard}> Zurück </button>
		</nav>
	{:else}
		<nav class="flex justify-between w-full items-center mb-z-ds-12">
			<div class="flex flex-col">
				<span class="font-bold">Eckchen</span>
				<span class="text-z-ds-general-black-80 text-xs"
					>Spiel <strong>{game.name}</strong> bearbeiten</span
				>
			</div>

			<button class="z-ds-button" onclick={handleBackToDashboard}> Zurück </button>
		</nav>

		<div class="w-full flex items-center justify-between my-z-ds-8">
			<label class="text-md" for="name">Name:</label>
			<input
				class="border py-z-ds-8 px-z-ds-12 border-black rounded-lg text-md"
				name="name"
				id="name"
				value={game.name}
				type="text"
			/>
		</div>

		<div class="flex justify-center mt-z-ds-32">
			<button class="z-ds-button" onclick={handleSaveEditedGame}> Speichern </button>
		</div>
	{/if}
</ViewWrapper>
