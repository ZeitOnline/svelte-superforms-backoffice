<script lang="ts">
    import GenericDashboardTable from '$components/GenericDashboardTable.svelte';
	import ViewNavigation from '$components/ViewNavigation.svelte';
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { GameComplete } from '$types';
	import type { ViewStateStore } from '../stores/view-state-store.svelte';

	let { store, games }: { store: ViewStateStore; games: GameComplete[] } = $props();

	function handleNewGameView() {
		store.updateView('new-game');
	}
</script>

<ViewWrapper>
	<ViewNavigation
		viewName="Dashboard"
		mainAction={handleNewGameView}
		mainActionText="Neues Spiel erstellen"
	/>

	<GenericDashboardTable {store} {games} />
</ViewWrapper>
