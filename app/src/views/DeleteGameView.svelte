<script lang="ts">
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { GameComplete } from '$types';
	import { toast } from '@zerodevx/svelte-toast';
	import { type ViewStateStore } from '../stores/view-state-store.svelte';
	import { deleteGame } from '$lib/queries';
	import { APP_MESSAGES } from '$lib/app-messages';

	let { store, games }: { store: ViewStateStore; games: GameComplete[] } = $props();

	const handleBackToDashboard = () => {
		store.updateView('dashboard');
		store.updateSelectedGameId(-1);
	};

	const handleDeleteFromList = async (id: number) => {
		toast.push('Spiel wird gelöscht...', {
            duration: 3000,
			theme: {
				'--toastBackground': '#333',
				'--toastColor': '#fff'
			}
		});

		await deleteGame(id);

		setTimeout(() => {
			store.updateView('dashboard');
			store.updateSelectedGameId(-1);

			window.location.reload();
		}, 3500);
	};

	const game = games.find((game: GameComplete) => game.id === store.selectedGameId);
</script>

<ViewWrapper>
	<div class="flex flex-col items-center gap-z-ds-14 py-z-ds-32">
		{#if game !== undefined}
			<div>
				{@html APP_MESSAGES.DELETE_GAME.replace('{name}', game.name)}
			</div>
			<div class="flex justify-end gap-z-ds-8">
				<button class="z-ds-button z-ds-button-outline" onclick={handleBackToDashboard}
					>Abbrechen</button
				>
				<button class="z-ds-button" onclick={() => handleDeleteFromList(game.id)}>Löschen</button>
			</div>
		{/if}
	</div>
</ViewWrapper>
