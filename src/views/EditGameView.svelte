<script lang="ts">
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { GameComplete } from '$types';
	import { type ViewStateStore } from '../stores/view-state-store.svelte';
	import ViewNavigation from '$components/ViewNavigation.svelte';
	import EditGameTable from '$components/EditGameTable.svelte';

	let { store, games }: { store: ViewStateStore; games: GameComplete[] } = $props();

	const handleBackToDashboard = () => {
		store.updateSelectedGameId(-1);
		store.updateView('dashboard');
	};

	const game = games.find((game: GameComplete) => game.id === store.selectedGameId);
	if (!game) {
		store.updateSelectedGameId(-1);
		store.updateView('dashboard');
	}
	
</script>

<ViewWrapper>
	{#if game === undefined}
		<ViewNavigation
			viewName="Game Not Found"
			mainAction={handleBackToDashboard}
			mainActionText="Zurück"
		/>
	{:else}
		<ViewNavigation
			viewName={`Spiel ${game.name} bearbeiten`}
			mainAction={handleBackToDashboard}
			mainActionText="Zurück"
		/>

		<EditGameTable {game} {store} />
	{/if}
</ViewWrapper>

