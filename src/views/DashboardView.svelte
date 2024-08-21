<script lang="ts">
	import DashboardTable from "$components/DashboardTable.svelte";
	import type { View } from "$types";
	import type { PageData } from "../routes/$types";

	let {
		data,
		view = $bindable()
	}: {
		data: PageData;
		view: View;
	} = $props();

	function handleNewGameView() {
		view = "new-game";
	}

</script>

<div class="max-w-3xl p-z-ds-20 bg-z-ds-general-white-100 border border-z-ds-general-black-100 rounded-lg mx-auto">
	<!-- Header of the Dashboard  -->
	<nav class="flex justify-between w-full items-center mb-z-ds-24">
		<div class="flex flex-col">
			<span class="font-bold">Eckchen</span>
			<span class="text-z-ds-general-black-80 text-xs">Dashboard</span>
		</div>

		<button class="z-ds-button" onclick={handleNewGameView}> Neues Spiel erstellen </button>
	</nav>

	<DashboardTable {data} bind:view={view} />
</div>
