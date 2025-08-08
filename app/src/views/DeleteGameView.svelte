<script lang="ts">
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { GameComplete } from '$types';
	import { type ViewStateStore } from '../stores/view-state-store.svelte';
	import { deleteGame } from '$lib/queries';
	import { APP_MESSAGES } from '$lib/app-messages';
	import { getToastState } from '$lib/toast-state.svelte';
    import { isEckchenGame, isWortigerGame } from '../utils';

	let { store, games }: { store: ViewStateStore; games: GameComplete[] } = $props();
	const toastManager = getToastState();

	const handleBackToDashboard = () => {
		store.updateView('dashboard');
		store.updateSelectedGameId(-1);
	};

	const handleDeleteFromList = async (id: number) => {

		if (toastManager) {
			toastManager.add('Spiel wird gelöscht', `Bitte warten Sie einen Moment, bis die Aktion abgeschlossen ist.`);
		}

		try {
			await deleteGame(id);

			setTimeout(() => {
				store.updateView('dashboard');
				store.updateSelectedGameId(-1);
				window.location.reload();
			}, 2500);
		} catch (error) {
			console.error('Error deleting game:', error);

			if (toastManager) {
				toastManager.add('Fehler beim Löschen', `Das Spiel konnte nicht gelöscht werden.`);
			}
		}
	};

	const game = games.find((game: GameComplete) => game.id === store.selectedGameId);
</script>

<ViewWrapper>
	<div class="flex flex-col items-center gap-z-ds-14 py-z-ds-32">
		{#if game !== undefined}
			<div>
				{#if isEckchenGame(game)}
					{@html APP_MESSAGES.GAME.DELETE_ECKCHEN.replace('{name}', game.name)}
				{:else if isWortigerGame(game)}
					{@html APP_MESSAGES.GAME.DELETE_WORTIGER.replace('{solution}', String(game.solution))}
				{/if}
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
