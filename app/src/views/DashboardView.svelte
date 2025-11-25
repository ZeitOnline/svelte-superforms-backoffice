<script lang="ts">
    import GenericDashboardTable from '$components/GenericDashboardTable.svelte';
	import ViewNavigation from '$components/ViewNavigation.svelte';
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { GameComplete, GameType } from '$types';
	import type { ViewStateStore } from '../stores/view-state-store.svelte';

	type Props = {
		store: ViewStateStore;
		games: GameComplete[];
		gameName: GameType;
	}

	let { store, games, gameName }: Props = $props();

	function handleNewGameView() {
		store.updateView('new-game');
	}

</script>

<ViewWrapper>
	<ViewNavigation
		viewName="Dashboard"
		mainAction={handleNewGameView}
		mainActionText="Neues Spiel erstellen"
		{gameName}
	/>

	<GenericDashboardTable {store} {games} {gameName} />
</ViewWrapper>
