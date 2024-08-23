<script lang="ts">
	import DashboardTable from '$components/DashboardTable.svelte';
	import ViewNavigation from '$components/ViewNavigation.svelte';
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { Game } from '$types';
	import type { ViewStateStore } from '../stores/view-state-store.svelte';

	let { store, games }: { store: ViewStateStore; games: Game[] } = $props();

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

	<DashboardTable {store} {games} />
</ViewWrapper>
