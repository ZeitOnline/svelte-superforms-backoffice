<script lang="ts">
	import AddGameTable from '../components/AddGameTable.svelte';
	import GenerateGameTable from '../components/GenerateGameTable.svelte';
	import type { PageData } from '../routes/$types';

	let { data, isNewGame = $bindable() } = $props<{ data: PageData; isNewGame: boolean }>();

	let resultsDataHeader: Array<string> = $state([]);
	let resultsDataBody: string[][] = $state([]);

	function handleBackToDashboard() {
		isNewGame = false;
	}
</script>

<div class="max-w-2xl p-5 bg-white border border-black rounded-lg mx-auto">
	<nav class="flex justify-between w-full items-center mb-12">
		<div class="flex flex-col">
			<span class="font-bold">Eckchen</span>
			<span class="text-gray-700 text-xs">Neues Spiel erstellen</span>
		</div>

		<button class="z-ds-button" onclick={handleBackToDashboard}> Zurueck </button>
	</nav>

	{#if resultsDataHeader.length > 0 && resultsDataBody.length > 0}
		<AddGameTable {data} bind:resultsDataBody bind:resultsDataHeader />
	{:else}
		<GenerateGameTable {data} bind:resultsDataBody bind:resultsDataHeader />
	{/if}
</div>
