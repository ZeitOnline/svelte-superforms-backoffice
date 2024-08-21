<script lang="ts">
	import DashboardTable from '$components/DashboardTable.svelte';
	import ViewWrapper from '$components/ViewWrapper.svelte';
	import type { Game, View } from '$types';

	let {
		selectedGameId = $bindable(),
		games,
		view = $bindable()
	}: {
		selectedGameId: string;
		games: Game[];
		view: View;
	} = $props();

	function handleNewGameView() {
		view = 'new-game';
	}
</script>

<ViewWrapper>
	<!-- Header of the Dashboard  -->
	<nav class="flex justify-between w-full items-center mb-z-ds-24">
		<div class="flex flex-col">
			<span class="font-bold">Eckchen</span>
			<span class="text-z-ds-general-black-80 text-xs">Dashboard</span>
		</div>

		<button class="z-ds-button" onclick={handleNewGameView}> Neues Spiel erstellen </button>
	</nav>

	<DashboardTable bind:selectedGameId {games} bind:view />
</ViewWrapper>
