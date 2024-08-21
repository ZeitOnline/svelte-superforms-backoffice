<script lang="ts">
	import AddGameTable from '$components/AddGameTable.svelte';
	import GenerateGameTable from '$components/GenerateGameTable.svelte';
	import type { PageData } from '../routes/$types';
	import type { View } from '$types';

	let { data, view = $bindable() } = $props<{ data: PageData; view: View }>();

	let resultsDataHeader: Array<string> = $state([]);
	let resultsDataBody: string[][] = $state([]);

	function handleBackToDashboard() {
		view = "dashboard";
	}
</script>

<div class="max-w-3xl p-z-ds-20 bg-z-ds-general-white-100 border border-z-ds-general-black-100 rounded-lg mx-auto">
	<nav class="flex justify-between w-full items-center mb-z-ds-12">
		<div class="flex flex-col">
			<span class="font-bold">Eckchen</span>
			<span class="text-z-ds-general-black-80 text-xs">Neues Spiel erstellen</span>
		</div>

		<button class="z-ds-button" onclick={handleBackToDashboard}> Zurueck </button>
	</nav>

	{#if resultsDataHeader.length > 0 && resultsDataBody.length > 0}
		<AddGameTable {data} bind:resultsDataBody bind:resultsDataHeader />
	{:else}
		<GenerateGameTable {data} bind:resultsDataBody bind:resultsDataHeader />
	{/if}
</div>
